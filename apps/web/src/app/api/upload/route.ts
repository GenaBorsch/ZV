import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { 
  uploadFile, 
  BUCKETS, 
  ALLOWED_TYPES, 
  MAX_FILE_SIZES,
  FileUploadOptions
} from '@/lib/minio';
import { initMinIO } from '@/lib/init-minio';
import { isRateLimited, getClientIpFromHeaders, RATE_LIMITS } from '@/lib/rateLimiter';

// Типы файлов и их конфигурации
const UPLOAD_CONFIGS: Record<string, FileUploadOptions> = {
  avatar: {
    bucket: BUCKETS.AVATARS,
    folder: 'users',
    maxSizeMB: MAX_FILE_SIZES.AVATAR,
    allowedTypes: ALLOWED_TYPES.IMAGES,
  },
  'character-avatar': {
    bucket: BUCKETS.AVATARS,
    folder: 'characters',
    maxSizeMB: MAX_FILE_SIZES.AVATAR,
    allowedTypes: ALLOWED_TYPES.IMAGES,
  },
  'character-sheet': {
    bucket: BUCKETS.DOCUMENTS,
    folder: 'character-sheets',
    maxSizeMB: MAX_FILE_SIZES.SHEET,
    allowedTypes: ALLOWED_TYPES.OFFICE_DOCUMENTS,
  },
  'product-image': {
    bucket: BUCKETS.UPLOADS,
    folder: 'products',
    maxSizeMB: MAX_FILE_SIZES.DOCUMENT,
    allowedTypes: ALLOWED_TYPES.IMAGES,
  },
  'report-attachment': {
    bucket: BUCKETS.DOCUMENTS,
    folder: 'reports',
    maxSizeMB: MAX_FILE_SIZES.DOCUMENT,
    allowedTypes: [...ALLOWED_TYPES.IMAGES, ...ALLOWED_TYPES.DOCUMENTS],
  },
  'monster-image': {
    bucket: BUCKETS.UPLOADS,
    folder: 'monsters',
    maxSizeMB: MAX_FILE_SIZES.DOCUMENT,
    allowedTypes: ALLOWED_TYPES.IMAGES,
  },
  'exclusive-material': {
    bucket: BUCKETS.DOCUMENTS,
    folder: 'exclusive-materials',
    maxSizeMB: 500, // PDF могут быть большие
    allowedTypes: ['application/pdf'],
  },
};

// Проверка прав доступа
function checkPermissions(type: string, userRoles: string[]): boolean {
  switch (type) {
    case 'avatar':
    case 'character-avatar':
    case 'character-sheet':
      // Любой авторизованный пользователь может загружать свои файлы
      return true;
    case 'product-image':
      // Только админы могут загружать изображения товаров
      return userRoles.includes('SUPERADMIN') || userRoles.includes('MODERATOR');
    case 'report-attachment':
      // Мастера и админы могут загружать вложения к отчетам
      return userRoles.includes('MASTER') || userRoles.includes('SUPERADMIN') || userRoles.includes('MODERATOR');
    case 'monster-image':
      // Только админы могут загружать изображения монстров
      return userRoles.includes('SUPERADMIN') || userRoles.includes('MODERATOR');
    case 'exclusive-material':
      // Только админы могут загружать эксклюзивные материалы
      return userRoles.includes('SUPERADMIN') || userRoles.includes('MODERATOR');
    default:
      return false;
  }
}

export async function POST(request: NextRequest) {
  try {
    // Проверка аутентификации
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Необходима авторизация' },
        { status: 401 }
      );
    }

    // НОВОЕ: Защита от спама загрузок файлов
    const userId = (session.user as any).id;
    if (isRateLimited([userId, 'upload'], RATE_LIMITS.UPLOAD)) {
      return NextResponse.json(
        { error: 'Слишком много загрузок файлов. Попробуйте через час' },
        { status: 429 }
      );
    }

    // Инициализация бакетов (если еще не созданы)
    await initMinIO();

    // Получение данных из формы
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const type = formData.get('type') as string;

    if (!file) {
      return NextResponse.json(
        { error: 'Файл не найден' },
        { status: 400 }
      );
    }

    if (!type || !UPLOAD_CONFIGS[type]) {
      return NextResponse.json(
        { error: 'Неподдерживаемый тип загрузки' },
        { status: 400 }
      );
    }

    // Проверка прав доступа
    const userRoles = (session.user as any)?.roles as string[] || [];
    if (!checkPermissions(type, userRoles)) {
      return NextResponse.json(
        { error: 'Недостаточно прав для загрузки этого типа файла' },
        { status: 403 }
      );
    }

    // Получение конфигурации для типа файла
    const config = UPLOAD_CONFIGS[type];

    try {
      // Загрузка файла
      const result = await uploadFile(file, config);
      
      console.log(`✅ File uploaded successfully:`, {
        userId: session.user.id,
        type,
        fileName: file.name,
        size: file.size,
        url: result.url
      });

      return NextResponse.json({
        success: true,
        data: {
          url: result.url,
          key: result.key,
          bucket: result.bucket,
          originalName: file.name,
          size: file.size,
          type: file.type,
        }
      });

    } catch (uploadError) {
      console.error('Upload error:', uploadError);
      return NextResponse.json(
        { error: uploadError instanceof Error ? uploadError.message : 'Ошибка загрузки файла' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('API upload error:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}

// GET endpoint для получения конфигурации загрузки
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Необходима авторизация' },
        { status: 401 }
      );
    }

    const userRoles = (session.user as any)?.roles as string[] || [];
    
    // Возвращаем только те типы загрузки, к которым у пользователя есть доступ
    const availableTypes = Object.keys(UPLOAD_CONFIGS).filter(type => 
      checkPermissions(type, userRoles)
    );

    const configs = availableTypes.reduce((acc, type) => {
      const config = UPLOAD_CONFIGS[type];
      acc[type] = {
        maxSizeMB: config.maxSizeMB,
        allowedTypes: config.allowedTypes,
      };
      return acc;
    }, {} as Record<string, Partial<FileUploadOptions>>);

    return NextResponse.json({
      success: true,
      data: configs
    });

  } catch (error) {
    console.error('API upload config error:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}
