import {
  pgTable,
  text,
  varchar,
  timestamp,
  boolean,
  integer,
  uuid,
  unique,
  json,
  pgEnum,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { relations } from 'drizzle-orm';

// Энумы
export const roleEnum = pgEnum('role', ['PLAYER', 'MASTER', 'MODERATOR', 'SUPERADMIN']);
export const gameFormatEnum = pgEnum('game_format', ['ONLINE', 'OFFLINE', 'MIXED']);
export const memberStatusEnum = pgEnum('member_status', ['ACTIVE', 'PAUSED', 'LEFT']);
export const enrollmentStatusEnum = pgEnum('enrollment_status', ['PENDING', 'CONFIRMED', 'CANCELLED', 'WAITLIST']);
export const productTypeEnum = pgEnum('product_type', ['BATTLEPASS', 'MERCH', 'ADDON']);
export const orderStatusEnum = pgEnum('order_status', ['PENDING', 'PAID', 'CANCELLED', 'REFUNDED']);
export const paymentProviderEnum = pgEnum('payment_provider', ['YOOKASSA', 'MANUAL']);
export const battlepassKindEnum = pgEnum('battlepass_kind', ['SEASON', 'FOUR', 'SINGLE']);
export const battlepassStatusEnum = pgEnum('battlepass_status', ['ACTIVE', 'EXPIRED', 'USED_UP']);
export const rpgExperienceEnum = pgEnum('rpg_experience', ['NOVICE', 'INTERMEDIATE', 'VETERAN']);
export const applicationStatusEnum = pgEnum('application_status', ['PENDING', 'APPROVED', 'REJECTED', 'WITHDRAWN']);
export const reportStatusEnum = pgEnum('report_status', ['PENDING', 'APPROVED', 'REJECTED', 'CANCELLED']);
export const elementStatusEnum = pgEnum('element_status', ['AVAILABLE', 'LOCKED']);
export const storyTextTypeEnum = pgEnum('story_text_type', ['LOCATION', 'MAIN_EVENT', 'SIDE_EVENT']);

// Таблицы
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).unique().notNull(),
  tel: varchar('tel', { length: 50 }).unique(),
  tgId: varchar('tg_id', { length: 50 }).unique(),
  name: varchar('name', { length: 255 }),
  avatarUrl: text('avatar_url'),
  passwordHash: text('password_hash'),
  // Новые поля для профиля
  rpgExperience: rpgExperienceEnum('rpg_experience'),
  contacts: varchar('contacts', { length: 255 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const userRoles = pgTable('user_roles', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  role: roleEnum('role').notNull(),
}, (table) => {
  return {
    userRoleUnique: unique().on(table.userId, table.role),
  };
});

export const playerProfiles = pgTable('player_profiles', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').unique().notNull().references(() => users.id, { onDelete: 'cascade' }),
  nickname: varchar('nickname', { length: 255 }),
  notes: text('notes'),
});

export const masterProfiles = pgTable('master_profiles', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').unique().notNull().references(() => users.id, { onDelete: 'cascade' }),
  bio: text('bio'),
  format: gameFormatEnum('format').notNull(),
  location: varchar('location', { length: 255 }),
  clubId: uuid('club_id').references(() => clubs.id),
});

export const clubs = pgTable('clubs', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  address: text('address'),
  contacts: text('contacts'),
});

export const characters = pgTable('characters', {
  id: uuid('id').primaryKey().defaultRandom(),
  playerId: uuid('player_id').notNull().references(() => playerProfiles.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 255 }).notNull(),
  archetype: varchar('archetype', { length: 100 }),
  level: integer('level').default(1).notNull(),
  avatarUrl: varchar('avatar_url', { length: 512 }),
  backstory: text('backstory'),
  journal: text('journal'),
  isAlive: boolean('is_alive').default(true).notNull(),
  deathDate: varchar('death_date', { length: 10 }), // формат дд.мм.ггг
  notes: text('notes'),
  sheetUrl: text('sheet_url'),
  updatedBy: uuid('updated_by').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => {
  return {
    levelCheck: sql`CHECK (${table.level} >= 1)`,
  };
});

