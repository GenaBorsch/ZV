# ТЗ: План мастера на следующую игру и сетка событий

**Версия:** 2.0 (финальная после критического ревью)  
**Дата:** 16 октября 2025  
**Статус:** Готово к реализации

---

## 🎯 Цель и ценность

При создании отчёта о прошедшей игре мастер **обязательно выбирает "сетку"** из 4 элементов на следующую сессию:
- **Монстр** (отдельная сущность с карточкой)
- **Локация** (текстовый элемент)
- **Основное сюжетное событие** (текстовый элемент)
- **Второстепенное событие** (текстовый элемент)

**Ключевые фичи:**
1. Кнопка **"Мне повезёт"** — автогенерация всей сетки случайными доступными элементами
2. Флаг **"Это продолжение прошлой сессии"** — подтягивает ранее закреплённые элементы этой группы
3. После одобрения отчёта (APPROVED) элементы **блокируются навсегда** и недоступны другим мастерам
4. Мастер дописывает **текстовый план** следующей игры (до 2000 символов)

---

## 🏗️ Архитектурные решения

### ✅ Принятые упрощения

| Вопрос | Решение |
|--------|---------|
| **Резервы/TTL** | ❌ Нет. Используем **оптимистическую блокировку**: проверка при создании отчёта |
| **Монстры vs тексты** | 🔄 **Две отдельные таблицы** (у монстров будущие фичи) |
| **Связь с группами** | ✅ Добавляем `groupId` в таблицу `reports` |
| **Блокировка навсегда** | ✅ Да, админы могут добавлять новые элементы и делать ручной unlock |
| **"Мне повезёт"** | ✅ Оставляем в MVP |
| **Админка** | 📂 `/admin/monsters` — отдельно, `/admin/story-pool` — для текстов |

---

## 📊 Модель данных (Drizzle)

### 1. Таблица `monsters`

```sql
CREATE TABLE monsters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(200) NOT NULL UNIQUE,
  image_url VARCHAR(512),
  description TEXT NOT NULL,
  last_known_location VARCHAR(200),
  bounty_alive INTEGER,
  bounty_dead INTEGER,
  
  -- Блокировка
  status VARCHAR(20) DEFAULT 'AVAILABLE' NOT NULL, -- AVAILABLE | LOCKED
  locked_by_report_id UUID REFERENCES reports(id),
  locked_by_group_id UUID REFERENCES groups(id),
  locked_at TIMESTAMP,
  
  is_active BOOLEAN DEFAULT TRUE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_monsters_status ON monsters(status) WHERE is_active = TRUE;
```

### 2. Таблица `story_texts`

```sql
CREATE TYPE story_text_type AS ENUM ('LOCATION', 'MAIN_EVENT', 'SIDE_EVENT');

CREATE TABLE story_texts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type story_text_type NOT NULL,
  text TEXT NOT NULL, -- от пары слов до абзаца
  
  -- Блокировка
  status VARCHAR(20) DEFAULT 'AVAILABLE' NOT NULL, -- AVAILABLE | LOCKED
  locked_by_report_id UUID REFERENCES reports(id),
  locked_by_group_id UUID REFERENCES groups(id),
  locked_at TIMESTAMP,
  
  is_active BOOLEAN DEFAULT TRUE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
  
  UNIQUE(type, text) -- один текст не повторяется в рамках типа
);

CREATE INDEX idx_story_texts_type_status ON story_texts(type, status) WHERE is_active = TRUE;
```

### 3. Расширение таблицы `reports`

```sql
ALTER TABLE reports 
ADD COLUMN group_id UUID REFERENCES groups(id) NOT NULL;

CREATE INDEX idx_reports_group_status ON reports(group_id, status);
```

### 4. Таблица `report_next_plans`

