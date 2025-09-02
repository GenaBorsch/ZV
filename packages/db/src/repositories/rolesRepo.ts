import { db, userRoles, eq, and, inArray, sql } from '../index';
import type { Role } from '../schema';

export class RolesRepo {
  /**
   * Получить все роли пользователя
   */
  static async listByUser(userId: string): Promise<string[]> {
    const result = await db
      .select({ role: userRoles.role })
      .from(userRoles)
      .where(eq(userRoles.userId, userId));

    return result.map(r => r.role);
  }

  /**
   * Добавить роль пользователю
   * Гарантирует уникальность (userId, role)
   */
  static async add(userId: string, role: Role): Promise<void> {
    try {
      await db
        .insert(userRoles)
        .values({
          userId,
          role,
        })
        .onConflictDoNothing(); // Игнорируем, если роль уже существует
    } catch (error: any) {
      // Дополнительная обработка на случай race conditions
      if (error.code === '23505') { // unique_violation
        // Роль уже существует, это нормально
        return;
      }
      throw error;
    }
  }

  /**
   * Удалить роль у пользователя
   */
  static async remove(userId: string, role: Role): Promise<void> {
    await db
      .delete(userRoles)
      .where(and(
        eq(userRoles.userId, userId),
        eq(userRoles.role, role)
      ));
  }

  /**
   * Добавить несколько ролей пользователю атомарно
   */
  static async addMultiple(userId: string, roles: Role[]): Promise<void> {
    if (roles.length === 0) return;

    const values = roles.map(role => ({
      userId,
      role,
    }));

    try {
      await db
        .insert(userRoles)
        .values(values)
        .onConflictDoNothing();
    } catch (error: any) {
      if (error.code === '23505') { // unique_violation
        // Некоторые роли уже существуют, это нормально
        return;
      }
      throw error;
    }
  }

  /**
   * Удалить несколько ролей у пользователя атомарно
   */
  static async removeMultiple(userId: string, roles: Role[]): Promise<void> {
    if (roles.length === 0) return;

    await db
      .delete(userRoles)
      .where(and(
        eq(userRoles.userId, userId),
        inArray(userRoles.role, roles)
      ));
  }

  /**
   * Управление ролями пользователя (добавление и удаление в одной транзакции)
   */
  static async manageUserRoles(
    userId: string, 
    { add = [], remove = [] }: { add?: Role[], remove?: Role[] }
  ): Promise<string[]> {
    return await db.transaction(async (tx) => {
      // Удаляем роли
      if (remove.length > 0) {
        await tx
          .delete(userRoles)
          .where(and(
            eq(userRoles.userId, userId),
            inArray(userRoles.role, remove)
          ));
      }

      // Добавляем роли
      if (add.length > 0) {
        const values = add.map(role => ({
          userId,
          role,
        }));

        await tx
          .insert(userRoles)
          .values(values)
          .onConflictDoNothing();
      }

      // Возвращаем актуальный список ролей
      const result = await tx
        .select({ role: userRoles.role })
        .from(userRoles)
        .where(eq(userRoles.userId, userId));

      return result.map(r => r.role);
    });
  }

  /**
   * Проверить, есть ли у пользователя конкретная роль
   */
  static async hasRole(userId: string, role: Role): Promise<boolean> {
    const result = await db
      .select({ role: userRoles.role })
      .from(userRoles)
      .where(and(
        eq(userRoles.userId, userId),
        eq(userRoles.role, role)
      ))
      .limit(1);

    return result.length > 0;
  }

  /**
   * Проверить, есть ли у пользователя любая из указанных ролей
   */
  static async hasAnyRole(userId: string, roles: Role[]): Promise<boolean> {
    if (roles.length === 0) return false;

    const result = await db
      .select({ role: userRoles.role })
      .from(userRoles)
      .where(and(
        eq(userRoles.userId, userId),
        inArray(userRoles.role, roles)
      ))
      .limit(1);

    return result.length > 0;
  }

  /**
   * Получить количество пользователей с ролью SUPERADMIN
   */
  static async getSuperAdminCount(): Promise<number> {
    const result = await db
      .select({ count: sql<number>`count(*)` })
      .from(userRoles)
      .where(eq(userRoles.role, 'SUPERADMIN'));

    return result[0]?.count || 0;
  }

  /**
   * Проверить, является ли пользователь единственным SUPERADMIN
   */
  static async isOnlySuperAdmin(userId: string): Promise<boolean> {
    const totalSuperAdmins = await this.getSuperAdminCount();
    if (totalSuperAdmins <= 1) {
      return await this.hasRole(userId, 'SUPERADMIN');
    }
    return false;
  }
}
