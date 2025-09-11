import { Client } from 'minio';
import { v4 as uuidv4 } from 'uuid';

// Типы для загрузки файлов
export interface UploadResult {
  url: string;
  key: string;
  bucket: string;
}

export interface FileUploadOptions {
  bucket: string;
  folder?: string;
  maxSizeMB?: number;
  allowedTypes?: string[];
}

// Парсинг S3 endpoint
function parseS3Endpoint() {
  const endpoint = process.env.S3_ENDPOINT || 'http://localhost:9000';
  const isSSL = endpoint.startsWith('https://');
  const cleanEndpoint = endpoint.replace('http://', '').replace('https://', '');
  const [host, portStr] = cleanEndpoint.split(':');
  const port = portStr ? parseInt(portStr) : (isSSL ? 443 : 80);
  
  return {
    endPoint: host,
    port,
    useSSL: isSSL,
  };
}

// Конфигурация MinIO клиента
const minioConfig = {
  ...parseS3Endpoint(),
  accessKey: process.env.S3_ACCESS_KEY || '',
  secretKey: process.env.S3_SECRET_KEY || '',
};

// Создание MinIO клиента (только на сервере)
export const minioClient = typeof window === 'undefined' ? new Client(minioConfig) : null;

// Названия бакетов
export const BUCKETS = {
  AVATARS: process.env.S3_BUCKET_AVATARS || 'avatars',
  DOCUMENTS: process.env.S3_BUCKET_DOCUMENTS || 'documents', 
  UPLOADS: process.env.S3_BUCKET_UPLOADS || 'uploads',
} as const;

// Разрешенные типы файлов
export const ALLOWED_TYPES = {
  IMAGES: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'],
  DOCUMENTS: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  SHEETS: ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
} as const;

// Разрешенные расширения файлов (дополнительная проверка)
export const ALLOWED_EXTENSIONS = {
  IMAGES: ['.jpg', '.jpeg', '.png', '.webp', '.gif'],
  DOCUMENTS: ['.pdf', '.doc', '.docx'],
  SHEETS: ['.pdf', '.jpg', '.jpeg', '.png', '.webp'],
} as const;

// Магические байты для проверки типа файла
export const MAGIC_BYTES = {
  PNG: [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A],
  JPEG: [0xFF, 0xD8, 0xFF],
  WEBP: [0x52, 0x49, 0x46, 0x46], // + WEBP на позиции 8
  GIF_87A: [0x47, 0x49, 0x46, 0x38, 0x37, 0x61],
  GIF_89A: [0x47, 0x49, 0x46, 0x38, 0x39, 0x61],
  PDF: [0x25, 0x50, 0x44, 0x46],
} as const;

// Максимальные размеры файлов (в МБ)
export const MAX_FILE_SIZES = {
  AVATAR: 5,
  DOCUMENT: 10,
  SHEET: 10,
} as const;

/**
 * Инициализация бакетов MinIO
 */
export async function initializeBuckets() {
  if (!minioClient) {
    throw new Error('MinIO client is not available (client-side environment)');
  }

  const buckets = Object.values(BUCKETS);
  
  for (const bucket of buckets) {
    try {
      const exists = await minioClient.bucketExists(bucket);
      if (!exists) {
        await minioClient.makeBucket(bucket, 'us-east-1');
        console.log(`✅ Created MinIO bucket: ${bucket}`);
        
        // Устанавливаем политику для публичного чтения аватаров
        if (bucket === BUCKETS.AVATARS) {
          const policy = {
            Version: '2012-10-17',
            Statement: [
              {
                Effect: 'Allow',
                Principal: { AWS: ['*'] },
                Action: ['s3:GetObject'],
                Resource: [`arn:aws:s3:::${bucket}/*`],
              },
            ],
          };
          await minioClient.setBucketPolicy(bucket, JSON.stringify(policy));
          console.log(`✅ Set public read policy for bucket: ${bucket}`);
        }
      }
    } catch (error) {
      console.error(`❌ Error initializing bucket ${bucket}:`, error);
    }
  }
}

/**
 * Проверка магических байтов файла
 */
async function validateMagicBytes(file: File): Promise<boolean> {
  const buffer = await file.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  
  // Проверяем первые байты файла
  const checkBytes = (magic: readonly number[]) => {
    if (bytes.length < magic.length) return false;
    return magic.every((byte, index) => bytes[index] === byte);
  };

  // Специальная проверка для WEBP (RIFF + WEBP на позиции 8)
  const isWebP = () => {
    if (bytes.length < 12) return false;
    const riffCheck = checkBytes(MAGIC_BYTES.WEBP);
    const webpCheck = bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50;
    return riffCheck && webpCheck;
  };

  // Проверяем все известные форматы
  return (
    checkBytes(MAGIC_BYTES.PNG) ||
    checkBytes(MAGIC_BYTES.JPEG) ||
    isWebP() ||
    checkBytes(MAGIC_BYTES.GIF_87A) ||
    checkBytes(MAGIC_BYTES.GIF_89A) ||
    checkBytes(MAGIC_BYTES.PDF)
  );
}

/**
 * Валидация файла (улучшенная версия)
 */
