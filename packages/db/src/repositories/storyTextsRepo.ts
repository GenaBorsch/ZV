/**
 * Репозиторий для работы с текстовыми элементами (локации, события)
 */

import { db } from '../index';
import { storyTexts, reports, users } from '../schema';
import { eq, and, ilike, desc, sql, inArray } from 'drizzle-orm';
import type { StoryText, NewStoryText, StoryTextType } from '../schema';

export const storyTextsRepo = {
  /**
   * Получить список текстов с фильтрацией и пагинацией (админ)
   */
  async list(filters: {
    type?: StoryTextType;
    status?: 'AVAILABLE' | 'LOCKED';
    isActive?: boolean;
    search?: string;
    page?: number;
    limit?: number;
  } = {}) {
    const { type, status, isActive, search, page = 1, limit = 50 } = filters;
    const offset = (page - 1) * limit;

    const conditions = [];

    if (type) {
      conditions.push(eq(storyTexts.type, type));
    }
    if (status) {
      conditions.push(eq(storyTexts.status, status));
    }
    if (isActive !== undefined) {
      conditions.push(eq(storyTexts.isActive, isActive));
    }
    if (search) {
      conditions.push(
        sql`(${storyTexts.title} ILIKE ${`%${search}%`} OR ${storyTexts.text} ILIKE ${`%${search}%`})`
      );
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [data, totalResult] = await Promise.all([
      db
        .select({
          id: storyTexts.id,
          type: storyTexts.type,
          title: storyTexts.title,
          text: storyTexts.text,
          status: storyTexts.status,
          lockedByReportId: storyTexts.lockedByReportId,
          lockedByGroupId: storyTexts.lockedByGroupId,
          lockedAt: storyTexts.lockedAt,
          isActive: storyTexts.isActive,
          createdAt: storyTexts.createdAt,
          updatedAt: storyTexts.updatedAt,
          // Информация о мастере, который заблокировал
          lockedByMasterName: users.name,
          lockedByMasterEmail: users.email,
        })
        .from(storyTexts)
        .leftJoin(reports, eq(storyTexts.lockedByReportId, reports.id))
        .leftJoin(users, eq(reports.masterId, users.id))
        .where(whereClause)
        .orderBy(desc(storyTexts.createdAt))
        .limit(limit)
        .offset(offset),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(storyTexts)
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
   * Получить доступные тексты по типу для выбора мастером
   */
  async listAvailableByType(type: StoryTextType, search?: string, limit = 50) {
    const conditions = [
      eq(storyTexts.type, type),
      eq(storyTexts.status, 'AVAILABLE'),
      eq(storyTexts.isActive, true),
    ];

    if (search) {
      conditions.push(
        sql`(${storyTexts.title} ILIKE ${`%${search}%`} OR ${storyTexts.text} ILIKE ${`%${search}%`})`
      );
    }

    return db
      .select()
      .from(storyTexts)
      .where(and(...conditions))
      .orderBy(storyTexts.title)
      .limit(limit);
  },

  /**
   * Получить текст по ID
   */
  async getById(id: string): Promise<StoryText | undefined> {
    const [text] = await db
      .select()
      .from(storyTexts)
      .where(eq(storyTexts.id, id))
      .limit(1);
    return text;
  },

  /**
   * Создать текст (админ)
   */
  async create(data: NewStoryText): Promise<StoryText> {
    const [text] = await db.insert(storyTexts).values(data).returning();
    return text;
  },

  /**
   * Обновить текст (админ)
   */
  async update(id: string, data: Partial<NewStoryText>): Promise<StoryText> {
    const [text] = await db
      .update(storyTexts)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(storyTexts.id, id))
      .returning();
    
    if (!text) {
      throw new Error('Story text not found');
    }
    
    return text;
  },

  /**
   * Удалить текст (админ)
   * Нельзя удалить заблокированный текст
   */
  async delete(id: string): Promise<void> {
    const text = await this.getById(id);
    
    if (!text) {
      throw new Error('Story text not found');
    }
    
    if (text.status === 'LOCKED') {
      throw new Error('Cannot delete locked story text');
    }

    await db.delete(storyTexts).where(eq(storyTexts.id, id));
  },

  /**
   * Заблокировать текст при одобрении отчёта (оптимистическая блокировка)
   */
  async lockByReport(
    textId: string,
    reportId: string,
    groupId: string
  ): Promise<boolean> {
    const result = await db
      .update(storyTexts)
      .set({
        status: 'LOCKED',
        lockedByReportId: reportId,
        lockedByGroupId: groupId,
        lockedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(storyTexts.id, textId),
          eq(storyTexts.status, 'AVAILABLE') // Атомарная проверка
        )
      )
      .returning();

    return result.length > 0;
  },

  /**
   * Разблокировать текст (админ - ручной unlock)
   */
  async unlock(id: string): Promise<StoryText> {
    const [text] = await db
      .update(storyTexts)
      .set({
        status: 'AVAILABLE',
        lockedByReportId: null,
        lockedByGroupId: null,
        lockedAt: null,
        updatedAt: new Date(),
      })
      .where(eq(storyTexts.id, id))
      .returning();

    if (!text) {
      throw new Error('Story text not found');
    }

    return text;
  },

  /**
   * Проверить доступность списка текстов (для оптимистической блокировки)
   */
  async checkAvailability(textIds: string[]): Promise<string[]> {
    if (textIds.length === 0) return [];

    const results = await db
      .select({ id: storyTexts.id })
      .from(storyTexts)
      .where(
        and(
          inArray(storyTexts.id, textIds),
          eq(storyTexts.status, 'AVAILABLE'),
          eq(storyTexts.isActive, true)
        )
      );

    return results.map((r) => r.id);
  },

  /**
   * Получить случайный доступный текст по типу
   */
  async getRandomAvailableByType(type: StoryTextType): Promise<StoryText | undefined> {
    const [text] = await db
      .select()
      .from(storyTexts)
      .where(
        and(
          eq(storyTexts.type, type),
          eq(storyTexts.status, 'AVAILABLE'),
          eq(storyTexts.isActive, true)
        )
      )
      .orderBy(sql`RANDOM()`)
      .limit(1);

    return text;
  },

  /**
   * Получить случайную сетку текстов (для "Мне повезёт")
   */
  async getRandomGrid(): Promise<{
    location?: StoryText;
    mainEvent?: StoryText;
    sideEvent?: StoryText;
  }> {
    const [location, mainEvent, sideEvent] = await Promise.all([
      this.getRandomAvailableByType('LOCATION'),
      this.getRandomAvailableByType('MAIN_EVENT'),
      this.getRandomAvailableByType('SIDE_EVENT'),
    ]);

    return {
      location,
      mainEvent,
      sideEvent,
    };
  },
};

