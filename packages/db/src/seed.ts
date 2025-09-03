import { db, seasons, users, masterProfiles, playerProfiles, eq } from './index';

async function main() {
  console.log('🌱 Начинаю заполнение базы данных...');

  // Проверяем, есть ли уже активный сезон
  const existingActiveSeason = await db
    .select()
    .from(seasons)
    .where(eq(seasons.isActive, true))
    .limit(1);

  if (existingActiveSeason.length === 0) {
    // Создаем активный сезон
    const currentDate = new Date();
    const startDate = new Date(currentDate.getFullYear(), 0, 1); // 1 января текущего года
    const endDate = new Date(currentDate.getFullYear(), 11, 31); // 31 декабря текущего года

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
    console.log('📅 Период:', startDate.toLocaleDateString('ru'), '-', endDate.toLocaleDateString('ru'));
  } else {
    console.log('✅ Активный сезон уже существует:', existingActiveSeason[0].title);
  }

  // Создаем профили для демо-пользователей
  await createDemoProfiles();
}

async function createDemoProfiles() {
  console.log('👥 Создаю профили для демо-пользователей...');

  // Найти демо-мастера
  const demoMaster = await db
    .select()
    .from(users)
    .where(eq(users.email, 'demomaster@zvezdnoe-vereteno.ru'))
    .limit(1);

  if (demoMaster[0]) {
    // Проверить, есть ли уже профиль мастера
    const existingMasterProfile = await db
      .select()
      .from(masterProfiles)
      .where(eq(masterProfiles.userId, demoMaster[0].id))
      .limit(1);

    if (existingMasterProfile.length === 0) {
      await db.insert(masterProfiles).values({
        userId: demoMaster[0].id,
        bio: 'Демо-мастер для тестирования системы',
        format: 'MIXED',
        location: 'Онлайн/Офлайн',
      });
      console.log('✅ Создан профиль мастера для demomaster@zvezdnoe-vereteno.ru');
    } else {
      console.log('✅ Профиль мастера уже существует для demomaster@zvezdnoe-vereteno.ru');
    }
  } else {
    console.log('⚠️  Демо-мастер не найден в базе данных');
  }

  // Найти демо-игрока
  const demoPlayer = await db
    .select()
    .from(users)
    .where(eq(users.email, 'demoplayer@zvezdnoe-vereteno.ru'))
    .limit(1);

  if (demoPlayer[0]) {
    // Проверить, есть ли уже профиль игрока
    const existingPlayerProfile = await db
      .select()
      .from(playerProfiles)
      .where(eq(playerProfiles.userId, demoPlayer[0].id))
      .limit(1);

    if (existingPlayerProfile.length === 0) {
      await db.insert(playerProfiles).values({
        userId: demoPlayer[0].id,
        nickname: 'Демо-игрок',
        notes: 'Тестовый аккаунт игрока',
      });
      console.log('✅ Создан профиль игрока для demoplayer@zvezdnoe-vereteno.ru');
    } else {
      console.log('✅ Профиль игрока уже существует для demoplayer@zvezdnoe-vereteno.ru');
    }
  } else {
    console.log('⚠️  Демо-игрок не найден в базе данных');
  }
}

main()
  .catch((e) => {
    console.error('❌ Ошибка при заполнении базы данных:', e);
    process.exit(1);
  })
  .finally(async () => {
    console.log('🔌 Закрываю соединение с базой данных');
    process.exit(0);
  });