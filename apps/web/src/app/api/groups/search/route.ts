import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { GroupsRepo } from '@zv/db';
import { z } from 'zod';

// Схема валидации параметров поиска
const SearchGroupsQuerySchema = z.object({
  search: z.string().optional(),
  format: z.enum(['ONLINE', 'OFFLINE', 'MIXED']).optional(),
  seasonId: z.string().uuid().optional(),
});

function isPlayer(roles: string[] | undefined): boolean {
  return roles?.includes('PLAYER') || false;
}

export async function GET(req: NextRequest) {
  try {
    // Проверка авторизации
    const session = await getServerSession(authOptions as any);
    if (!session?.user || !isPlayer((session.user as any).roles)) {
      return NextResponse.json({ error: 'Доступ запрещен. Требуется роль PLAYER.' }, { status: 403 });
    }

    const userId = (session.user as any).id;

    // Получение и валидация параметров запроса
    const url = new URL(req.url);
    const searchParams = {
      search: url.searchParams.get('search') || undefined,
      format: url.searchParams.get('format') || undefined,
      seasonId: url.searchParams.get('seasonId') || undefined,
    };

    const validationResult = SearchGroupsQuerySchema.safeParse(searchParams);
    
    if (!validationResult.success) {
      return NextResponse.json({ 
        error: 'Некорректные параметры запроса',
        details: validationResult.error.errors 
      }, { status: 400 });
    }

    const { search, format, seasonId } = validationResult.data;

    // Поиск доступных групп
    const groups = await GroupsRepo.searchAvailableGroups({
      search,
      format,
      seasonId,
    });

    // Формирование ответа
    const response = groups.map(group => ({
      id: group.id,
      name: group.name,
      description: group.description,
      maxMembers: group.maxMembers,
      currentMembers: group.currentMembers,
      isRecruiting: group.isRecruiting,
      format: group.format,
      place: group.place,
      createdAt: group.createdAt.toISOString(),
      updatedAt: group.updatedAt.toISOString(),
      master: {
        id: group.master.id,
        name: group.master.name,
        bio: group.master.bio,
        format: group.master.format,
        location: group.master.location,
        rpgExperience: group.master.rpgExperience,
        contacts: group.master.contacts,
      },
      season: {
        id: group.season.id,
        title: group.season.title,
        code: group.season.code,
        isActive: group.season.isActive,
      },
    }));

    return NextResponse.json({ 
      groups: response,
      total: response.length 
    });

  } catch (error: any) {
    console.error('Error in GET /api/groups/search:', error);
    return NextResponse.json({ 
      error: error.message || 'Внутренняя ошибка сервера' 
    }, { status: 500 });
  }
}
