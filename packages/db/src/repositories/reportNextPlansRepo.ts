/**
 * Репозиторий для работы с планами следующей игры
 */

import { db } from '../index';
import { reportNextPlans, reports, monsters, storyTexts } from '../schema';
import { eq, and, desc } from 'drizzle-orm';
import type { ReportNextPlan, NewReportNextPlan } from '../schema';

export const reportNextPlansRepo = {
  /**
   * Создать план следующей игры
   */
  async create(data: NewReportNextPlan): Promise<ReportNextPlan> {
    const [plan] = await db.insert(reportNextPlans).values(data).returning();
    return plan;
  },

  /**
   * Получить план по reportId
   */
  async getByReportId(reportId: string): Promise<ReportNextPlan | undefined> {
    const [plan] = await db
      .select()
      .from(reportNextPlans)
      .where(eq(reportNextPlans.reportId, reportId))
      .limit(1);
    return plan;
  },

  /**
   * Получить последний APPROVED план для группы
   * (для режима "Продолжение")
   */
  async getLastApprovedForGroup(groupId: string): Promise<{
    report: any;
    plan: ReportNextPlan;
  } | null> {
    const [reportData] = await db
      .select()
      .from(reports)
      .where(and(eq(reports.groupId, groupId), eq(reports.status, 'APPROVED')))
      .orderBy(desc(reports.createdAt))
      .limit(1);

    if (!reportData) return null;

    const plan = await this.getByReportId(reportData.id);
    if (!plan) return null;

    return {
      report: reportData,
      plan,
    };
  },

  /**
   * Получить план с полными данными элементов
   */
  async getByReportIdWithElements(reportId: string) {
    const plan = await this.getByReportId(reportId);
    if (!plan) return null;

    // Загружаем все элементы параллельно
    const [monster, location, mainEvent, sideEvent] = await Promise.all([
      db.select().from(monsters).where(eq(monsters.id, plan.monsterId)).limit(1),
      db.select().from(storyTexts).where(eq(storyTexts.id, plan.locationTextId)).limit(1),
      db.select().from(storyTexts).where(eq(storyTexts.id, plan.mainEventTextId)).limit(1),
      db.select().from(storyTexts).where(eq(storyTexts.id, plan.sideEventTextId)).limit(1),
    ]);

    return {
      ...plan,
      monster: monster[0],
      location: location[0],
      mainEvent: mainEvent[0],
      sideEvent: sideEvent[0],
    };
  },

  /**
   * Обновить план
   */
  async update(reportId: string, data: Partial<NewReportNextPlan>): Promise<ReportNextPlan> {
    const [plan] = await db
      .update(reportNextPlans)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(reportNextPlans.reportId, reportId))
      .returning();

    if (!plan) {
      throw new Error('Plan not found');
    }

    return plan;
  },

  /**
   * Удалить план (каскадное удаление при удалении отчёта)
   */
  async delete(reportId: string): Promise<void> {
    await db.delete(reportNextPlans).where(eq(reportNextPlans.reportId, reportId));
  },
};

