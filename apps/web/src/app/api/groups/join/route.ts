import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { GroupsRepo } from '@zv/db';
import { JoinGroupDto } from '@zv/contracts';

function isPlayer(roles: string[] | undefined): boolean {
  const r = roles || [];
  return r.includes('PLAYER');
}

export async function POST(req: Request) {
  try {
    // Проверка авторизации
    const session = await getServerSession(authOptions as any);
    if (!session?.user || !isPlayer((session.user as any).roles)) {
      return NextResponse.json({ error: 'Доступ запрещен. Требуется роль PLAYER.' }, { status: 403 });
    }

    const userId = (session.user as any).id;

    // Валидация входных данных
    const body = await req.json();
    const validationResult = JoinGroupDto.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json({ 
        error: 'Некорректные данные',
        details: validationResult.error.errors 
      }, { status: 400 });
    }

    const { referralCode } = validationResult.data;

    // Присоединение к группе
    const group = await GroupsRepo.joinByReferral(referralCode, userId);

    const response = {
      message: 'Успешно присоединились к группе!',
      group: {
        id: group.id,
        name: group.name,
        description: group.description,
        maxMembers: group.maxMembers,
        currentMembers: group.currentMembers,
        format: group.format,
        place: group.place,
      },
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error: any) {
    console.error('Error in POST /api/groups/join:', error);
    
    if (error.message === 'Invalid referral code') {
      return NextResponse.json({ error: 'Неверный код приглашения' }, { status: 404 });
    }
    
    if (error.message === 'Player already in group') {
      return NextResponse.json({ error: 'Вы уже являетесь участником этой группы' }, { status: 409 });
    }
    
    if (error.message === 'Group is full') {
      return NextResponse.json({ error: 'Группа заполнена. Свободных мест нет.' }, { status: 409 });
    }

    return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 });
  }
}
