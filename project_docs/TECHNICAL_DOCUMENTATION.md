# Техническая документация

**Последнее обновление:** 23 сентября 2025

## 🆕 Последние изменения (сентябрь 2025)

### ✅ Реализованные функции:
- **Система персонажей**: Полное CRUD API (`/api/v1/characters`) с UI компонентами
- **Загрузка файлов**: MinIO интеграция для аватаров персонажей
- **Обновленная типографика**: Кастомные шрифты и улучшенная читаемость
- **UI/UX улучшения**: Консистентные размеры кнопок, исправленная контрастность
- **Система уведомлений**: Улучшенный интерфейс с корректным отображением счетчиков
- **Юридические документы**: Страница `/legal` с офертой и политикой конфиденциальности
- **Обязательное согласие**: Валидация согласия при регистрации на клиенте и сервере

### 🔧 Технические улучшения:
- **Валидация файлов**: Проверка типов и размеров при загрузке
- **Оптимизация изображений**: Автоматическое изменение размера аватаров
- **Улучшенная безопасность**: Дополнительные проверки прав доступа
- **Консистентность API**: Единообразные схемы ответов и ошибок
- **Правовое соответствие**: Добавлена система согласия с юридическими документами

## 🗄️ База данных и модель данных

### Схема данных (Drizzle ORM + PostgreSQL)

Источник: `packages/db/src/schema.ts`

#### Пользователи и роли
- **`User (users)`**: email (unique), tel?, tgId?, name?, **avatarUrl?** (MinIO URL), **rpgExperience?** (NOVICE|INTERMEDIATE|VETERAN), **contacts?**, timestamps
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
- **`Character (characters)`**: playerId (→ PlayerProfile), name, **avatarUrl?** (MinIO URL), archetype?, **sheetUrl?** (MinIO URL), notes?
- **`Session (sessions)`**: groupId, startsAt, durationMin, place?, format, isOpen, slotsTotal, slotsFree
- **`Enrollment (enrollments)`**: sessionId, playerId (→ User), status (PENDING|CONFIRMED|CANCELLED|WAITLIST), createdAt
- **`Report (reports)`**: sessionId (optional), masterId, description, highlights?, **attachments?** (JSON array of MinIO URLs), status (PENDING|APPROVED|REJECTED|CANCELLED), rejectionReason?, createdAt, updatedAt
- **`ReportPlayer (report_players)`**: reportId (→ Report), playerId (→ User), createdAt - связь отчётов с игроками
- **`Writeoff (writeoffs)`**: userId, sessionId?, reportId?, battlepassId, createdAt - логирование списаний игр

#### Система заявок в группы
- **`GroupApplication (group_applications)`**: groupId (→ Group), playerId (→ PlayerProfile), status (PENDING|APPROVED|REJECTED|WITHDRAWN), message?, masterResponse?, createdAt, updatedAt
  - Уникальный индекс: (groupId, playerId) - один игрок может подать только одну заявку в группу
  - Каскадное удаление при удалении группы или игрока

#### Система уведомлений
- **`Notification (notifications)`**: userId (→ User), type (REPORT_SUBMITTED|REPORT_APPROVED|REPORT_REJECTED|BATTLEPASS_DEDUCTED|REPORT_CANCELLED), message, link?, status (UNREAD|READ), createdAt

#### Контент и правила
- **`RuleDoc (rule_docs)`**: title, slug unique, content (markdown), version?, published

#### Коммерция
- **`Product (products)`**: sku unique, title, **imageUrl?** (MinIO URL), type (BATTLEPASS|MERCH|ADDON), priceRub, meta?, active
- **`Order (orders)`**: userId, status (PENDING|PAID|CANCELLED|REFUNDED), totalRub, provider (YOOKASSA), providerId?, createdAt
- **`OrderItem (order_items)`**: orderId, productId, qty (default 1), priceRub
- **`Battlepass (battlepasses)`**: userId, kind (SEASON|FOUR|SINGLE), seasonId, usesTotal, usesLeft, status (ACTIVE|EXPIRED|USED_UP)

