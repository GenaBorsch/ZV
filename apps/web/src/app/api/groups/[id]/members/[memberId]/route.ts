import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { GroupsRepo } from '@zv/db';

function isMaster(roles: string[] | undefined): boolean {
  const r = roles || [];
  return r.includes('MASTER');
}

// DELETE /api/groups/[id]/members/[memberId] - Удалить участника из группы
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; memberId: string }> }
) {
  try {
    const session = await getServerSession(authOptions as any);
    if (!session?.user || !isMaster((session.user as any).roles)) {
      return NextResponse.json({ error: 'Доступ запрещен. Требуется роль MASTER.' }, { status: 403 });
    }

    const userId = (session.user as any).id;
    const { id: groupId, memberId } = await params;

    // Удалить участника из группы
    const success = await GroupsRepo.removeMember(groupId, memberId, userId);

    if (!success) {
      return NextResponse.json({ 
        error: 'Не удалось удалить участника. Возможно, группа не найдена или доступ запрещен.' 
      }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Участник успешно удален из группы' });

  } catch (error: any) {
    console.error('Error removing member from group:', error);
    return NextResponse.json({ error: error.message || 'Failed to remove member from group' }, { status: 500 });
  }
}