```sql
CREATE TABLE report_next_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID UNIQUE NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
  
  -- Продолжение прошлой сессии
  continued_from_report_id UUID REFERENCES reports(id),
  
  -- Текстовый план
  next_plan_text TEXT NOT NULL CHECK (char_length(next_plan_text) <= 2000),
  
  -- Сетка событий (4 слота)
  monster_id UUID NOT NULL REFERENCES monsters(id),
  location_text_id UUID NOT NULL REFERENCES story_texts(id),
  main_event_text_id UUID NOT NULL REFERENCES story_texts(id),
  side_event_text_id UUID NOT NULL REFERENCES story_texts(id),
  
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
  
  -- Проверка: текстовые элементы не повторяются
  CHECK (
    location_text_id != main_event_text_id AND
    location_text_id != side_event_text_id AND
    main_event_text_id != side_event_text_id
  )
);
```

---

## 🔧 API Контракты

### Админ-панель: Монстры

**Базовый путь:** `/api/admin/monsters`

#### GET `/api/admin/monsters`
Список монстров с фильтрацией.

**Query params:**
```typescript
{
  status?: 'AVAILABLE' | 'LOCKED',
  isActive?: boolean,
  search?: string, // поиск по title/description
  page?: number,
  limit?: number
}
```

**Response:**
```typescript
{
  data: Monster[],
  pagination: { total, page, limit, pages }
}
```

#### POST `/api/admin/monsters`
Создание монстра.

**Body:**
```typescript
{
  title: string, // required, unique
  imageUrl?: string,
  description: string, // required
  lastKnownLocation?: string,
  bountyAlive?: number,
  bountyDead?: number
}
```

#### PATCH `/api/admin/monsters/:id`
Редактирование монстра.

#### DELETE `/api/admin/monsters/:id`
Удаление монстра (запрещено если `status = LOCKED`).

#### POST `/api/admin/monsters/:id/unlock`
Ручная разблокировка (override) админом.

---

### Админ-панель: Текстовые события

**Базовый путь:** `/api/admin/story-texts`

#### GET `/api/admin/story-texts`
Список текстов с фильтрацией.

**Query params:**
```typescript
{
  type?: 'LOCATION' | 'MAIN_EVENT' | 'SIDE_EVENT',
  status?: 'AVAILABLE' | 'LOCKED',
  isActive?: boolean,
  search?: string,
  page?: number,
  limit?: number
}
```

#### POST `/api/admin/story-texts`
Создание текстового элемента.

**Body:**
```typescript
{
  type: 'LOCATION' | 'MAIN_EVENT' | 'SIDE_EVENT',
  text: string // required
}
```

#### PATCH `/api/admin/story-texts/:id`
Редактирование текста.

#### DELETE `/api/admin/story-texts/:id`
Удаление (запрещено если `status = LOCKED`).

#### POST `/api/admin/story-texts/:id/unlock`
Ручная разблокировка.

---

### Мастер: Выбор сетки

**Базовый путь:** `/api/story-pool`

#### GET `/api/story-pool/monsters/available`
Доступные монстры для выбора.

**Query params:**
```typescript
{
  search?: string,
  limit?: number
}
```

**Response:**
```typescript
{
  data: Array<{
    id: string,
    title: string,
    imageUrl: string | null,
    description: string,
    lastKnownLocation: string | null,
    bountyAlive: number | null,
    bountyDead: number | null
  }>
}
```

#### GET `/api/story-pool/texts/available`
Доступные текстовые элементы.

**Query params:**
```typescript
{
  type: 'LOCATION' | 'MAIN_EVENT' | 'SIDE_EVENT',
  search?: string,
  limit?: number
}
```

#### POST `/api/story-pool/feeling-lucky`
Случайная генерация сетки.

**Body:**
```typescript
{
  groupId: string // для проверки "продолжения"
}
```

**Response:**
```typescript
{
  monsterId: string,
  locationTextId: string,
  mainEventTextId: string,
  sideEventTextId: string,
  elements: {
    monster: MonsterDto,
    location: StoryTextDto,
    mainEvent: StoryTextDto,
    sideEvent: StoryTextDto
  }
}
```

**Логика:**
- Проверяет доступность элементов (status = AVAILABLE, isActive = true)
- Случайно выбирает по 1 элементу каждого типа
- Возвращает ID и полные данные для превью

---

### Интеграция в отчёты

#### POST `/api/reports`
Создание отчёта (расширенный DTO).

