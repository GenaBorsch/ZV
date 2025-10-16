/**
 * API для работы с конкретным текстовым элементом (админ-панель)
 * GET    /api/admin/story-texts/[id] - получить текст
 * PATCH  /api/admin/story-texts/[id] - обновить текст
 * DELETE /api/admin/story-texts/[id] - удалить текст
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { storyTextsRepo } from '@zv/db';
import { UpdateStoryTextDto } from '@zv/contracts';

/**
 * GET /api/admin/story-texts/[id]
 * Получить текст по ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const storyText = await storyTextsRepo.getById(params.id);

    if (!storyText) {
      return NextResponse.json({ error: 'Story text not found' }, { status: 404 });
    }

    return NextResponse.json(storyText);
  } catch (error: any) {
    console.error('Error fetching story text:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/story-texts/[id]
 * Обновить текстовый элемент
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
    const validation = UpdateStoryTextDto.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error.errors },
        { status: 400 }
      );
    }

    // Обновление
    const storyText = await storyTextsRepo.update(params.id, validation.data);

    return NextResponse.json(storyText);
  } catch (error: any) {
    console.error('Error updating story text:', error);

    if (error.message === 'Story text not found') {
      return NextResponse.json({ error: 'Story text not found' }, { status: 404 });
    }

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

/**
 * DELETE /api/admin/story-texts/[id]
 * Удалить текстовый элемент
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    await storyTextsRepo.delete(params.id);

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    console.error('Error deleting story text:', error);

    if (error.message === 'Story text not found') {
      return NextResponse.json({ error: 'Story text not found' }, { status: 404 });
    }

    if (error.message === 'Cannot delete locked story text') {
      return NextResponse.json(
        { error: 'Cannot delete locked story text', message: 'This story text is currently locked and cannot be deleted' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    );
  }
}

