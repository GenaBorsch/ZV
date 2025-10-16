/**
 * API для работы с конкретным монстром (админ-панель)
 * GET    /api/admin/monsters/[id] - получить монстра
 * PATCH  /api/admin/monsters/[id] - обновить монстра
 * DELETE /api/admin/monsters/[id] - удалить монстра
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { monstersRepo } from '@zv/db';
import { UpdateMonsterDto } from '@zv/contracts';

/**
 * GET /api/admin/monsters/[id]
 * Получить монстра по ID
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

    const monster = await monstersRepo.getById(params.id);

    if (!monster) {
      return NextResponse.json({ error: 'Monster not found' }, { status: 404 });
    }

    return NextResponse.json(monster);
  } catch (error: any) {
    console.error('Error fetching monster:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/monsters/[id]
 * Обновить монстра
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
    const validation = UpdateMonsterDto.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error.errors },
        { status: 400 }
      );
    }

    // Обновление
    const monster = await monstersRepo.update(params.id, validation.data);

    return NextResponse.json(monster);
  } catch (error: any) {
    console.error('Error updating monster:', error);

    if (error.message === 'Monster not found') {
      return NextResponse.json({ error: 'Monster not found' }, { status: 404 });
    }

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

/**
 * DELETE /api/admin/monsters/[id]
 * Удалить монстра
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

    await monstersRepo.delete(params.id);

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    console.error('Error deleting monster:', error);

    if (error.message === 'Monster not found') {
      return NextResponse.json({ error: 'Monster not found' }, { status: 404 });
    }

    if (error.message === 'Cannot delete locked monster') {
      return NextResponse.json(
        { error: 'Cannot delete locked monster', message: 'This monster is currently locked and cannot be deleted' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    );
  }
}