**Body:**
```typescript
{
  groupId: string, // NEW!
  description: string,
  players: string[], // массив userId
  
  // NEW: План следующей игры
  nextPlan: {
    continuedFromReportId?: string | null,
    nextPlanText: string, // max 2000 символов
    monsterId: string,
    locationTextId: string,
    mainEventTextId: string,
    sideEventTextId: string
  }
}
```

**Серверная логика:**
1. Валидирует, что все 4 элемента сейчас `status = AVAILABLE`
2. **Атомарно** в транзакции:
   - Создаёт `report` (status = PENDING)
   - Создаёт `report_next_plans`
   - **НЕ блокирует** элементы (блокировка только при APPROVED)
3. Если хоть один элемент уже LOCKED → ошибка 409:
   ```typescript
   {
     error: 'CONFLICT',
     conflicts: {
       monsterId?: 'LOCKED',
       locationTextId?: 'LOCKED',
       ...
     },
     alternatives: {
       monsters: Monster[], // доступные альтернативы
       locations: StoryText[],
       ...
     }
   }
   ```

#### PATCH `/api/reports/:id`
Редактирование отчёта (до модерации).

- Можно изменить `nextPlan` если отчёт в статусе `PENDING` или `REJECTED`
- Если `continuedFromReportId` установлен — нельзя менять сетку (только `nextPlanText`)

#### PATCH `/api/reports/:id` (модерация админом)
Одобрение/отклонение отчёта.

**Body (админ):**
```typescript
{
  status: 'APPROVED' | 'REJECTED',
  rejectionReason?: string // обязательно при REJECTED
}
```

**Серверный хук при APPROVED:**
```typescript
// 1. Обновить статус отчёта
await db.update(reports).set({ status: 'APPROVED' })

// 2. Получить сетку из report_next_plans
const plan = await db.select().from(reportNextPlans).where(...)

// 3. Заблокировать все 4 элемента (атомарно)
await db.transaction(async (tx) => {
  await tx.update(monsters)
    .set({ 
      status: 'LOCKED',
      lockedByReportId: reportId,
      lockedByGroupId: groupId,
      lockedAt: new Date()
    })
    .where(eq(monsters.id, plan.monsterId))
  
  // Аналогично для 3 текстовых элементов
  await tx.update(storyTexts)...
})

// 4. Списать баттлпассы игроков (существующая логика)

// 5. Отправить уведомления мастеру и игрокам
```

**Серверный хук при REJECTED:**
- Элементы остаются `AVAILABLE` (они не блокировались)
- Мастер может отредактировать отчёт и выбрать новую сетку

---

## 🎨 UI компоненты

### Админ-панель

#### `/admin/monsters`
Отдельный раздел для управления монстрами.

**Компоненты:**
- Таблица монстров с колонками: превью, название, описание, статус, действия
- Фильтры: статус (AVAILABLE/LOCKED), активность, поиск
- Модальное окно создания/редактирования с формой:
  - Загрузка изображения (через MinIO)
  - Название (required, unique)
  - Описание (required, textarea)
  - Последняя локация
  - Награды (числовые поля)
- Кнопка "Разблокировать" для LOCKED монстров (с подтверждением)
- История блокировок (в детальной карточке)

#### `/admin/story-pool`
Управление текстовыми событиями.

**Компоненты:**
- Табы по типам: Локации / Основные события / Второстепенные события
- Таблица с колонками: текст, статус, действия
- Фильтры: статус, активность, поиск
- Простая форма создания/редактирования:
  - Тип (radio buttons / автоматически по табу)
  - Текст (textarea, до абзаца)
- Кнопка "Разблокировать" для LOCKED элементов

---

### Кабинет мастера

#### `/master/reports/create` (расширение)

**Новый блок: "План следующей игры"**

