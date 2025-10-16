/**
 * Репозиторий для работы с монстрами
 */

import { db } from '../index';
import { monsters, reports, users } from '../schema';
import { eq, and, ilike, desc, sql, inArray } from 'drizzle-orm';
import type { Monster, NewMonster } from '../schema';

export const monstersRepo = {
  /**
   * Получить список монстров с фильтрацией и пагинацией (админ)
   */
  async list(filters: {
    status?: 'AVAILABLE' | 'LOCKED';
    isActive?: boolean;
    search?: string;
    page?: number;
    limit?: number;
  } = {}) {
    const { status, isActive, search, page = 1, limit = 50 } = filters;
    const offset = (page - 1) * limit;

    const conditions = [];

    if (status) {
      conditions.push(eq(monsters.status, status));
    }
    if (isActive !== undefined) {
      conditions.push(eq(monsters.isActive, isActive));
    }
    if (search) {
      conditions.push(
        sql`${monsters.title} ILIKE ${'%' + search + '%'} OR ${monsters.description} ILIKE ${'%' + search + '%'}`
      );
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [data, totalResult] = await Promise.all([
      db
        .select({
          id: monsters.id,
          title: monsters.title,
          imageUrl: monsters.imageUrl,
          description: monsters.description,
          lastKnownLocation: monsters.lastKnownLocation,
          bountyAlive: monsters.bountyAlive,
          bountyDead: monsters.bountyDead,
          status: monsters.status,
          lockedByReportId: monsters.lockedByReportId,
          lockedByGroupId: monsters.lockedByGroupId,
          lockedAt: monsters.lockedAt,
          isActive: monsters.isActive,
          createdAt: monsters.createdAt,
          updatedAt: monsters.updatedAt,
          // Информация о мастере, который заблокировал
          lockedByMasterName: users.name,
          lockedByMasterEmail: users.email,
        })
        .from(monsters)
        .leftJoin(reports, eq(monsters.lockedByReportId, reports.id))
        .leftJoin(users, eq(reports.masterId, users.id))
        .where(whereClause)
        .orderBy(desc(monsters.createdAt))
        .limit(limit)
        .offset(offset),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(monsters)
        .where(whereClause),
    ]);

    const total = totalResult[0]?.count || 0;
    const pages = Math.ceil(total / limit);

    return {
      data,
      pagination: {
        total,
        page,
        limit,
        pages,
      },
    };
  },

  /**
   * Получить доступные монстры для выбора мастером
   */
  async listAvailable(search?: string, limit = 50) {
    const conditions = [
      eq(monsters.status, 'AVAILABLE'),
      eq(monsters.isActive, true),
    ];

    if (search) {
      conditions.push(ilike(monsters.title, `%${search}%`));
    }

    return db
      .select()
      .from(monsters)
      .where(and(...conditions))
      .orderBy(monsters.title)
      .limit(limit);
  },

  /**
   * Получить монстра по ID
   */
  async getById(id: string): Promise<Monster | undefined> {
    const [monster] = await db
      .select()
      .from(monsters)
      .where(eq(monsters.id, id))
      .limit(1);
    return monster;
  },

  /**
   * Создать монстра (админ)
   */
  async create(data: NewMonster): Promise<Monster> {
    const [monster] = await db.insert(monsters).values(data).returning();
    return monster;
  },

  /**
   * Обновить монстра (админ)
   */
  async update(id: string, data: Partial<NewMonster>): Promise<Monster> {
    const [monster] = await db
      .update(monsters)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(monsters.id, id))
      .returning();
    
    if (!monster) {
      throw new Error('Monster not found');
    }
    
    return monster;
  },

  /**
   * Удалить монстра (админ)
   * Нельзя удалить заблокированного монстра
   */
  async delete(id: string): Promise<void> {
    const monster = await this.getById(id);
    
    if (!monster) {
      throw new Error('Monster not found');
    }
    
    if (monster.status === 'LOCKED') {
      throw new Error('Cannot delete locked monster');
    }

    await db.delete(monsters).where(eq(monsters.id, id));
  },

  /**
   * Заблокировать монстра при одобрении отчёта (оптимистическая блокировка)
   */
  async lockByReport(
    monsterId: string,
    reportId: string,
    groupId: string
  ): Promise<boolean> {
    const result = await db
      .update(monsters)
      .set({
        status: 'LOCKED',
        lockedByReportId: reportId,
        lockedByGroupId: groupId,
        lockedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(monsters.id, monsterId),
          eq(monsters.status, 'AVAILABLE') // Атомарная проверка
        )
      )
      .returning();

    return result.length > 0;
  },

  /**
   * Разблокировать монстра (админ - ручной unlock)
   */
  async unlock(id: string): Promise<Monster> {
    const [monster] = await db
      .update(monsters)
      .set({
        status: 'AVAILABLE',
        lockedByReportId: null,
        lockedByGroupId: null,
        lockedAt: null,
        updatedAt: new Date(),
      })
      .where(eq(monsters.id, id))
      .returning();

    if (!monster) {
      throw new Error('Monster not found');
    }

    return monster;
  },

  /**
   * Проверить доступность списка монстров (для оптимистической блокировки)
   */
  async checkAvailability(monsterIds: string[]): Promise<string[]> {
    if (monsterIds.length === 0) return [];

    const results = await db
      .select({ id: monsters.id })
      .from(monsters)
      .where(
        and(
          inArray(monsters.id, monsterIds),
          eq(monsters.status, 'AVAILABLE'),
          eq(monsters.isActive, true)
        )
      );

    return results.map((r) => r.id);
  },

  /**
   * Получить случайного доступного монстра
   */
  async getRandomAvailable(): Promise<Monster | undefined> {
    const [monster] = await db
      .select()
      .from(monsters)
      .where(
        and(
          eq(monsters.status, 'AVAILABLE'),
          eq(monsters.isActive, true)
        )
      )
      .orderBy(sql`RANDOM()`)
      .limit(1);

    return monster;
  },
};

