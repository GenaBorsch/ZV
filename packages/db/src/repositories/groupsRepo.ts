import { db, groups, groupMembers, seasons, masterProfiles, playerProfiles, users, eq, and, sql } from '../index';
import type { CreateGroupDto, UpdateGroupDto } from '@zv/contracts';
import { v4 as uuidv4 } from 'uuid';

export interface GroupWithDetails {
  id: string;
  name: string;
  description: string | null;
  maxMembers: number;
  isRecruiting: boolean;
  referralCode: string | null;
  format: 'ONLINE' | 'OFFLINE' | 'MIXED';
  place: string | null;
  createdAt: Date;
  updatedAt: Date;
  seasonId: string;
  masterId: string;
  clubId: string | null;
  currentMembers: number;
}

export interface GroupMember {
  id: string;
  userId: string;
  playerProfileId: string;
  nickname: string | null;
  email: string;
  status: 'ACTIVE' | 'INACTIVE' | 'BANNED';
  joinedAt: Date;
}

export class GroupsRepo {
  /**
   * Создать группу
   */
  static async create(data: CreateGroupDto, userId: string): Promise<GroupWithDetails> {
    // Получить активный сезон
    const activeSeason = await db
      .select()
      .from(seasons)
      .where(eq(seasons.isActive, true))
      .limit(1);

    if (!activeSeason[0]) {
      throw new Error('No active season found');
    }

    // Найти профиль мастера по userId
    const master = await db
      .select()
      .from(masterProfiles)
      .where(eq(masterProfiles.userId, userId))
      .limit(1);

    if (!master[0]) {
      throw new Error('Master profile not found');
    }

    return db.transaction(async (tx) => {
      const referralCode = uuidv4();

      const [group] = await tx
        .insert(groups)
        .values({
          ...data,
          masterId: master[0].id,
          seasonId: activeSeason[0].id,
          referralCode,
        })
        .returning();

      return {
        ...group,
        currentMembers: 0,
      };
    });
  }

  /**
   * Присоединиться к группе по реферальному коду
   */
  static async joinByReferral(referralCode: string, userId: string): Promise<GroupWithDetails> {
    return db.transaction(async (tx) => {
      // Найти или создать профиль игрока
      let player = await tx
        .select()
        .from(playerProfiles)
        .where(eq(playerProfiles.userId, userId))
        .limit(1);

      if (!player[0]) {
        // Создать профиль игрока, если его нет
        const [newPlayer] = await tx
          .insert(playerProfiles)
          .values({
            userId: userId,
            nickname: null, // Пользователь может установить позже
          })
          .returning();
        player = [newPlayer];
      }

      const playerId = player[0].id;

      // Найти группу по реферальному коду
      const [group] = await tx
        .select()
        .from(groups)
        .where(eq(groups.referralCode, referralCode));

      if (!group) {
        throw new Error('Invalid referral code');
      }

      // Проверить, что игрок еще не в группе
      const existingMembership = await tx
        .select()
        .from(groupMembers)
        .where(and(
          eq(groupMembers.groupId, group.id),
          eq(groupMembers.playerId, playerId)
        ));

      if (existingMembership.length > 0) {
        throw new Error('Player already in group');
      }

      // Подсчитать текущих участников
      const currentMembersResult = await tx
        .select({ count: sql<number>`count(*)` })
        .from(groupMembers)
        .where(and(
          eq(groupMembers.groupId, group.id),
          eq(groupMembers.status, 'ACTIVE')
        ));

      const currentMembers = currentMembersResult[0]?.count || 0;

      if (currentMembers >= group.maxMembers) {
        throw new Error('Group is full');
      }

      // Добавить участника
      await tx.insert(groupMembers).values({
        groupId: group.id,
        playerId,
        status: 'ACTIVE',
      });

      return {
        ...group,
        currentMembers: currentMembers + 1,
      };
    });
  }