**Структура:**
```
┌─────────────────────────────────────────┐
│ 📝 План следующей игры                   │
├─────────────────────────────────────────┤
│ ☐ Это продолжение прошлой сессии        │  <- Checkbox
├─────────────────────────────────────────┤
│ Сетка событий:                          │
│                                         │
│ ┌────────┐ ┌────────┐ ┌────────┐ ┌────┐│
│ │ МОНСТР │ │ЛОКАЦИЯ │ │ОСНОВНОЕ│ │ВТО-││
│ │        │ │        │ │        │ │РОС.││
│ │ [выбр] │ │ [выбр] │ │ [выбр] │ │[в.]││
│ └────────┘ └────────┘ └────────┘ └────┘│
│                                         │
│        [🎲 Мне повезёт]                 │  <- Кнопка рандома
├─────────────────────────────────────────┤
│ Описание плана:                         │
│ ┌─────────────────────────────────────┐ │
│ │ [Текстовый план...]                 │ │
│ │                                     │ │
│ └─────────────────────────────────────┘ │
│ 0 / 2000 символов                       │  <- Счётчик
└─────────────────────────────────────────┘
```

**UX-логика:**

1. **Чекбокс "Продолжение":**
   - Если включён → загружается последний APPROVED отчёт этой группы
   - Сетка автоматически заполняется LOCKED элементами из того отчёта
   - Слоты становятся **disabled** (нельзя изменить)
   - Поле `nextPlanText` активно (можно дописать новый план)
   - Кнопка "Мне повезёт" скрыта

2. **Слоты выбора:**
   - **Монстр:** карточка с превью (изображение, название, краткое описание)
   - **Текстовые:** просто текст в рамке
   - Кнопка "Выбрать" открывает модальное окно:
     - Для монстров: карточки с изображениями (grid)
     - Для текстов: список строк
     - Поиск/фильтр в модалке
   - После выбора показывается кнопка "Изменить"

3. **Кнопка "Мне повезёт":**
   - Отправляет запрос `POST /api/story-pool/feeling-lucky`
   - Заполняет все 4 слота случайными элементами
   - Показывает loader при загрузке
   - При ошибке (недостаточно элементов) показывает предупреждение

4. **Textarea плана:**
   - Живой счётчик символов
   - Предупреждение при приближении к лимиту (1900/2000)
   - Ошибка при превышении (клиентская валидация)

5. **Валидация перед отправкой:**
   - Если НЕ "продолжение" → все 4 слота обязательны
   - `nextPlanText` обязателен, max 2000 символов
   - Проверка уникальности текстовых элементов (нельзя один текст в разные слоты)

6. **Обработка конфликтов (409):**
   - Если элемент уже заблокирован другим мастером:
   - Показать уведомление: "Элемент [название] уже занят"
   - Подсветить проблемные слоты
   - Показать модалку с альтернативами: "Выберите другой элемент"
   - Автоматически открыть модал выбора для конфликтного слота

**Компоненты:**
- `NextGamePlanBlock.tsx` — основной блок
- `StoryGridSelector.tsx` — сетка из 4 слотов
- `MonsterCard.tsx` — карточка монстра с превью
- `MonsterSelectModal.tsx` — модалка выбора монстра
- `StoryTextSelectModal.tsx` — модалка выбора текста
- `FeelingLuckyButton.tsx` — кнопка рандома

---

## 🔐 Безопасность и права доступа

### RBAC правила

| Роль | Доступ |
|------|--------|
| **SUPERADMIN / MODERATOR** | Полный доступ к `/admin/monsters` и `/admin/story-pool` (CRUD, unlock) |
| **MASTER** | Доступ к выбору элементов, создание планов, редактирование до модерации |
| **PLAYER** | Только просмотр своих отчётов (план видят) |

### Валидация на сервере

```typescript
// Middleware проверка роли
if (!['MODERATOR', 'SUPERADMIN'].includes(userRole)) {
  return res.status(403).json({ error: 'Access denied' })
}

// Проверка доступности элементов (атомарно)
const elements = await db.select()
  .from(monsters)
  .where(and(
    eq(monsters.id, monsterId),
    eq(monsters.status, 'AVAILABLE'),
    eq(monsters.isActive, true)
  ))

if (!elements.length) {
  throw new Error('Monster not available')
}

// Проверка уникальности в сетке
const textIds = [locationTextId, mainEventTextId, sideEventTextId]
if (new Set(textIds).size !== textIds.length) {
  throw new Error('Duplicate text elements')
}
```

---

## 🧪 Тестирование

### Unit тесты

**`packages/db/src/repositories/monstersRepo.test.ts`**
- `create()` — создание монстра
- `listAvailable()` — только AVAILABLE и isActive=true
- `lockByReport()` — блокировка при одобрении отчёта
- `unlock()` — ручная разблокировка админом
- `checkAvailability()` — проверка доступности списка ID

