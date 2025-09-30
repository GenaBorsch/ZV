import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { GroupsRepo } from '@zv/db';
import { JoinGroupDto } from '@zv/contracts';
import { z } from 'zod';

// Расширенная схема для присоединения к группе
const JoinGroupExtendedDto = z.object({
  referralCode: z.string().uuid().optional(),
  groupId: z.string().uuid().optional(),
}).refine(data => data.referralCode || data.groupId, {
  message: 'Необходимо указать либо referralCode, либо groupId',
});

function isPlayer(roles: string[] | undefined): boolean {
  const r = roles || [];
  return r.includes('PLAYER');
}

export async function POST(req: Request) {
  try {
    // Проверка авторизации
    const session = await getServerSession(authOptions);
    if (!session?.user || !isPlayer((session.user as any).roles)) {
      return NextResponse.json({ error: 'Доступ запрещен. Требуется роль PLAYER.' }, { status: 403 });
    }

    const userId = (session.user as any).id;

    // Валидация входных данных
    const body = await req.json();
    
    // Проверяем старый формат для обратной совместимости
    let validationResult: any = JoinGroupDto.safeParse(body);
    let useReferralCode = true;
    
    if (!validationResult.success) {
      // Пробуем новый расширенный формат
      const extendedResult = JoinGroupExtendedDto.safeParse(body);
      if (!extendedResult.success) {
        return NextResponse.json({ 
          error: 'Некорректные данные',
          details: extendedResult.error.errors 
        }, { status: 400 });
      }
      validationResult = extendedResult;
      useReferralCode = false;
    }

    const data = validationResult.data as any;

    // Присоединение к группе
    let group;
    if (useReferralCode || data.referralCode) {
      group = await GroupsRepo.joinByReferral(data.referralCode, userId);
    } else if (data.groupId) {
      group = await GroupsRepo.joinByGroupId(data.groupId, userId);
    } else {
      return NextResponse.json({ 
        error: 'Необходимо указать либо referralCode, либо groupId' 
      }, { status: 400 });
    }

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
    
    if (error.message === 'Group not found') {
      return NextResponse.json({ error: 'Группа не найдена' }, { status: 404 });
    }
    
    if (error.message === 'Group is not recruiting') {
      return NextResponse.json({ error: 'Группа не ведет набор участников' }, { status: 409 });
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
