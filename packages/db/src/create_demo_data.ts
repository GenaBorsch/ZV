import { config } from 'dotenv';
import { resolve } from 'path';

// Загружаем .env из корня проекта
config({ path: resolve(__dirname, '../../../.env') });

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

// Создаем подключение напрямую с правильным URL
const connectionString = process.env.DATABASE_URL!;
console.log('🔗 Используем DATABASE_URL:', connectionString);

const client = postgres(connectionString);
const db = drizzle(client, { schema });

const { 
  users, userRoles, seasons, masterProfiles, playerProfiles, 
  groups, groupMembers, characters, products, battlepasses
} = schema;

async function main() {
  console.log('🚀 Создаю полный набор тестовых данных...');

  try {
    // 1. Создаем активный сезон
    await createActiveSeason();
    
    // 2. Создаем всех тестовых пользователей
    await createTestUsers();
    
    // 3. Создаем дополнительных пользователей для разнообразия
    await createAdditionalUsers();
    
    // 4. Создаем тестовые группы
    await createTestGroups();
    
    // 5. Создаем персонажей
    await createTestCharacters();
    
    // 6. Создаем баттлпассы/продукты
    await createTestProducts();
    
    console.log('✅ Все тестовые данные успешно созданы!');
    
  } catch (error) {
    console.error('❌ Ошибка при создании тестовых данных:', error);
    throw error;
  } finally {
    await client.end();
  }
}