**`packages/db/src/repositories/storyTextsRepo.test.ts`**
- Аналогично для текстовых элементов

**`packages/db/src/repositories/reportsRepo.test.ts`**
- `createWithNextPlan()` — создание отчёта с планом
- `approveReport()` — блокировка элементов при одобрении
- `getLastApprovedForGroup()` — поиск последнего отчёта группы для "продолжения"

### E2E тесты (Playwright)

**Сценарий 1: Создание отчёта с "Мне повезёт"**
1. Мастер логинится
2. Переходит в создание отчёта
3. Нажимает "Мне повезёт"
4. Все 4 слота заполняются
5. Вводит текстовый план
6. Отправляет отчёт → статус PENDING
7. Админ одобряет → элементы становятся LOCKED

**Сценарий 2: Конкурентный доступ**
1. Два мастера (в разных браузерах) создают отчёты
2. Оба выбирают одного и того же монстра
3. Первый отправляет отчёт → успех
4. Админ одобряет первый отчёт → монстр LOCKED
5. Второй пытается отправить → ошибка 409
6. Видит уведомление о конфликте
7. Выбирает другого монстра → успех

**Сценарий 3: Продолжение прошлой сессии**
1. Мастер создаёт отчёт для группы А → одобрен → элементы LOCKED
2. Мастер создаёт новый отчёт для группы А
3. Включает чекбокс "Продолжение"
4. Сетка автоматически заполняется из прошлого отчёта
5. Слоты disabled (нельзя изменить)
6. Мастер дописывает новый текст плана
7. Отправляет → успех (элементы остаются LOCKED за этой группой)

**Сценарий 4: Модерация и откат**
1. Мастер создаёт отчёт с сеткой → PENDING
2. Админ отклоняет (REJECTED) → элементы остаются AVAILABLE
3. Мастер редактирует отчёт, меняет сетку
4. Отправляет снова → PENDING
5. Админ одобряет → элементы LOCKED

**Сценарий 5: Админ разблокирует элемент**
1. Монстр в статусе LOCKED
2. Админ открывает `/admin/monsters`
3. Нажимает "Разблокировать" → подтверждение
4. Монстр становится AVAILABLE
5. Другие мастера видят его в выборе

---

## 📦 Структура изменений в кодовой базе

### Packages

#### `packages/contracts/src/enums.ts`
```typescript
export enum StoryTextType {
  LOCATION = 'LOCATION',
  MAIN_EVENT = 'MAIN_EVENT',
  SIDE_EVENT = 'SIDE_EVENT',
}

export enum ElementStatus {
  AVAILABLE = 'AVAILABLE',
  LOCKED = 'LOCKED',
}
```

#### `packages/contracts/src/dto.ts`
```typescript
// Монстры
export const MonsterDto = z.object({
  id: z.string().uuid(),
  title: z.string().min(1).max(200),
  imageUrl: z.string().url().nullable(),
  description: z.string().min(1),
  lastKnownLocation: z.string().max(200).nullable(),
  bountyAlive: z.number().int().positive().nullable(),
  bountyDead: z.number().int().positive().nullable(),
  status: z.enum(['AVAILABLE', 'LOCKED']),
  isActive: z.boolean(),
})

export const CreateMonsterDto = MonsterDto.pick({
  title: true,
  imageUrl: true,
  description: true,
  lastKnownLocation: true,
  bountyAlive: true,
  bountyDead: true,
})

// Текстовые элементы
export const StoryTextDto = z.object({
  id: z.string().uuid(),
  type: z.enum(['LOCATION', 'MAIN_EVENT', 'SIDE_EVENT']),
  text: z.string().min(1).max(1000),
  status: z.enum(['AVAILABLE', 'LOCKED']),
  isActive: z.boolean(),
})

export const CreateStoryTextDto = StoryTextDto.pick({
  type: true,
  text: true,
})

// План следующей игры
export const ReportNextPlanDto = z.object({
  continuedFromReportId: z.string().uuid().nullable().optional(),
  nextPlanText: z.string().min(1).max(2000),
  monsterId: z.string().uuid(),
  locationTextId: z.string().uuid(),
  mainEventTextId: z.string().uuid(),
  sideEventTextId: z.string().uuid(),
})

// Расширение CreateReportDto
export const CreateReportDto = z.object({
  groupId: z.string().uuid(), // NEW!
  description: z.string().min(50),
  players: z.array(z.string().uuid()).min(1),
  nextPlan: ReportNextPlanDto, // NEW!
})

// Feeling Lucky Response
export const FeelingLuckyResponseDto = z.object({
  monsterId: z.string().uuid(),
  locationTextId: z.string().uuid(),
  mainEventTextId: z.string().uuid(),
  sideEventTextId: z.string().uuid(),
  elements: z.object({
    monster: MonsterDto,
    location: StoryTextDto,
    mainEvent: StoryTextDto,
    sideEvent: StoryTextDto,
  }),
})
```

