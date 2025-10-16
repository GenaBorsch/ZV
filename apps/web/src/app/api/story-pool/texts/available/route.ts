/**
 * API для получения доступных текстовых элементов (для выбора мастером)
 * GET /api/story-pool/texts/available?type=LOCATION|MAIN_EVENT|SIDE_EVENT
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { storyTextsRepo } from '@zv/db';
import type { StoryTextType } from '@zv/db';

/**
 * GET /api/story-pool/texts/available
 * Получить список доступных текстов по типу для выбора
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
    const type = searchParams.get('type') as StoryTextType | null;
    const search = searchParams.get('search') || undefined;
    const limit = parseInt(searchParams.get('limit') || '50');

    // Валидация типа
    if (!type) {
      return NextResponse.json(
        { error: 'Type parameter is required', message: 'Please provide type: LOCATION, MAIN_EVENT, or SIDE_EVENT' },
        { status: 400 }
      );
    }

    if (!['LOCATION', 'MAIN_EVENT', 'SIDE_EVENT'].includes(type)) {
      return NextResponse.json(
        { error: 'Invalid type parameter', message: 'Type must be one of: LOCATION, MAIN_EVENT, SIDE_EVENT' },
        { status: 400 }
      );
    }

    // Получение доступных текстов
    const texts = await storyTextsRepo.listAvailableByType(type, search, limit);

    return NextResponse.json({
      data: texts,
      total: texts.length,
      type,
    });
  } catch (error: any) {
    console.error('Error fetching available story texts:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    );
  }
}