#### Связи (основные)
- User 1–1 PlayerProfile, 1–1 MasterProfile; 1–N UserRole, Enrollment, Order, Battlepass
- MasterProfile N–1 Club, 1–N Group, Report
- Group N–1 Season, N–1 MasterProfile, N–1 Club; 1–N GroupMember, GroupApplication, Session
- Session 1–N Enrollment, 1–1 Report
- GroupMember N–1 Group, N–1 PlayerProfile
- GroupApplication N–1 Group, N–1 PlayerProfile
- Enrollment N–1 Session, N–1 User
- Order 1–N OrderItem; OrderItem N–1 Product
- Battlepass N–1 User (ИСПРАВЛЕНО: убрана зависимость от Season)

Во всех критичных местах настроены `onDelete: Cascade`.

### Репозитории и API

#### GroupsRepo (`packages/db/src/repositories/groupsRepo.ts`)
Основной репозиторий для работы с группами:

**Методы для мастеров:**
- `create(data: CreateGroupDto, userId: string)` - создание группы с автогенерацией referralCode
- `getByMasterId(userId: string)` - получение групп мастера
- `getByMasterIdWithNotifications(userId: string)` - получение групп мастера с количеством ожидающих заявок
- `getById(groupId: string)` - детали группы
- `updateGroup(groupId: string, data: UpdateGroupDto, userId: string)` - обновление группы
- `removeMember(groupId: string, memberId: string, userId: string)` - удаление участника
- `getGroupMembers(groupId: string)` - список участников с деталями
- `isGroupMaster(groupId: string, userId: string)` - проверка прав мастера

**Методы для игроков:**
- `joinByReferral(referralCode: string, userId: string)` - присоединение по коду (автосоздание профиля)
- `getPlayerGroups(userId: string)` - получение групп игрока
- `leaveGroup(groupId: string, userId: string)` - выход из группы
- `searchAvailableGroups(filters)` - поиск доступных для присоединения групп

**Методы для системы заявок:**
- `applyToGroup(groupId: string, userId: string, message?: string)` - подача заявки в группу
- `getGroupApplications(groupId: string, userId: string)` - получение заявок для группы (только мастер)
- `approveApplication(applicationId: string, userId: string, masterResponse?: string)` - принятие заявки
- `rejectApplication(applicationId: string, userId: string, masterResponse?: string)` - отклонение заявки
- `getPlayerApplications(userId: string)` - получение заявок игрока

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
  - Для мастеров: возвращает группы с количеством ожидающих заявок (`pendingApplicationsCount`)
- **`GET/PUT /api/groups/[id]`** - детали и редактирование (только мастер)
- **`GET /api/groups/[id]/details`** - подробная информация (участники группы)
- **`DELETE /api/groups/[id]/members/[memberId]`** - удаление участника (только мастер)

#### Система заявок в группы:
- **`POST /api/groups/[id]/apply`** - подача заявки в группу (только игроки)
- **`GET /api/groups/[id]/applications`** - список заявок для группы (только мастер)
- **`PATCH /api/groups/applications/[id]`** - принятие/отклонение заявки (только мастер)
- **`GET /api/groups/applications/my`** - список заявок игрока (только игроки)

#### Участие в группах:
- **`POST /api/groups/join`** - присоединение по referralCode
- **`POST /api/groups/[id]/leave`** - выход из группы (только игроки)

#### Управление пользователями (Админ-панель):
- **`GET /api/admin/users`** - список пользователей с фильтрацией
- **`GET/PATCH/DELETE /api/admin/users/[id]`** - управление пользователями
- **`PATCH /api/admin/users/[id]/roles`** - управление ролями

#### Система отчётов мастеров:
- **`GET/POST /api/reports`** - список отчётов (роль-зависимый) и создание отчётов (только мастера)
  - Rate limiting: 10 отчётов/час для мастеров
  - Валидация: минимум 50 символов описания, обязательный выбор игроков
  - ✅ ИСПРАВЛЕНО: добавлен импорт `desc` для корректной сортировки
- **`GET /api/reports/[id]`** - получение отчёта (доступ по ролям)
- **`PATCH /api/reports/[id]`** - редактирование отчёта (мастер) или модерация (админ)
  - Мастера могут редактировать только в статусе PENDING/REJECTED
  - Админы могут модерировать (APPROVED/REJECTED) с обязательной причиной при отклонении
  - ✅ При одобрении автоматически списываются игры с баттлпассов
- **`DELETE /api/reports/[id]`** - удаление отчёта (только мастер, только PENDING)
- **`GET /api/master/groups`** - получение групп мастера с участниками для создания отчётов

