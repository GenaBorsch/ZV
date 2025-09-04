# Техническая документация

## 🗄️ База данных и модель данных

### Схема данных (Drizzle ORM + PostgreSQL)

Источник: `packages/db/src/schema.ts`

#### Пользователи и роли
- **`User (users)`**: email (unique), tel?, tgId?, name?, avatarUrl?, **rpgExperience?** (NOVICE|INTERMEDIATE|VETERAN), **contacts?**, timestamps
- **`UserRole (user_roles)`**: (userId, role) unique; enum `Role`: PLAYER, MASTER, MODERATOR, SUPERADMIN

**Профили (1–1 от `User`):**
- **`PlayerProfile (player_profiles)`**: nickname?, notes?
- **`MasterProfile (master_profiles)`**: bio?, format (ONLINE|OFFLINE|MIXED), location?, clubId?

#### Организационные сущности
- **`Club (clubs)`**: name, address?, contacts?
- **`Season (seasons)`**: title, code unique, startsAt, endsAt, isActive
- **`Group (groups)`**: name, seasonId, masterId, clubId?, description?, maxMembers (default 4), isRecruiting (default false), referralCode (unique), format (ONLINE|OFFLINE|MIXED, default ONLINE), place?, createdAt, updatedAt
- **`GroupMember (group_members)`**: groupId, playerId (→ PlayerProfile), characterId?, status (ACTIVE|INACTIVE|BANNED), createdAt

#### Игровой процесс
- **`Character (characters)`**: playerId (→ PlayerProfile), name, archetype?, sheetUrl?, notes?
- **`Session (sessions)`**: groupId, startsAt, durationMin, place?, format, isOpen, slotsTotal, slotsFree
- **`Enrollment (enrollments)`**: sessionId, playerId (→ User), status (PENDING|CONFIRMED|CANCELLED|WAITLIST), createdAt
- **`Report (reports)`**: sessionId unique, masterId, summary, highlights?, createdAt

#### Контент и правила
- **`RuleDoc (rule_docs)`**: title, slug unique, content (markdown), version?, published

#### Коммерция
- **`Product (products)`**: sku unique, title, type (BATTLEPASS|MERCH|ADDON), priceRub, meta?, active
- **`Order (orders)`**: userId, status (PENDING|PAID|CANCELLED|REFUNDED), totalRub, provider (YOOKASSA), providerId?, createdAt
- **`OrderItem (order_items)`**: orderId, productId, qty (default 1), priceRub
- **`Battlepass (battlepasses)`**: userId, kind (SEASON|FOUR|SINGLE), seasonId, usesTotal, usesLeft, status (ACTIVE|EXPIRED|USED_UP)

#### Связи (основные)
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

#### GroupsRepo (`packages/db/src/repositories/groupsRepo.ts`)
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

#### ProfilesRepo (`packages/db/src/repositories/profilesRepo.ts`)
Репозиторий для работы с профилями пользователей:

**Методы управления профилем:**
- `getProfile(userId: string)` - получение полного профиля пользователя
- `updateProfile(userId: string, data: UpdateProfileDto)` - обновление основного профиля
- `updatePlayerProfile(userId: string, data: UpdatePlayerProfileDto)` - обновление профиля игрока
- `updateMasterProfile(userId: string, data: UpdateMasterProfileDto)` - обновление профиля мастера
- `createPlayerProfile(userId: string, data?: CreatePlayerProfileDto)` - создание профиля игрока
- `createMasterProfile(userId: string, data?: CreateMasterProfileDto)` - создание профиля мастера

**Особенности:**
- Автоматическое создание профилей при первом обращении
- Транзакционная безопасность операций обновления
- Полная поддержка роль-специфичных полей
- Валидация данных через DTO схемы

#### UsersRepo (`packages/db/src/repositories/usersRepo.ts`)
Репозиторий для работы с пользователями в админ-панели:

**Методы управления пользователями:**
- `list(query: AdminUsersListQuery)` - получение списка пользователей с фильтрацией и пагинацией
- `getById(userId: string)` - получение пользователя по ID с ролями
- `update(userId: string, data: UpdateUserDto)` - обновление пользователя
- `delete(userId: string)` - удаление пользователя (hard delete)
- `exists(userId: string)` - проверка существования пользователя
- `findByEmail(email: string)` - поиск по email

#### RolesRepo (`packages/db/src/repositories/rolesRepo.ts`)
Репозиторий для управления ролями пользователей:

