## Auth страницы и поведение (step 1)

- Маршруты: `/auth/register`, `/auth/login`, `/player`.
- Формы на shadcn-совместимых компонентах (`Input`, `Button`) без валидаторов.
- Регистрация: `fetch('/api/auth/register', { method: 'POST', body: JSON })` → по 201 редирект на `/auth/login`.
- Логин: `signIn('credentials', { redirect: false, email, password })` → при успехе клиентский редирект на `/player`.
- Logout: кнопка в хедере вызывает `signOut({ callbackUrl: '/auth/login' })`.
- Доступ: middleware пропускает только при наличии cookie `next-auth.*` на `/player|/master|/admin`, иначе редирект на `/auth/login`.
## Frontend (apps/web)

### Стек
- Next.js 15 (App Router), React 18, TypeScript
- Tailwind CSS (+ tailwindcss-animate), shadcn/ui (план)
- Auth: NextAuth v4, валидация форм — zod + react-hook-form
- Состояние: Zustand, данные — @tanstack/react-query

### Навигация (страницы)
Директория: `apps/web/src/app`
- `/` → `page.tsx` — главная
- `/auth/login` → `auth/login/page.tsx` — вход
- `/auth/register` → `auth/register/page.tsx` — регистрация
- `/player` → `player/page.tsx` — кабинет игрока
- `/master` → `master/page.tsx` — кабинет мастера
- `/admin` → `admin/page.tsx` — админ-панель (заглушка)

Общий каркас: `layout.tsx`, глобальные стили: `globals.css`.

### Конфигурации
- `next.config.js`:
  - `serverExternalPackages: ['@zv/db']` — разрешает использовать пакет `@zv/db` (Drizzle ORM)
  - `images.domains = ['localhost']`, remotePatterns для MinIO на `localhost:9000`
  - Заголовки для `/api/*`: CORS (методы, заголовки, origin `*`)
- `tsconfig.json`: alias `@/*`, `@/components/*`, `@/lib/*`, `@/types/*`
- `tailwind.config.js`: сканирует `app`, `src`, `components`; настраивает тему и анимации

### Планируемые функции UI
- Компоненты форм на шейдсн/UI с кастомной валидацией (без нативных всплывающих ошибок)
- Таблицы и фильтры для сессий, групп, заказов
- Просмотр и редактирование профилей

### API и данные
- BFF через Next.js API Routes/Server Actions, типы запросов/ответов — из `@zv/contracts`
- Верификация входящих DTO — `zod` из `contracts/src/dto`


