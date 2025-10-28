import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db, ExclusiveMaterialsRepo, eq } from '@zv/db';

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

    // Проверка прав (только для админов)
    const roles = (session.user as any)?.roles || [];
    if (!roles.includes('SUPERADMIN') && !roles.includes('MODERATOR')) {
      return NextResponse.json(
        { error: 'Недостаточно прав' },
        { status: 403 }
      );
    }

    // Получаем все материалы
    const materials = await ExclusiveMaterialsRepo.getAll();

    return NextResponse.json({
      success: true,
      materials
    });

  } catch (error) {
    console.error('Error fetching exclusive materials:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
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

    // Проверка прав (только для админов)
    const roles = (session.user as any)?.roles || [];
    if (!roles.includes('SUPERADMIN') && !roles.includes('MODERATOR')) {
      return NextResponse.json(
        { error: 'Недостаточно прав' },
        { status: 403 }
      );
    }

    // Получаем данные из запроса
    const body = await request.json();
    const { title, fileUrl, fileName, fileSize, sortOrder } = body;

    if (!title || !fileUrl || !fileName) {
      return NextResponse.json(
        { error: 'Необходимы поля: title, fileUrl, fileName' },
        { status: 400 }
      );
    }

    // Создаем материал
    const material = await ExclusiveMaterialsRepo.create({
      title,
      fileUrl,
      fileName,
      fileSize: fileSize || null,
      isVisible: true,
      sortOrder: sortOrder || 0,
    });

    return NextResponse.json({
      success: true,
      material
    });

  } catch (error) {
    console.error('Error creating exclusive material:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}

