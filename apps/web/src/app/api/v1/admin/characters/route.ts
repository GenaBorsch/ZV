import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { CharactersRepo } from '@zv/db';
import { CreateCharacterDto, UpdateCharacterDto } from '@zv/contracts';
import { z } from 'zod';

function hasRole(roles: string[] | undefined, requiredRole: string): boolean {
  return roles?.includes(requiredRole) || false;
}

function isAdmin(roles: string[] | undefined): boolean {
  return hasRole(roles, 'MODERATOR') || hasRole(roles, 'SUPERADMIN');
}

const AdminCharactersQueryDto = z.object({
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().refine(val => [10, 20, 50, 100].includes(val), 'pageSize должен быть 10, 20, 50 или 100').default(20),
});

const AdminCreateCharacterDto = z.object({
  name: z.string().min(1, 'Имя персонажа обязательно').max(255, 'Имя персонажа не должно превышать 255 символов'),
  archetype: z.string().max(100, 'Архетип не должен превышать 100 символов').optional(),
  level: z.number().int().min(1, 'Уровень должен быть не менее 1').default(1),
  avatarUrl: z.string().url('Некорректная ссылка на аватар').max(512, 'URL аватара слишком длинный').optional(),
  backstory: z.string().max(5000, 'Предыстория не должна превышать 5000 символов').optional(),
  journal: z.string().max(5000, 'Журнал не должен превышать 5000 символов').optional(),
  isAlive: z.boolean().default(true),
  deathDate: z.string().regex(/^\d{2}\.\d{2}\.\d{3}$/, 'Дата смерти должна быть в формате дд.мм.ггг').optional(),
  notes: z.string().optional(),
  sheetUrl: z.string().url('Некорректная ссылка на лист персонажа').optional(),
  playerId: z.string().uuid('Некорректный ID игрока'),
}).refine(data => {
  // Если персонаж мертв, дата смерти может быть указана
  if (!data.isAlive && !data.deathDate) {
    return true; // Дата смерти опциональна даже для мертвых персонажей
  }
  return true;
}, {
  message: 'Некорректные данные персонажа',
});

// GET /api/v1/admin/characters - Получить всех персонажей (с пагинацией)
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions as any);
    if (!session?.user || !isAdmin((session.user as any).roles)) {
      return NextResponse.json({ error: 'Доступ запрещен. Требуется роль MODERATOR или SUPERADMIN.' }, { status: 403 });
    }

    // Парсим параметры запроса
    const url = new URL(req.url);
    const queryValidation = AdminCharactersQueryDto.safeParse({
      page: url.searchParams.get('page'),
      pageSize: url.searchParams.get('pageSize'),
    });

    if (!queryValidation.success) {
      return NextResponse.json({ 
        error: 'Некорректные параметры запроса',
        details: queryValidation.error.errors 
      }, { status: 400 });
    }

    const { page, pageSize } = queryValidation.data;

    // Получаем персонажей с пагинацией
    const result = await CharactersRepo.getAll(page, pageSize);

    return NextResponse.json({
      characters: result.characters,
      pagination: {
        page,
        pageSize,
        total: result.total,
        totalPages: Math.ceil(result.total / pageSize),
      }
    });
  } catch (error: any) {
    console.error('Error in GET /api/v1/admin/characters:', error);
    return NextResponse.json({ 
      error: 'Внутренняя ошибка сервера',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 });
  }
}

// POST /api/v1/admin/characters - Создать персонажа (для админа)
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions as any);
    if (!session?.user || !isAdmin((session.user as any).roles)) {
      return NextResponse.json({ error: 'Доступ запрещен. Требуется роль MODERATOR или SUPERADMIN.' }, { status: 403 });
    }

    const userId = (session.user as any).id;
    const userRoles = (session.user as any).roles;

    // Валидация входных данных
    const body = await req.json();
    const validationResult = AdminCreateCharacterDto.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json({ 
        error: 'Некорректные данные',
        details: validationResult.error.errors 
      }, { status: 400 });
    }

    const { playerId, ...characterData } = validationResult.data;

    // Создаем персонажа от имени админа
    const character = await CharactersRepo.create(characterData, playerId, userId);

    return NextResponse.json({ character }, { status: 201 });
  } catch (error: any) {
    console.error('Error in POST /api/v1/admin/characters:', error);
    
    if (error.message === 'Превышен лимит персонажей (максимум 5)') {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    
    if (error.message === 'Игрок не найден') {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    
    return NextResponse.json({ 
      error: 'Внутренняя ошибка сервера',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 });
  }
}
