import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { parseMinioUrl, getPresignedUrl } from '@/lib/minio';

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
    // Для упрощения пока разрешаем доступ всем авторизованным пользователям
    // В будущем можно добавить более строгую проверку прав

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
