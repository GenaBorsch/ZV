import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { GroupsRepo } from '@zv/db';

function isMaster(roles: string[] | undefined): boolean {
  return roles?.includes('MASTER') || false;
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Проверка авторизации
    const session = await getServerSession(authOptions);
    if (!session?.user || !isMaster((session.user as any).roles)) {
      return NextResponse.json({ error: 'Доступ запрещен. Требуется роль MASTER.' }, { status: 403 });
    }

    const userId = (session.user as any).id;
    const groupId = (await params).id;

    // Получить заявки для группы
    const applications = await GroupsRepo.getGroupApplications(groupId, userId);

    return NextResponse.json({
      applications: applications.map(app => ({
        id: app.id,
        groupId: app.groupId,
        status: app.status,
        message: app.message,
        masterResponse: app.masterResponse,
        createdAt: app.createdAt,
        updatedAt: app.updatedAt,
        player: {
          id: app.player.id,
          userId: app.player.userId,
          nickname: app.player.nickname,
          notes: app.player.notes,
          user: {
            id: app.player.user.id,
            name: app.player.user.name,
            email: app.player.user.email,
            rpgExperience: app.player.user.rpgExperience,
            contacts: app.player.user.contacts,
          }
        }
      }))
    });

  } catch (error: any) {
    console.error('Error in GET /api/groups/[id]/applications:', error);

    if (error.message === 'Access denied. You are not the master of this group.') {
      return NextResponse.json({ error: 'Доступ запрещен. Вы не являетесь мастером этой группы.' }, { status: 403 });
    }

    return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 });
  }
}
