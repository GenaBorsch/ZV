import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { parseMinioUrl, getPresignedUrl } from '@/lib/minio';
import { db, battlepasses, eq } from '@zv/db';

export async function GET(request: NextRequest) {
  try {
    // Проверка аутентификации
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Необходима авторизация' },
        { status: 401 }
      );
    }

    // Получаем URL файла из параметров запроса
    const { searchParams } = new URL(request.url);
    const fileUrl = searchParams.get('url');

    if (!fileUrl) {
      return NextResponse.json(
        { error: 'URL файла не указан' },
        { status: 400 }
      );
    }

    // Парсим URL файла для получения bucket и key
    const parsed = parseMinioUrl(fileUrl);
    if (!parsed) {
      return NextResponse.json(
        { error: 'Неверный URL файла' },
        { status: 400 }
      );
    }

    const { bucket, key } = parsed;

    // Проверяем права доступа к файлу
    // Если это файл из папки exclusive-materials, проверяем наличие баттлпасса
    if (key.startsWith('exclusive-materials/')) {
      const userId = (session.user as any).id;
      
      // Проверяем наличие баттлпасса у пользователя
      const userBattlepasses = await db
        .select()
        .from(battlepasses)
        .where(eq(battlepasses.userId, userId))
        .limit(1);

      if (userBattlepasses.length === 0) {
        return NextResponse.json(
          { error: 'У вас нет доступа к эксклюзивным материалам. Необходимо наличие путёвки.' },
          { status: 403 }
        );
      }
    }

    try {
      // Генерируем presigned URL для скачивания (действует 1 час)
      const downloadUrl = await getPresignedUrl(bucket, key, 3600);
      
      // Возвращаем временный URL для скачивания
      return NextResponse.json({
        success: true,
        downloadUrl,
        fileName: key.split('/').pop() || 'download'
      });

    } catch (error) {
      console.error('Error generating download URL:', error);
      return NextResponse.json(
        { error: 'Файл не найден или недоступен' },
        { status: 404 }
      );
    }

  } catch (error) {
    console.error('API download error:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}
