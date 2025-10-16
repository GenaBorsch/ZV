/**
 * API для получения доступных монстров (для выбора мастером)
 * GET /api/story-pool/monsters/available
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { monstersRepo } from '@zv/db';

/**
 * GET /api/story-pool/monsters/available
 * Получить список доступных монстров для выбора
 */
export async function GET(request: NextRequest) {
  try {
    // Проверка авторизации
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Проверка роли (только MASTER)
    const userRoles = (session.user as any).roles || [];
    if (!userRoles.includes('MASTER')) {
      return NextResponse.json(
        { error: 'Forbidden', message: 'Only masters can access this endpoint' },
        { status: 403 }
      );
    }

    // Параметры поиска
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get('search') || undefined;
    const limit = parseInt(searchParams.get('limit') || '50');

    // Получение доступных монстров
    const monsters = await monstersRepo.listAvailable(search, limit);

    return NextResponse.json({
      data: monsters,
      total: monsters.length,
    });
  } catch (error: any) {
    console.error('Error fetching available monsters:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    );
  }
}

