# Звёздное Веретено - Личные кабинеты и админ-панель

**Звёздное Веретено** — это веб-платформа для управления настольной ролевой игрой (НРИ) "Звёздное Веретено". Проект представляет собой систему личных кабинетов для игроков, мастеров и администраторов, обеспечивающую полный цикл управления игровым процессом.

## 🎯 Основные цели проекта

- 🎮 **Личные кабинеты** для игроков и мастеров НРИ «Звёздное Веретено»
- 🛠️ **Админ-панель** для управления сезонами, группами, сессиями, товарами и заказами
- 📦 **Монорепозиторий** с едиными контрактами типов и общими пакетами
- 💰 **Система платежей** через YooKassa для продажи баттлпассов
- 📊 **Управление игровым процессом** с отчетностью и аналитикой

## 🏗️ Технологический стек

### Frontend
- **Next.js 15** с App Router
- **React 18** + **TypeScript**
- **Tailwind CSS** + **shadcn/ui** (utility-first + headless-компоненты)
- **Zustand** для управления состоянием
- **@tanstack/react-query** для работы с данными

### Backend
- **Next.js API Routes** + **Server Actions** (BFF архитектура)
- **PostgreSQL** в качестве основной БД
- **Drizzle ORM** для работы с базой данных
- **NextAuth v4** для аутентификации (email + пароль, планируется Telegram OAuth)

### Инфраструктура
- **MinIO** (S3-совместимое хранилище файлов)
- **YooKassa** для обработки платежей
- **Docker & Docker Compose** для локальной разработки
- **pnpm** workspaces для управления монорепозиторием

## 🚀 Быстрый старт

### Предварительные требования

- Node.js 18+
- pnpm 8+
- Docker & Docker Compose

### 1. Клонирование и установка

```bash
git clone <repository-url>
cd zvezdnoe-vereteno
pnpm install
```

### 2. Настройка окружения

```bash
cp .env.example .env
# Отредактируйте .env файл
```

### 3. Запуск инфраструктуры

```bash
docker-compose up -d postgres minio
```

### 4. Настройка базы данных

```bash
pnpm db:generate
pnpm db:migrate
pnpm db:seed
```

### 5. Запуск приложения

```bash
pnpm dev
```

Приложение будет доступно по адресу: http://localhost:3000

### Демо-аккаунты для тестирования

- **Администратор**: `demoadmin@zvezdnoe-vereteno.ru` / `demo1234`
- **Модератор**: `demomoderator@zvezdnoe-vereteno.ru` / `demo1234`
- **Мастер**: `demomaster@zvezdnoe-vereteno.ru` / `demo1234`
- **Игрок**: `demoplayer@zvezdnoe-vereteno.ru` / `demo1234`

## 📁 Структура монорепозитория

```
apps/
  web/                # Next.js приложение (BFF + UI)
packages/
  db/                 # Drizzle ORM: схема и миграции
  ui/                 # Общий UI-кит (в разработке)
  contracts/          # Типы, DTO, события
  utils/              # Общие утилиты
```

### Описание пакетов:

- **`apps/web`**: основное веб-приложение с клиентским интерфейсом и BFF-слоем
- **`packages/db`**: Drizzle ORM схемы, миграции и сиды для базы данных
- **`packages/contracts`**: единые типы API/DTO/Enums/Events для фронта и бэка
- **`packages/ui`**: общий UI-кит (планируется интеграция shadcn/ui)
- **`packages/utils`**: общие утилиты (валидация, даты, роли, className merge)

## 📈 Статус проекта

**Текущая готовность**: ~80% базового функционала

### ✅ Реализованные модули:

1. **Система аутентификации и авторизации** - ГОТОВ ✅
   - Регистрация и вход через email/пароль
   - RBAC система с ролями (PLAYER, MASTER, MODERATOR, SUPERADMIN)
   - Middleware для защиты приватных страниц
   - Автоматический редирект по ролям

2. **Модуль управления пользователями (Админ-панель)** - ГОТОВ ✅
   - Полнофункциональный CRUD для пользователей
   - Современный UI с поиском, фильтрацией и пагинацией
   - Управление ролями с транзакционной безопасностью
   - Валидация данных через Zod схемы

3. **Система управления игровыми группами** - ГОТОВ ✅
   - **Кабинет мастера**: создание, редактирование, управление группами
   - **Кабинет игрока**: просмотр групп, присоединение, выход из групп
   - **Реферальная система**: автоматическая генерация кодов и ссылок
   - **Современный UI**: responsive интерфейс с модальными окнами