  /**
   * Получить группы мастера по userId
   */
  static async getByMasterId(userId: string): Promise<GroupWithDetails[]> {
    // Найти профиль мастера по userId
    const master = await db
      .select()
      .from(masterProfiles)
      .where(eq(masterProfiles.userId, userId))
      .limit(1);

    if (!master[0]) {
      return []; // Если профиль мастера не найден, возвращаем пустой список
    }

    const groupsList = await db
      .select()
      .from(groups)
      .where(eq(groups.masterId, master[0].id));

    // Получить количество участников для каждой группы
    const result: GroupWithDetails[] = [];
    for (const group of groupsList) {
      const currentMembersResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(groupMembers)
        .where(and(
          eq(groupMembers.groupId, group.id),
          eq(groupMembers.status, 'ACTIVE')
        ));

      const currentMembers = currentMembersResult[0]?.count || 0;

      result.push({
        ...group,
        currentMembers,
      });
    }

    return result;
  }

  /**
   * Получить публичные группы для набора
   */
  static async getPublicGroups(): Promise<GroupWithDetails[]> {
    const groupsList = await db
      .select()
      .from(groups)
      .where(eq(groups.isRecruiting, true));

    // Получить количество участников для каждой группы
    const result: GroupWithDetails[] = [];
    for (const group of groupsList) {
      const currentMembersResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(groupMembers)
        .where(and(
          eq(groupMembers.groupId, group.id),
          eq(groupMembers.status, 'ACTIVE')
        ));

      const currentMembers = currentMembersResult[0]?.count || 0;

      // Показываем только группы с свободными местами
      if (currentMembers < group.maxMembers) {
        result.push({
          ...group,
          currentMembers,
        });
      }
    }

    return result;
  }

  /**
   * Получить группу по ID
   */
  static async getById(groupId: string): Promise<GroupWithDetails | null> {
    const [group] = await db
      .select()
      .from(groups)
      .where(eq(groups.id, groupId));

    if (!group) {
      return null;
    }

    const currentMembersResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(groupMembers)
      .where(and(
        eq(groupMembers.groupId, group.id),
        eq(groupMembers.status, 'ACTIVE')
      ));

    const currentMembers = currentMembersResult[0]?.count || 0;

    return {
      ...group,
      currentMembers,
    };
  }

  /**
   * Получить участников группы
   */
  static async getGroupMembers(groupId: string): Promise<GroupMember[]> {
    const members = await db
      .select({
        id: groupMembers.id,
        userId: users.id,
        playerProfileId: playerProfiles.id,
        nickname: playerProfiles.nickname,
        email: users.email,
        status: groupMembers.status,
        joinedAt: groupMembers.createdAt,
      })
      .from(groupMembers)
      .innerJoin(playerProfiles, eq(groupMembers.playerId, playerProfiles.id))
      .innerJoin(users, eq(playerProfiles.userId, users.id))
      .where(eq(groupMembers.groupId, groupId))
      .orderBy(groupMembers.createdAt);

    return members.map(member => ({
      id: member.id,
      userId: member.userId,
      playerProfileId: member.playerProfileId,
      nickname: member.nickname,
      email: member.email,
      status: member.status as 'ACTIVE' | 'INACTIVE' | 'BANNED',
      joinedAt: member.joinedAt,
    }));
  }

  /**
   * Обновить данные группы
   */
  static async updateGroup(groupId: string, data: UpdateGroupDto, userId: string): Promise<GroupWithDetails | null> {
    // Проверить, что пользователь является мастером группы
    const master = await db
      .select()
      .from(masterProfiles)
      .where(eq(masterProfiles.userId, userId))
      .limit(1);

    if (!master[0]) {
      throw new Error('Master profile not found');
    }

    const [group] = await db
      .select()
      .from(groups)
      .where(and(
        eq(groups.id, groupId),
        eq(groups.masterId, master[0].id)
      ))
      .limit(1);

    if (!group) {
      return null; // Группа не найдена или пользователь не является её мастером
    }

    // Обновить группу
    const [updatedGroup] = await db
      .update(groups)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(groups.id, groupId))
      .returning();

    // Получить количество участников
    const currentMembersResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(groupMembers)
      .where(and(
        eq(groupMembers.groupId, updatedGroup.id),
        eq(groupMembers.status, 'ACTIVE')
      ));

    const currentMembers = currentMembersResult[0]?.count || 0;

