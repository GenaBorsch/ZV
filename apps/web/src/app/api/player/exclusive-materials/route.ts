import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db, ExclusiveMaterialsRepo, battlepasses, eq } from '@zv/db';

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

    const userId = session.user.id as string;

    // Проверяем, есть ли у пользователя хотя бы один баттлпасс
    const userBattlepasses = await db
      .select()
      .from(battlepasses)
      .where(eq(battlepasses.userId, userId))
      .limit(1);

    if (userBattlepasses.length === 0) {
      return NextResponse.json(
        { error: 'У вас нет активных путёвок' },
        { status: 403 }
      );
    }

    // Получаем видимые материалы
    const materials = await ExclusiveMaterialsRepo.getVisible();

    return NextResponse.json({
      success: true,
      materials
    });

  } catch (error) {
    console.error('Error fetching exclusive materials for player:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}

