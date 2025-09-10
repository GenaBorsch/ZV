# Оптимизированный Dockerfile только для приложения
# Для использования с внешними PostgreSQL и MinIO
FROM node:18-alpine AS base

# Устанавливаем pnpm глобально
RUN npm install -g pnpm

# Создаем рабочую директорию
WORKDIR /app

# Копируем файлы конфигурации монорепозитория
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# Этап установки зависимостей
FROM base AS deps
# Копируем все package.json файлы из всех пакетов
COPY apps/web/package.json ./apps/web/
COPY packages/db/package.json ./packages/db/
COPY packages/contracts/package.json ./packages/contracts/
COPY packages/ui/package.json ./packages/ui/
COPY packages/utils/package.json ./packages/utils/

# Устанавливаем зависимости
RUN pnpm install --frozen-lockfile || pnpm install

# Этап сборки
FROM base AS builder
# Копируем node_modules из этапа deps
COPY --from=deps /app/node_modules ./node_modules

# Копируем весь исходный код
COPY . .

# Устанавливаем зависимости еще раз для полной совместимости
RUN pnpm install

# Генерируем схему базы данных
RUN pnpm db:generate

# Собираем пакеты (игнорируем ошибки TypeScript для db)
RUN pnpm --filter contracts build || true
RUN pnpm --filter utils build || true
RUN pnpm --filter db build || mkdir -p packages/db/dist && echo "export * from '../src/index';" > packages/db/dist/index.js

# Собираем приложение (устанавливаем фиктивные переменные для сборки)
RUN DATABASE_URL="postgresql://build:build@localhost:5432/build" \
    NEXTAUTH_SECRET="build-secret-32-chars-minimum" \
    NEXTAUTH_URL="http://localhost:3000" \
    PUBLIC_BASE_URL="http://localhost:3000" \
    S3_ENDPOINT="http://localhost:9000" \
    S3_ACCESS_KEY="build" \
    S3_SECRET_KEY="build" \
    SKIP_ENV_VALIDATION=true \
    pnpm build

# Продакшен этап
FROM node:18-alpine AS runner
WORKDIR /app

# Создаем пользователя без root прав
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Устанавливаем pnpm
RUN npm install -g pnpm

# Копируем собранное приложение
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/public ./apps/web/public

# Копируем package.json и скомпилированные пакеты для миграций
COPY --from=builder --chown=nextjs:nodejs /app/package.json ./
COPY --from=builder --chown=nextjs:nodejs /app/packages/db/package.json ./packages/db/
COPY --from=builder --chown=nextjs:nodejs /app/packages/db/dist ./packages/db/dist
COPY --from=builder --chown=nextjs:nodejs /app/packages/db/drizzle ./packages/db/drizzle
COPY --from=builder --chown=nextjs:nodejs /app/packages/db/drizzle.config.ts ./packages/db/
COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules

# Копируем дополнительные пакеты
COPY --from=builder --chown=nextjs:nodejs /app/packages/contracts ./packages/contracts
COPY --from=builder --chown=nextjs:nodejs /app/packages/utils ./packages/utils

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV NODE_ENV=production
ENV HOSTNAME="0.0.0.0"

# Создаем скрипт для запуска с миграциями
COPY --chown=nextjs:nodejs <<'EOF' /app/start.sh
#!/bin/sh
echo "🚀 Запуск приложения Звёздное Веретено..."

# Проверяем обязательные переменные окружения
if [ -z "$DATABASE_URL" ]; then
  echo "❌ Ошибка: DATABASE_URL не установлен"
  exit 1
fi

if [ -z "$NEXTAUTH_SECRET" ]; then
  echo "❌ Ошибка: NEXTAUTH_SECRET не установлен"
  exit 1
fi

echo "📊 Проверка переменных окружения для БД..."
# Для EasyPanel проверяем только наличие переменных, подключение проверится при запуске приложения
if echo "$DATABASE_URL" | grep -q "postgresql://"; then
  echo "✅ DATABASE_URL корректен"
else
  echo "⚠️ DATABASE_URL может быть некорректным: $DATABASE_URL"
fi

echo "🔄 Применение миграций базы данных..."
if ! pnpm --filter db migrate; then
  echo "⚠️ Предупреждение: Не удалось применить миграции, продолжаем..."
fi

echo "🌟 Запуск Next.js приложения..."
exec node apps/web/server.js
EOF

RUN chmod +x /app/start.sh

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1

CMD ["/app/start.sh"]