#### Система баттлпассов:
- **`POST /api/battlepasses/redeem`** - списание игр с баттлпассов (автоматически при одобрении отчётов)
- **`POST /api/payments/create-checkout`** - создание заказа на покупку баттлпасса
- **`POST /api/payments/webhook`** - обработка успешных платежей YooKassa
- **`POST /api/payments/check-status`** - ручная проверка статуса платежа
- ✅ ИСПРАВЛЕНО: убрана зависимость от seasonId в баттлпассах

#### Система уведомлений:
- **`GET/POST /api/notifications`** - список уведомлений пользователя и создание
- **`PATCH /api/notifications/[id]`** - пометка уведомления как прочитанное

#### Вспомогательные эндпоинты:
- **`POST /api/players/check-battlepasses`** - проверка доступных игр у списка игроков

#### Утилиты:
- **`GET /api/users/[id]`** - информация о пользователе (для отображения мастера)
- **`GET /join?code=<referralCode>`** - страница прямого присоединения

#### Юридические документы:
- **`GET /legal`** - страница с офертой и политикой конфиденциальности
  - Вкладочный интерфейс с двумя документами
  - Полный текст публичной оферты
  - Политика обработки персональных данных
  - Ссылка из формы регистрации (target="_blank")

## 📋 Система юридических документов

### Архитектура решения

**Источники документов:**
- Документы в формате ODT хранятся в папке `/legal/`
- Автоматическая конвертация ODT → HTML через LibreOffice
- Интеграция контента в React компоненты

**Структура файлов:**
```
legal/
├── оферта.odt                                    # Исходный документ
├── оферта.html                                   # Конвертированный HTML
├── Политика обработки персональных данных.odt    # Исходный документ  
└── Политика обработки персональных данных.html   # Конвертированный HTML
```

### Страница /legal

**Технические особенности:**
- **Responsive дизайн** с адаптацией под мобильные устройства
- **Вкладочная навигация** между документами через shadcn/ui Tabs
- **Типографика проекта** с использованием кастомных шрифтов
- **Структурированный контент** с правильной HTML семантикой

**UI компоненты:**
```typescript
// apps/web/src/app/legal/page.tsx
- Card, CardContent, CardHeader, CardTitle
- Tabs, TabsContent, TabsList, TabsTrigger  
- Button для навигации
- Link для внешних ссылок
```

### Система согласия при регистрации

**Фронтенд валидация:**
```typescript
// apps/web/src/app/auth/register/page.tsx
const [formData, setFormData] = useState({
  email: '',
  password: '',
  agreeToTerms: false,  // Новое поле
});

// Проверка перед отправкой
if (!formData.agreeToTerms) {
  setError('Необходимо согласиться с условиями...');
  return;
}
```

**Серверная валидация:**
```typescript
// apps/web/src/app/api/auth/register/route.ts
const { email, password, name, agreeToTerms } = await req.json();

if (!agreeToTerms) {
  return NextResponse.json({ 
    error: 'Необходимо согласиться с условиями...' 
  }, { status: 400 });
}
```

**UI компонент Checkbox:**
```typescript
// apps/web/src/components/ui/checkbox.tsx
export interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: React.ReactNode;  // Поддержка JSX в label
}
```

### Правовое соответствие

**Документы включают:**
- ✅ **Публичная оферта** - полные условия использования платформы
- ✅ **Политика конфиденциальности** - обработка персональных данных по ФЗ-152
- ✅ **Контактная информация** - реквизиты оператора
- ✅ **Актуальные даты** - последние обновления документов

**Соответствие законодательству:**
- Федеральный закон № 152-ФЗ "О персональных данных"
- Федеральный закон № 2300-1 "О защите прав потребителей"  
- Федеральный закон № 161-ФЗ "О национальной платежной системе"
- Гражданский кодекс РФ (ст. 437 - публичная оферта)

### Контракты и валидация

#### DTO схемы (`packages/contracts/src/dto.ts`)

