/**
 * API для управления монстрами (админ-панель)
 * GET  /api/admin/monsters - список монстров с фильтрацией
 * POST /api/admin/monsters - создание монстра
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { monstersRepo } from '@zv/db';
import { CreateMonsterDto, MonstersListQueryDto } from '@zv/contracts';

/**
 * GET /api/admin/monsters
 * Получить список монстров с фильтрацией и пагинацией
 */
export async function GET(request: NextRequest) {
  try {
    // Проверка авторизации
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Проверка роли (только MODERATOR или SUPERADMIN)
    const userRoles = (session.user as any).roles || [];
    if (!userRoles.includes('MODERATOR') && !userRoles.includes('SUPERADMIN')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Парсинг query параметров
    const searchParams = request.nextUrl.searchParams;
    const statusParam = searchParams.get('status');
    const isActiveParam = searchParams.get('isActive');
    const searchParam = searchParams.get('search');
    const pageParam = searchParams.get('page');
    const limitParam = searchParams.get('limit');
    
    const queryParams = {
      status: statusParam ? (statusParam as 'AVAILABLE' | 'LOCKED') : undefined,
      isActive: isActiveParam === 'true' ? true : isActiveParam === 'false' ? false : undefined,
      search: searchParam || undefined,
      page: pageParam || undefined,
      limit: limitParam || undefined,
    };

    // Валидация параметров
    const validation = MonstersListQueryDto.safeParse(queryParams);
    if (!validation.success) {
      console.error('Validation failed:', validation.error.errors);
      return NextResponse.json(
        { error: 'Invalid query parameters', details: validation.error.errors },
        { status: 400 }
      );
    }

    // Получение данных
    const result = await monstersRepo.list(queryParams);

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error fetching monsters:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/monsters
 * Создать нового монстра
 */
export async function POST(request: NextRequest) {
  try {
    // Проверка авторизации
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Проверка роли
    const userRoles = (session.user as any).roles || [];
    if (!userRoles.includes('MODERATOR') && !userRoles.includes('SUPERADMIN')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Парсинг тела запроса
    const body = await request.json();

    // Валидация
    const validation = CreateMonsterDto.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error.errors },
        { status: 400 }
      );
    }

    // Создание монстра
    const monster = await monstersRepo.create(validation.data);

    return NextResponse.json(monster, { status: 201 });
  } catch (error: any) {
    console.error('Error creating monster:', error);

    // Обработка ошибки уникальности
    if (error.message?.includes('unique') || error.message?.includes('duplicate')) {
      return NextResponse.json(
        { error: 'Monster with this title already exists' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    );
  }
}

