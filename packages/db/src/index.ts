import { config } from 'dotenv';
import { resolve } from 'path';

// Загружаем .env из корня проекта
config({ path: resolve(__dirname, '../../.env') });
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

// Экспорт всех схем и типов
export * from './schema';

// Создание подключения к базе данных
const connectionString = process.env.DATABASE_URL!;
const client = postgres(connectionString);

// Создание Drizzle клиента
export const db = drizzle(client, { schema });

// Экспорт клиента как синглтон для обратной совместимости
declare global {
  var __drizzle: typeof db | undefined;
}

export const drizzleDb = globalThis.__drizzle || db;

if (process.env.NODE_ENV !== 'production') {
  globalThis.__drizzle = drizzleDb;
}

// Алиас для удобства миграции с Prisma
export const prisma = drizzleDb;

export { and, or, eq, ilike, asc, desc, sql, inArray, count } from 'drizzle-orm';

// Export repositories
export { UsersRepo } from './repositories/usersRepo';
export { RolesRepo } from './repositories/rolesRepo';
export { GroupsRepo, type GroupWithDetails, type GroupWithNotifications, type GroupMember, type GroupApplicationWithPlayer } from './repositories/groupsRepo';
export { ProfilesRepo } from './repositories/profilesRepo';
export { CharactersRepo } from './repositories/charactersRepo';
export { monstersRepo } from './repositories/monstersRepo';
export { storyTextsRepo } from './repositories/storyTextsRepo';
export { reportNextPlansRepo } from './repositories/reportNextPlansRepo';