// Монстры (для системы планов мастеров)
export const monsters = pgTable('monsters', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: varchar('title', { length: 200 }).unique().notNull(),
  imageUrl: varchar('image_url', { length: 512 }),
  description: text('description').notNull(),
  lastKnownLocation: varchar('last_known_location', { length: 200 }),
  bountyAlive: integer('bounty_alive'),
  bountyDead: integer('bounty_dead'),
  // Блокировка
  status: elementStatusEnum('status').default('AVAILABLE').notNull(),
  lockedByReportId: uuid('locked_by_report_id').references(() => reports.id, { onDelete: 'set null' }),
  lockedByGroupId: uuid('locked_by_group_id').references(() => groups.id, { onDelete: 'set null' }),
  lockedAt: timestamp('locked_at'),
  // Мета
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => {
  return {
    statusActiveIdx: sql`CREATE INDEX IF NOT EXISTS monsters_status_active_idx ON ${table} (status) WHERE is_active = TRUE`,
  };
});

// Текстовые элементы (локации, события)
export const storyTexts = pgTable('story_texts', {
  id: uuid('id').primaryKey().defaultRandom(),
  type: storyTextTypeEnum('type').notNull(),
  title: varchar('title', { length: 50 }).notNull(),
  text: text('text').notNull(),
  // Блокировка
  status: elementStatusEnum('status').default('AVAILABLE').notNull(),
  lockedByReportId: uuid('locked_by_report_id').references(() => reports.id, { onDelete: 'set null' }),
  lockedByGroupId: uuid('locked_by_group_id').references(() => groups.id, { onDelete: 'set null' }),
  lockedAt: timestamp('locked_at'),
  // Мета
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => {
  return {
    typeTitleUnique: unique().on(table.type, table.title),
    typeStatusActiveIdx: sql`CREATE INDEX IF NOT EXISTS story_texts_type_status_active_idx ON ${table} (type, status) WHERE is_active = TRUE`,
  };
});

export const seasons = pgTable('seasons', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: varchar('title', { length: 255 }).notNull(),
  code: varchar('code', { length: 50 }).unique().notNull(),
  startsAt: timestamp('starts_at').notNull(),
  endsAt: timestamp('ends_at').notNull(),
  isActive: boolean('is_active').default(true).notNull(),
});

