import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { CharactersRepo } from '@zv/db';
import { UpdateCharacterDto } from '@zv/contracts';

function hasRole(roles: string[] | undefined, requiredRole: string): boolean {
  return roles?.includes(requiredRole) || false;
}

function isAdmin(roles: string[] | undefined): boolean {
  return hasRole(roles, 'MODERATOR') || hasRole(roles, 'SUPERADMIN');
}

// GET /api/v1/admin/characters/[id] - Получить персонажа (для админа)
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions as any);
    if (!session?.user || !isAdmin((session.user as any).roles)) {
      return NextResponse.json({ error: 'Доступ запрещен. Требуется роль MODERATOR или SUPERADMIN.' }, { status: 403 });
    }

    const { id: characterId } = await params;

    // Админы могут получить любого персонажа без проверки прав доступа
    const character = await CharactersRepo.getById(characterId);
    
    if (!character) {
      return NextResponse.json({ error: 'Персонаж не найден' }, { status: 404 });
    }

    return NextResponse.json({ character });
  } catch (error: any) {
    console.error('Error in GET /api/v1/admin/characters/[id]:', error);
    return NextResponse.json({ 
      error: 'Внутренняя ошибка сервера',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 });
  }
}

// PATCH /api/v1/admin/characters/[id] - Обновить персонажа (для админа)
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions as any);
    if (!session?.user || !isAdmin((session.user as any).roles)) {
      return NextResponse.json({ error: 'Доступ запрещен. Требуется роль MODERATOR или SUPERADMIN.' }, { status: 403 });
    }

    const userId = (session.user as any).id;
    const userRoles = (session.user as any).roles;
    const { id: characterId } = await params;

    // Валидация входных данных
    const body = await req.json();
    const validationResult = UpdateCharacterDto.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json({ 
        error: 'Некорректные данные',
        details: validationResult.error.errors 
      }, { status: 400 });
    }

    const data = validationResult.data;

    // Админы могут обновлять любого персонажа
    const character = await CharactersRepo.update(characterId, data, userId, userRoles);

    return NextResponse.json({ character });
  } catch (error: any) {
    console.error('Error in PATCH /api/v1/admin/characters/[id]:', error);
    
    if (error.message === 'Персонаж не найден') {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    
    return NextResponse.json({ 
      error: 'Внутренняя ошибка сервера',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 });
  }
}

// DELETE /api/v1/admin/characters/[id] - Удалить персонажа (для админа)
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions as any);
    if (!session?.user || !isAdmin((session.user as any).roles)) {
      return NextResponse.json({ error: 'Доступ запрещен. Требуется роль MODERATOR или SUPERADMIN.' }, { status: 403 });
    }

    const userId = (session.user as any).id;
    const userRoles = (session.user as any).roles;
    const { id: characterId } = await params;

    // Админы могут удалять любого персонажа
    await CharactersRepo.delete(characterId, userId, userRoles);

    return NextResponse.json({ message: 'Персонаж успешно удален' });
  } catch (error: any) {
    console.error('Error in DELETE /api/v1/admin/characters/[id]:', error);
    
    if (error.message === 'Персонаж не найден') {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    
    return NextResponse.json({ 
      error: 'Внутренняя ошибка сервера',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 });
  }
}
