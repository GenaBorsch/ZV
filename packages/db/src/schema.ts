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

// Таблицы
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).unique().notNull(),
  tel: varchar('tel', { length: 50 }).unique(),
  tgId: varchar('tg_id', { length: 50 }).unique(),
  name: varchar('name', { length: 255 }),
  avatarUrl: text('avatar_url'),
  passwordHash: text('password_hash'),
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
  archetype: varchar('archetype', { length: 255 }),
  sheetUrl: text('sheet_url'),
  notes: text('notes'),
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
});

export const groupMembers = pgTable('group_members', {
  id: uuid('id').primaryKey().defaultRandom(),
  groupId: uuid('group_id').notNull().references(() => groups.id, { onDelete: 'cascade' }),
  playerId: uuid('player_id').notNull().references(() => playerProfiles.id, { onDelete: 'cascade' }),
  characterId: uuid('character_id'),
  status: memberStatusEnum('status').default('ACTIVE').notNull(),
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
  sessionId: uuid('session_id').unique().notNull().references(() => sessions.id, { onDelete: 'cascade' }),
  masterId: uuid('master_id').notNull().references(() => masterProfiles.id, { onDelete: 'cascade' }),
  summary: text('summary').notNull(),
  highlights: text('highlights'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
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
  seasonId: uuid('season_id').notNull().references(() => seasons.id, { onDelete: 'cascade' }),
  usesTotal: integer('uses_total').notNull(),
  usesLeft: integer('uses_left').notNull(),
  status: battlepassStatusEnum('status').default('ACTIVE').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const writeoffs = pgTable('writeoffs', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  sessionId: uuid('session_id').notNull().references(() => sessions.id, { onDelete: 'cascade' }),
  reportId: uuid('report_id').references(() => reports.id, { onDelete: 'cascade' }),
  battlepassId: uuid('battlepass_id').notNull().references(() => battlepasses.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => {
  return {
    writeoffUnique: unique().on(table.userId, table.sessionId),
  };
});

// Связи (Relations)
export const usersRelations = relations(users, ({ many, one }) => ({
  roles: many(userRoles),
  playerProfile: one(playerProfiles),
  masterProfile: one(masterProfiles),
  enrollments: many(enrollments),
  orders: many(orders),
  battlepasses: many(battlepasses),
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
  sessions: many(sessions),
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

export const reportsRelations = relations(reports, ({ one }) => ({
  session: one(sessions, {
    fields: [reports.sessionId],
    references: [sessions.id],
  }),
  master: one(masterProfiles, {
    fields: [reports.masterId],
    references: [masterProfiles.id],
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
  season: one(seasons, {
    fields: [battlepasses.seasonId],
    references: [seasons.id],
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
