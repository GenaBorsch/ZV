import { config } from 'dotenv';
import { resolve } from 'path';

// Загружаем .env из корня проекта (если есть)
config({ path: resolve(__dirname, '../../../.env') });

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';
import { eq, ilike, inArray } from 'drizzle-orm';

// Создаем подключение напрямую с DATABASE_URL из переменных окружения
const connectionString = process.env.DATABASE_URL!;
console.log('🔗 Подключение к продакшн базе для очистки тестовых данных');

if (!connectionString) {
  console.error('❌ DATABASE_URL не установлен!');
  process.exit(1);
}

// Проверяем, что мы не в локальной разработке
if (connectionString.includes('localhost') || connectionString.includes('127.0.0.1')) {
  console.log('🚫 Обнаружена локальная база данных. Для безопасности скрипт остановлен.');
  console.log('💡 Этот скрипт предназначен только для продакшн баз данных.');
  process.exit(0);
}

const client = postgres(connectionString);
const db = drizzle(client, { schema });

const { users, userRoles } = schema;

async function main() {
  console.log('🧹 Очистка тестовых аккаунтов в продакшне...');
  
  // Подтверждение от пользователя
  if (process.env.CONFIRM_CLEANUP !== 'yes') {
    console.log('');
    console.log('⚠️ ВНИМАНИЕ: Этот скрипт удалит все тестовые аккаунты!');
    console.log('');
    console.log('Для подтверждения запустите:');
    console.log('CONFIRM_CLEANUP=yes pnpm cleanup-production');
    console.log('');
    process.exit(0);
  }

  try {
    // Список тестовых email-адресов для удаления
    const testEmails = [
      'demoadmin@zvezdnoe-vereteno.ru',
      'demomoderator@zvezdnoe-vereteno.ru',
      'demomaster@zvezdnoe-vereteno.ru',
      'demoplayer@zvezdnoe-vereteno.ru'
    ];

    // Находим всех пользователей с тестовыми email
    const testUsers = await db
      .select({ id: users.id, email: users.email })
      .from(users)
      .where(ilike(users.email, 'demo%'));

    if (testUsers.length === 0) {
      console.log('✅ Тестовые аккаунты не найдены - база данных чистая');
      return;
    }

    console.log(`🔍 Найдено ${testUsers.length} тестовых аккаунтов:`);
    testUsers.forEach(user => console.log(`   - ${user.email}`));

    const userIds = testUsers.map(u => u.id);

    // Удаляем роли пользователей (каскадное удаление может не сработать)
    await db.delete(userRoles).where(inArray(userRoles.userId, userIds));
    console.log('✅ Удалены роли тестовых пользователей');

    // Удаляем самих пользователей (каскадно удалятся связанные данные)
    await db.delete(users).where(inArray(users.id, userIds));
    console.log('✅ Удалены тестовые аккаунты');

    console.log('');
    console.log('🎉 Очистка тестовых данных завершена успешно!');
    console.log('');
    
  } catch (error) {
    console.error('❌ Ошибка при очистке тестовых данных:', error);
    throw error;
  } finally {
    await client.end();
  }
}

main()
  .catch((e) => {
    console.error('❌ Ошибка:', e);
    process.exit(1);
  })
  .finally(async () => {
    console.log('🔌 Завершение очистки');
    process.exit(0);
  });