### Repositories

#### `packages/db/src/repositories/monstersRepo.ts`
```typescript
export const monstersRepo = {
  // Админ CRUD
  async list(filters: { status?, isActive?, search?, page?, limit? }) { ... },
  async create(data: CreateMonsterDto) { ... },
  async update(id: string, data: Partial<CreateMonsterDto>) { ... },
  async delete(id: string) {
    // Проверка: нельзя удалить LOCKED
    const monster = await this.getById(id)
    if (monster.status === 'LOCKED') {
      throw new Error('Cannot delete locked monster')
    }
    await db.delete(monsters).where(eq(monsters.id, id))
  },
  
  // Выбор мастером
  async listAvailable(search?: string, limit = 50) {
    return db.select()
      .from(monsters)
      .where(and(
        eq(monsters.status, 'AVAILABLE'),
        eq(monsters.isActive, true),
        search ? ilike(monsters.title, `%${search}%`) : undefined
      ))
      .limit(limit)
  },
  
  // Блокировка при одобрении отчёта
  async lockByReport(monsterId: string, reportId: string, groupId: string) {
    await db.update(monsters)
      .set({
        status: 'LOCKED',
        lockedByReportId: reportId,
        lockedByGroupId: groupId,
        lockedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(and(
        eq(monsters.id, monsterId),
        eq(monsters.status, 'AVAILABLE') // атомарная проверка
      ))
  },
  
  // Разблокировка админом
  async unlock(monsterId: string) {
    await db.update(monsters)
      .set({
        status: 'AVAILABLE',
        lockedByReportId: null,
        lockedByGroupId: null,
        lockedAt: null,
        updatedAt: new Date(),
      })
      .where(eq(monsters.id, monsterId))
  },
  
  // Проверка доступности (для оптимистической блокировки)
  async checkAvailability(monsterIds: string[]) {
    const results = await db.select({ id: monsters.id })
      .from(monsters)
      .where(and(
        inArray(monsters.id, monsterIds),
        eq(monsters.status, 'AVAILABLE'),
        eq(monsters.isActive, true)
      ))
    
    return results.map(r => r.id)
  },
}
```

#### `packages/db/src/repositories/storyTextsRepo.ts`
Аналогично `monstersRepo`, с учётом `type` поля.

