import { db, users, userRoles, eq, and, or, ilike, asc, desc, sql, inArray } from '../index';
import type { Role } from '../schema';

export interface UsersListParams {
  page: number;
  pageSize: number;
  search?: string;
  roles?: Role[];
  sortBy: 'createdAt' | 'email' | 'name';
  sortDir: 'asc' | 'desc';
}

export interface UserWithRoles {
  id: string;
  name: string | null;
  email: string;
  tel: string | null;
  tgId: string | null;
  avatarUrl: string | null;
  roles: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface UsersListResult {
  items: UserWithRoles[];
  total: number;
}

export class UsersRepo {
  /**
   * Получить список пользователей с фильтрацией, поиском и пагинацией
   */
  static async list(params: UsersListParams): Promise<UsersListResult> {
    const { page, pageSize, search, roles: filterRoles, sortBy, sortDir } = params;
    const offset = (page - 1) * pageSize;

    // Построение условий поиска
    const searchConditions = [];
    if (search) {
      const searchTerm = `%${search}%`;
      searchConditions.push(
        or(
          ilike(users.name, searchTerm),
          ilike(users.email, searchTerm),
          ilike(users.tel, searchTerm),
          ilike(users.tgId, searchTerm)
        )
      );
    }

    // Подзапрос для фильтрации по ролям
    let roleFilterCondition;
    if (filterRoles && filterRoles.length > 0) {
      const usersWithRoles = db
        .select({ userId: userRoles.userId })
        .from(userRoles)
        .where(inArray(userRoles.role, filterRoles))
        .groupBy(userRoles.userId);
      
      roleFilterCondition = inArray(users.id, sql`(${usersWithRoles})`);
    }

    // Построение итогового условия WHERE
    const whereConditions = [
      ...searchConditions,
      ...(roleFilterCondition ? [roleFilterCondition] : [])
    ].filter(Boolean);

    const whereClause = whereConditions.length > 0 ? and(...whereConditions) : undefined;

    // Определение сортировки
    const sortColumn = sortBy === 'createdAt' ? users.createdAt 
                     : sortBy === 'email' ? users.email 
                     : users.name;
    const sortOrder = sortDir === 'asc' ? asc(sortColumn) : desc(sortColumn);

    // Получение общего количества записей
    const totalResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(users)
      .where(whereClause);
    
    const total = totalResult[0]?.count || 0;

    // Получение пользователей
    const usersList = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        tel: users.tel,
        tgId: users.tgId,
        avatarUrl: users.avatarUrl,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      })
      .from(users)
      .where(whereClause)
      .orderBy(sortOrder)
      .limit(pageSize)
      .offset(offset);

    // Получение ролей для каждого пользователя
    const userIds = usersList.map(u => u.id);
    const rolesData = userIds.length > 0 
      ? await db
          .select({
            userId: userRoles.userId,
            role: userRoles.role,
          })
          .from(userRoles)
          .where(inArray(userRoles.userId, userIds))
      : [];

    // Группировка ролей по пользователям
    const rolesMap = rolesData.reduce((acc, { userId, role }) => {
      if (!acc[userId]) acc[userId] = [];
      acc[userId].push(role);
      return acc;
    }, {} as Record<string, string[]>);

    // Формирование результата
    const items: UserWithRoles[] = usersList.map(user => ({
      ...user,
      roles: rolesMap[user.id] || [],
    }));

    return { items, total };
  }

  /**
   * Получить пользователя по ID
   */
  static async getById(id: string) {
    const userResult = await db
      .select()
      .from(users)
      .where(eq(users.id, id))
      .limit(1);

    return userResult[0] || null;
  }

  /**
   * Обновить пользователя
   */
  static async update(id: string, patch: Partial<{
    name: string | null;
    email: string;
    tel: string | null;
    tgId: string | null;
    avatarUrl: string | null;
  }>) {
    const updateData = {
      ...patch,
      updatedAt: new Date(),
    };

    const result = await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, id))
      .returning();

    return result[0] || null;
  }

  /**
   * Удалить пользователя (hard delete)
   * Бросает ошибку при FK-конфликтах
   */
  static async delete(id: string) {
    try {
      const result = await db
        .delete(users)
        .where(eq(users.id, id))
        .returning();

      return result[0] || null;
    } catch (error: any) {
      // Обработка FK-конфликтов
      if (error.code === '23503') { // foreign_key_violation
        throw new Error('Невозможно удалить пользователя: существуют связанные записи (заказы, баттлпассы, записи на игры)');
      }
      throw error;
    }
  }

  /**
   * Проверить существование пользователя
   */
  static async exists(id: string): Promise<boolean> {
    const result = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.id, id))
      .limit(1);

    return result.length > 0;
  }

  /**
   * Получить пользователей по email (для проверки уникальности)
   */
  static async findByEmail(email: string) {
    const result = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    return result[0] || null;
  }
}
