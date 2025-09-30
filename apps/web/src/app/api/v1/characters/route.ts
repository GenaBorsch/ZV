import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../lib/auth';
import { db, characters, users, playerProfiles, eq, and, count } from '@zv/db';
// Временный импорт схем напрямую
import { z } from 'zod';

const CreateCharacterDto = z.object({
  name: z.string().min(1, 'Имя персонажа обязательно').max(255, 'Имя персонажа не должно превышать 255 символов'),
  archetype: z.string().max(100, 'Архетип не должен превышать 100 символов').optional(),
  level: z.number().int().min(1, 'Уровень должен быть не менее 1').default(1),
  avatarUrl: z.string().max(512, 'URL аватара слишком длинный').optional().refine(val => !val || z.string().url().safeParse(val).success, 'Некорректная ссылка на аватар'),
  backstory: z.string().max(5000, 'Предыстория не должна превышать 5000 символов').optional(),
  journal: z.string().max(5000, 'Журнал не должен превышать 5000 символов').optional(),
  isAlive: z.boolean().default(true),
  deathDate: z.string().optional().refine(val => !val || /^\d{2}\.\d{2}\.\d{3}$/.test(val), 'Дата смерти должна быть в формате дд.мм.ггг'),
  notes: z.string().optional(),
  sheetUrl: z.string().optional().refine(val => !val || z.string().url().safeParse(val).success, 'Некорректная ссылка на лист персонажа'),
}).refine(data => {
  // Если персонаж мертв, дата смерти может быть указана
  if (!data.isAlive && !data.deathDate) {
    return true; // Дата смерти опциональна даже для мертвых персонажей
  }
  return true;
}, {
  message: 'Некорректные данные персонажа',
});

type CreateCharacterDtoType = z.infer<typeof CreateCharacterDto>;

function hasRole(roles: string[] | undefined, requiredRole: string): boolean {
  return roles?.includes(requiredRole) || false;
}

function isPlayer(roles: string[] | undefined): boolean {
  return hasRole(roles, 'PLAYER');
}

function isAdmin(roles: string[] | undefined): boolean {
  return hasRole(roles, 'MODERATOR') || hasRole(roles, 'SUPERADMIN');
}

// GET /api/v1/characters - Получить персонажей игрока
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 });
    }

    const userId = (session.user as any).id;
    const userRoles = (session.user as any).roles;

    // Только игроки могут получать свои персонажи через этот endpoint
    if (!isPlayer(userRoles)) {
      return NextResponse.json({ error: 'Доступ запрещен. Требуется роль PLAYER.' }, { status: 403 });
    }

    // Получаем или создаем профиль игрока
    let playerProfile = await db
      .select()
      .from(playerProfiles)
      .where(eq(playerProfiles.userId, userId))
      .limit(1);

    // Создаем профиль игрока, если его нет
    if (!playerProfile.length) {
      const [newPlayerProfile] = await db
        .insert(playerProfiles)
        .values({
          userId: userId,
        })
        .returning();
      playerProfile = [newPlayerProfile];
    }

    // Получаем персонажей игрока напрямую
    const userCharacters = await db
      .select()
      .from(characters)
      .where(eq(characters.playerId, playerProfile[0].id))
      .orderBy(characters.createdAt);

    return NextResponse.json({ characters: userCharacters });
  } catch (error: any) {
    console.error('Error in GET /api/v1/characters:', error);
    return NextResponse.json({ 
      error: 'Внутренняя ошибка сервера',
      details: error.message 
    }, { status: 500 });
  }
}

// POST /api/v1/characters - Создать нового персонажа
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 });
    }

    const userId = (session.user as any).id;
    const userRoles = (session.user as any).roles;

    // Только игроки могут создавать персонажей
    if (!isPlayer(userRoles)) {
      return NextResponse.json({ error: 'Доступ запрещен. Требуется роль PLAYER.' }, { status: 403 });
    }

    // Получаем или создаем профиль игрока
    let playerProfile = await db
      .select()
      .from(playerProfiles)
      .where(eq(playerProfiles.userId, userId))
      .limit(1);

    // Создаем профиль игрока, если его нет
    if (!playerProfile.length) {
      const [newPlayerProfile] = await db
        .insert(playerProfiles)
        .values({
          userId: userId,
        })
        .returning();
      playerProfile = [newPlayerProfile];
    }

    const playerProfileId = playerProfile[0].id;

    // Проверяем лимит персонажей (5 на игрока)
    const existingCharactersCount = await db
      .select({ count: count() })
      .from(characters)
      .where(eq(characters.playerId, playerProfileId));

    const currentCount = existingCharactersCount[0]?.count || 0;
    if (currentCount >= 5) {
      return NextResponse.json({ 
        error: 'Достигнут лимит персонажей. Максимум 5 персонажей на игрока.' 
      }, { status: 400 });
    }

    // Валидируем данные
    const body = await req.json();
    const validatedData = CreateCharacterDto.parse(body);

    // Автоматически заполняем дату смерти, если персонаж мертв
    let characterData = { ...validatedData };
    if (!characterData.isAlive && !characterData.deathDate) {
      const now = new Date();
      const day = String(now.getDate()).padStart(2, '0');
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const year = String(now.getFullYear()).slice(-3); // Последние 3 цифры года
      characterData.deathDate = `${day}.${month}.${year}`;
    }

    // Очищаем пустые URL поля
    if (characterData.avatarUrl === '') characterData.avatarUrl = undefined;
    if (characterData.sheetUrl === '') characterData.sheetUrl = undefined;
    if (characterData.deathDate === '') characterData.deathDate = undefined;

    // Создаем персонажа
    console.log('Creating character with data:', {
      ...characterData,
      playerId: playerProfileId,
    });

    const [newCharacter] = await db
      .insert(characters)
      .values({
        ...characterData,
        playerId: playerProfileId,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    return NextResponse.json({ 
      character: newCharacter,
      message: 'Персонаж успешно создан' 
    }, { status: 201 });

  } catch (error: any) {
    console.error('Error in POST /api/v1/characters:', error);
    
    // Обработка ошибок валидации Zod
    if (error.name === 'ZodError') {
      return NextResponse.json({
        error: 'Некорректные данные',
        details: error.errors
      }, { status: 400 });
    }

    return NextResponse.json({ 
      error: 'Внутренняя ошибка сервера',
      details: error.message 
    }, { status: 500 });
  }
}