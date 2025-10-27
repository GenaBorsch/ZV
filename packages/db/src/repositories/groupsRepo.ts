import { db, groups, groupMembers, groupApplications, seasons, masterProfiles, playerProfiles, users, eq, and, sql } from '../index';
import type { CreateGroupDtoType, UpdateGroupDtoType } from '@zv/contracts';
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

export interface GroupWithMasterAndSeason extends GroupWithDetails {
  master: {
    id: string;
    name: string | null;
    bio: string | null;
    format: 'ONLINE' | 'OFFLINE' | 'MIXED';
    location: string | null;
    rpgExperience: 'NOVICE' | 'INTERMEDIATE' | 'VETERAN' | null;
    contacts: string | null;
  };
  season: {
    id: string;
    title: string;
    code: string;
    isActive: boolean;
  };
}

export interface GroupWithNotifications extends GroupWithDetails {
  pendingApplicationsCount: number;
}

export interface UserGroupWithRole extends GroupWithDetails {
  role: 'MASTER' | 'PLAYER';
  pendingApplicationsCount?: number;
}

export interface GroupMember {
  id: string;
  userId: string;
  playerProfileId: string;
  nickname: string | null;
  name: string | null;
  email: string;
  status: 'ACTIVE' | 'INACTIVE' | 'BANNED';
  joinedAt: Date;
}

export interface GroupApplicationWithPlayer {
  id: string;
  groupId: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'WITHDRAWN';
  message: string | null;
  masterResponse: string | null;
  createdAt: Date;
  updatedAt: Date;
  player: {
    id: string;
    userId: string;
    nickname: string | null;
    notes: string | null;
    user: {
      id: string;
      name: string | null;
      email: string;
      rpgExperience: 'NOVICE' | 'INTERMEDIATE' | 'VETERAN' | null;
      contacts: string | null;
    };
  };
}

