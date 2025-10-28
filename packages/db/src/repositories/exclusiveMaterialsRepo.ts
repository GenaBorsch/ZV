import { db } from '../index';
import { exclusiveMaterials } from '../schema';
import { eq, desc, asc } from 'drizzle-orm';
import type { NewExclusiveMaterial } from '../schema';

export class ExclusiveMaterialsRepo {
  // Получить все материалы (для админа)
  static async getAll() {
    return await db
      .select()
      .from(exclusiveMaterials)
      .orderBy(asc(exclusiveMaterials.sortOrder), desc(exclusiveMaterials.createdAt));
  }

  // Получить только видимые материалы (для игроков)
  static async getVisible() {
    return await db
      .select()
      .from(exclusiveMaterials)
      .where(eq(exclusiveMaterials.isVisible, true))
      .orderBy(asc(exclusiveMaterials.sortOrder), desc(exclusiveMaterials.createdAt));
  }

  // Получить один материал
  static async getById(id: string) {
    const result = await db
      .select()
      .from(exclusiveMaterials)
      .where(eq(exclusiveMaterials.id, id))
      .limit(1);
    return result[0] || null;
  }

  // Создать материал
  static async create(data: NewExclusiveMaterial) {
    const [material] = await db
      .insert(exclusiveMaterials)
      .values(data)
      .returning();
    return material;
  }

  // Обновить материал
  static async update(id: string, data: Partial<NewExclusiveMaterial>) {
    const [material] = await db
      .update(exclusiveMaterials)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(exclusiveMaterials.id, id))
      .returning();
    return material;
  }

  // Удалить материал
  static async delete(id: string) {
    await db
      .delete(exclusiveMaterials)
      .where(eq(exclusiveMaterials.id, id));
  }

  // Переключить видимость
  static async toggleVisibility(id: string) {
    const material = await this.getById(id);
    if (!material) return null;

    const [updated] = await db
      .update(exclusiveMaterials)
      .set({ isVisible: !material.isVisible, updatedAt: new Date() })
      .where(eq(exclusiveMaterials.id, id))
      .returning();
    return updated;
  }
}

