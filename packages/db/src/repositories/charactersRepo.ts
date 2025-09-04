import { db } from '../index';
import { characters, playerProfiles, users, groupMembers, groups } from '../schema';
import { CreateCharacterDtoType, UpdateCharacterDtoType, CharacterDtoType } from '@zv/contracts';
import { eq, and, sql, count } from 'drizzle-orm';

export class CharactersRepo {
  /**
   * Создать персонажа с проверкой лимита (максимум 5 персонажей на игрока)
   */
  static async create(data: CreateCharacterDtoType, playerId: string, updatedBy?: string): Promise<CharacterDtoType> {
    // Проверяем лимит персонажей для игрока
    const characterCount = await this.countByPlayerId(playerId);
    if (characterCount >= 5) {
      throw new Error('Превышен лимит персонажей (максимум 5)');
    }

    // Проверяем существование игрока
    const [player] = await db.select().from(playerProfiles).where(eq(playerProfiles.id, playerId)).limit(1);
    if (!player) {
      throw new Error('Игрок не найден');
    }

    // Создаем персонажа
    const [character] = await db.insert(characters).values({
      playerId,
      name: data.name,
      archetype: data.archetype,
      level: data.level || 1,
      avatarUrl: data.avatarUrl,
      backstory: data.backstory,
      journal: data.journal,
      isAlive: data.isAlive ?? true,
      deathDate: data.deathDate,
      notes: data.notes,
      sheetUrl: data.sheetUrl,
      updatedBy: updatedBy || null,
    }).returning();

    return this.mapToDto(character);
  }

  /**
   * Получить всех персонажей игрока
   */
  static async getByPlayerId(playerId: string): Promise<CharacterDtoType[]> {
    const charactersList = await db.select()
      .from(characters)
      .where(eq(characters.playerId, playerId))
      .orderBy(characters.createdAt);

    return charactersList.map(this.mapToDto);
  }

  /**
   * Получить персонажа по ID с проверкой прав доступа
   */
  static async getById(characterId: string, requesterId?: string, requesterRoles?: string[]): Promise<CharacterDtoType | null> {
    const [character] = await db.select()
      .from(characters)
      .where(eq(characters.id, characterId))
      .limit(1);

    if (!character) {
      return null;
    }

    // Проверяем права доступа
    if (requesterId && requesterRoles) {
      const hasAccess = await this.checkAccess(character, requesterId, requesterRoles);
      if (!hasAccess) {
        throw new Error('Доступ запрещен');
      }
    }

    return this.mapToDto(character);
  }

  /**
   * Обновить персонажа с проверкой прав доступа
   */
  static async update(
    characterId: string, 
    data: UpdateCharacterDtoType, 
    requesterId: string, 
    requesterRoles: string[]
  ): Promise<CharacterDtoType> {
    // Получаем текущего персонажа
    const [currentCharacter] = await db.select()
      .from(characters)
      .where(eq(characters.id, characterId))
      .limit(1);

    if (!currentCharacter) {
      throw new Error('Персонаж не найден');
    }

    // Проверяем права доступа
    const hasAccess = await this.checkAccess(currentCharacter, requesterId, requesterRoles);
    if (!hasAccess) {
      throw new Error('Доступ запрещен');
    }

    // Автоматически устанавливаем дату смерти, если персонаж умирает
    let updateData = { ...data };
    if (data.isAlive === false && !data.deathDate && currentCharacter.isAlive) {
      // Генерируем текущую дату в формате дд.мм.ггг
      const now = new Date();
      const day = String(now.getDate()).padStart(2, '0');
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const year = String(now.getFullYear()).slice(-3); // последние 3 цифры года
      updateData.deathDate = `${day}.${month}.${year}`;
    }

    // Обновляем персонажа
    const [updatedCharacter] = await db.update(characters)
      .set({
        ...updateData,
        updatedBy: requesterRoles.includes('MASTER') || requesterRoles.includes('MODERATOR') || requesterRoles.includes('SUPERADMIN') 
          ? requesterId 
          : null,
        updatedAt: new Date(),
      })
      .where(eq(characters.id, characterId))
      .returning();

    return this.mapToDto(updatedCharacter);
  }

  /**
   * Удалить персонажа с проверкой прав доступа
   */
  static async delete(characterId: string, requesterId: string, requesterRoles: string[]): Promise<void> {
    // Получаем текущего персонажа
    const [character] = await db.select()
      .from(characters)
      .where(eq(characters.id, characterId))
      .limit(1);

    if (!character) {
      throw new Error('Персонаж не найден');
    }

    // Проверяем права доступа
    const hasAccess = await this.checkAccess(character, requesterId, requesterRoles);
    if (!hasAccess) {
      throw new Error('Доступ запрещен');
    }

    // Удаляем персонажа (связанные записи в group_members обновятся автоматически благодаря ON DELETE SET NULL)
    await db.delete(characters).where(eq(characters.id, characterId));
  }