**Профили пользователей:**
- `UpdateProfileDto` - обновление основного профиля (name, avatarUrl, rpgExperience, contacts)
- `ProfileDto` - полная схема профиля пользователя с роль-специфичными полями
- `CreatePlayerProfileDto` / `UpdatePlayerProfileDto` - управление профилем игрока
- `CreateMasterProfileDto` / `UpdateMasterProfileDto` - управление профилем мастера
- `RegisterDto` - регистрация пользователя (имя теперь опциональное, обязательное согласие с условиями)

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
- **`/player/search`** → `player/search/page.tsx` — поиск доступных групп
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
- ✅ **Система заявок в группы** с уведомлениями для мастеров
- ✅ **Поиск и фильтрация групп** для игроков
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
- **`MasterDashboardContent.tsx`** - контент кабинета мастера с уведомлениями о заявках
- **`MasterPageWrapper.tsx`** - обертка страницы мастера
- **`PlayerDashboardContent.tsx`** - контент кабинета игрока с отображением заявок
- **`PlayerPageWrapper.tsx`** - обертка страницы игрока

#### Компоненты системы заявок:
- **`GroupApplicationsList.tsx`** - список заявок для мастера с возможностью принятия/отклонения
- **`PlayerApplicationsList.tsx`** - список заявок игрока с отображением статусов
- **`PlayerProfileModal.tsx`** - модальное окно с профилем игрока для мастера
- **`SearchGroupsList.tsx`** - поиск и фильтрация доступных групп
- **`GroupSearchCard.tsx`** - карточка группы в результатах поиска

### API и данные
- **BFF** через Next.js API Routes/Server Actions, типы запросов/ответов — из `@zv/contracts`
- **Верификация входящих DTO** — `zod` из `contracts/src/dto`
- **React Query** для кеширования и синхронизации данных с сервером
- **Оптимистичные обновления** для лучшего UX

### Планируемые функции UI
- Таблицы и фильтры для сессий, заказов
- Интерактивные руководства по игре
- Real-time уведомления через WebSocket

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
7. ✅ **ПРОТЕСТИРОВАНО**: Полный цикл покупки и использования баттлпассов
8. ✅ **ПРОТЕСТИРОВАНО**: Создание отчетов мастерами через систему групп
9. ✅ **ПРОТЕСТИРОВАНО**: Модерация отчетов администраторами
10. ✅ **ПРОТЕСТИРОВАНО**: Автоматическое списание игр при одобрении отчетов

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

## 📁 Система управления файлами (MinIO)

### Архитектура файлового хранилища

**MinIO** используется как S3-совместимое объектное хранилище для всех файлов пользователей:

#### Структура бакетов:
- **`avatars`** - аватары пользователей и персонажей
  - `users/` - аватары пользователей  
  - `characters/` - аватары персонажей
- **`documents`** - документы и листы персонажей
  - `character-sheets/` - листы персонажей
  - `reports/` - вложения к отчетам
- **`uploads`** - загрузки администраторов
  - `products/` - изображения товаров

#### Политики доступа:
- **`avatars`** - доступ через API проксирование (для отображения в интерфейсе)
- **`documents`** - приватный доступ (через presigned URLs)  
- **`uploads`** - доступ через API проксирование (для изображений товаров)

> **Примечание:** Прямой доступ к MinIO (порт 9000) ограничен. Все публичные файлы должны запрашиваться через API endpoint `/api/files/[...path]` для обеспечения безопасности и контроля доступа.

### API загрузки файлов

#### Основные endpoints:
- **`POST /api/upload`** - загрузка файла
- **`DELETE /api/upload/delete`** - удаление файла
- **`GET /api/files/[...path]`** - получение файла через проксирование из MinIO

#### Доступ к файлам:

**Проксирование через API** (рекомендуемый способ):
```
GET /api/files/{bucket}/{folder}/{filename}
```

Примеры:
- `/api/files/uploads/products/image.jpg` - изображение товара
- `/api/files/avatars/characters/avatar.png` - аватар персонажа

**Особенности API файлов:**
- Автоматическое определение Content-Type по расширению
- Кэширование файлов на 1 час (`Cache-Control: public, max-age=3600`)
- Поддержка ETag для оптимизации кэширования
- Доступ только к публичным bucket'ам (`uploads`, `avatars`)
- Возврат соответствующих HTTP статусов (404 для несуществующих файлов)

#### Поддерживаемые типы загрузки:
```typescript
const UPLOAD_CONFIGS = {
  'avatar': {
    bucket: 'avatars',
    folder: 'users',
    maxSizeMB: 5,
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
  },
  'character-avatar': {
    bucket: 'avatars', 
    folder: 'characters',
    maxSizeMB: 5,
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
  },
  'character-sheet': {
    bucket: 'documents',
    folder: 'character-sheets', 
    maxSizeMB: 10,
    allowedTypes: ['application/pdf', 'image/jpeg', 'image/png', 'image/webp']
  },
  'product-image': {
    bucket: 'uploads',
    folder: 'products',
    maxSizeMB: 10,
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
  },
  'report-attachment': {
    bucket: 'documents',
    folder: 'reports',
    maxSizeMB: 10,
    allowedTypes: ['image/*', 'application/pdf', 'application/msword']
  }
}
```