**Методы управления ролями:**
- `listByUser(userId: string)` - получение ролей пользователя
- `add(userId: string, role: Role)` - добавление роли
- `remove(userId: string, role: Role)` - удаление роли
- `addMultiple(userId: string, roles: Role[])` - пакетное добавление ролей
- `removeMultiple(userId: string, roles: Role[])` - пакетное удаление ролей
- `manageUserRoles(userId: string, add: Role[], remove: Role[])` - управление ролями в транзакции
- `hasRole(userId: string, role: Role)` - проверка роли
- `hasAnyRole(userId: string, roles: Role[])` - проверка любой из ролей
- `getSuperAdminCount()` - подсчет SUPERADMIN
- `isOnlySuperAdmin(userId: string)` - проверка единственного SUPERADMIN

### API Endpoints

#### Управление профилями:
- **`GET/PATCH /api/profile`** - получение и обновление основного профиля
- **`POST /api/profile/complete`** - завершение заполнения профиля
- **`GET/PATCH /api/profile/player`** - управление профилем игрока
- **`GET/PATCH /api/profile/master`** - управление профилем мастера

#### Управление группами:
- **`GET/POST /api/groups`** - список групп (роль-зависимый) и создание
- **`GET/PUT /api/groups/[id]`** - детали и редактирование (только мастер)
- **`GET /api/groups/[id]/details`** - подробная информация (участники группы)
- **`DELETE /api/groups/[id]/members/[memberId]`** - удаление участника (только мастер)

#### Участие в группах:
- **`POST /api/groups/join`** - присоединение по referralCode
- **`POST /api/groups/[id]/leave`** - выход из группы (только игроки)

#### Управление пользователями (Админ-панель):
- **`GET /api/admin/users`** - список пользователей с фильтрацией
- **`GET/PATCH/DELETE /api/admin/users/[id]`** - управление пользователями
- **`PATCH /api/admin/users/[id]/roles`** - управление ролями

#### Утилиты:
- **`GET /api/users/[id]`** - информация о пользователе (для отображения мастера)
- **`GET /join?code=<referralCode>`** - страница прямого присоединения

### Контракты и валидация

#### DTO схемы (`packages/contracts/src/dto.ts`)

**Профили пользователей:**
- `UpdateProfileDto` - обновление основного профиля (name, avatarUrl, rpgExperience, contacts)
- `ProfileDto` - полная схема профиля пользователя с роль-специфичными полями
- `CreatePlayerProfileDto` / `UpdatePlayerProfileDto` - управление профилем игрока
- `CreateMasterProfileDto` / `UpdateMasterProfileDto` - управление профилем мастера
- `RegisterDto` - регистрация пользователя (имя теперь опциональное)

**Группы:**
- `CreateGroupDto` - создание группы (name, description, maxMembers, isRecruiting, format, place)
- `UpdateGroupDto` - обновление группы (частичные данные)
- `JoinGroupDto` - присоединение по коду (referralCode)

**Админ-панель (`packages/contracts/src/admin.ts`):**
- `AdminUsersListQuery` - параметры запроса списка пользователей
- `AdminUserDto` - DTO пользователя для админ-панели
- `AdminManageUserRoles` - управление ролями пользователя

#### События системы (`packages/contracts/src/events.ts`)
- `GroupCreatedEvent` - создание группы
- `PlayerJoinedGroupEvent` - присоединение игрока

Все операции проходят валидацию через Zod схемы и проверку RBAC прав доступа.

## 🎨 Frontend архитектура

### Технологический стек
- **Next.js 15** (App Router), **React 18**, **TypeScript**
- **Tailwind CSS** (+ tailwindcss-animate), **shadcn/ui** (@radix-ui/react-tabs и др.)
- **Auth**: NextAuth v4, валидация форм — zod + react-hook-form
- **Состояние**: Zustand, данные — **@tanstack/react-query**

### Структура страниц
Директория: `apps/web/src/app`

#### Основные страницы:
- **`/`** → `page.tsx` — главная
- **`/auth/login`** → `auth/login/page.tsx` — вход
- **`/auth/register`** → `auth/register/page.tsx` — регистрация
- **`/profile`** → `profile/page.tsx` — **страница редактирования профиля пользователя** ✅
- **`/player`** → `player/page.tsx` — кабинет игрока
- **`/master`** → `master/page.tsx` — кабинет мастера
- **`/admin`** → `admin/page.tsx` — админ-панель
- **`/join`** → `join/page.tsx` — присоединение к группе по коду