async function createActiveSeason() {
  console.log('📅 Создаю активный сезон...');
  
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

async function createTestUsers() {
  console.log('👥 Создаю основных тестовых пользователей...');
  
  const testUsers = [
    {
      email: 'demoadmin@zvezdnoe-vereteno.ru',
      name: 'Демо Администратор',
      role: 'SUPERADMIN' as const,
      rpgExperience: 'VETERAN' as const,
      contacts: 'Telegram: @demo_admin, Email: admin@example.com'
    },
    {
      email: 'demomoderator@zvezdnoe-vereteno.ru',
      name: 'Демо Модератор',
      role: 'MODERATOR' as const,
      rpgExperience: 'VETERAN' as const,
      contacts: 'Telegram: @demo_moderator, Discord: moderator#1234'
    },
    {
      email: 'demomaster@zvezdnoe-vereteno.ru',
      name: 'Демо Мастер',
      role: 'MASTER' as const,
      rpgExperience: 'VETERAN' as const,
      contacts: 'Telegram: @demo_master, VK: vk.com/demo_master'
    },
    {
      email: 'demoplayer@zvezdnoe-vereteno.ru',
      name: 'Демо Игрок',
      role: 'PLAYER' as const,
      rpgExperience: 'INTERMEDIATE' as const,
      contacts: 'Discord: demo_player#1234, Telegram: @demo_player'
    }
  ];

  const password = 'demo1234';
  const passwordHash = bcrypt.hashSync(password, 10);

  for (const testUser of testUsers) {
    // Проверяем существование пользователя
    const existing = await db
      .select()
      .from(users)
      .where(eq(users.email, testUser.email))
      .limit(1);

    let user = existing[0];
    
    if (user) {
      // Обновляем существующего пользователя
      const updated = await db
        .update(users)
        .set({
          passwordHash,
          name: testUser.name,
          rpgExperience: testUser.rpgExperience,
          contacts: testUser.contacts,
          updatedAt: new Date(),
        })
        .where(eq(users.id, user.id))
        .returning();
      
      user = updated[0];
      console.log('✅ Обновлен пользователь:', testUser.email);
    } else {
      // Создаем нового пользователя
      const created = await db
        .insert(users)
        .values({
          email: testUser.email,
          name: testUser.name,
          passwordHash,
          rpgExperience: testUser.rpgExperience,
          contacts: testUser.contacts,
        })
        .returning();
      
      user = created[0];
      console.log('✅ Создан пользователь:', testUser.email);
    }

    // Проверяем и создаем роль
    const existingRole = await db
      .select()
      .from(userRoles)
      .where(eq(userRoles.userId, user.id))
      .limit(1);

    if (existingRole.length === 0) {
      await db.insert(userRoles).values({
        userId: user.id,
        role: testUser.role,
      });
      console.log('✅ Назначена роль:', testUser.role);
    }

    // Создаем профили для мастеров и игроков
    if (testUser.role === 'MASTER') {
      await createMasterProfile(user.id, testUser.email);
    } else if (testUser.role === 'PLAYER') {
      await createPlayerProfile(user.id, testUser.email);
    }
  }
}

async function createMasterProfile(userId: string, email: string) {
  const existingProfile = await db
    .select()
    .from(masterProfiles)
    .where(eq(masterProfiles.userId, userId))
    .limit(1);

  if (existingProfile.length === 0) {
    await db.insert(masterProfiles).values({
      userId,
      bio: 'Опытный мастер с 10+ летним стажем. Специализируюсь на эпическом фэнтези и космоопере. Люблю глубокие сюжеты и проработанных персонажей.',
      format: 'MIXED',
      location: 'Москва/Онлайн',
    });
    console.log('✅ Создан профиль мастера для', email);
  }
}

async function createPlayerProfile(userId: string, email: string) {
  const existingProfile = await db
    .select()
    .from(playerProfiles)
    .where(eq(playerProfiles.userId, userId))
    .limit(1);

  if (existingProfile.length === 0) {
    await db.insert(playerProfiles).values({
      userId,
      nickname: null,
      notes: 'Люблю играть за воинов и паладинов. Предпочитаю ролевые взаимодействия и эпические битвы. Всегда готов помочь команде!',
    });
    console.log('✅ Создан профиль игрока для', email);
  }
}

async function createAdditionalUsers() {
  console.log('👥 Создаю дополнительных пользователей...');
  
  const additionalUsers = [
    {
      email: 'testmaster1@zvezdnoe-vereteno.ru',
      name: 'Алексей Мастерский',
      role: 'MASTER' as const,
      rpgExperience: 'VETERAN' as const,
      contacts: 'Discord: AlexMaster#5678',
      masterBio: 'Специализируюсь на хоррор-кампаниях и психологических триллерах. 8 лет опыта.',
      masterLocation: 'Санкт-Петербург'
    },
    {
      email: 'testmaster2@zvezdnoe-vereteno.ru',
      name: 'Мария Сказительница',
      role: 'MASTER' as const,
      rpgExperience: 'INTERMEDIATE' as const,
      contacts: 'Telegram: @maria_storyteller',
      masterBio: 'Молодой мастер, увлекаюсь городским фэнтези и современными сеттингами.',
      masterLocation: 'Онлайн'
    },
    {
      email: 'testplayer1@zvezdnoe-vereteno.ru',
      name: 'Дмитрий Воин',
      role: 'PLAYER' as const,
      rpgExperience: 'VETERAN' as const,
      contacts: 'Steam: WarriorDmitry',
      playerNickname: 'Стальной Клинок',
      playerNotes: 'Предпочитаю играть танков и защитников. Люблю тактические бои.'
    },
    {
      email: 'testplayer2@zvezdnoe-vereteno.ru',
      name: 'Анна Магичка',
      role: 'PLAYER' as const,
      rpgExperience: 'INTERMEDIATE' as const,
      contacts: 'Discord: MagicAnna#9999',
      playerNickname: 'Лунная Волшебница',
      playerNotes: 'Играю за магов и целителей. Люблю загадки и исследования.'
    },
    {
      email: 'testplayer3@zvezdnoe-vereteno.ru',
      name: 'Сергей Хитрец',
      role: 'PLAYER' as const,
      rpgExperience: 'NOVICE' as const,
      contacts: 'Telegram: @sergey_rogue',
      playerNickname: 'Тихий Шаг',
      playerNotes: 'Новичок в НРИ. Хочу попробовать играть за воров и разведчиков.'
    }
  ];

  const password = 'demo1234';
  const passwordHash = bcrypt.hashSync(password, 10);

  for (const testUser of additionalUsers) {
    // Создаем пользователя
    const existing = await db
      .select()
      .from(users)
      .where(eq(users.email, testUser.email))
      .limit(1);

    if (existing.length === 0) {
      const [user] = await db
        .insert(users)
        .values({
          email: testUser.email,
          name: testUser.name,
          passwordHash,
          rpgExperience: testUser.rpgExperience,
          contacts: testUser.contacts,
        })
        .returning();

      // Создаем роль
      await db.insert(userRoles).values({
        userId: user.id,
        role: testUser.role,
      });

      // Создаем профили
      if (testUser.role === 'MASTER') {
        await db.insert(masterProfiles).values({
          userId: user.id,
          bio: testUser.masterBio,
          format: 'MIXED',
          location: testUser.masterLocation,
        });
      } else if (testUser.role === 'PLAYER') {
        await db.insert(playerProfiles).values({
          userId: user.id,
          nickname: testUser.playerNickname,
          notes: testUser.playerNotes,
        });
      }

      console.log('✅ Создан дополнительный пользователь:', testUser.email);
    }
  }
}

async function createTestGroups() {
  console.log('🎭 Создаю тестовые группы...');
  
  // Получаем активный сезон
  const activeSeason = await db
    .select()
    .from(seasons)
    .where(eq(seasons.isActive, true))
    .limit(1);

  if (activeSeason.length === 0) {
    console.log('⚠️ Активный сезон не найден, пропускаю создание групп');
    return;
  }

  // Получаем мастеров
  const mastersData = await db
    .select({
      userId: users.id,
      email: users.email,
      name: users.name,
      masterProfileId: masterProfiles.id
    })
    .from(users)
    .innerJoin(userRoles, eq(users.id, userRoles.userId))
    .innerJoin(masterProfiles, eq(users.id, masterProfiles.userId))
    .where(eq(userRoles.role, 'MASTER'));

  if (mastersData.length === 0) {
    console.log('⚠️ Мастеры не найдены, пропускаю создание групп');
    return;
  }

  const testGroups = [
    {
      name: 'Легенды Средиземья',
      description: 'Эпическая кампания по миру Толкина. Путешествуем от Хоббитании до Мордора, встречаем знакомых персонажей и создаем собственные легенды.',
      format: 'MIXED' as const,
      location: 'Москва/Онлайн',
      maxPlayers: 6,
      currentPlayers: 4,
      masterId: mastersData[0]?.masterProfileId
    },
    {
      name: 'Киберпанк 2077: Найт-Сити',
      description: 'Погружение в мир киберпанка. Корпоративные интриги, уличные банды и высокие технологии в антиутопическом будущем.',
      format: 'ONLINE' as const,
      location: 'Онлайн',
      maxPlayers: 4,
      currentPlayers: 2,
      masterId: mastersData[1]?.masterProfileId || mastersData[0]?.masterProfileId
    },
    {
      name: 'Ужасы Аркхэма',
      description: 'Мистический хоррор в духе Лавкрафта. Исследуем древние тайны, боремся с космическими ужасами и пытаемся сохранить рассудок.',
      format: 'OFFLINE' as const,
      location: 'Санкт-Петербург',
      maxPlayers: 5,
      currentPlayers: 3,
      masterId: mastersData[0]?.masterProfileId
    }
  ];

  for (const groupData of testGroups) {
    if (!groupData.masterId) continue;
    
    const existing = await db
      .select()
      .from(groups)
      .where(eq(groups.name, groupData.name))
      .limit(1);

    if (existing.length === 0) {
      const [group] = await db
        .insert(groups)
        .values({
          name: groupData.name,
          description: groupData.description,
          format: groupData.format,
          place: groupData.location,
          maxMembers: groupData.maxPlayers,
          masterId: groupData.masterId,
          seasonId: activeSeason[0].id,
          isRecruiting: true,
        })
        .returning();

      console.log('✅ Создана группа:', groupData.name);

      // Добавляем игроков в группы
      await addPlayersToGroup(group.id, Math.min(groupData.currentPlayers, 3));
    }
  }
}

async function addPlayersToGroup(groupId: string, playerCount: number) {
  // Получаем игроков
  const playersData = await db
    .select({
      userId: users.id,
      playerProfileId: playerProfiles.id
    })
    .from(users)
    .innerJoin(userRoles, eq(users.id, userRoles.userId))
    .innerJoin(playerProfiles, eq(users.id, playerProfiles.userId))
    .where(eq(userRoles.role, 'PLAYER'))
    .limit(playerCount);

  for (const player of playersData) {
    const existing = await db
      .select()
      .from(groupMembers)
      .where(eq(groupMembers.playerId, player.playerProfileId))
      .limit(1);

    if (existing.length === 0) {
      await db.insert(groupMembers).values({
        groupId,
        playerId: player.playerProfileId,
        status: 'ACTIVE',
      });
    }
  }
}

async function createTestCharacters() {
  console.log('⚔️ Создаю тестовых персонажей...');
  
  // Получаем игроков
  const playersData = await db
    .select({
      userId: users.id,
      name: users.name,
      playerProfileId: playerProfiles.id
    })
    .from(users)
    .innerJoin(userRoles, eq(users.id, userRoles.userId))
    .innerJoin(playerProfiles, eq(users.id, playerProfiles.userId))
    .where(eq(userRoles.role, 'PLAYER'));

  const testCharacters = [
    {
      name: 'Арагорн Следопыт',
      archetype: 'Следопыт',
      level: 15,
      backstory: 'Наследник престола Гондора, скрывающийся под именем Бродяжника. Долгие годы защищал границы от тьмы, ожидая своего часа.',
      journal: 'День 1: Встретил хоббитов в Пригожине. Странная компания...\nДень 15: Битва при Хельмовой Пади. Мы победили, но какой ценой.\nДень 30: Коронация. Наконец-то принял свою судьбу.',
      notes: 'Владеет мечом Андурил. Имеет особую связь с эльфами.',
      avatarUrl: 'https://images.unsplash.com/photo-1566492031773-4f4e44671d66?w=150&h=150&fit=crop&crop=face'
    },
    {
      name: 'Лиралей Лунная Певица',
      archetype: 'Бард',
      level: 12,
      backstory: 'Эльфийская менестрель, путешествующая по миру в поисках древних мелодий и забытых историй.',
      journal: 'Сегодня выучила новую песню о драконах...\nВстретила интересную компанию авантюристов.\nМоя лютня начинает светиться при полной луне.',
      notes: 'Магическая лютня, унаследованная от бабушки. Знает древние эльфийские заклинания.',
      avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop&crop=face'
    },
    {
      name: 'Торин Железная Борода',
      archetype: 'Воин',
      level: 18,
      backstory: 'Дварфийский берсеркер из клана Железной Горы. Поклялся отомстить за разрушение родного дома.',
      journal: 'Орки снова напали на караван...\nНашел следы своего заклятого врага.\nТопор дедушки жаждет крови врагов.',
      notes: 'Легендарный топор "Гроза Орков". Неукротимая ярость в бою.',
      avatarUrl: null
    },
    {
      name: 'Зара Кибер-ниндзя',
      archetype: 'Хакер',
      level: 10,
      backstory: 'Уличная хакерша из трущоб Найт-Сити. Специализируется на корпоративном шпионаже и кибервойне.',
      journal: 'Взломала базу данных Арасаки...\nНовые импланты работают отлично.\nКто-то следит за мной в сети.',
      notes: 'Военные кибер-импланты. Связи в преступном мире.',
      avatarUrl: 'https://images.unsplash.com/photo-1494790108755-2616c9d8c1a0?w=150&h=150&fit=crop&crop=face'
    },
    {
      name: 'Профессор Аркрайт',
      archetype: 'Исследователь',
      level: 8,
      backstory: 'Археолог и оккультист из Мискатоникского университета. Изучает древние артефакты и запретные знания.',
      journal: 'Нашел странный артефакт в библиотеке...\nСны становятся все более яркими.\nЧто-то наблюдает за мной из теней.',
      notes: 'Обширные знания оккультизма. Доступ к университетской библиотеке.',
      avatarUrl: null
    }
  ];

  for (let i = 0; i < testCharacters.length && i < playersData.length; i++) {
    const character = testCharacters[i];
    const player = playersData[i];

    const existing = await db
      .select()
      .from(characters)
      .where(eq(characters.name, character.name))
      .limit(1);

    if (existing.length === 0) {
      await db.insert(characters).values({
        playerId: player.playerProfileId,
        name: character.name,
        archetype: character.archetype,
        level: character.level,
        backstory: character.backstory,
        journal: character.journal,
        notes: character.notes,
        avatarUrl: character.avatarUrl,
        isAlive: true,
      });

      console.log('✅ Создан персонаж:', character.name, 'для игрока', player.name);
    }
  }
}

async function createTestProducts() {
  console.log('💰 Создаю тестовые продукты и баттлпассы...');
  
  const testProducts = [
    {
      sku: 'BP_SEASON_2025',
      title: 'Сезонный Баттлпасс 2025',
      description: 'Полный доступ ко всем активностям сезона 2025. Включает эксклюзивные награды, дополнительные слоты персонажей и приоритетную поддержку.',
      priceRub: 15,
      type: 'BATTLEPASS' as const,
      active: true,
      visible: true,
      seasonRequired: true,
      bpUsesTotal: 1,
      meta: {
        duration_months: 12,
        character_slots: 5,
        exclusive_content: true
      }
    },
    {
      sku: 'BP_QUARTER_2025',
      title: 'Квартальный Баттлпасс',
      description: 'Доступ к активностям на 3 месяца. Отличный выбор для новых игроков.',
      priceRub: 5,
      type: 'BATTLEPASS' as const,
      active: true,
      visible: true,
      seasonRequired: false,
      bpUsesTotal: 1,
      meta: {
        duration_months: 3,
        character_slots: 2,
        exclusive_content: false
      }
    },
    {
      sku: 'ADDON_MASTER_KIT',
      title: 'Набор мастера',
      description: 'Дополнительные инструменты для мастеров: расширенные отчеты, дополнительные слоты групп, эксклюзивные материалы.',
      priceRub: 10,
      type: 'ADDON' as const,
      active: true,
      visible: true,
      seasonRequired: false,
      bpUsesTotal: 1,
      meta: {
        group_slots: 5,
        advanced_reports: true,
        master_materials: true
      }
    },
    {
      sku: 'MERCH_TSHIRT_001',
      title: 'Футболка "Звёздное Веретено"',
      description: 'Официальная футболка с логотипом проекта. 100% хлопок, высокое качество печати.',
      priceRub: 1500,
      type: 'MERCH' as const,
      active: true,
      visible: true,
      seasonRequired: false,
      bpUsesTotal: 1,
      meta: {
        sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
        colors: ['black', 'white', 'navy'],
        material: '100% cotton'
      }
    }
  ];

  for (const product of testProducts) {
    const existing = await db
      .select()
      .from(products)
      .where(eq(products.sku, product.sku))
      .limit(1);

    if (existing.length === 0) {
      await db.insert(products).values({
        sku: product.sku,
        title: product.title,
        description: product.description,
        priceRub: product.priceRub,
        type: product.type,
        active: product.active,
        visible: product.visible,
        seasonRequired: product.seasonRequired,
        bpUsesTotal: product.bpUsesTotal,
        meta: product.meta,
      });

      console.log('✅ Создан продукт:', product.title);
    }
  }

  // Создаем несколько покупок баттлпассов для демо-игроков
  await createTestPurchases();
}

async function createTestPurchases() {
  console.log('🛒 Создаю тестовые покупки...');
  
  // Получаем игроков и баттлпассы
  const playersData = await db
    .select({
      userId: users.id,
      name: users.name
    })
    .from(users)
    .innerJoin(userRoles, eq(users.id, userRoles.userId))
    .where(eq(userRoles.role, 'PLAYER'))
    .limit(2);

  const battlepassProducts = await db
    .select()
    .from(products)
    .where(eq(products.type, 'BATTLEPASS'))
    .limit(2);

  if (playersData.length > 0 && battlepassProducts.length > 0) {
    // Демо-игрок покупает сезонный баттлпасс
    const seasonalBattlepass = battlepassProducts.find(p => p.title.includes('Сезонный'));
    if (seasonalBattlepass) {
      const existing = await db
        .select()
        .from(battlepasses)
        .where(eq(battlepasses.userId, playersData[0].userId))
        .limit(1);

      if (existing.length === 0) {
        const expiresAt = new Date();
        expiresAt.setFullYear(expiresAt.getFullYear() + 1); // на год

        // Получаем активный сезон для баттлпасса
        const activeSeason = await db
          .select()
          .from(seasons)
          .where(eq(seasons.isActive, true))
          .limit(1);

        if (activeSeason.length > 0) {
          await db.insert(battlepasses).values({
            userId: playersData[0].userId,
            kind: 'SEASON',
            usesTotal: seasonalBattlepass.bpUsesTotal || 1,
            usesLeft: seasonalBattlepass.bpUsesTotal || 1,
            status: 'ACTIVE',
          });
        }

        console.log('✅ Создана покупка баттлпасса для', playersData[0].name);
      }
    }
  }
}

main()
  .catch((e) => {
    console.error('❌ Ошибка при создании тестовых данных:', e);
    process.exit(1);
  })
  .finally(async () => {
    console.log('🔌 Закрываю соединение с базой данных');
    process.exit(0);
  });