#### `packages/db/src/repositories/reportsRepo.ts`
```typescript
export const reportsRepo = {
  // ... существующие методы
  
  async createWithNextPlan(data: CreateReportDto, masterId: string) {
    return db.transaction(async (tx) => {
      // 1. Проверить доступность всех элементов (оптимистическая блокировка)
      const availableMonsters = await monstersRepo.checkAvailability([data.nextPlan.monsterId])
      const availableTexts = await storyTextsRepo.checkAvailability([
        data.nextPlan.locationTextId,
        data.nextPlan.mainEventTextId,
        data.nextPlan.sideEventTextId,
      ])
      
      if (!availableMonsters.includes(data.nextPlan.monsterId)) {
        throw new ConflictError('Monster not available', { monsterId: 'LOCKED' })
      }
      
      if (availableTexts.length !== 3) {
        // Определить какие именно заблокированы
        const conflicts = {}
        if (!availableTexts.includes(data.nextPlan.locationTextId)) conflicts.locationTextId = 'LOCKED'
        if (!availableTexts.includes(data.nextPlan.mainEventTextId)) conflicts.mainEventTextId = 'LOCKED'
        if (!availableTexts.includes(data.nextPlan.sideEventTextId)) conflicts.sideEventTextId = 'LOCKED'
        throw new ConflictError('Some texts not available', conflicts)
      }
      
      // 2. Создать отчёт
      const [report] = await tx.insert(reports).values({
        groupId: data.groupId,
        masterId,
        description: data.description,
        status: 'PENDING',
      }).returning()
      
      // 3. Создать план
      await tx.insert(reportNextPlans).values({
        reportId: report.id,
        ...data.nextPlan,
      })
      
      // 4. Создать связи с игроками
      await tx.insert(reportPlayers).values(
        data.players.map(playerId => ({
          reportId: report.id,
          playerId,
        }))
      )
      
      return report
    })
  },
  
  async approveReport(reportId: string) {
    return db.transaction(async (tx) => {
      // 1. Обновить статус отчёта
      await tx.update(reports)
        .set({ status: 'APPROVED', updatedAt: new Date() })
        .where(eq(reports.id, reportId))
      
      // 2. Получить план и groupId
      const [report] = await tx.select({ groupId: reports.groupId })
        .from(reports)
        .where(eq(reports.id, reportId))
      
      const [plan] = await tx.select()
        .from(reportNextPlans)
        .where(eq(reportNextPlans.reportId, reportId))
      
      // 3. Заблокировать все элементы
      await monstersRepo.lockByReport(plan.monsterId, reportId, report.groupId)
      await storyTextsRepo.lockByReport(plan.locationTextId, reportId, report.groupId)
      await storyTextsRepo.lockByReport(plan.mainEventTextId, reportId, report.groupId)
      await storyTextsRepo.lockByReport(plan.sideEventTextId, reportId, report.groupId)
      
      // 4. Списать баттлпассы (существующая логика)
      await battlepassesRepo.redeemForReport(reportId)
      
      // 5. Отправить уведомления (существующая логика)
      await notificationsRepo.notifyReportApproved(reportId)
    })
  },
  
  async getLastApprovedForGroup(groupId: string) {
    const [report] = await db.select()
      .from(reports)
      .where(and(
        eq(reports.groupId, groupId),
        eq(reports.status, 'APPROVED')
      ))
      .orderBy(desc(reports.createdAt))
      .limit(1)
    
    if (!report) return null
    
    const [plan] = await db.select()
      .from(reportNextPlans)
      .where(eq(reportNextPlans.reportId, report.id))
    
    return { report, plan }
  },
}
```

---

## 🚀 План реализации (порядок задач)

### Фаза 1: База данных и миграции
1. ✅ Создать таблицу `monsters`
2. ✅ Создать enum `story_text_type` и таблицу `story_texts`
3. ✅ Добавить `groupId` в таблицу `reports`
4. ✅ Создать таблицу `report_next_plans`
5. ✅ Создать индексы для производительности
6. ✅ Написать сиды (10-20 монстров, 20-40 текстов по каждому типу)

### Фаза 2: Контракты и репозитории
1. ✅ Добавить enums и DTO в `packages/contracts`
2. ✅ Создать `monstersRepo.ts`
3. ✅ Создать `storyTextsRepo.ts`
4. ✅ Расширить `reportsRepo.ts`
5. ✅ Написать unit-тесты для репозиториев

### Фаза 3: API (Админ-панель)
1. ✅ `GET/POST/PATCH/DELETE /api/admin/monsters`
2. ✅ `POST /api/admin/monsters/:id/unlock`
3. ✅ `GET/POST/PATCH/DELETE /api/admin/story-texts`
4. ✅ `POST /api/admin/story-texts/:id/unlock`

### Фаза 4: API (Мастер)
1. ✅ `GET /api/story-pool/monsters/available`
2. ✅ `GET /api/story-pool/texts/available`
3. ✅ `POST /api/story-pool/feeling-lucky`
4. ✅ Расширить `POST /api/reports` (с nextPlan)
5. ✅ Расширить `PATCH /api/reports/:id` (модерация с блокировкой)

