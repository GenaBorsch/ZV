import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../../lib/auth';
import { db, characters, users, playerProfiles, eq, and } from '@zv/db';
import { z } from 'zod';

// Временный импорт схем напрямую
const UpdateCharacterDto = z.object({
  name: z.string().min(1, 'Имя персонажа обязательно').max(255, 'Имя персонажа не должно превышать 255 символов').optional(),
  archetype: z.string().max(100, 'Архетип не должен превышать 100 символов').optional(),
  level: z.number().int().min(1, 'Уровень должен быть не менее 1').optional(),
  avatarUrl: z.string().optional().refine(val => !val || z.string().url().safeParse(val).success, 'Некорректная ссылка на аватар'),
  backstory: z.string().max(5000, 'Предыстория не должна превышать 5000 символов').optional(),
  journal: z.string().max(5000, 'Журнал не должен превышать 5000 символов').optional(),
  isAlive: z.boolean().optional(),
  deathDate: z.string().optional().refine(val => !val || /^\d{2}\.\d{2}\.\d{3}$/.test(val), 'Дата смерти должна быть в формате дд.мм.ггг'),
  notes: z.string().optional(),
  sheetUrl: z.string().optional().refine(val => !val || z.string().url().safeParse(val).success, 'Некорректная ссылка на лист персонажа'),
}).refine(data => {
  // Если статус меняется на мертвый, дата смерти может быть указана
  if (data.isAlive === false && !data.deathDate) {
    return true; // Дата смерти опциональна
  }
  return true;
}, {
  message: 'Некорректные данные для обновления персонажа',
});

type UpdateCharacterDtoType = z.infer<typeof UpdateCharacterDto>;

function hasRole(roles: string[] | undefined, requiredRole: string): boolean {
  return roles?.includes(requiredRole) || false;
}

function isPlayer(roles: string[] | undefined): boolean {
  return hasRole(roles, 'PLAYER');
}

function isMaster(roles: string[] | undefined): boolean {
  return hasRole(roles, 'MASTER');
}

function isAdmin(roles: string[] | undefined): boolean {
  return hasRole(roles, 'MODERATOR') || hasRole(roles, 'SUPERADMIN');
}

// GET /api/v1/characters/[id] - Получить детали персонажа
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 });
    }

    const userId = (session.user as any).id;
    const userRoles = (session.user as any).roles;
    const { id: characterId } = await params;

    // Получаем персонажа напрямую из БД
    const [character] = await db
      .select()
      .from(characters)
      .where(eq(characters.id, characterId))
      .limit(1);
    
    if (!character) {
      return NextResponse.json({ error: 'Персонаж не найден' }, { status: 404 });
    }

    // Проверяем права доступа
    if (isPlayer(userRoles)) {
      // Получаем профиль игрока
      const [playerProfile] = await db
        .select()
        .from(playerProfiles)
        .where(eq(playerProfiles.userId, userId))
        .limit(1);

      // Игрок может видеть только свои персонажи
      if (!playerProfile || character.playerId !== playerProfile.id) {
        return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 });
      }
    } else if (!isAdmin(userRoles) && !isMaster(userRoles)) {
      return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 });
    }

    return NextResponse.json({ character });
  } catch (error: any) {
    console.error('Error in GET /api/v1/characters/[id]:', error);
    
    return NextResponse.json({ 
      error: 'Внутренняя ошибка сервера',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 });
  }
}

// PATCH /api/v1/characters/[id] - Обновить персонажа
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 });
    }

    const userId = (session.user as any).id;
    const userRoles = (session.user as any).roles;
    const { id: characterId } = await params;

    // Валидация входных данных
    const body = await req.json();
    console.log('PATCH body received:', body);
    
    const validationResult = UpdateCharacterDto.safeParse(body);
    
    if (!validationResult.success) {
      console.log('Validation errors:', validationResult.error.errors);
      return NextResponse.json({ 
        error: 'Некорректные данные',
        details: validationResult.error.errors 
      }, { status: 400 });
    }

    const data: UpdateCharacterDtoType = validationResult.data;

    // Очищаем пустые URL поля
    if (data.avatarUrl === '') data.avatarUrl = undefined;
    if (data.sheetUrl === '') data.sheetUrl = undefined;
    if (data.deathDate === '') data.deathDate = undefined;

    // Получаем существующий персонаж для проверки прав
    const [existingCharacter] = await db
      .select()
      .from(characters)
      .where(eq(characters.id, characterId))
      .limit(1);
    
    if (!existingCharacter) {
      return NextResponse.json({ error: 'Персонаж не найден' }, { status: 404 });
    }

    // Проверяем права доступа
    if (isPlayer(userRoles)) {
      // Получаем профиль игрока
      const [playerProfile] = await db
        .select()
        .from(playerProfiles)
        .where(eq(playerProfiles.userId, userId))
        .limit(1);

      // Игрок может редактировать только свои персонажи
      if (!playerProfile || existingCharacter.playerId !== playerProfile.id) {
        return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 });
      }
    } else if (!isAdmin(userRoles) && !isMaster(userRoles)) {
      return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 });
    }

    // Автоматически заполняем дату смерти, если персонаж умирает
    let updateData = { ...data };
    if (updateData.isAlive === false && !updateData.deathDate) {
      const now = new Date();
      const day = String(now.getDate()).padStart(2, '0');
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const year = String(now.getFullYear()).slice(-3); // Последние 3 цифры года
      updateData.deathDate = `${day}.${month}.${year}`;
    }

    // Обновляем персонажа
    const [updatedCharacter] = await db
      .update(characters)
      .set({
        ...updateData,
        updatedAt: new Date(),
        updatedBy: isAdmin(userRoles) || isMaster(userRoles) ? userId : undefined,
      })
      .where(eq(characters.id, characterId))
      .returning();

    console.log('Character updated successfully:', updatedCharacter);
    return NextResponse.json({ character: updatedCharacter });
  } catch (error: any) {
    console.error('Error in PATCH /api/v1/characters/[id]:', error);
    
    return NextResponse.json({ 
      error: 'Внутренняя ошибка сервера',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 });
  }
}

// DELETE /api/v1/characters/[id] - Удалить персонажа
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 });
    }

    const userId = (session.user as any).id;
    const userRoles = (session.user as any).roles;
    const { id: characterId } = await params;

    // Получаем существующий персонаж для проверки прав
    const [existingCharacter] = await db
      .select()
      .from(characters)
      .where(eq(characters.id, characterId))
      .limit(1);
    
    if (!existingCharacter) {
      return NextResponse.json({ error: 'Персонаж не найден' }, { status: 404 });
    }

    // Проверяем права доступа
    if (isPlayer(userRoles)) {
      // Получаем профиль игрока
      const [playerProfile] = await db
        .select()
        .from(playerProfiles)
        .where(eq(playerProfiles.userId, userId))
        .limit(1);

      // Игрок может удалять только свои персонажи
      if (!playerProfile || existingCharacter.playerId !== playerProfile.id) {
        return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 });
      }
    } else if (!isAdmin(userRoles)) {
      return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 });
    }

    // Удаляем персонажа
    await db
      .delete(characters)
      .where(eq(characters.id, characterId));

    return NextResponse.json({ message: 'Персонаж успешно удален' });
  } catch (error: any) {
    console.error('Error in DELETE /api/v1/characters/[id]:', error);
    
    return NextResponse.json({ 
      error: 'Внутренняя ошибка сервера',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 });
  }
}
