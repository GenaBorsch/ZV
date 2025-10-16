/**
 * API "Мне повезёт" - случайная генерация сетки событий
 * POST /api/story-pool/feeling-lucky
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { monstersRepo, storyTextsRepo } from '@zv/db';
import { FeelingLuckyRequestDto } from '@zv/contracts';

/**
 * POST /api/story-pool/feeling-lucky
 * Случайно выбрать сетку из 4 элементов: 1 монстр + 3 текста
 */
export async function POST(request: NextRequest) {
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

    // Парсинг body (опционально - groupId для будущего использования)
    const body = await request.json();
    const validation = FeelingLuckyRequestDto.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error.errors },
        { status: 400 }
      );
    }

    // Случайный выбор элементов
    const [monster, textGrid] = await Promise.all([
      monstersRepo.getRandomAvailable(),
      storyTextsRepo.getRandomGrid(),
    ]);

    // Проверка доступности всех элементов
    const missing = [];
    if (!monster) missing.push('monster');
    if (!textGrid.location) missing.push('location');
    if (!textGrid.mainEvent) missing.push('main event');
    if (!textGrid.sideEvent) missing.push('side event');

    if (missing.length > 0) {
      return NextResponse.json(
        {
          error: 'Insufficient available elements',
          message: `Not enough available elements to generate grid. Missing: ${missing.join(', ')}`,
          missing,
        },
        { status: 409 }
      );
    }

    // Формирование ответа
    const response = {
      monsterId: monster!.id,
      locationTextId: textGrid.location!.id,
      mainEventTextId: textGrid.mainEvent!.id,
      sideEventTextId: textGrid.sideEvent!.id,
      elements: {
        monster: monster!,
        location: textGrid.location!,
        mainEvent: textGrid.mainEvent!,
        sideEvent: textGrid.sideEvent!,
      },
    };

    return NextResponse.json(response);
  } catch (error: any) {
    console.error('Error generating feeling lucky grid:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    );
  }
}

