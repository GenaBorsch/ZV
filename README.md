# Звёздное Веретено - Личные кабинеты и админ-панель

Личные кабинеты для проведения игры по НРИ "Звёздное Веретено" с микросервисной архитектурой.

## 🏗️ Архитектура

- **Frontend**: Next.js 15 (App Router) + React 18 + TypeScript
- **UI**: Tailwind CSS + shadcn/ui
- **Backend**: Next.js API Routes + Server Actions
- **Database**: PostgreSQL + Drizzle ORM
- **Auth**: NextAuth v4 (email + пароль; опционально Telegram OAuth)
- **Storage**: MinIO (S3 API)
- **Payments**: YooKassa

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

## 📁 Структура проекта

```
apps/
  web/                # Next.js приложение (BFF + UI)
packages/
  db/                 # Drizzle ORM: схема и миграции
  ui/                 # Общий UI-кит
  contracts/          # Типы, DTO, события
  utils/              # Общие утилиты
```

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

## 🌐 Домены

- **Основной сайт**: zvezdnoe-vereteno.ru (Tilda)
- **Личные кабинеты**: app.zvezdnoe-vereteno.ru (Next.js)

## 📋 TODO

- [x] Базовая структура монорепо
- [x] Настройка Next.js с App Router
- [x] Интеграция Prisma + PostgreSQL
- [ ] Настройка NextAuth
- [x] Базовые модели данных
- [ ] API роуты и RBAC
- [ ] UI компоненты (shadcn/ui)
- [ ] Личные кабинеты (Игрок, Мастер, Админ)
- [ ] Система платежей и баттлпассов
- [ ] Интеграция с YooKassa
- [ ] Система уведомлений
- [ ] Тестирование и документация
