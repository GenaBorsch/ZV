import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { GroupsRepo } from '@zv/db';

function isPlayer(roles: string[] | undefined): boolean {
  const r = roles || [];
  return r.includes('PLAYER');
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !isPlayer((session.user as any).roles)) {
      return NextResponse.json({ error: 'Доступ запрещен. Требуется роль PLAYER.' }, { status: 403 });
    }

    const userId = (session.user as any).id;
    const { id: groupId } = await params; // Await params

    const success = await GroupsRepo.leaveGroup(groupId, userId);

    if (!success) {
      return NextResponse.json({ error: 'Не удалось покинуть группу. Возможно, вы не состоите в этой группе.' }, { status: 400 });
    }

    return NextResponse.json({ message: 'Вы успешно покинули группу' });
  } catch (error: any) {
    console.error('Error leaving group:', error);
    return NextResponse.json({ error: error.message || 'Failed to leave group' }, { status: 500 });
  }
}
