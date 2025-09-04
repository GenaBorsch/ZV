import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { CharactersRepo } from '@zv/db';
import { z } from 'zod';

const AssignGroupDto = z.object({
  groupId: z.string().uuid('Некорректный ID группы'),
});

function hasRole(roles: string[] | undefined, requiredRole: string): boolean {
  return roles?.includes(requiredRole) || false;
}

function isPlayer(roles: string[] | undefined): boolean {
  return hasRole(roles, 'PLAYER');
}

// POST /api/v1/characters/[id]/assign-group - Привязать персонажа к группе
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions as any);
    if (!session?.user) {
      return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 });
    }

    const userId = (session.user as any).id;
    const userRoles = (session.user as any).roles;
    const { id: characterId } = await params;

    // Только игроки могут привязывать своих персонажей к группам
    if (!isPlayer(userRoles)) {
      return NextResponse.json({ error: 'Доступ запрещен. Требуется роль PLAYER.' }, { status: 403 });
    }

    // Валидация входных данных
    const body = await req.json();
    const validationResult = AssignGroupDto.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json({ 
        error: 'Некорректные данные',
        details: validationResult.error.errors 
      }, { status: 400 });
    }

    const { groupId } = validationResult.data;

    // Привязываем персонажа к группе
    await CharactersRepo.assignToGroup(characterId, groupId, userId, userRoles);

    return NextResponse.json({ 
      message: 'Персонаж успешно привязан к группе',
      characterId,
      groupId 
    });
  } catch (error: any) {
    console.error('Error in POST /api/v1/characters/[id]/assign-group:', error);
    
    if (error.message === 'Персонаж не найден') {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    
    if (error.message === 'Доступ к персонажу запрещен' || error.message === 'Доступ запрещен') {
      return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 });
    }
    
    if (error.message === 'Игрок не состоит в этой группе') {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    
    return NextResponse.json({ 
      error: 'Внутренняя ошибка сервера',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 });
  }
}