#### Админ-панель:
- **`/admin/users`** → `admin/users/page.tsx` — **список пользователей** ✅
- **`/admin/users/[id]`** → `admin/users/[id]/page.tsx` — **детальная страница пользователя** ✅
- **`/admin/products`** → `admin/products/page.tsx` — управление товарами

Общий каркас: `layout.tsx`, глобальные стили: `globals.css`.

### Конфигурации

#### `next.config.js`:
- `serverExternalPackages: ['@zv/db']` — разрешает использовать пакет `@zv/db` (Drizzle ORM)
- `images.domains = ['localhost']`, remotePatterns для MinIO на `localhost:9000`
- Заголовки для `/api/*`: CORS (методы, заголовки, origin `*`)

#### `tsconfig.json`: 
- alias `@/*`, `@/components/*`, `@/lib/*`, `@/types/*`

#### `tailwind.config.js`: 
- сканирует `app`, `src`, `components`; настраивает тему и анимации

### Реализованные компоненты UI ✅

#### Основные компоненты:
- ✅ **Система управления пользователями** с поиском, фильтрацией и пагинацией
- ✅ **Система управления профилями** с полным функционалом редактирования
- ✅ **Формы с валидацией** через react-hook-form + zod
- ✅ **RBAC система** с middleware защитой
- ✅ **Responsive дизайн** на Tailwind CSS
- ✅ **Оптимистичный UI** для лучшего UX

#### shadcn/ui компоненты:
- ✅ **Card, Tabs, Button, Input, Label, Select, Textarea** - базовые компоненты
- ✅ **Switch** - переключатели для настроек
- ✅ **Проверка заполненности профиля** с автоматическим редиректом

### Аутентификация и поведение

#### Auth страницы:
- **Маршруты**: `/auth/register`, `/auth/login`, `/profile`, `/player`, `/master`, `/admin`
- **Формы**: на shadcn/ui компонентах с полной валидацией через zod
- **Регистрация**: `fetch('/api/auth/register')` → имя теперь опциональное при регистрации
- **Логин**: `signIn('credentials')` → проверка заполненности профиля → редирект на `/profile` или основную страницу роли
- **Профиль**: полная страница редактирования с табами для общей информации, профиля игрока и мастера
- **Logout**: кнопка в хедере вызывает `signOut({ callbackUrl: '/auth/login' })`
- **Доступ**: middleware проверяет cookie `next-auth.*` и заполненность профиля, редиректит на `/profile` при необходимости

### Система управления группами

#### Компоненты групп:
- **`CreateGroupForm.tsx`** - форма создания группы
- **`GroupCreatedSuccess.tsx`** - успешное создание группы
- **`GroupDetailsModal.tsx`** - модальное окно с деталями группы
- **`JoinGroupForm.tsx`** - форма присоединения к группе
- **`JoinGroupSuccess.tsx`** - успешное присоединение
- **`PlayerGroupDetailsModal.tsx`** - детали группы для игроков

#### Wrapper компоненты:
- **`MasterDashboardContent.tsx`** - контент кабинета мастера
- **`MasterPageWrapper.tsx`** - обертка страницы мастера
- **`PlayerDashboardContent.tsx`** - контент кабинета игрока
- **`PlayerPageWrapper.tsx`** - обертка страницы игрока

### API и данные
- **BFF** через Next.js API Routes/Server Actions, типы запросов/ответов — из `@zv/contracts`
- **Верификация входящих DTO** — `zod` из `contracts/src/dto`
- **React Query** для кеширования и синхронизации данных с сервером
- **Оптимистичные обновления** для лучшего UX

### Планируемые функции UI
- Компоненты форм на shadcn/ui с кастомной валидацией
- Таблицы и фильтры для сессий, групп, заказов
- Система уведомлений для пользователей
- Интерактивные руководства по игре

## 🔧 Настройки разработки

### Переменные окружения
Обязательные переменные в `.env`:

```env
# База данных
DATABASE_URL=postgresql://zv_user:zv_password@localhost:5433/zvezdnoe_vereteno

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=dev-secret

# S3/MinIO (опционально)
S3_ENDPOINT=http://localhost:9000
S3_ACCESS_KEY=zv_admin
S3_SECRET_KEY=zv_admin_password
S3_BUCKET_AVATARS=avatars
S3_BUCKET_UPLOADS=uploads
S3_BUCKET_DOCUMENTS=documents

# Email (опционально)
EMAIL_FROM=noreply@zvezdnoe-vereteno.ru
SMTP_URL=smtp://user:pass@localhost:587

# Telegram (опционально)
TELEGRAM_BOT_TOKEN=your_bot_token
TELEGRAM_WEBHOOK_URL=https://your-domain.com/api/telegram/webhook

# Платежи YooKassa (опционально)
YKS_SHOP_ID=your_shop_id
YKS_SECRET=your_secret_key

# Публичный URL
PUBLIC_BASE_URL=http://localhost:3000

# Флаги функций
FEATURE_PAYMENTS=false
FEATURE_TELEGRAM=false
```

### Docker Compose (`docker-compose.yml`)
- **`postgres`**: 15-alpine, порт `5433→5432`, пользователь `zv_user`, БД `zvezdnoe_vereteno`
- **`minio`**: RELEASE.2024-01-16, порты `9000` (API) и `9001` (Console)
- **Volume'ы**: `postgres_data`, `minio_data`

### Команды разработки
В корне монорепо:
- `pnpm install` — установка зависимостей
- **Инфраструктура**: `docker-compose up -d postgres minio`
- **Drizzle**: `pnpm db:generate`, `pnpm db:migrate`, `pnpm db:seed`, `pnpm db:studio`
- **Запуск приложения**: `pnpm dev` (проксирует `apps/web`)

### Порты и доступ
- **Next.js dev сервер**: переменная `NEXT_PORT` (по умолчанию 3000)
- **Drizzle Studio**: переменная `STUDIO_PORT` (по умолчанию 4983)
- **PostgreSQL**: хост-порт `5433` (проксируется в контейнер `5432`)
- **MinIO API**: `9000`
- **MinIO Console**: `9001`

## 🧪 Тестирование

### Unit тесты
Запуск unit тестов:
```bash
pnpm test          # Запуск тестов
pnpm test:ui       # Запуск с UI
pnpm test:run      # Однократный запуск
```

**Покрыты тестами:**
- `UsersRepo` - все методы репозитория пользователей
- `RolesRepo` - все методы репозитория ролей  
- `roles utilities` - утилиты для работы с ролями

### E2E тесты
Для запуска E2E тестов рекомендуется использовать Playwright:

```bash
# Установка Playwright (если не установлен)
pnpm add -D @playwright/test

# Запуск E2E тестов
pnpm playwright test
```

**Тестовые сценарии:**
1. Доступ к модулям только для соответствующих ролей
2. Поиск и фильтрация в админ-панели
3. Создание и редактирование групп
4. Присоединение к группам и выход из них
5. Управление профилями пользователей
6. Проверка ограничений безопасности

### Демо-данные для тестирования
**Демо-аккаунты (создаются сидом):**
- `demoadmin@zvezdnoe-vereteno.ru` — SUPERADMIN — пароль: `demo1234`
- `demomoderator@zvezdnoe-vereteno.ru` — MODERATOR — пароль: `demo1234`
- `demomaster@zvezdnoe-vereteno.ru` — MASTER — пароль: `demo1234`
- `demoplayer@zvezdnoe-vereteno.ru` — PLAYER — пароль: `demo1234`

**Создание дополнительных пользователей:**
```bash
DATABASE_URL="postgresql://zv_user:zv_password@localhost:5433/zvezdnoe_vereteno" \
pnpm --filter db run create-user \
  --email=user@example.com \
  --password=password123 \
  --name="User Name" \
  --role=PLAYER
```

## 🔒 Безопасность

### RBAC система
- **Роли**: PLAYER, MASTER, MODERATOR, SUPERADMIN
- **Проверка ролей** происходит на двух уровнях:
  - Middleware проверяет доступ к маршрутам
  - API endpoints дублируют проверку ролей
- **Защита SUPERADMIN**:
  - Нельзя удалить единственного SUPERADMIN
  - Только SUPERADMIN может управлять ролью SUPERADMIN

### Валидация данных
- **Все входные данные** проходят валидацию через Zod схемы
- **API контракты** определены в `packages/contracts`
- **Санитизация** пользовательского ввода на уровне DTO

### Аутентификация
- **NextAuth v4** с JWT стратегией
- **bcryptjs** для хеширования паролей (12 rounds)
- **Сессии** хранятся в JWT токенах
- **CSRF защита** встроена в NextAuth

**Последнее обновление**: Декабрь 2024
