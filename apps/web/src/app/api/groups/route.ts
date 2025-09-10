import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { GroupsRepo } from '@zv/db';
import { CreateGroupDto } from '@zv/contracts';

function isMaster(roles: string[] | undefined): boolean {
  const r = roles || [];
  return r.includes('MASTER');
}

function isPlayer(roles: string[] | undefined): boolean {
  const r = roles || [];
  return r.includes('PLAYER');
}

export async function POST(req: Request) {
  try {
    // Проверка авторизации
    const session = await getServerSession(authOptions as any);
    if (!session?.user || !isMaster((session.user as any).roles)) {
      return NextResponse.json({ error: 'Доступ запрещен. Требуется роль MASTER.' }, { status: 403 });
    }

    const masterId = (session.user as any).id;

    // Валидация входных данных
    const body = await req.json();
    const validationResult = CreateGroupDto.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json({ 
        error: 'Некорректные данные',
        details: validationResult.error.errors 
      }, { status: 400 });
    }

    const data = validationResult.data;

    // Создание группы
    const group = await GroupsRepo.create(data, masterId);

    // Формирование реферальной ссылки
    const baseUrl = process.env.PUBLIC_BASE_URL || `http://localhost:${process.env.PORT || 3000}`;
    const referralLink = `${baseUrl}/join?code=${group.referralCode}`;

    const response = {
      group: {
        id: group.id,
        name: group.name,
        description: group.description,
        maxMembers: group.maxMembers,
        currentMembers: group.currentMembers,
        isRecruiting: group.isRecruiting,
        format: group.format,
        place: group.place,
        createdAt: group.createdAt.toISOString(),
      },
      referralCode: group.referralCode,
      referralLink,
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error: any) {
    console.error('Error in POST /api/groups:', error);
    
    if (error.message === 'No active season found') {
      return NextResponse.json({ error: 'Нет активного сезона для создания группы' }, { status: 409 });
    }
    
    if (error.message === 'Master profile not found') {
      return NextResponse.json({ error: 'Профиль мастера не найден' }, { status: 404 });
    }

    return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    // Получение публичных групп для набора
    const url = new URL(req.url);
    const recruiting = url.searchParams.get('recruiting');

    if (recruiting === 'true') {
      const groups = await GroupsRepo.getPublicGroups();
      
      const response = groups.map(group => ({
        id: group.id,
        name: group.name,
        description: group.description,
        maxMembers: group.maxMembers,
        currentMembers: group.currentMembers,
        format: group.format,
        place: group.place,
        createdAt: group.createdAt.toISOString(),
      }));

      return NextResponse.json({ groups: response });
    }

    // Получить группы в зависимости от роли пользователя
    const session = await getServerSession(authOptions as any);
    if (!session?.user) {
      return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 });
    }

    const userId = (session.user as any).id;
    const userRoles = (session.user as any).roles;
    let groups: any[] = [];

    if (isMaster(userRoles)) {
      // Для мастеров - получить их группы с уведомлениями
      groups = await GroupsRepo.getByMasterIdWithNotifications(userId);
    } else if (isPlayer(userRoles)) {
      // Для игроков - получить группы, в которых они состоят
      groups = await GroupsRepo.getPlayerGroups(userId);
    } else {
      return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 });
    }
    
    const response = groups.map(group => ({
      id: group.id,
      name: group.name,
      description: group.description,
      maxMembers: group.maxMembers,
      currentMembers: group.currentMembers,
      isRecruiting: group.isRecruiting,
      format: group.format,
      place: group.place,
      referralCode: isMaster(userRoles) ? group.referralCode : null, // Скрываем код для игроков
      pendingApplicationsCount: isMaster(userRoles) ? group.pendingApplicationsCount : undefined, // Только для мастеров
      createdAt: group.createdAt.toISOString(),
    }));

    return NextResponse.json({ groups: response });
  } catch (error) {
    console.error('Error in GET /api/groups:', error);
    return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 });
  }
}