export const groups = pgTable('groups', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  seasonId: uuid('season_id').notNull().references(() => seasons.id, { onDelete: 'cascade' }),
  masterId: uuid('master_id').notNull().references(() => masterProfiles.id),
  clubId: uuid('club_id').references(() => clubs.id),
  description: text('description'),
  maxMembers: integer('max_members').default(4).notNull(),
  isRecruiting: boolean('is_recruiting').default(false).notNull(),
  referralCode: varchar('referral_code', { length: 36 }).unique(),
  format: gameFormatEnum('format').default('ONLINE').notNull(),
  place: varchar('place', { length: 200 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const groupMembers = pgTable('group_members', {
  id: uuid('id').primaryKey().defaultRandom(),
  groupId: uuid('group_id').notNull().references(() => groups.id, { onDelete: 'cascade' }),
  playerId: uuid('player_id').notNull().references(() => playerProfiles.id, { onDelete: 'cascade' }),
  characterId: uuid('character_id').references(() => characters.id, { onDelete: 'set null' }),
  status: memberStatusEnum('status').default('ACTIVE').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const groupApplications = pgTable('group_applications', {
  id: uuid('id').primaryKey().defaultRandom(),
  groupId: uuid('group_id').notNull().references(() => groups.id, { onDelete: 'cascade' }),
  playerId: uuid('player_id').notNull().references(() => playerProfiles.id, { onDelete: 'cascade' }),
  status: applicationStatusEnum('status').default('PENDING').notNull(),
  message: text('message'), // Сообщение от игрока к мастеру
  masterResponse: text('master_response'), // Ответ мастера
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => {
  return {
    // Один игрок может подать только одну активную заявку на группу
    playerGroupUnique: unique().on(table.groupId, table.playerId),
  };
});

export const sessions = pgTable('sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  groupId: uuid('group_id').notNull().references(() => groups.id, { onDelete: 'cascade' }),
  startsAt: timestamp('starts_at').notNull(),
  durationMin: integer('duration_min').notNull(),
  place: varchar('place', { length: 255 }),
  format: gameFormatEnum('format').notNull(),
  isOpen: boolean('is_open').default(false).notNull(),
  slotsTotal: integer('slots_total').notNull(),
  slotsFree: integer('slots_free').notNull(),
});

export const enrollments = pgTable('enrollments', {
  id: uuid('id').primaryKey().defaultRandom(),
  sessionId: uuid('session_id').notNull().references(() => sessions.id, { onDelete: 'cascade' }),
  playerId: uuid('player_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  status: enrollmentStatusEnum('status').default('PENDING').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const reports = pgTable('reports', {
  id: uuid('id').primaryKey().defaultRandom(),
  groupId: uuid('group_id').notNull().references(() => groups.id, { onDelete: 'cascade' }), // связь с группой
  sessionId: uuid('session_id').references(() => sessions.id, { onDelete: 'cascade' }), // optional для независимых отчётов
  masterId: uuid('master_id').notNull().references(() => users.id, { onDelete: 'cascade' }), // изменено на users для простоты
  summary: text('summary').notNull(), // старое поле, теперь алиас для description
  description: text('description').notNull(), // основное описание игры
  highlights: text('highlights'), // дополнительные моменты
  status: reportStatusEnum('status').default('PENDING').notNull(),
  rejectionReason: text('rejection_reason'),
  attachments: json('attachments'), // массив URL файлов для будущего
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => {
  return {
    groupStatusIdx: sql`CREATE INDEX IF NOT EXISTS reports_group_status_idx ON ${table} (group_id, status, created_at DESC)`,
  };
});

export const ruleDocs = pgTable('rule_docs', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: varchar('title', { length: 255 }).notNull(),
  slug: varchar('slug', { length: 255 }).unique().notNull(),
  content: text('content').notNull(),
  version: varchar('version', { length: 50 }),
  published: boolean('published').default(false).notNull(),
});

export const products = pgTable('products', {
  id: uuid('id').primaryKey().defaultRandom(),
  sku: varchar('sku', { length: 255 }).unique().notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  type: productTypeEnum('type').notNull(),
  priceRub: integer('price_rub').notNull(),
  description: text('description'),
  imageUrl: text('image_url'),
  bpUsesTotal: integer('bp_uses_total').default(1).notNull(),
  visible: boolean('visible').default(true).notNull(),
  sortIndex: integer('sort_index').default(0).notNull(),
  seasonRequired: boolean('season_required').default(false).notNull(),
  archivedAt: timestamp('archived_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  meta: json('meta'),
  active: boolean('active').default(true).notNull(),
});

export const orders = pgTable('orders', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  // если покупка оформляется мастером для игрока
  forUserId: uuid('for_user_id').references(() => users.id, { onDelete: 'cascade' }),
  status: orderStatusEnum('status').default('PENDING').notNull(),
  totalRub: integer('total_rub').notNull(),
  provider: paymentProviderEnum('provider').notNull(),
  providerId: varchar('provider_id', { length: 255 }),
  // отметка, что заказ уже был выполнен (выпущены battlepass'ы)
  fulfilledAt: timestamp('fulfilled_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => {
  return {
    providerIdUnique: unique().on(table.providerId),
  };
});

export const orderItems = pgTable('order_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  orderId: uuid('order_id').notNull().references(() => orders.id, { onDelete: 'cascade' }),
  productId: uuid('product_id').notNull().references(() => products.id),
  qty: integer('qty').default(1).notNull(),
  priceRub: integer('price_rub').notNull(),
  priceRubAtPurchase: integer('price_rub_at_purchase'),
  bpUsesTotalAtPurchase: integer('bp_uses_total_at_purchase'),
  productSkuSnapshot: varchar('product_sku_snapshot', { length: 255 }),
  productTitleSnapshot: varchar('product_title_snapshot', { length: 255 }),
});

export const battlepasses = pgTable('battlepasses', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  kind: battlepassKindEnum('kind').notNull(),
  title: varchar('title', { length: 255 }),
  usesTotal: integer('uses_total').notNull(),
  usesLeft: integer('uses_left').notNull(),
  status: battlepassStatusEnum('status').default('ACTIVE').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const writeoffs = pgTable('writeoffs', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  sessionId: uuid('session_id').references(() => sessions.id, { onDelete: 'cascade' }), // optional для отчётов без сессии
  reportId: uuid('report_id').references(() => reports.id, { onDelete: 'cascade' }),
  battlepassId: uuid('battlepass_id').notNull().references(() => battlepasses.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => {
  return {
    // убираем unique constraint для sessionId, так как теперь может быть null
    writeoffReportUnique: unique().on(table.userId, table.reportId), // уникальность по отчёту
  };
});

export const exclusiveMaterials = pgTable('exclusive_materials', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: varchar('title', { length: 255 }).notNull(),
  fileUrl: text('file_url').notNull(),
  fileName: varchar('file_name', { length: 255 }).notNull(),
  fileSize: integer('file_size'), // размер в байтах
  isVisible: boolean('is_visible').default(true).notNull(),
  sortOrder: integer('sort_order').default(0).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Связь отчётов с игроками
export const reportPlayers = pgTable('report_players', {
  id: uuid('id').primaryKey().defaultRandom(),
  reportId: uuid('report_id').notNull().references(() => reports.id, { onDelete: 'cascade' }),
  playerId: uuid('player_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => {
  return {
    reportPlayerUnique: unique().on(table.reportId, table.playerId),
  };
});

// План следующей игры (привязка к отчёту)
export const reportNextPlans = pgTable('report_next_plans', {
  id: uuid('id').primaryKey().defaultRandom(),
  reportId: uuid('report_id').unique().notNull().references(() => reports.id, { onDelete: 'cascade' }),
  // Продолжение прошлой сессии
  continuedFromReportId: uuid('continued_from_report_id').references(() => reports.id, { onDelete: 'set null' }),
  // Текстовый план
  nextPlanText: text('next_plan_text').notNull(),
  // Сетка событий (4 слота)
  monsterId: uuid('monster_id').notNull().references(() => monsters.id, { onDelete: 'restrict' }),
  locationTextId: uuid('location_text_id').notNull().references(() => storyTexts.id, { onDelete: 'restrict' }),
  mainEventTextId: uuid('main_event_text_id').notNull().references(() => storyTexts.id, { onDelete: 'restrict' }),
  sideEventTextId: uuid('side_event_text_id').notNull().references(() => storyTexts.id, { onDelete: 'restrict' }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => {
  return {
    // Проверка длины плана
    planLengthCheck: sql`CHECK (char_length(${table.nextPlanText}) <= 2000)`,
    // Проверка уникальности текстовых элементов (нельзя один текст в разные слоты)
    uniqueTextsCheck: sql`CHECK (
      ${table.locationTextId} != ${table.mainEventTextId} AND
      ${table.locationTextId} != ${table.sideEventTextId} AND
      ${table.mainEventTextId} != ${table.sideEventTextId}
    )`,
  };
});

// Система уведомлений
export const notifications = pgTable('notifications', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  title: varchar('title', { length: 255 }).notNull(),
  message: text('message').notNull(),
  type: varchar('type', { length: 50 }).default('INFO').notNull(), // INFO, SUCCESS, WARNING, ERROR
  relatedType: varchar('related_type', { length: 50 }), // REPORT, BATTLEPASS, etc.
  relatedId: uuid('related_id'), // ID связанного объекта
  isRead: boolean('is_read').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Связи (Relations)
export const usersRelations = relations(users, ({ many, one }) => ({
  roles: many(userRoles),
  playerProfile: one(playerProfiles),
  masterProfile: one(masterProfiles),
  enrollments: many(enrollments),
  orders: many(orders),
  battlepasses: many(battlepasses),
  masterReports: many(reports, { relationName: 'masterReports' }),
  reportParticipations: many(reportPlayers),
  notifications: many(notifications),
  writeoffs: many(writeoffs),
}));

export const userRolesRelations = relations(userRoles, ({ one }) => ({
  user: one(users, {
    fields: [userRoles.userId],
    references: [users.id],
  }),
}));

export const playerProfilesRelations = relations(playerProfiles, ({ one, many }) => ({
  user: one(users, {
    fields: [playerProfiles.userId],
    references: [users.id],
  }),
  characters: many(characters),
  groupMemberships: many(groupMembers),
  groupApplications: many(groupApplications),
}));

export const masterProfilesRelations = relations(masterProfiles, ({ one, many }) => ({
  user: one(users, {
    fields: [masterProfiles.userId],
    references: [users.id],
  }),
  club: one(clubs, {
    fields: [masterProfiles.clubId],
    references: [clubs.id],
  }),
  groups: many(groups),
  reports: many(reports),
}));

export const clubsRelations = relations(clubs, ({ many }) => ({
  masters: many(masterProfiles),
  groups: many(groups),
}));

export const charactersRelations = relations(characters, ({ one }) => ({
  player: one(playerProfiles, {
    fields: [characters.playerId],
    references: [playerProfiles.id],
  }),
  updatedBy: one(users, {
    fields: [characters.updatedBy],
    references: [users.id],
  }),
}));

export const seasonsRelations = relations(seasons, ({ many }) => ({
  groups: many(groups),
  battlepasses: many(battlepasses),
}));

export const groupsRelations = relations(groups, ({ one, many }) => ({
  season: one(seasons, {
    fields: [groups.seasonId],
    references: [seasons.id],
  }),
  master: one(masterProfiles, {
    fields: [groups.masterId],
    references: [masterProfiles.id],
  }),
  club: one(clubs, {
    fields: [groups.clubId],
    references: [clubs.id],
  }),
  members: many(groupMembers),
  applications: many(groupApplications),
  sessions: many(sessions),
  reports: many(reports),
}));

export const groupMembersRelations = relations(groupMembers, ({ one }) => ({
  group: one(groups, {
    fields: [groupMembers.groupId],
    references: [groups.id],
  }),
  player: one(playerProfiles, {
    fields: [groupMembers.playerId],
    references: [playerProfiles.id],
  }),
  character: one(characters, {
    fields: [groupMembers.characterId],
    references: [characters.id],
  }),
}));

export const groupApplicationsRelations = relations(groupApplications, ({ one }) => ({
  group: one(groups, {
    fields: [groupApplications.groupId],
    references: [groups.id],
  }),
  player: one(playerProfiles, {
    fields: [groupApplications.playerId],
    references: [playerProfiles.id],
  }),
}));

export const sessionsRelations = relations(sessions, ({ one, many }) => ({
  group: one(groups, {
    fields: [sessions.groupId],
    references: [groups.id],
  }),
  enrollments: many(enrollments),
  report: one(reports),
}));

export const enrollmentsRelations = relations(enrollments, ({ one }) => ({
  session: one(sessions, {
    fields: [enrollments.sessionId],
    references: [sessions.id],
  }),
  player: one(users, {
    fields: [enrollments.playerId],
    references: [users.id],
  }),
}));

export const reportsRelations = relations(reports, ({ one, many }) => ({
  group: one(groups, {
    fields: [reports.groupId],
    references: [groups.id],
  }),
  session: one(sessions, {
    fields: [reports.sessionId],
    references: [sessions.id],
  }),
  master: one(users, {
    fields: [reports.masterId],
    references: [users.id],
  }),
  players: many(reportPlayers),
  writeoffs: many(writeoffs),
  nextPlan: one(reportNextPlans, {
    fields: [reports.id],
    references: [reportNextPlans.reportId],
  }),
}));

export const reportPlayersRelations = relations(reportPlayers, ({ one }) => ({
  report: one(reports, {
    fields: [reportPlayers.reportId],
    references: [reports.id],
  }),
  player: one(users, {
    fields: [reportPlayers.playerId],
    references: [users.id],
  }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
}));

export const productsRelations = relations(products, ({ many }) => ({
  orderItems: many(orderItems),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  user: one(users, {
    fields: [orders.userId],
    references: [users.id],
  }),
  items: many(orderItems),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id],
  }),
  product: one(products, {
    fields: [orderItems.productId],
    references: [products.id],
  }),
}));

export const battlepassesRelations = relations(battlepasses, ({ one }) => ({
  user: one(users, {
    fields: [battlepasses.userId],
    references: [users.id],
  }),
}));

// Экспорт типов для использования в приложении
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type UserRole = typeof userRoles.$inferSelect;
export type NewUserRole = typeof userRoles.$inferInsert;
export type PlayerProfile = typeof playerProfiles.$inferSelect;
export type NewPlayerProfile = typeof playerProfiles.$inferInsert;
export type MasterProfile = typeof masterProfiles.$inferSelect;
export type NewMasterProfile = typeof masterProfiles.$inferInsert;
export type Club = typeof clubs.$inferSelect;
export type NewClub = typeof clubs.$inferInsert;
export type Character = typeof characters.$inferSelect;
export type NewCharacter = typeof characters.$inferInsert;
export type Season = typeof seasons.$inferSelect;
export type NewSeason = typeof seasons.$inferInsert;
export type Group = typeof groups.$inferSelect;
export type NewGroup = typeof groups.$inferInsert;
export type GroupMember = typeof groupMembers.$inferSelect;
export type NewGroupMember = typeof groupMembers.$inferInsert;
export type GroupApplication = typeof groupApplications.$inferSelect;
export type NewGroupApplication = typeof groupApplications.$inferInsert;
export type Session = typeof sessions.$inferSelect;
export type NewSession = typeof sessions.$inferInsert;
export type Enrollment = typeof enrollments.$inferSelect;
export type NewEnrollment = typeof enrollments.$inferInsert;
export type Report = typeof reports.$inferSelect;
export type NewReport = typeof reports.$inferInsert;
export type RuleDoc = typeof ruleDocs.$inferSelect;
export type NewRuleDoc = typeof ruleDocs.$inferInsert;
export type Product = typeof products.$inferSelect;
export type NewProduct = typeof products.$inferInsert;
export type Order = typeof orders.$inferSelect;
export type NewOrder = typeof orders.$inferInsert;
export type OrderItem = typeof orderItems.$inferSelect;
export type NewOrderItem = typeof orderItems.$inferInsert;
export type Battlepass = typeof battlepasses.$inferSelect;
export type NewBattlepass = typeof battlepasses.$inferInsert;
export type Writeoff = typeof writeoffs.$inferSelect;
export type NewWriteoff = typeof writeoffs.$inferInsert;

// Relations для новых таблиц (монстры и планы)
export const monstersRelations = relations(monsters, ({ many }) => ({
  nextPlans: many(reportNextPlans),
}));

export const storyTextsRelations = relations(storyTexts, ({ many }) => ({
  locationPlans: many(reportNextPlans),
  mainEventPlans: many(reportNextPlans),
  sideEventPlans: many(reportNextPlans),
}));

export const reportNextPlansRelations = relations(reportNextPlans, ({ one }) => ({
  report: one(reports, {
    fields: [reportNextPlans.reportId],
    references: [reports.id],
  }),
  continuedFromReport: one(reports, {
    fields: [reportNextPlans.continuedFromReportId],
    references: [reports.id],
  }),
  monster: one(monsters, {
    fields: [reportNextPlans.monsterId],
    references: [monsters.id],
  }),
  locationText: one(storyTexts, {
    fields: [reportNextPlans.locationTextId],
    references: [storyTexts.id],
  }),
  mainEventText: one(storyTexts, {
    fields: [reportNextPlans.mainEventTextId],
    references: [storyTexts.id],
  }),
  sideEventText: one(storyTexts, {
    fields: [reportNextPlans.sideEventTextId],
    references: [storyTexts.id],
  }),
}));

// Экспорт новых типов
export type ReportPlayer = typeof reportPlayers.$inferSelect;
export type NewReportPlayer = typeof reportPlayers.$inferInsert;
export type Notification = typeof notifications.$inferSelect;
export type NewNotification = typeof notifications.$inferInsert;
export type ExclusiveMaterial = typeof exclusiveMaterials.$inferSelect;
export type NewExclusiveMaterial = typeof exclusiveMaterials.$inferInsert;

// Типы энумов
export type Role = typeof roleEnum.enumValues[number];
export type GameFormat = typeof gameFormatEnum.enumValues[number];
export type MemberStatus = typeof memberStatusEnum.enumValues[number];
export type EnrollmentStatus = typeof enrollmentStatusEnum.enumValues[number];
export type ProductType = typeof productTypeEnum.enumValues[number];
export type OrderStatus = typeof orderStatusEnum.enumValues[number];
export type PaymentProvider = typeof paymentProviderEnum.enumValues[number];
export type BattlepassKind = typeof battlepassKindEnum.enumValues[number];
export type BattlepassStatus = typeof battlepassStatusEnum.enumValues[number];
export type RpgExperience = typeof rpgExperienceEnum.enumValues[number];
export type ApplicationStatus = typeof applicationStatusEnum.enumValues[number];
export type ReportStatus = typeof reportStatusEnum.enumValues[number];
export type ElementStatus = typeof elementStatusEnum.enumValues[number];
export type StoryTextType = typeof storyTextTypeEnum.enumValues[number];

// Типы новых таблиц
export type Monster = typeof monsters.$inferSelect;
export type NewMonster = typeof monsters.$inferInsert;
export type StoryText = typeof storyTexts.$inferSelect;
export type NewStoryText = typeof storyTexts.$inferInsert;
export type ReportNextPlan = typeof reportNextPlans.$inferSelect;
export type NewReportNextPlan = typeof reportNextPlans.$inferInsert;

// === WIKI СИСТЕМА ===

// Разделы вики (иерархическая структура)
export const wikiSections = pgTable('wiki_sections', {
  id: uuid('id').primaryKey().defaultRandom(),
  parentId: uuid('parent_id').references(() => wikiSections.id, { onDelete: 'cascade' }),
  title: varchar('title', { length: 200 }).notNull(),
  slug: varchar('slug', { length: 200 }).notNull(),
  orderIndex: integer('order_index').default(0).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  // Уникальность slug в рамках родительского раздела
  parentSlugUnique: unique().on(table.parentId, table.slug),
}));

// Статьи вики
export const wikiArticles = pgTable('wiki_articles', {
  id: uuid('id').primaryKey().defaultRandom(),
  sectionId: uuid('section_id').notNull().references(() => wikiSections.id, { onDelete: 'cascade' }),
  title: varchar('title', { length: 200 }).notNull(),
  slug: varchar('slug', { length: 200 }).notNull(),
  // Храним Markdown для редактирования
  contentMd: text('content_md').notNull(),
  // Минимальная роль для просмотра
  minRole: roleEnum('min_role').default('MASTER').notNull(),
  // Служебное
  authorUserId: uuid('author_user_id').references(() => users.id, { onDelete: 'set null' }),
  updatedByUserId: uuid('updated_by_user_id').references(() => users.id, { onDelete: 'set null' }),
  lastUpdatedAt: timestamp('last_updated_at').defaultNow().notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  sectionSlugUnique: unique().on(table.sectionId, table.slug),
  // Полнотекстовый поиск будет добавлен через миграцию
}));

// Комментарии к статьям
export const wikiComments = pgTable('wiki_comments', {
  id: uuid('id').primaryKey().defaultRandom(),
  articleId: uuid('article_id').notNull().references(() => wikiArticles.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  body: varchar('body', { length: 2000 }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Relations для вики
export const wikiSectionsRelations = relations(wikiSections, ({ one, many }) => ({
  parent: one(wikiSections, {
    fields: [wikiSections.parentId],
    references: [wikiSections.id],
    relationName: 'parentChild',
  }),
  children: many(wikiSections, {
    relationName: 'parentChild',
  }),
  articles: many(wikiArticles),
}));

export const wikiArticlesRelations = relations(wikiArticles, ({ one, many }) => ({
  section: one(wikiSections, {
    fields: [wikiArticles.sectionId],
    references: [wikiSections.id],
  }),
  author: one(users, {
    fields: [wikiArticles.authorUserId],
    references: [users.id],
    relationName: 'wikiAuthor',
  }),
  updatedBy: one(users, {
    fields: [wikiArticles.updatedByUserId],
    references: [users.id],
    relationName: 'wikiUpdater',
  }),
  comments: many(wikiComments),
}));

export const wikiCommentsRelations = relations(wikiComments, ({ one }) => ({
  article: one(wikiArticles, {
    fields: [wikiComments.articleId],
    references: [wikiArticles.id],
  }),
  user: one(users, {
    fields: [wikiComments.userId],
    references: [users.id],
  }),
}));

// Типы для вики
export type WikiSection = typeof wikiSections.$inferSelect;
export type NewWikiSection = typeof wikiSections.$inferInsert;
export type WikiArticle = typeof wikiArticles.$inferSelect;
export type NewWikiArticle = typeof wikiArticles.$inferInsert;
export type WikiComment = typeof wikiComments.$inferSelect;
export type NewWikiComment = typeof wikiComments.$inferInsert;
