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
- `Group (groups)`: name, seasonId, masterId, clubId?, description?, maxMembers (default 4), isRecruiting (default false), referralCode (unique), format (ONLINE|OFFLINE|MIXED, default ONLINE), place?, createdAt, updatedAt
- `GroupMember (group_members)`: groupId, playerId (→ PlayerProfile), characterId?, status (ACTIVE|INACTIVE|BANNED), createdAt

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

### Репозитории и API

#### GroupsRepo (packages/db/src/repositories/groupsRepo.ts)
Основной репозиторий для работы с группами:

**Методы для мастеров:**
- `create(data: CreateGroupDto, userId: string)` - создание группы с автогенерацией referralCode
- `getByMasterId(userId: string)` - получение групп мастера
- `getById(groupId: string)` - детали группы
- `updateGroup(groupId: string, data: UpdateGroupDto, userId: string)` - обновление группы
- `removeMember(groupId: string, memberId: string, userId: string)` - удаление участника
- `getGroupMembers(groupId: string)` - список участников с деталями
- `isGroupMaster(groupId: string, userId: string)` - проверка прав мастера

**Методы для игроков:**
- `joinByReferral(referralCode: string, userId: string)` - присоединение по коду (автосоздание профиля)
- `getPlayerGroups(userId: string)` - получение групп игрока
- `leaveGroup(groupId: string, userId: string)` - выход из группы

**Особенности:**
- Автоматическое создание профилей игроков при первом присоединении
- Валидация лимитов участников и статуса набора
- Транзакционная безопасность операций
- Подсчёт текущих участников в реальном времени

#### API Endpoints

**Управление группами:**
- `GET/POST /api/groups` - список групп (роль-зависимый) и создание
- `GET/PUT /api/groups/[id]` - детали и редактирование (только мастер)
- `GET /api/groups/[id]/details` - подробная информация (участники группы)
- `DELETE /api/groups/[id]/members/[memberId]` - удаление участника (только мастер)

**Участие в группах:**
- `POST /api/groups/join` - присоединение по referralCode
- `POST /api/groups/[id]/leave` - выход из группы (только игроки)

**Утилиты:**
- `GET /api/users/[id]` - информация о пользователе (для отображения мастера)
- `GET /join?code=<referralCode>` - страница прямого присоединения

### Контракты и валидация

**DTO схемы (packages/contracts/src/dto.ts):**
- `CreateGroupDto` - создание группы (name, description, maxMembers, isRecruiting, format, place)
- `UpdateGroupDto` - обновление группы (частичные данные)
- `JoinGroupDto` - присоединение по коду (referralCode)

**События системы (packages/contracts/src/events.ts):**
- `GroupCreatedEvent` - создание группы
- `PlayerJoinedGroupEvent` - присоединение игрока

Все операции проходят валидацию через Zod схемы и проверку RBAC прав доступа.


