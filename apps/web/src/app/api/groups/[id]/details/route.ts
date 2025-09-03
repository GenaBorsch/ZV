import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { GroupsRepo } from '@zv/db';

function isPlayer(roles: string[] | undefined): boolean {
  const r = roles || [];
  return r.includes('PLAYER');
}

function isMaster(roles: string[] | undefined): boolean {
  const r = roles || [];
  return r.includes('MASTER');
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions as any);
    if (!session?.user) {
      return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 });
    }

    const userId = (session.user as any).id;
    const userRoles = (session.user as any).roles;
    const { id: groupId } = await params; // Await params

    // Проверяем, что пользователь либо игрок в группе, либо мастер группы
    let hasAccess = false;
    
    if (isMaster(userRoles)) {
      hasAccess = await GroupsRepo.isGroupMaster(groupId, userId);
    }
    
    if (!hasAccess && isPlayer(userRoles)) {
      // Проверяем, состоит ли игрок в этой группе
      const playerGroups = await GroupsRepo.getPlayerGroups(userId);
      hasAccess = playerGroups.some(group => group.id === groupId);
    }

    if (!hasAccess) {
      return NextResponse.json({ error: 'Доступ запрещен. Вы не состоите в этой группе.' }, { status: 403 });
    }

    const group = await GroupsRepo.getById(groupId);
    if (!group) {
      return NextResponse.json({ error: 'Группа не найдена' }, { status: 404 });
    }

    const members = await GroupsRepo.getGroupMembers(groupId);

    return NextResponse.json({ group, members });
  } catch (error: any) {
    console.error('Error fetching group details:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch group details' }, { status: 500 });
  }
}
