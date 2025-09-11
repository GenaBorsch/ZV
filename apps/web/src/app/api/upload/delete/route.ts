import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { deleteFile } from '@/lib/minio';

export async function DELETE(request: NextRequest) {
  try {
    // Проверка аутентификации
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Необходима авторизация' },
        { status: 401 }
      );
    }

    // Получение данных из запроса
    const body = await request.json();
    const { bucket, key } = body;

    if (!bucket || !key) {
      return NextResponse.json(
        { error: 'Необходимы параметры bucket и key' },
        { status: 400 }
      );
    }

    try {
      // Удаление файла
      await deleteFile(bucket, key);
      
      console.log(`✅ File deleted successfully:`, {
        userId: session.user.id,
        bucket,
        key
      });

      return NextResponse.json({
        success: true,
        message: 'Файл успешно удален'
      });

    } catch (deleteError) {
      console.error('Delete error:', deleteError);
      return NextResponse.json(
        { error: deleteError instanceof Error ? deleteError.message : 'Ошибка удаления файла' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('API delete error:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}