export async function validateFile(file: File, options: FileUploadOptions): Promise<{ valid: boolean; error?: string }> {
  // Проверка размера
  const maxSizeBytes = (options.maxSizeMB || 10) * 1024 * 1024;
  if (file.size > maxSizeBytes) {
    return {
      valid: false,
      error: `Файл слишком большой. Максимальный размер: ${options.maxSizeMB || 10}МБ`,
    };
  }

  // Проверка расширения файла
  const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
  let allowedExtensions: readonly string[] = [];
  
  if (options.allowedTypes?.includes('image/jpeg') || options.allowedTypes?.includes('image/png')) {
    allowedExtensions = ALLOWED_EXTENSIONS.IMAGES;
  } else if (options.allowedTypes?.includes('application/pdf')) {
    allowedExtensions = [...ALLOWED_EXTENSIONS.DOCUMENTS, ...ALLOWED_EXTENSIONS.IMAGES];
  }
  
  if (allowedExtensions.length > 0 && !allowedExtensions.includes(fileExtension)) {
    return {
      valid: false,
      error: `Неподдерживаемое расширение файла. Разрешены: ${allowedExtensions.join(', ')}`,
    };
  }

  // Проверка MIME-типа
  if (options.allowedTypes && !options.allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `Неподдерживаемый тип файла. Разрешены: ${options.allowedTypes.join(', ')}`,
    };
  }

  // Проверка магических байтов (дополнительная безопасность)
  const magicBytesValid = await validateMagicBytes(file);
  if (!magicBytesValid) {
    return {
      valid: false,
      error: 'Файл не соответствует заявленному типу. Возможно, это не изображение или документ.',
    };
  }

  return { valid: true };
}

/**
 * Генерация уникального ключа для файла
 */
export function generateFileKey(originalName: string, folder?: string): string {
  const extension = originalName.split('.').pop() || '';
  const uuid = uuidv4();
  const timestamp = Date.now();
  const fileName = `${timestamp}_${uuid}.${extension}`;
  
  return folder ? `${folder}/${fileName}` : fileName;
}

/**
 * Загрузка файла в MinIO
 */
export async function uploadFile(
  file: File,
  options: FileUploadOptions
): Promise<UploadResult> {
  if (!minioClient) {
    throw new Error('MinIO client is not available (client-side environment)');
  }

  // Валидация файла (теперь асинхронная)
  const validation = await validateFile(file, options);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  // Генерация ключа
  const key = generateFileKey(file.name, options.folder);
  
  // Конвертация File в Buffer
  const buffer = Buffer.from(await file.arrayBuffer());
  
  // Метаданные файла
  const metaData = {
    'Content-Type': file.type,
    'Content-Length': file.size.toString(),
    'X-Original-Name': encodeURIComponent(file.name),
  };

  try {
    // Загрузка в MinIO
    await minioClient.putObject(options.bucket, key, buffer, file.size, metaData);
    
    // Формирование публичного URL
    const url = `${process.env.S3_ENDPOINT}/${options.bucket}/${key}`;
    
    return {
      url,
      key,
      bucket: options.bucket,
    };
  } catch (error) {
    console.error('Error uploading file to MinIO:', error);
    throw new Error('Ошибка загрузки файла');
  }
}

/**
 * Получение presigned URL для скачивания
 */
export async function getPresignedUrl(
  bucket: string,
  key: string,
  expirySeconds: number = 7 * 24 * 60 * 60 // 7 дней
): Promise<string> {
  if (!minioClient) {
    throw new Error('MinIO client is not available (client-side environment)');
  }

  try {
    return await minioClient.presignedGetObject(bucket, key, expirySeconds);
  } catch (error) {
    console.error('Error generating presigned URL:', error);
    throw new Error('Ошибка генерации ссылки для скачивания');
  }
}

/**
 * Удаление файла из MinIO
 */
export async function deleteFile(bucket: string, key: string): Promise<void> {
  if (!minioClient) {
    throw new Error('MinIO client is not available (client-side environment)');
  }

  try {
    await minioClient.removeObject(bucket, key);
  } catch (error) {
    console.error('Error deleting file from MinIO:', error);
    throw new Error('Ошибка удаления файла');
  }
}

/**
 * Проверка существования файла
 */
export async function fileExists(bucket: string, key: string): Promise<boolean> {
  if (!minioClient) {
    throw new Error('MinIO client is not available (client-side environment)');
  }

  try {
    await minioClient.statObject(bucket, key);
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Извлечение bucket и key из URL MinIO
 */
export function parseMinioUrl(url: string): { bucket: string; key: string } | null {
  try {
    const s3Endpoint = process.env.S3_ENDPOINT || 'http://localhost:9000';
    
    // Проверяем, что URL начинается с нашего S3 endpoint
    if (!url.startsWith(s3Endpoint)) {
      return null;
    }
    
    // Убираем endpoint из URL
    const pathPart = url.substring(s3Endpoint.length);
    
    // Разбираем путь: /bucket/key
    const pathMatch = pathPart.match(/^\/([^\/]+)\/(.+)$/);
    if (!pathMatch) {
      return null;
    }
    
    const [, bucket, key] = pathMatch;
    return { bucket, key };
  } catch (error) {
    console.error('Error parsing MinIO URL:', error);
    return null;
  }
}

/**
 * Удаление старого файла при обновлении (если URL из MinIO)
 */
export async function deleteOldFileIfExists(oldUrl: string | null): Promise<void> {
  if (!oldUrl) return;
  
  const parsed = parseMinioUrl(oldUrl);
  if (!parsed) {
    // Не наш файл, не удаляем
    return;
  }
  
  try {
    const exists = await fileExists(parsed.bucket, parsed.key);
    if (exists) {
      await deleteFile(parsed.bucket, parsed.key);
      console.log(`🗑️ Deleted old file: ${parsed.bucket}/${parsed.key}`);
    }
  } catch (error) {
    console.error(`❌ Error deleting old file ${oldUrl}:`, error);
    // Не бросаем ошибку, чтобы не прерывать основной процесс
  }
}