### Безопасность файлов

#### Многоуровневая валидация:
1. **Проверка MIME-типа** - валидация заголовка Content-Type
2. **Проверка расширения** - блокировка опасных расширений (.exe, .bat, .cmd, .scr)
3. **Магические байты** - определение реального типа файла по содержимому
4. **Ограничение размера** - индивидуальные лимиты для каждого типа

#### Магические байты для определения типов:
```typescript
const MAGIC_BYTES = {
  PNG: [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A],
  JPEG: [0xFF, 0xD8, 0xFF],
  WEBP: [0x52, 0x49, 0x46, 0x46], // + WEBP на позиции 8
  GIF_87A: [0x47, 0x49, 0x46, 0x38, 0x37, 0x61],
  GIF_89A: [0x47, 0x49, 0x46, 0x38, 0x39, 0x61],
  PDF: [0x25, 0x50, 0x44, 0x46]
}
```

#### Контроль доступа:
- **PLAYER** - может загружать аватары и листы персонажей
- **MASTER** - дополнительно может загружать вложения к отчетам
- **MODERATOR/SUPERADMIN** - дополнительно может загружать изображения товаров

### Автоматическое управление файлами

#### Генерация имен файлов:
```typescript
// Формат: timestamp_uuid.extension
const fileName = `${Date.now()}_${uuidv4()}.${extension}`;
```

#### Автоудаление старых файлов:
При обновлении файлов (аватар, изображение товара) старые файлы автоматически удаляются:

```typescript
// В API профиля и товаров
if (newFileUrl && oldFileUrl && newFileUrl !== oldFileUrl) {
  await deleteOldFileIfExists(oldFileUrl);
}
```

#### Функции для работы с файлами:
- **`uploadFile(file, options)`** - загрузка с валидацией
- **`deleteFile(bucket, key)`** - удаление файла
- **`deleteOldFileIfExists(url)`** - безопасное удаление старого файла
- **`parseMinioUrl(url)`** - извлечение bucket и key из URL
- **`getPresignedUrl(bucket, key)`** - генерация временных ссылок

### UI компоненты

#### FileUpload компонент:
- **Drag & Drop** интерфейс загрузки
- **Предварительный просмотр** изображений
- **Прогресс-бар** загрузки
- **Обработка ошибок** с детальными сообщениями
- **Автоматическая интеграция** с формами

#### Интеграция в формы:
- **Профиль пользователя** - загрузка аватара
- **Создание товара** - загрузка изображения
- **Редактирование товара** - замена изображения с удалением старого
- **Создание персонажа** - загрузка аватара персонажа и листа персонажа

### Конфигурация MinIO

#### Переменные окружения:
```env
S3_ENDPOINT="http://localhost:9000"
S3_ACCESS_KEY="zv_admin"
S3_SECRET_KEY="zv_admin_password"
S3_BUCKET_AVATARS="avatars"
S3_BUCKET_DOCUMENTS="documents"
S3_BUCKET_UPLOADS="uploads"
```

#### Автоматическая инициализация:
При первом запуске автоматически:
1. Создаются необходимые бакеты
2. Настраиваются политики доступа
3. Проверяется подключение к MinIO

### Тестирование файловой системы

#### Страница тестирования безопасности:
**`/test-security`** - специальная страница для проверки системы безопасности:
- Автоматические тесты попыток загрузки вредоносных файлов
- Ручное тестирование различных типов файлов
- Отображение результатов валидации в реальном времени

#### Тестовые сценарии:
1. **Подделка MIME-типа** - .exe файл с Content-Type: image/png
2. **Подделка расширения** - malware.png с содержимым .exe файла  
3. **Batch файлы** - .bat файлы с подделкой MIME-типа
4. **Превышение размера** - файлы больше установленных лимитов
5. **Валидные файлы** - корректные изображения и документы

**Последнее обновление**: Сентябрь 2025 - добавлена безопасная система управления файлами с MinIO