export class GroupsRepo {
  /**
   * Создать группу
   */
  static async create(data: CreateGroupDtoType, userId: string): Promise<GroupWithDetails> {
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
   * Присоединиться к группе по ID
   */
  static async joinByGroupId(groupId: string, userId: string): Promise<GroupWithDetails> {
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

      // Найти группу по ID
      const [group] = await tx
        .select()
        .from(groups)
        .where(eq(groups.id, groupId));

      if (!group) {
        throw new Error('Group not found');
      }

      // Проверить, что группа открыта для набора
      if (!group.isRecruiting) {
        throw new Error('Group is not recruiting');
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

      const currentMembers = Number(currentMembersResult[0]?.count) || 0;

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

      const currentMembers = Number(currentMembersResult[0]?.count) || 0;

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

      const currentMembers = Number(currentMembersResult[0]?.count) || 0;

      result.push({
        ...group,
        currentMembers,
      });
    }

    return result;
  }

  /**
   * Получить группы мастера с количеством ожидающих заявок
   */
  static async getByMasterIdWithNotifications(userId: string): Promise<GroupWithNotifications[]> {
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
      .where(eq(groups.masterId, master[0].id));

    // Получить количество участников и ожидающих заявок для каждой группы
    const result: GroupWithNotifications[] = [];
    for (const group of groupsList) {
      // Количество активных участников
      const currentMembersResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(groupMembers)
        .where(and(
          eq(groupMembers.groupId, group.id),
          eq(groupMembers.status, 'ACTIVE')
        ));

      // Количество ожидающих заявок
      const pendingApplicationsResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(groupApplications)
        .where(and(
          eq(groupApplications.groupId, group.id),
          eq(groupApplications.status, 'PENDING')
        ));

      const currentMembers = Number(currentMembersResult[0]?.count) || 0;
      const pendingApplicationsCount = Number(pendingApplicationsResult[0]?.count) || 0;

      result.push({
        ...group,
        currentMembers,
        pendingApplicationsCount,
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

      const currentMembers = Number(currentMembersResult[0]?.count) || 0;

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
   * Поиск доступных групп с полной информацией о мастере и сезоне
   */
  static async searchAvailableGroups(params: {
    search?: string;
    format?: 'ONLINE' | 'OFFLINE' | 'MIXED';
    seasonId?: string;
  }): Promise<GroupWithMasterAndSeason[]> {
    const { search, format, seasonId } = params;

    // Применяем фильтры
    const conditions = [eq(groups.isRecruiting, true), eq(seasons.isActive, true)];
    
    if (format) {
      conditions.push(eq(groups.format, format));
    }
    
    if (seasonId) {
      conditions.push(eq(groups.seasonId, seasonId));
    }

    // Базовый запрос с JOIN'ами для получения данных мастера и сезона
    const groupsList = await db
      .select({
        // Данные группы
        groupId: groups.id,
        groupName: groups.name,
        groupDescription: groups.description,
        groupMaxMembers: groups.maxMembers,
        groupIsRecruiting: groups.isRecruiting,
        groupReferralCode: groups.referralCode,
        groupFormat: groups.format,
        groupPlace: groups.place,
        groupCreatedAt: groups.createdAt,
        groupUpdatedAt: groups.updatedAt,
        groupSeasonId: groups.seasonId,
        groupMasterId: groups.masterId,
        groupClubId: groups.clubId,
        
        // Данные мастера
        masterProfileId: masterProfiles.id,
        masterBio: masterProfiles.bio,
        masterFormat: masterProfiles.format,
        masterLocation: masterProfiles.location,
        
        // Данные пользователя мастера
        masterName: users.name,
        masterRpgExperience: users.rpgExperience,
        masterContacts: users.contacts,
        
        // Данные сезона
        seasonId: seasons.id,
        seasonTitle: seasons.title,
        seasonCode: seasons.code,
        seasonIsActive: seasons.isActive,
      })
      .from(groups)
      .innerJoin(masterProfiles, eq(groups.masterId, masterProfiles.id))
      .innerJoin(users, eq(masterProfiles.userId, users.id))
      .innerJoin(seasons, eq(groups.seasonId, seasons.id))
      .where(and(...conditions));

    // Получить количество участников для каждой группы и применить поиск
    const result: GroupWithMasterAndSeason[] = [];
    
    for (const group of groupsList) {
      const currentMembersResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(groupMembers)
        .where(and(
          eq(groupMembers.groupId, group.groupId),
          eq(groupMembers.status, 'ACTIVE')
        ));

      const currentMembers = Number(currentMembersResult[0]?.count) || 0;

      // Показываем только группы с свободными местами
      if (currentMembers >= group.groupMaxMembers) {
        continue;
      }

      // Применяем поиск по названию группы или имени мастера
      if (search) {
        const searchLower = search.toLowerCase();
        const groupNameMatch = group.groupName.toLowerCase().includes(searchLower);
        const masterNameMatch = group.masterName?.toLowerCase().includes(searchLower) || false;
        
        if (!groupNameMatch && !masterNameMatch) {
          continue;
        }
      }

      result.push({
        id: group.groupId,
        name: group.groupName,
        description: group.groupDescription,
        maxMembers: group.groupMaxMembers,
        isRecruiting: group.groupIsRecruiting,
        referralCode: group.groupReferralCode,
        format: group.groupFormat,
        place: group.groupPlace,
        createdAt: group.groupCreatedAt,
        updatedAt: group.groupUpdatedAt,
        seasonId: group.groupSeasonId,
        masterId: group.groupMasterId,
        clubId: group.groupClubId,
        currentMembers,
        master: {
          id: group.masterProfileId,
          name: group.masterName,
          bio: group.masterBio,
          format: group.masterFormat,
          location: group.masterLocation,
          rpgExperience: group.masterRpgExperience,
          contacts: group.masterContacts,
        },
        season: {
          id: group.seasonId,
          title: group.seasonTitle,
          code: group.seasonCode,
          isActive: group.seasonIsActive,
        },
      });
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

    const currentMembers = Number(currentMembersResult[0]?.count) || 0;

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
        name: users.name,
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
      name: member.name,
      email: member.email,
      status: member.status as 'ACTIVE' | 'INACTIVE' | 'BANNED',
      joinedAt: member.joinedAt,
    }));
  }

  /**
   * Обновить данные группы
   */
  static async updateGroup(groupId: string, data: UpdateGroupDtoType, userId: string): Promise<GroupWithDetails | null> {
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

    const currentMembers = Number(currentMembersResult[0]?.count) || 0;

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

    return Array.isArray(result) ? result.length > 0 : (result as any).rowCount > 0;
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

      const currentMembers = Number(currentMembersResult[0]?.count) || 0;

      result.push({
        ...group,
        currentMembers,
      });
    }

    return result;
  }

  /**
   * Получить все группы пользователя (как мастера и как игрока)
   */
  static async getAllUserGroups(userId: string): Promise<UserGroupWithRole[]> {
    const result: UserGroupWithRole[] = [];
    const seenGroupIds = new Set<string>();

    // Получить группы, где пользователь является мастером
    const masterGroups = await this.getByMasterIdWithNotifications(userId);
    for (const group of masterGroups) {
      if (!seenGroupIds.has(group.id)) {
        seenGroupIds.add(group.id);
        result.push({
          ...group,
          role: 'MASTER' as const,
          pendingApplicationsCount: group.pendingApplicationsCount,
        });
      }
    }

    // Получить группы, где пользователь является игроком
    const playerGroups = await this.getPlayerGroups(userId);
    for (const group of playerGroups) {
      if (!seenGroupIds.has(group.id)) {
        seenGroupIds.add(group.id);
        result.push({
          ...group,
          role: 'PLAYER' as const,
        });
      }
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

    return Array.isArray(result) ? result.length > 0 : (result as any).rowCount > 0;
  }

  /**
   * Подать заявку на вступление в группу
   */
  static async applyToGroup(groupId: string, userId: string, message?: string): Promise<GroupApplicationWithPlayer> {
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
            nickname: null,
          })
          .returning();
        player = [newPlayer];
      }

      const playerId = player[0].id;

      // Проверить, что группа существует и открыта для набора
      const [group] = await tx
        .select()
        .from(groups)
        .where(eq(groups.id, groupId));

      if (!group) {
        throw new Error('Group not found');
      }

      if (!group.isRecruiting) {
        throw new Error('Group is not recruiting');
      }

      // Проверить, что игрок еще не подавал заявку
      const existingApplication = await tx
        .select()
        .from(groupApplications)
        .where(and(
          eq(groupApplications.groupId, groupId),
          eq(groupApplications.playerId, playerId),
          eq(groupApplications.status, 'PENDING')
        ));

      if (existingApplication.length > 0) {
        throw new Error('Application already submitted');
      }

      // Проверить, что игрок не является участником группы
      const existingMembership = await tx
        .select()
        .from(groupMembers)
        .where(and(
          eq(groupMembers.groupId, groupId),
          eq(groupMembers.playerId, playerId)
        ));

      if (existingMembership.length > 0) {
        throw new Error('Player already in group');
      }

      // Создать заявку
      const [application] = await tx
        .insert(groupApplications)
        .values({
          groupId,
          playerId,
          message,
          status: 'PENDING',
        })
        .returning();

      // Получить полную информацию о заявке с данными игрока
      const applicationWithPlayer = await tx
        .select({
          id: groupApplications.id,
          groupId: groupApplications.groupId,
          status: groupApplications.status,
          message: groupApplications.message,
          masterResponse: groupApplications.masterResponse,
          createdAt: groupApplications.createdAt,
          updatedAt: groupApplications.updatedAt,
          playerId: playerProfiles.id,
          playerUserId: playerProfiles.userId,
          playerNickname: playerProfiles.nickname,
          playerNotes: playerProfiles.notes,
          userId: users.id,
          userName: users.name,
          userEmail: users.email,
          userRpgExperience: users.rpgExperience,
          userContacts: users.contacts,
        })
        .from(groupApplications)
        .innerJoin(playerProfiles, eq(groupApplications.playerId, playerProfiles.id))
        .innerJoin(users, eq(playerProfiles.userId, users.id))
        .where(eq(groupApplications.id, application.id))
        .limit(1);

      const result = applicationWithPlayer[0];

      return {
        id: result.id,
        groupId: result.groupId,
        status: result.status as 'PENDING' | 'APPROVED' | 'REJECTED' | 'WITHDRAWN',
        message: result.message,
        masterResponse: result.masterResponse,
        createdAt: result.createdAt,
        updatedAt: result.updatedAt,
        player: {
          id: result.playerId,
          userId: result.playerUserId,
          nickname: result.playerNickname,
          notes: result.playerNotes,
          user: {
            id: result.userId,
            name: result.userName,
            email: result.userEmail,
            rpgExperience: result.userRpgExperience,
            contacts: result.userContacts,
          },
        },
      };
    });
  }

  /**
   * Получить заявки для группы (для мастера)
   */
  static async getGroupApplications(groupId: string, userId: string): Promise<GroupApplicationWithPlayer[]> {
    // Проверить, что пользователь является мастером группы
    const isMaster = await this.isGroupMaster(groupId, userId);
    if (!isMaster) {
      throw new Error('Access denied. You are not the master of this group.');
    }

    const applications = await db
      .select({
        id: groupApplications.id,
        groupId: groupApplications.groupId,
        status: groupApplications.status,
        message: groupApplications.message,
        masterResponse: groupApplications.masterResponse,
        createdAt: groupApplications.createdAt,
        updatedAt: groupApplications.updatedAt,
        playerId: playerProfiles.id,
        playerUserId: playerProfiles.userId,
        playerNickname: playerProfiles.nickname,
        playerNotes: playerProfiles.notes,
        userId: users.id,
        userName: users.name,
        userEmail: users.email,
        userRpgExperience: users.rpgExperience,
        userContacts: users.contacts,
      })
      .from(groupApplications)
      .innerJoin(playerProfiles, eq(groupApplications.playerId, playerProfiles.id))
      .innerJoin(users, eq(playerProfiles.userId, users.id))
      .where(eq(groupApplications.groupId, groupId))
      .orderBy(groupApplications.createdAt);

    return applications.map(app => ({
      id: app.id,
      groupId: app.groupId,
      status: app.status as 'PENDING' | 'APPROVED' | 'REJECTED' | 'WITHDRAWN',
      message: app.message,
      masterResponse: app.masterResponse,
      createdAt: app.createdAt,
      updatedAt: app.updatedAt,
      player: {
        id: app.playerId,
        userId: app.playerUserId,
        nickname: app.playerNickname,
        notes: app.playerNotes,
        user: {
          id: app.userId,
          name: app.userName,
          email: app.userEmail,
          rpgExperience: app.userRpgExperience,
          contacts: app.userContacts,
        },
      },
    }));
  }

  /**
   * Принять заявку (мастером)
   */
  static async approveApplication(applicationId: string, userId: string, masterResponse?: string): Promise<GroupApplicationWithPlayer> {
    return db.transaction(async (tx) => {
      // Получить заявку
      const [application] = await tx
        .select()
        .from(groupApplications)
        .where(eq(groupApplications.id, applicationId));

      if (!application) {
        throw new Error('Application not found');
      }

      // Проверить, что пользователь является мастером группы
      const isMaster = await this.isGroupMaster(application.groupId, userId);
      if (!isMaster) {
        throw new Error('Access denied. You are not the master of this group.');
      }

      // Проверить, что заявка находится в статусе PENDING
      if (application.status !== 'PENDING') {
        throw new Error('Application is not pending');
      }

      // Проверить, что группа не переполнена
      const currentMembersResult = await tx
        .select({ count: sql<number>`count(*)` })
        .from(groupMembers)
        .where(and(
          eq(groupMembers.groupId, application.groupId),
          eq(groupMembers.status, 'ACTIVE')
        ));

      const currentMembers = Number(currentMembersResult[0]?.count) || 0;
      
      const [group] = await tx
        .select()
        .from(groups)
        .where(eq(groups.id, application.groupId));

      if (currentMembers >= group.maxMembers) {
        throw new Error('Group is full');
      }

      // Обновить статус заявки
      await tx
        .update(groupApplications)
        .set({
          status: 'APPROVED',
          masterResponse,
          updatedAt: new Date(),
        })
        .where(eq(groupApplications.id, applicationId));

      // Добавить игрока в группу
      await tx.insert(groupMembers).values({
        groupId: application.groupId,
        playerId: application.playerId,
        status: 'ACTIVE',
      });

      // Получить обновленную заявку с данными игрока
      const applicationWithPlayer = await tx
        .select({
          id: groupApplications.id,
          groupId: groupApplications.groupId,
          status: groupApplications.status,
          message: groupApplications.message,
          masterResponse: groupApplications.masterResponse,
          createdAt: groupApplications.createdAt,
          updatedAt: groupApplications.updatedAt,
          playerId: playerProfiles.id,
          playerUserId: playerProfiles.userId,
          playerNickname: playerProfiles.nickname,
          playerNotes: playerProfiles.notes,
          userId: users.id,
          userName: users.name,
          userEmail: users.email,
          userRpgExperience: users.rpgExperience,
          userContacts: users.contacts,
        })
        .from(groupApplications)
        .innerJoin(playerProfiles, eq(groupApplications.playerId, playerProfiles.id))
        .innerJoin(users, eq(playerProfiles.userId, users.id))
        .where(eq(groupApplications.id, applicationId))
        .limit(1);

      const result = applicationWithPlayer[0];

      return {
        id: result.id,
        groupId: result.groupId,
        status: result.status as 'PENDING' | 'APPROVED' | 'REJECTED' | 'WITHDRAWN',
        message: result.message,
        masterResponse: result.masterResponse,
        createdAt: result.createdAt,
        updatedAt: result.updatedAt,
        player: {
          id: result.playerId,
          userId: result.playerUserId,
          nickname: result.playerNickname,
          notes: result.playerNotes,
          user: {
            id: result.userId,
            name: result.userName,
            email: result.userEmail,
            rpgExperience: result.userRpgExperience,
            contacts: result.userContacts,
          },
        },
      };
    });
  }

  /**
   * Отклонить заявку (мастером)
   */
  static async rejectApplication(applicationId: string, userId: string, masterResponse?: string): Promise<GroupApplicationWithPlayer> {
    return db.transaction(async (tx) => {
      // Получить заявку
      const [application] = await tx
        .select()
        .from(groupApplications)
        .where(eq(groupApplications.id, applicationId));

      if (!application) {
        throw new Error('Application not found');
      }

      // Проверить, что пользователь является мастером группы
      const isMaster = await this.isGroupMaster(application.groupId, userId);
      if (!isMaster) {
        throw new Error('Access denied. You are not the master of this group.');
      }

      // Проверить, что заявка находится в статусе PENDING
      if (application.status !== 'PENDING') {
        throw new Error('Application is not pending');
      }

      // Обновить статус заявки
      await tx
        .update(groupApplications)
        .set({
          status: 'REJECTED',
          masterResponse,
          updatedAt: new Date(),
        })
        .where(eq(groupApplications.id, applicationId));

      // Получить обновленную заявку с данными игрока
      const applicationWithPlayer = await tx
        .select({
          id: groupApplications.id,
          groupId: groupApplications.groupId,
          status: groupApplications.status,
          message: groupApplications.message,
          masterResponse: groupApplications.masterResponse,
          createdAt: groupApplications.createdAt,
          updatedAt: groupApplications.updatedAt,
          playerId: playerProfiles.id,
          playerUserId: playerProfiles.userId,
          playerNickname: playerProfiles.nickname,
          playerNotes: playerProfiles.notes,
          userId: users.id,
          userName: users.name,
          userEmail: users.email,
          userRpgExperience: users.rpgExperience,
          userContacts: users.contacts,
        })
        .from(groupApplications)
        .innerJoin(playerProfiles, eq(groupApplications.playerId, playerProfiles.id))
        .innerJoin(users, eq(playerProfiles.userId, users.id))
        .where(eq(groupApplications.id, applicationId))
        .limit(1);

      const result = applicationWithPlayer[0];

      return {
        id: result.id,
        groupId: result.groupId,
        status: result.status as 'PENDING' | 'APPROVED' | 'REJECTED' | 'WITHDRAWN',
        message: result.message,
        masterResponse: result.masterResponse,
        createdAt: result.createdAt,
        updatedAt: result.updatedAt,
        player: {
          id: result.playerId,
          userId: result.playerUserId,
          nickname: result.playerNickname,
          notes: result.playerNotes,
          user: {
            id: result.userId,
            name: result.userName,
            email: result.userEmail,
            rpgExperience: result.userRpgExperience,
            contacts: result.userContacts,
          },
        },
      };
    });
  }

  /**
   * Получить заявки игрока
   */
  static async getPlayerApplications(userId: string): Promise<GroupApplicationWithPlayer[]> {
    // Найти профиль игрока
    const player = await db
      .select()
      .from(playerProfiles)
      .where(eq(playerProfiles.userId, userId))
      .limit(1);

    if (!player[0]) {
      return [];
    }

    const applications = await db
      .select({
        id: groupApplications.id,
        groupId: groupApplications.groupId,
        status: groupApplications.status,
        message: groupApplications.message,
        masterResponse: groupApplications.masterResponse,
        createdAt: groupApplications.createdAt,
        updatedAt: groupApplications.updatedAt,
        playerId: playerProfiles.id,
        playerUserId: playerProfiles.userId,
        playerNickname: playerProfiles.nickname,
        playerNotes: playerProfiles.notes,
        userId: users.id,
        userName: users.name,
        userEmail: users.email,
        userRpgExperience: users.rpgExperience,
        userContacts: users.contacts,
      })
      .from(groupApplications)
      .innerJoin(playerProfiles, eq(groupApplications.playerId, playerProfiles.id))
      .innerJoin(users, eq(playerProfiles.userId, users.id))
      .where(eq(groupApplications.playerId, player[0].id))
      .orderBy(groupApplications.createdAt);

    return applications.map(app => ({
      id: app.id,
      groupId: app.groupId,
      status: app.status as 'PENDING' | 'APPROVED' | 'REJECTED' | 'WITHDRAWN',
      message: app.message,
      masterResponse: app.masterResponse,
      createdAt: app.createdAt,
      updatedAt: app.updatedAt,
      player: {
        id: app.playerId,
        userId: app.playerUserId,
        nickname: app.playerNickname,
        notes: app.playerNotes,
        user: {
          id: app.userId,
          name: app.userName,
          email: app.userEmail,
          rpgExperience: app.userRpgExperience,
          contacts: app.userContacts,
        },
      },
    }));
  }

  /**
   * Удалить группу
   */
  static async deleteGroup(groupId: string, userId: string): Promise<boolean> {
    return db.transaction(async (tx) => {
      // Проверить, что пользователь является мастером группы
      const isMaster = await GroupsRepo.isGroupMaster(groupId, userId);
      if (!isMaster) {
        throw new Error('Access denied. You are not the master of this group.');
      }

      // Проверить, что группа существует
      const group = await tx
        .select()
        .from(groups)
        .where(eq(groups.id, groupId))
        .limit(1);

      if (!group[0]) {
        throw new Error('Group not found');
      }

      // Удалить все заявки в группу
      await tx
        .delete(groupApplications)
        .where(eq(groupApplications.groupId, groupId));

      // Удалить всех участников группы
      await tx
        .delete(groupMembers)
        .where(eq(groupMembers.groupId, groupId));

      // Удалить саму группу
      await tx
        .delete(groups)
        .where(eq(groups.id, groupId));

      // Если мы дошли до этого места без ошибок, значит удаление прошло успешно
      return true;
    });
  }
}