  /**
   * Привязать персонажа к группе
   */
  static async assignToGroup(
    characterId: string, 
    groupId: string, 
    requesterId: string, 
    requesterRoles: string[]
  ): Promise<void> {
    // Получаем персонажа
    const [character] = await db.select()
      .from(characters)
      .where(eq(characters.id, characterId))
      .limit(1);

    if (!character) {
      throw new Error('Персонаж не найден');
    }

    // Проверяем права доступа к персонажу
    const hasCharacterAccess = await this.checkAccess(character, requesterId, requesterRoles);
    if (!hasCharacterAccess) {
      throw new Error('Доступ к персонажу запрещен');
    }

    // Проверяем, что игрок состоит в группе
    const [membership] = await db.select()
      .from(groupMembers)
      .where(and(
        eq(groupMembers.groupId, groupId),
        eq(groupMembers.playerId, character.playerId)
      ))
      .limit(1);

    if (!membership) {
      throw new Error('Игрок не состоит в этой группе');
    }

    // Обновляем запись участия в группе, привязывая персонажа
    await db.update(groupMembers)
      .set({ characterId })
      .where(eq(groupMembers.id, membership.id));
  }

  /**
   * Получить персонажей группы (для мастера)
   */
  static async getByGroupId(groupId: string, masterId: string): Promise<CharacterDtoType[]> {
    // Проверяем, что пользователь является мастером группы
    const [group] = await db.select()
      .from(groups)
      .where(and(
        eq(groups.id, groupId),
        eq(groups.masterId, masterId)
      ))
      .limit(1);

    if (!group) {
      throw new Error('Группа не найдена или вы не являетесь её мастером');
    }

    // Получаем персонажей группы
    const charactersInGroup = await db.select({
      character: characters,
    })
      .from(groupMembers)
      .innerJoin(characters, eq(groupMembers.characterId, characters.id))
      .where(eq(groupMembers.groupId, groupId));

    return charactersInGroup.map(({ character }) => this.mapToDto(character));
  }

  /**
   * Подсчитать количество персонажей игрока
   */
  static async countByPlayerId(playerId: string): Promise<number> {
    const [result] = await db.select({ count: count() })
      .from(characters)
      .where(eq(characters.playerId, playerId));

    return result?.count || 0;
  }

  /**
   * Получить всех персонажей для админ-панели с пагинацией
   */
  static async getAll(page: number = 1, pageSize: number = 20): Promise<{
    characters: CharacterDtoType[];
    total: number;
  }> {
    const offset = (page - 1) * pageSize;

    // Получаем общее количество
    const [totalResult] = await db.select({ count: count() }).from(characters);
    const total = totalResult?.count || 0;

    // Получаем персонажей
    const charactersList = await db.select()
      .from(characters)
      .orderBy(characters.createdAt)
      .limit(pageSize)
      .offset(offset);

    return {
      characters: charactersList.map(this.mapToDto),
      total,
    };
  }

  /**
   * Проверить права доступа к персонажу
   */
  private static async checkAccess(
    character: any, 
    requesterId: string, 
    requesterRoles: string[]
  ): Promise<boolean> {
    // Админы и модераторы имеют полный доступ
    if (requesterRoles.includes('SUPERADMIN') || requesterRoles.includes('MODERATOR')) {
      return true;
    }

    // Игроки могут управлять только своими персонажами
    if (requesterRoles.includes('PLAYER')) {
      const [playerProfile] = await db.select()
        .from(playerProfiles)
        .where(eq(playerProfiles.userId, requesterId))
        .limit(1);

      return playerProfile?.id === character.playerId;
    }

    // Мастера могут просматривать персонажей игроков в своих группах
    if (requesterRoles.includes('MASTER')) {
      const [masterProfile] = await db.select()
        .from(playerProfiles)
        .where(eq(playerProfiles.userId, requesterId))
        .limit(1);

      if (!masterProfile) {
        return false;
      }

      // Проверяем, есть ли персонаж в группах этого мастера
      const [groupMembership] = await db.select()
        .from(groupMembers)
        .innerJoin(groups, eq(groupMembers.groupId, groups.id))
        .where(and(
          eq(groupMembers.playerId, character.playerId),
          eq(groups.masterId, masterProfile.id)
        ))
        .limit(1);

      return !!groupMembership;
    }

    return false;
  }

  /**
   * Преобразовать данные БД в DTO
   */
  private static mapToDto(character: any): CharacterDtoType {
    return {
      id: character.id,
      playerId: character.playerId,
      name: character.name,
      archetype: character.archetype,
      level: character.level,
      avatarUrl: character.avatarUrl,
      backstory: character.backstory,
      journal: character.journal,
      isAlive: character.isAlive,
      deathDate: character.deathDate,
      notes: character.notes,
      sheetUrl: character.sheetUrl,
      updatedBy: character.updatedBy,
      createdAt: character.createdAt.toISOString(),
      updatedAt: character.updatedAt.toISOString(),
    };
  }
}
