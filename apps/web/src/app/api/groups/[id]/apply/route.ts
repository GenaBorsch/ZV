import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { GroupsRepo } from '@zv/db';
import { z } from 'zod';

// Схема валидации для заявки
const ApplyToGroupSchema = z.object({
  message: z.string().optional(),
});

function isPlayer(roles: string[] | undefined): boolean {
  return roles?.includes('PLAYER') || false;
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Проверка авторизации
    const session = await getServerSession(authOptions as any);
    if (!session?.user || !isPlayer((session.user as any).roles)) {
      return NextResponse.json({ error: 'Доступ запрещен. Требуется роль PLAYER.' }, { status: 403 });
    }

    const userId = (session.user as any).id;
    const groupId = (await params).id;

    // Валидация входных данных
    const body = await req.json();
    const validationResult = ApplyToGroupSchema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json({ error: 'Некорректные данные', details: validationResult.error.errors }, { status: 400 });
    }

    const { message } = validationResult.data;

    // Подать заявку
    const application = await GroupsRepo.applyToGroup(groupId, userId, message);

    return NextResponse.json({
      message: 'Заявка успешно отправлена',
      application: {
        id: application.id,
        groupId: application.groupId,
        status: application.status,
        message: application.message,
        createdAt: application.createdAt,
      }
    }, { status: 201 });

  } catch (error: any) {
    console.error('Error in POST /api/groups/[id]/apply:', error);

    if (error.message === 'Group not found') {
      return NextResponse.json({ error: 'Группа не найдена' }, { status: 404 });
    }
    
    if (error.message === 'Group is not recruiting') {
      return NextResponse.json({ error: 'Группа не ведет набор игроков' }, { status: 409 });
    }
    
    if (error.message === 'Application already submitted') {
      return NextResponse.json({ error: 'Заявка уже подана на эту группу' }, { status: 409 });
    }
    
    if (error.message === 'Player already in group') {
      return NextResponse.json({ error: 'Вы уже являетесь участником этой группы' }, { status: 409 });
    }

    return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 });
  }
}
