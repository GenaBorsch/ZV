import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { ExclusiveMaterialsRepo } from '@zv/db';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Проверка аутентификации
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Необходима авторизация' },
        { status: 401 }
      );
    }

    // Проверка прав (только для админов)
    const roles = (session.user as any)?.roles || [];
    if (!roles.includes('SUPERADMIN') && !roles.includes('MODERATOR')) {
      return NextResponse.json(
        { error: 'Недостаточно прав' },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const { title, fileUrl, fileName, fileSize, isVisible, sortOrder } = body;

    // Обновляем материал
    const material = await ExclusiveMaterialsRepo.update(id, {
      title,
      fileUrl,
      fileName,
      fileSize,
      isVisible,
      sortOrder,
    });

    if (!material) {
      return NextResponse.json(
        { error: 'Материал не найден' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      material
    });

  } catch (error) {
    console.error('Error updating exclusive material:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Проверка аутентификации
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Необходима авторизация' },
        { status: 401 }
      );
    }

    // Проверка прав (только для админов)
    const roles = (session.user as any)?.roles || [];
    if (!roles.includes('SUPERADMIN') && !roles.includes('MODERATOR')) {
      return NextResponse.json(
        { error: 'Недостаточно прав' },
        { status: 403 }
      );
    }

    const { id } = await params;

    // Удаляем материал
    await ExclusiveMaterialsRepo.delete(id);

    return NextResponse.json({
      success: true
    });

  } catch (error) {
    console.error('Error deleting exclusive material:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}

