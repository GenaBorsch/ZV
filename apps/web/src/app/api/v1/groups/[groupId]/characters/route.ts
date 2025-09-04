import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { CharactersRepo, ProfilesRepo } from '@zv/db';

function hasRole(roles: string[] | undefined, requiredRole: string): boolean {
  return roles?.includes(requiredRole) || false;
}

function isMaster(roles: string[] | undefined): boolean {
  return hasRole(roles, 'MASTER');
}

function isAdmin(roles: string[] | undefined): boolean {
  return hasRole(roles, 'MODERATOR') || hasRole(roles, 'SUPERADMIN');
}

// GET /api/v1/groups/[groupId]/characters - Получить персонажей группы (для мастера)
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ groupId: string }> }
) {
  try {
    const session = await getServerSession(authOptions as any);
    if (!session?.user) {
      return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 });
    }

    const userId = (session.user as any).id;
    const userRoles = (session.user as any).roles;
    const { groupId } = await params;

    // Только мастера и админы могут просматривать персонажей группы
    if (!isMaster(userRoles) && !isAdmin(userRoles)) {
      return NextResponse.json({ error: 'Доступ запрещен. Требуется роль MASTER или выше.' }, { status: 403 });
    }

    let characters;

    if (isAdmin(userRoles)) {
      // Админы могут просматривать персонажей любой группы
      // Для админов нужна отдельная логика, пока используем мастерскую
      const { ProfilesRepo } = await import('@zv/db');
      const profile = await ProfilesRepo.prototype.getProfile(userId);
      
      if (!profile.masterProfile) {
        return NextResponse.json({ error: 'Профиль мастера не найден' }, { status: 404 });
      }

      characters = await CharactersRepo.getByGroupId(groupId, profile.masterProfile.id);
    } else {
      // Мастера могут просматривать только персонажей своих групп
      const { ProfilesRepo } = await import('@zv/db');
      const profile = await ProfilesRepo.prototype.getProfile(userId);
      
      if (!profile.masterProfile) {
        return NextResponse.json({ error: 'Профиль мастера не найден' }, { status: 404 });
      }

      characters = await CharactersRepo.getByGroupId(groupId, profile.masterProfile.id);
    }

    return NextResponse.json({ characters });
  } catch (error: any) {
    console.error('Error in GET /api/v1/groups/[groupId]/characters:', error);
    
    if (error.message === 'Группа не найдена или вы не являетесь её мастером') {
      return NextResponse.json({ error: 'Группа не найдена или доступ запрещен' }, { status: 404 });
    }
    
    return NextResponse.json({ 
      error: 'Внутренняя ошибка сервера',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 });
  }
}