4. **Базовая инфраструктура** - ГОТОВ ✅
   - Next.js 15 с App Router
   - NextAuth v4 с JWT стратегией
   - Drizzle ORM + PostgreSQL
   - Монорепозиторий с pnpm workspaces

### 🚧 В разработке:
- Система управления игровыми сессиями
- Система баттлпассов и платежей
- Интеграция с YooKassa для платежей
- Система персонажей игроков

## 🔧 Команды

- `pnpm dev` - Запуск в режиме разработки
- `pnpm build` - Сборка для продакшена
- `pnpm db:generate` - Генерация миграций (Drizzle)
- `pnpm db:migrate` - Применение миграций (Drizzle)
- `pnpm db:seed` - Заполнение тестовыми данными
- `pnpm db:studio` - Открытие Drizzle Studio

## 🧪 How to test auth (step 1)

- Приложение может стартовать на `:3001`, если `:3000` занят. Смотрите лог `next dev`.
- Откройте `/auth/register` — зарегистрируйте нового пользователя (в БД появится `password_hash`).
- Откройте `/auth/login` — войдите email+пароль. При успехе попадёте на `/player`.
- Без сессии доступ к `/player|/master|/admin` редиректит на `/auth/login` (проверка cookie `next-auth`).
- В хедере есть кнопка «Выйти» — вернёт на `/auth/login` и удалит сессию.

### Технические детали

- Auth: NextAuth Credentials (JWT стратегия). В jwt/session пробрасываются `id` и `roles`.
- Бэкенд: Drizzle ORM, таблицы `users`, `user_roles`. Пароль — `bcryptjs.hashSync(password, 12)`.
- Регистрация: `POST /api/auth/register` → 201 `{ ok: true }` или 409 при конфликте email.
- Логин: клиент вызывает `signIn('credentials', { redirect: false })`; при успехе — клиентский редирект на `/player`.

### ENV (обязательно)

Задайте в корневом `.env`:

```
DATABASE_URL=postgresql://zv_user:zv_password@localhost:5433/zvezdnoe_vereteno
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=dev-secret
```

Для локальной разработки файл `.env` автоматически подключается в приложении через симлинк `.env.local`.

### Troubleshooting

- Сервер поднялся на `:3001`: переходите на `http://localhost:3001`.
- Ошибка модуля `bcrypt`: используется `bcryptjs` (JS-версия). Убедитесь, что зависимости установлены: `pnpm -C apps/web i`.

### Перенос на другую машину

См. подробное руководство в `project_docs/MIGRATION.md` (бэкап/восстановление БД, перенос MinIO, env).
- В URL видны `?email=&password=`: перейдите на страницу напрямую, формы отправляются POST и не добавляют параметры; сторонние ссылки с query не использовать.

## 🌐 Развертывание

- **Основной сайт**: zvezdnoe-vereteno.ru (Tilda)
- **Личные кабинеты**: app.zvezdnoe-vereteno.ru (Next.js)

## 📚 Документация

Подробная техническая документация находится в каталоге [`project_docs/`](./project_docs/):

- **[PROJECT_DESCRIPTION.md](./project_docs/PROJECT_DESCRIPTION.md)** - основное описание проекта, стек, функции
- **[ADMIN_USERS.md](./project_docs/ADMIN_USERS.md)** - модуль управления пользователями
- **[DATABASE.md](./project_docs/DATABASE.md)** - модель данных и схема БД
- **[DEMO_ACCOUNTS.md](./project_docs/DEMO_ACCOUNTS.md)** - демо-аккаунты и тестирование
- **[ARCHITECTURE.md](./project_docs/ARCHITECTURE.md)** - архитектурный обзор
- **[FRONTEND.md](./project_docs/FRONTEND.md)** - фронтенд: страницы, конфиги, UI
- **[PACKAGES.md](./project_docs/PACKAGES.md)** - описание пакетов монорепозитория
- **[DEVOPS.md](./project_docs/DEVOPS.md)** - окружение, Docker, команды
- **[COMMANDS.md](./project_docs/COMMANDS.md)** - полезные команды и troubleshooting
- **[MIGRATION.md](./project_docs/MIGRATION.md)** - перенос проекта на другую машину

### 🎯 Быстрое тестирование функций

1. **Система групп**: Войти как мастер → создать группу → войти как игрок → присоединиться
2. **Админ-панель**: Войти как администратор → управление пользователями
3. **Подробные инструкции**: см. [DEMO_ACCOUNTS.md](./project_docs/DEMO_ACCOUNTS.md)
