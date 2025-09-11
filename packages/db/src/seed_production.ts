import { config } from 'dotenv';
import { resolve } from 'path';

// Загружаем .env из корня проекта (если есть)
config({ path: resolve(__dirname, '../../../.env') });

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

// Создаем подключение напрямую с DATABASE_URL из переменных окружения
const connectionString = process.env.DATABASE_URL!;
console.log('🔗 Используем DATABASE_URL для продакшна');

if (!connectionString) {
  console.error('❌ DATABASE_URL не установлен!');
  process.exit(1);
}

const client = postgres(connectionString);
const db = drizzle(client, { schema });

const { 
  users, userRoles, seasons, masterProfiles, playerProfiles
} = schema;

async function main() {
  console.log('🌱 Создание базовых данных для продакшна...');

  try {
    // 1. Создаем активный сезон
    await createActiveSeason();
    
    // 2. Создаем только основные тестовые аккаунты (без лишних данных)
    if (process.env.CREATE_DEMO_ACCOUNTS === 'true') {
      console.log('🧪 CREATE_DEMO_ACCOUNTS=true - создаю тестовые аккаунты');
      await createDemoAccounts();
    } else {
      console.log('ℹ️ CREATE_DEMO_ACCOUNTS не установлен - пропускаю создание тестовых аккаунтов');
      console.log('💡 Для создания тестовых аккаунтов установите CREATE_DEMO_ACCOUNTS=true');
    }
    
    console.log('✅ Инициализация продакшна завершена успешно!');
    
  } catch (error) {
    console.error('❌ Ошибка при инициализации продакшна:', error);
    throw error;
  } finally {
    await client.end();
  }
}

async function createActiveSeason() {
  console.log('📅 Проверка активного сезона...');
  
  const existingActiveSeason = await db
    .select()
    .from(seasons)
    .where(eq(seasons.isActive, true))
    .limit(1);

  if (existingActiveSeason.length === 0) {
    const currentDate = new Date();
    const startDate = new Date(currentDate.getFullYear(), 0, 1);
    const endDate = new Date(currentDate.getFullYear(), 11, 31);

    const [newSeason] = await db
      .insert(seasons)
      .values({
        title: `Сезон ${currentDate.getFullYear()}`,
        code: `SEASON_${currentDate.getFullYear()}`,
        startsAt: startDate,
        endsAt: endDate,
        isActive: true,
      })
      .returning();

    console.log('✅ Создан активный сезон:', newSeason.title);
  } else {
    console.log('✅ Активный сезон уже существует:', existingActiveSeason[0].title);
  }
}

async function createDemoAccounts() {
  console.log('👥 Создание тестовых аккаунтов для демонстрации...');
  
  const demoAccounts = [
    {
      email: 'demoadmin@zvezdnoe-vereteno.ru',
      name: 'Демо Администратор',
      role: 'SUPERADMIN' as const,
      rpgExperience: 'VETERAN' as const,
      contacts: 'Telegram: @demo_admin'
    },
    {
      email: 'demomoderator@zvezdnoe-vereteno.ru',
      name: 'Демо Модератор',
      role: 'MODERATOR' as const,
      rpgExperience: 'VETERAN' as const,
      contacts: 'Telegram: @demo_moderator'
    },
    {
      email: 'demomaster@zvezdnoe-vereteno.ru',
      name: 'Демо Мастер',
      role: 'MASTER' as const,
      rpgExperience: 'VETERAN' as const,
      contacts: 'Telegram: @demo_master'
    },
    {
      email: 'demoplayer@zvezdnoe-vereteno.ru',
      name: 'Демо Игрок',
      role: 'PLAYER' as const,
      rpgExperience: 'INTERMEDIATE' as const,
      contacts: 'Discord: demo_player#1234'
    }
  ];

  const password = 'demo1234';
  const passwordHash = bcrypt.hashSync(password, 10);

  for (const account of demoAccounts) {
    // Проверяем существование пользователя
    const existing = await db
      .select()
      .from(users)
      .where(eq(users.email, account.email))
      .limit(1);

    let user = existing[0];
    
    if (user) {
      console.log('✅ Тестовый аккаунт уже существует:', account.email);
    } else {
      // Создаем нового пользователя
      const created = await db
        .insert(users)
        .values({
          email: account.email,
          name: account.name,
          passwordHash,
          rpgExperience: account.rpgExperience,
          contacts: account.contacts,
        })
        .returning();
      
      user = created[0];
      console.log('✅ Создан тестовый аккаунт:', account.email);

      // Создаем роль
      await db.insert(userRoles).values({
        userId: user.id,
        role: account.role,
      });

      // Создаем профили для мастеров и игроков
      if (account.role === 'MASTER') {
        await db.insert(masterProfiles).values({
          userId: user.id,
          bio: 'Демонстрационный профиль мастера для тестирования системы.',
          format: 'MIXED',
          location: 'Онлайн',
        });
      } else if (account.role === 'PLAYER') {
        await db.insert(playerProfiles).values({
          userId: user.id,
          nickname: 'Тестовый игрок',
          notes: 'Демонстрационный профиль игрока для тестирования системы.',
        });
      }
    }
  }

  console.log('');
  console.log('🧪 Тестовые аккаунты готовы к использованию:');
  console.log('   👑 Администратор: demoadmin@zvezdnoe-vereteno.ru / demo1234');
  console.log('   🛡️ Модератор: demomoderator@zvezdnoe-vereteno.ru / demo1234');
  console.log('   🎯 Мастер: demomaster@zvezdnoe-vereteno.ru / demo1234');
  console.log('   🎮 Игрок: demoplayer@zvezdnoe-vereteno.ru / demo1234');
  console.log('');
  console.log('⚠️ ВАЖНО: Удалите эти аккаунты в продакшне после тестирования!');
}

main()
  .catch((e) => {
    console.error('❌ Ошибка при инициализации:', e);
    process.exit(1);
  })
  .finally(async () => {
    console.log('🔌 Завершение инициализации');
    process.exit(0);
  });
