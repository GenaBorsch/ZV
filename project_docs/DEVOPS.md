## Next.js dev окружение и аутентификация

- Порты: dev-сервер поднимается на `3000`; если занят — на `3001` (см. вывод `next dev`).
- Окружение: корневой `.env` линкуется в `apps/web/.env.local` для локальной разработки.
- Обязательные переменные:

```
DATABASE_URL=postgresql://zv_user:zv_password@localhost:5432/zvezdnoe_vereteno
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=dev-secret
```

- Postgres: `docker-compose up -d postgres` (проверка порта `5432`).
- Миграции Drizzle: `pnpm db:migrate`.
- Замечание: используем `bcryptjs` вместо `bcrypt` для исключения нативных биндингов.
## DevOps и окружение

### Требования
- Node.js 18+, pnpm 8+
- Docker, Docker Compose

### Переменные окружения (см. `env.example`)
- БД: `DATABASE_URL`
- S3/MinIO: `S3_ENDPOINT`, `S3_ACCESS_KEY`, `S3_SECRET_KEY`, `S3_BUCKET_*`
- NextAuth: `NEXTAUTH_SECRET`, `NEXTAUTH_URL`
- Email: `EMAIL_FROM`, `SMTP_URL`
- Telegram (опц.): `TELEGRAM_BOT_TOKEN`, `TELEGRAM_WEBHOOK_URL`
- Платежи: `YKS_SHOP_ID`, `YKS_SECRET`
- Публичный URL: `PUBLIC_BASE_URL`
- Флаги: `FEATURE_PAYMENTS`, `FEATURE_TELEGRAM`,

Важно: правки `.env` выполняются вручную владельцем проекта. Провайдер оплаты: только YooKassa.

### Docker Compose (`docker-compose.yml`)
- `postgres`: 15-alpine, порт `5432`, пользователь `zv_user`, БД `zvezdnoe_vereteno`
- `minio`: RELEASE.2024-01-16, порты `9000` (API) и `9001` (Console)
- Volume'ы: `postgres_data`, `minio_data`

### Команды разработки
В корне монорепо:
- `pnpm install` — установка зависимостей
- Инфраструктура: `docker-compose up -d postgres minio`
- Prisma: `pnpm db:generate`, `pnpm db:migrate`, `pnpm db:seed`, `pnpm db:studio`
- Запуск приложения: `pnpm dev` (проксирует `apps/web`)

### Деплой (эскиз)
- Варианты: Docker контейнер Next.js (standalone), внешние сервисы Postgres/MinIO
- Секреты и ENV в CI/CD хранятся в Secret Store
- Миграции выполняются до старта приложения


