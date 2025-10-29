import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { ExclusiveMaterialsRepo } from '@zv/db';

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

    // Проверка прав (только для мастеров)
    const roles = (session.user as any)?.roles || [];
    if (!roles.includes('MASTER') && !roles.includes('SUPERADMIN') && !roles.includes('MODERATOR')) {
      return NextResponse.json(
        { error: 'Недостаточно прав' },
        { status: 403 }
      );
    }

    // Получаем видимые материалы (для мастеров доступны все видимые материалы без проверки баттлпасса)
    const materials = await ExclusiveMaterialsRepo.getVisible();

    return NextResponse.json({
      success: true,
      materials
    });

  } catch (error) {
    console.error('Error fetching exclusive materials for master:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}

