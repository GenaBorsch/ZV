import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { GroupsRepo } from '@zv/db';
import { UpdateGroupDto } from '@zv/contracts';

function isMaster(roles: string[] | undefined): boolean {
  const r = roles || [];
  return r.includes('MASTER');
}

// GET /api/groups/[id] - Получить детали группы
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !isMaster((session.user as any).roles)) {
      return NextResponse.json({ error: 'Доступ запрещен. Требуется роль MASTER.' }, { status: 403 });
    }

    const userId = (session.user as any).id;
    const { id: groupId } = await params;

    // Проверить, что пользователь является мастером группы
    const isMasterOfGroup = await GroupsRepo.isGroupMaster(groupId, userId);
    if (!isMasterOfGroup) {
      return NextResponse.json({ error: 'Доступ запрещен. Вы не являетесь мастером этой группы.' }, { status: 403 });
    }

    // Получить детали группы
    const group = await GroupsRepo.getById(groupId);
    if (!group) {
      return NextResponse.json({ error: 'Группа не найдена' }, { status: 404 });
    }

    // Получить участников группы
    const members = await GroupsRepo.getGroupMembers(groupId);

    return NextResponse.json({
      group: {
        id: group.id,
        name: group.name,
        description: group.description,
        maxMembers: group.maxMembers,
        currentMembers: group.currentMembers,
        isRecruiting: group.isRecruiting,
        format: group.format,
        place: group.place,
        referralCode: group.referralCode,
        createdAt: group.createdAt.toISOString(),
        updatedAt: group.updatedAt.toISOString(),
      },
      members: members.map(member => ({
        id: member.id,
        userId: member.userId,
        nickname: member.nickname || member.email,
        email: member.email,
        status: member.status,
        joinedAt: member.joinedAt.toISOString(),
      }))
    });

  } catch (error: any) {
    console.error('Error fetching group details:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch group details' }, { status: 500 });
  }
}

// PUT /api/groups/[id] - Обновить данные группы
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !isMaster((session.user as any).roles)) {
      return NextResponse.json({ error: 'Доступ запрещен. Требуется роль MASTER.' }, { status: 403 });
    }

    const userId = (session.user as any).id;
    const { id: groupId } = await params;

    // Валидация входных данных
    const body = await request.json();
    const validationResult = UpdateGroupDto.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json({ 
        error: 'Некорректные данные',
        details: validationResult.error.errors 
      }, { status: 400 });
    }

    const data = validationResult.data;

    // Обновить группу
    const updatedGroup = await GroupsRepo.updateGroup(groupId, data, userId);

    if (!updatedGroup) {
      return NextResponse.json({ error: 'Группа не найдена или доступ запрещен' }, { status: 404 });
    }

    return NextResponse.json({
      group: {
        id: updatedGroup.id,
        name: updatedGroup.name,
        description: updatedGroup.description,
        maxMembers: updatedGroup.maxMembers,
        currentMembers: updatedGroup.currentMembers,
        isRecruiting: updatedGroup.isRecruiting,
        format: updatedGroup.format,
        place: updatedGroup.place,
        referralCode: updatedGroup.referralCode,
        createdAt: updatedGroup.createdAt.toISOString(),
        updatedAt: updatedGroup.updatedAt.toISOString(),
      }
    });

  } catch (error: any) {
    console.error('Error updating group:', error);
    return NextResponse.json({ error: error.message || 'Failed to update group' }, { status: 500 });
  }
}