### Фаза 5: UI (Админ-панель)
1. ✅ Создать страницу `/admin/monsters`
2. ✅ Создать страницу `/admin/story-pool`
3. ✅ Компоненты: таблицы, формы, модалки
4. ✅ Кнопка "Разблокировать" с подтверждением

### Фаза 6: UI (Мастер)
1. ✅ Компонент `NextGamePlanBlock.tsx`
2. ✅ Компонент `StoryGridSelector.tsx`
3. ✅ Модалки выбора монстров/текстов
4. ✅ Кнопка "Мне повезёт"
5. ✅ Чекбокс "Продолжение" с логикой подтягивания
6. ✅ Textarea с счётчиком символов
7. ✅ Обработка конфликтов (409) с альтернативами

### Фаза 7: Тестирование и полировка
1. ✅ E2E тесты (5 сценариев выше)
2. ✅ Проверка производительности (индексы)
3. ✅ Обработка edge cases
4. ✅ Обновить документацию (README, TECHNICAL_DOCUMENTATION)

---

## 📊 Оценка сложности

| Фаза | Задач | Сложность | Время |
|------|-------|-----------|-------|
| База данных | 6 | Низкая | 2-3 часа |
| Контракты/Репо | 5 | Средняя | 4-5 часов |
| API Админ | 4 | Низкая | 3-4 часа |
| API Мастер | 5 | Высокая | 6-8 часов |
| UI Админ | 4 | Средняя | 5-6 часов |
| UI Мастер | 7 | Высокая | 10-12 часов |
| Тесты | 4 | Средняя | 4-6 часов |
| **ИТОГО** | **35** | - | **34-44 часа** |

---

## 🎯 Критерии готовности (DoD)

- [ ] Все миграции применены, сиды работают
- [ ] Unit-тесты покрывают репозитории (>80%)
- [ ] Админ может создавать/редактировать монстров и тексты
- [ ] Админ может разблокировать элементы
- [ ] Мастер видит только доступные элементы при выборе
- [ ] Кнопка "Мне повезёт" генерирует валидную сетку
- [ ] Чекбокс "Продолжение" корректно подтягивает прошлую сетку
- [ ] При конфликте (409) мастер видит альтернативы
- [ ] При одобрении отчёта элементы блокируются навсегда
- [ ] При отклонении отчёта элементы остаются доступными
- [ ] E2E тесты проходят (5/5)
- [ ] Документация обновлена

---

## 📚 Дополнительные материалы

### Примеры сидов

**Монстры:**
```typescript
{
  title: 'Кровавый Дракон Тенебриса',
  imageUrl: '/monsters/dragon-001.jpg',
  description: 'Древний красный дракон, терроризирующий торговые пути. Известен своей жестокостью и любовью к золоту.',
  lastKnownLocation: 'Пещеры Огненной Горы',
  bountyAlive: 50000,
  bountyDead: 25000,
}
```

**Локации:**
```typescript
{ type: 'LOCATION', text: 'Заброшенный храм в лесу Вечной Ночи' }
{ type: 'LOCATION', text: 'Подземелья под королевским дворцом' }
{ type: 'LOCATION', text: 'Летающий остров магов' }
```

**События:**
```typescript
{ type: 'MAIN_EVENT', text: 'Похищение наследника престола' }
{ type: 'MAIN_EVENT', text: 'Открытие портала в другой мир' }
{ type: 'SIDE_EVENT', text: 'Встреча со странствующим торговцем' }
{ type: 'SIDE_EVENT', text: 'Нападение бандитов на караван' }
```

---

## ✅ Финальный чек-лист согласований

- [x] Без TTL/резервов — оптимистическая блокировка
- [x] Монстры — отдельная таблица и раздел админки
- [x] Текстовые события — единая таблица `story_texts`
- [x] Добавлен `groupId` в таблицу `reports`
- [x] Блокировка навсегда с возможностью ручного unlock
- [x] "Мне повезёт" в MVP
- [x] Лимит `nextPlanText` — 2000 символов
- [x] "Продолжение" подтягивает последний APPROVED отчёт группы

---

**Готово к реализации! 🚀**

Если есть ещё вопросы или нужны уточнения — пиши.

