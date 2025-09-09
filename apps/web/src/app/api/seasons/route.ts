import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { db, seasons, eq, desc } from '@zv/db';

function isPlayer(roles: string[] | undefined): boolean {
  return roles?.includes('PLAYER') || false;
}

export async function GET(req: NextRequest) {
  try {
    // Проверка авторизации
    const session = await getServerSession(authOptions as any);
    if (!session?.user || !isPlayer((session.user as any).roles)) {
      return NextResponse.json({ error: 'Доступ запрещен. Требуется роль PLAYER.' }, { status: 403 });
    }

    // Получение параметров запроса
    const url = new URL(req.url);
    const activeOnly = url.searchParams.get('active') === 'true';

    // Построение запроса
    let seasonsList;
    
    if (activeOnly) {
      seasonsList = await db
        .select()
        .from(seasons)
        .where(eq(seasons.isActive, true))
        .orderBy(desc(seasons.createdAt));
    } else {
      seasonsList = await db
        .select()
        .from(seasons)
        .orderBy(desc(seasons.createdAt));
    }

    // Формирование ответа
    const response = seasonsList.map(season => ({
      id: season.id,
      title: season.title,
      code: season.code,
      startsAt: season.startsAt.toISOString(),
      endsAt: season.endsAt.toISOString(),
      isActive: season.isActive,
    }));

    return NextResponse.json({ 
      seasons: response,
      total: response.length 
    });

  } catch (error: any) {
    console.error('Error in GET /api/seasons:', error);
    return NextResponse.json({ 
      error: error.message || 'Внутренняя ошибка сервера' 
    }, { status: 500 });
  }
}
