import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { GroupsRepo } from '@zv/db';

function isPlayer(roles: string[] | undefined): boolean {
  return roles?.includes('PLAYER') || false;
}

export async function GET(req: NextRequest) {
  try {
    // Проверка авторизации
    const session = await getServerSession(authOptions);
    if (!session?.user || !isPlayer((session.user as any).roles)) {
      return NextResponse.json({ error: 'Доступ запрещен. Требуется роль PLAYER.' }, { status: 403 });
    }

    const userId = (session.user as any).id;

    // Получить заявки игрока
    const applications = await GroupsRepo.getPlayerApplications(userId);

    return NextResponse.json({
      applications: applications.map(app => ({
        id: app.id,
        groupId: app.groupId,
        status: app.status,
        message: app.message,
        masterResponse: app.masterResponse,
        createdAt: app.createdAt,
        updatedAt: app.updatedAt,
      }))
    });

  } catch (error: any) {
    console.error('Error in GET /api/groups/applications/my:', error);
    return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 });
  }
}
