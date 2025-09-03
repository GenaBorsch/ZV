## Auth страницы и поведение

- **Маршруты**: `/auth/register`, `/auth/login`, `/profile`, `/player`, `/master`, `/admin`.
- **Формы**: на shadcn/ui компонентах (`Input`, `Button`, `Tabs`, `Card`) с полной валидацией через zod.
- **Регистрация**: `fetch('/api/auth/register', { method: 'POST', body: JSON })` → имя теперь опциональное при регистрации.
- **Логин**: `signIn('credentials', { redirect: false, email, password })` → проверка заполненности профиля → редирект на `/profile` или основную страницу роли.
- **Профиль**: полная страница редактирования с табами для общей информации, профиля игрока и мастера.
- **Logout**: кнопка в хедере вызывает `signOut({ callbackUrl: '/auth/login' })`.
- **Доступ**: middleware проверяет cookie `next-auth.*` и заполненность профиля, редиректит на `/profile` при необходимости.
## Frontend (apps/web)

### Стек
- Next.js 15 (App Router), React 18, TypeScript
- Tailwind CSS (+ tailwindcss-animate), **shadcn/ui** (@radix-ui/react-tabs и др.)
- Auth: NextAuth v4, валидация форм — zod + react-hook-form
- Состояние: Zustand, данные — **@tanstack/react-query** (обновлена версия)

### Навигация (страницы)
Директория: `apps/web/src/app`
- `/` → `page.tsx` — главная
- `/auth/login` → `auth/login/page.tsx` — вход
- `/auth/register` → `auth/register/page.tsx` — регистрация
- **`/profile`** → **`profile/page.tsx`** — **страница редактирования профиля пользователя** ✅
- `/player` → `player/page.tsx` — кабинет игрока
- `/master` → `master/page.tsx` — кабинет мастера
- `/admin` → `admin/page.tsx` — админ-панель
- `/admin/users` → `admin/users/page.tsx` — **список пользователей** ✅
- `/admin/users/[id]` → `admin/users/[id]/page.tsx` — **детальная страница пользователя** ✅
- `/admin/products` → `admin/products/page.tsx` — управление товарами

Общий каркас: `layout.tsx`, глобальные стили: `globals.css`.

### Конфигурации
- `next.config.js`:
  - `serverExternalPackages: ['@zv/db']` — разрешает использовать пакет `@zv/db` (Drizzle ORM)
  - `images.domains = ['localhost']`, remotePatterns для MinIO на `localhost:9000`
  - Заголовки для `/api/*`: CORS (методы, заголовки, origin `*`)
- `tsconfig.json`: alias `@/*`, `@/components/*`, `@/lib/*`, `@/types/*`
- `tailwind.config.js`: сканирует `app`, `src`, `components`; настраивает тему и анимации

### Реализованные функции UI ✅
- ✅ **Модуль управления пользователями** с поиском, фильтрацией и пагинацией
- ✅ **Система управления профилями** с полным функционалом редактирования
- ✅ **Формы с валидацией** через react-hook-form + zod
- ✅ **RBAC система** с middleware защитой
- ✅ **Responsive дизайн** на Tailwind CSS
- ✅ **Оптимистичный UI** для лучшего UX
- ✅ **Компоненты shadcn/ui**: Card, Tabs, Button, Input, Label, Select, Textarea
- ✅ **Проверка заполненности профиля** с автоматическим редиректом

### Планируемые функции UI
- Компоненты форм на shadcn/ui с кастомной валидацией
- Таблицы и фильтры для сессий, групп, заказов
- Просмотр и редактирование профилей игроков и мастеров

### API и данные
- BFF через Next.js API Routes/Server Actions, типы запросов/ответов — из `@zv/contracts`
- Верификация входящих DTO — `zod` из `contracts/src/dto`


