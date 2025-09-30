import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { GroupsRepo } from '@zv/db';
import { z } from 'zod';

// Схема валидации для ответа на заявку
const ApplicationResponseSchema = z.object({
  action: z.enum(['approve', 'reject']),
  masterResponse: z.string().optional(),
});

function isMaster(roles: string[] | undefined): boolean {
  return roles?.includes('MASTER') || false;
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Проверка авторизации
    const session = await getServerSession(authOptions);
    if (!session?.user || !isMaster((session.user as any).roles)) {
      return NextResponse.json({ error: 'Доступ запрещен. Требуется роль MASTER.' }, { status: 403 });
    }

    const userId = (session.user as any).id;
    const applicationId = (await params).id;

    // Валидация входных данных
    const body = await req.json();
    const validationResult = ApplicationResponseSchema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json({ error: 'Некорректные данные', details: validationResult.error.errors }, { status: 400 });
    }

    const { action, masterResponse } = validationResult.data;

    let application;
    
    if (action === 'approve') {
      application = await GroupsRepo.approveApplication(applicationId, userId, masterResponse);
    } else {
      application = await GroupsRepo.rejectApplication(applicationId, userId, masterResponse);
    }

    return NextResponse.json({
      message: action === 'approve' ? 'Заявка принята' : 'Заявка отклонена',
      application: {
        id: application.id,
        groupId: application.groupId,
        status: application.status,
        message: application.message,
        masterResponse: application.masterResponse,
        createdAt: application.createdAt,
        updatedAt: application.updatedAt,
        player: {
          id: application.player.id,
          userId: application.player.userId,
          nickname: application.player.nickname,
          notes: application.player.notes,
          user: {
            id: application.player.user.id,
            name: application.player.user.name,
            email: application.player.user.email,
            rpgExperience: application.player.user.rpgExperience,
            contacts: application.player.user.contacts,
          }
        }
      }
    });

  } catch (error: any) {
    console.error('Error in PATCH /api/groups/applications/[id]:', error);

    if (error.message === 'Application not found') {
      return NextResponse.json({ error: 'Заявка не найдена' }, { status: 404 });
    }
    
    if (error.message === 'Access denied. You are not the master of this group.') {
      return NextResponse.json({ error: 'Доступ запрещен. Вы не являетесь мастером этой группы.' }, { status: 403 });
    }
    
    if (error.message === 'Application is not pending') {
      return NextResponse.json({ error: 'Заявка уже обработана' }, { status: 409 });
    }
    
    if (error.message === 'Group is full') {
      return NextResponse.json({ error: 'Группа заполнена. Нет свободных мест.' }, { status: 409 });
    }

    return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 });
  }
}
