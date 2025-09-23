import { NextRequest, NextResponse } from 'next/server';
import { minioClient } from '@/lib/minio';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const resolvedParams = await params;
    const path = resolvedParams.path;
    
    if (!path || path.length < 2) {
      return NextResponse.json(
        { error: 'Неверный путь к файлу' },
        { status: 400 }
      );
    }

    // Первый элемент пути - это bucket, остальное - key
    const bucket = path[0];
    const key = path.slice(1).join('/');

    // Проверяем доступ к публичным файлам
    const publicBuckets = ['uploads', 'avatars'];
    
    if (!publicBuckets.includes(bucket)) {
      return NextResponse.json(
        { error: 'Доступ запрещён' },
        { status: 403 }
      );
    }

    if (!minioClient) {
      return NextResponse.json(
        { error: 'Сервис файлов недоступен' },
        { status: 500 }
      );
    }

    try {
      // Получаем объект из MinIO
      const stream = await minioClient.getObject(bucket, key);
      
      // Получаем метаданные файла
      const stat = await minioClient.statObject(bucket, key);
      
      // Читаем данные из потока
      const chunks: Buffer[] = [];
      for await (const chunk of stream) {
        chunks.push(chunk);
      }
      const buffer = Buffer.concat(chunks);

      // Определяем Content-Type
      let contentType = stat.metaData['content-type'] || 'application/octet-stream';
      
      // Если Content-Type не определён, попробуем определить по расширению
      if (contentType === 'application/octet-stream') {
        const extension = key.split('.').pop()?.toLowerCase();
        switch (extension) {
          case 'jpg':
          case 'jpeg':
            contentType = 'image/jpeg';
            break;
          case 'png':
            contentType = 'image/png';
            break;
          case 'gif':
            contentType = 'image/gif';
            break;
          case 'webp':
            contentType = 'image/webp';
            break;
          case 'svg':
            contentType = 'image/svg+xml';
            break;
          default:
            contentType = 'application/octet-stream';
        }
      }

      // Возвращаем файл с правильными заголовками
      return new NextResponse(buffer, {
        status: 200,
        headers: {
          'Content-Type': contentType,
          'Content-Length': buffer.length.toString(),
          'Cache-Control': 'public, max-age=3600', // Кэшируем на 1 час
          'ETag': `"${stat.etag}"`,
        },
      });

    } catch (minioError: any) {
      console.error('MinIO error:', minioError);
      
      // Если файл не найден
      if (minioError.code === 'NoSuchKey' || minioError.code === 'NotFound') {
        return NextResponse.json(
          { error: 'Файл не найден' },
          { status: 404 }
        );
      }
      
      return NextResponse.json(
        { error: 'Ошибка при получении файла' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('API files error:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}