    return {
      ...updatedGroup,
      currentMembers,
    };
  }

  /**
   * Удалить участника из группы
   */
  static async removeMember(groupId: string, memberId: string, userId: string): Promise<boolean> {
    // Проверить, что пользователь является мастером группы
    const master = await db
      .select()
      .from(masterProfiles)
      .where(eq(masterProfiles.userId, userId))
      .limit(1);

    if (!master[0]) {
      throw new Error('Master profile not found');
    }

    const [group] = await db
      .select()
      .from(groups)
      .where(and(
        eq(groups.id, groupId),
        eq(groups.masterId, master[0].id)
      ))
      .limit(1);

    if (!group) {
      return false; // Группа не найдена или пользователь не является её мастером
    }

    // Удалить участника
    const result = await db
      .delete(groupMembers)
      .where(and(
        eq(groupMembers.id, memberId),
        eq(groupMembers.groupId, groupId)
      ));

    return result.rowCount > 0;
  }

  /**
   * Проверить, является ли пользователь мастером группы
   */
  static async isGroupMaster(groupId: string, userId: string): Promise<boolean> {
    const master = await db
      .select()
      .from(masterProfiles)
      .where(eq(masterProfiles.userId, userId))
      .limit(1);

    if (!master[0]) {
      return false;
    }

    const [group] = await db
      .select()
      .from(groups)
      .where(and(
        eq(groups.id, groupId),
        eq(groups.masterId, master[0].id)
      ))
      .limit(1);

    return !!group;
  }

  /**
   * Получить группы игрока
   */
  static async getPlayerGroups(userId: string): Promise<GroupWithDetails[]> {
    // Найти профиль игрока по userId
    const player = await db
      .select()
      .from(playerProfiles)
      .where(eq(playerProfiles.userId, userId))
      .limit(1);

    if (!player[0]) {
      return []; // Если профиль игрока не найден, возвращаем пустой список
    }

    // Получить группы, в которых состоит игрок
    const playerGroups = await db
      .select({
        id: groups.id,
        name: groups.name,
        description: groups.description,
        maxMembers: groups.maxMembers,
        isRecruiting: groups.isRecruiting,
        referralCode: groups.referralCode,
        format: groups.format,
        place: groups.place,
        createdAt: groups.createdAt,
        updatedAt: groups.updatedAt,
        seasonId: groups.seasonId,
        masterId: groups.masterId,
        clubId: groups.clubId,
      })
      .from(groups)
      .innerJoin(groupMembers, eq(groups.id, groupMembers.groupId))
      .where(and(
        eq(groupMembers.playerId, player[0].id),
        eq(groupMembers.status, 'ACTIVE')
      ))
      .orderBy(groups.createdAt);

    // Получить количество участников для каждой группы
    const result: GroupWithDetails[] = [];
    for (const group of playerGroups) {
      const currentMembersResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(groupMembers)
        .where(and(
          eq(groupMembers.groupId, group.id),
          eq(groupMembers.status, 'ACTIVE')
        ));

      const currentMembers = currentMembersResult[0]?.count || 0;

      result.push({
        ...group,
        currentMembers,
      });
    }

    return result;
  }

  /**
   * Игрок покидает группу
   */
  static async leaveGroup(groupId: string, userId: string): Promise<boolean> {
    // Найти профиль игрока по userId
    const player = await db
      .select()
      .from(playerProfiles)
      .where(eq(playerProfiles.userId, userId))
      .limit(1);

    if (!player[0]) {
      return false; // Профиль игрока не найден
    }

    // Найти запись о членстве в группе
    const membership = await db
      .select()
      .from(groupMembers)
      .where(and(
        eq(groupMembers.groupId, groupId),
        eq(groupMembers.playerId, player[0].id),
        eq(groupMembers.status, 'ACTIVE')
      ))
      .limit(1);

    if (!membership[0]) {
      return false; // Игрок не состоит в этой группе
    }

    // Удалить запись о членстве
    const result = await db
      .delete(groupMembers)
      .where(eq(groupMembers.id, membership[0].id));

    return result.rowCount > 0;
  }
}
