## Модель данных (Drizzle ORM + PostgreSQL)

Источник: `packages/db/src/schema.ts`

### Пользователи и роли
- `User (users)`: email (unique), tel?, tgId?, name?, avatarUrl?, timestamps
- `UserRole (user_roles)`: (userId, role) unique; enum `Role`: PLAYER, MASTER, MODERATOR, SUPERADMIN

Профили (1–1 от `User`):
- `PlayerProfile (player_profiles)`: nickname?, notes?
- `MasterProfile (master_profiles)`: bio?, format (ONLINE|OFFLINE|MIXED), location?, clubId?

### Организационные сущности
- `Club (clubs)`: name, address?, contacts?
- `Season (seasons)`: title, code unique, startsAt, endsAt, isActive
- `Group (groups)`: name, seasonId, masterId, clubId?
- `GroupMember (group_members)`: groupId, playerId (→ PlayerProfile), characterId?, status (ACTIVE|PAUSED|LEFT)

### Игровой процесс
- `Character (characters)`: playerId (→ PlayerProfile), name, archetype?, sheetUrl?, notes?
- `Session (sessions)`: groupId, startsAt, durationMin, place?, format, isOpen, slotsTotal, slotsFree
- `Enrollment (enrollments)`: sessionId, playerId (→ User), status (PENDING|CONFIRMED|CANCELLED|WAITLIST), createdAt
- `Report (reports)`: sessionId unique, masterId, summary, highlights?, createdAt

### Контент и правила
- `RuleDoc (rule_docs)`: title, slug unique, content (markdown), version?, published

### Коммерция
- `Product (products)`: sku unique, title, type (BATTLEPASS|MERCH|ADDON), priceRub, meta?, active
- `Order (orders)`: userId, status (PENDING|PAID|CANCELLED|REFUNDED), totalRub, provider (YOOKASSA), providerId?, createdAt
- `OrderItem (order_items)`: orderId, productId, qty (default 1), priceRub
- `Battlepass (battlepasses)`: userId, kind (SEASON|FOUR|SINGLE), seasonId, usesTotal, usesLeft, status (ACTIVE|EXPIRED|USED_UP)

### Связи (основные)
- User 1–1 PlayerProfile, 1–1 MasterProfile; 1–N UserRole, Enrollment, Order, Battlepass
- MasterProfile N–1 Club, 1–N Group, Report
- Group N–1 Season, N–1 MasterProfile, N–1 Club; 1–N GroupMember, Session
- Session 1–N Enrollment, 1–1 Report
- GroupMember N–1 Group, N–1 PlayerProfile
- Enrollment N–1 Session, N–1 User
- Order 1–N OrderItem; OrderItem N–1 Product
- Battlepass N–1 User, N–1 Season

Во всех критичных местах настроены `onDelete: Cascade`.


