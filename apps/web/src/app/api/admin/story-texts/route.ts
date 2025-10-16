/**
 * API для управления текстовыми элементами (админ-панель)
 * GET  /api/admin/story-texts - список текстов с фильтрацией
 * POST /api/admin/story-texts - создание текста
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { storyTextsRepo } from '@zv/db';
import { CreateStoryTextDto, StoryTextsListQueryDto } from '@zv/contracts';

/**
 * GET /api/admin/story-texts
 * Получить список текстов с фильтрацией и пагинацией
 */
export async function GET(request: NextRequest) {
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

    // Парсинг query параметров
    const searchParams = request.nextUrl.searchParams;
    const typeParam = searchParams.get('type');
    const statusParam = searchParams.get('status');
    const isActiveParam = searchParams.get('isActive');
    const searchParam = searchParams.get('search');
    const pageParam = searchParams.get('page');
    const limitParam = searchParams.get('limit');
    
    const queryParams = {
      type: typeParam ? (typeParam as 'LOCATION' | 'MAIN_EVENT' | 'SIDE_EVENT') : undefined,
      status: statusParam ? (statusParam as 'AVAILABLE' | 'LOCKED') : undefined,
      isActive: isActiveParam === 'true' ? true : isActiveParam === 'false' ? false : undefined,
      search: searchParam || undefined,
      page: pageParam || undefined,
      limit: limitParam || undefined,
    };

    // Валидация параметров
    const validation = StoryTextsListQueryDto.safeParse(queryParams);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: validation.error.errors },
        { status: 400 }
      );
    }

    // Получение данных
    const result = await storyTextsRepo.list(queryParams);

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error fetching story texts:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/story-texts
 * Создать новый текстовый элемент
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
    const validation = CreateStoryTextDto.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error.errors },
        { status: 400 }
      );
    }

    // Создание текста
    const storyText = await storyTextsRepo.create(validation.data);

    return NextResponse.json(storyText, { status: 201 });
  } catch (error: any) {
    console.error('Error creating story text:', error);

    // Обработка ошибки уникальности
    if (error.message?.includes('unique') || error.message?.includes('duplicate')) {
      return NextResponse.json(
        { error: 'Story text with this type and content already exists' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    );
  }
}

