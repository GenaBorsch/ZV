# Многоэтапная сборка для Next.js приложения
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

# Собираем приложение
RUN pnpm build

# Продакшен этап
FROM node:18-alpine AS runner
WORKDIR /app

# Создаем пользователя без root прав
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Устанавливаем pnpm
RUN npm install -g pnpm

# Копируем только необходимые файлы для продакшена
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/static ./apps/web/.next/static

# Копируем package.json для возможности запуска миграций
COPY --from=builder /app/package.json ./
COPY --from=builder /app/packages/db/package.json ./packages/db/
COPY --from=builder /app/packages/db/dist ./packages/db/dist
COPY --from=builder /app/packages/db/drizzle ./packages/db/drizzle
COPY --from=builder /app/packages/db/drizzle.config.ts ./packages/db/
COPY --from=builder /app/node_modules ./node_modules

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV NODE_ENV=production
ENV HOSTNAME="0.0.0.0"

# Создаем скрипт для запуска с миграциями
COPY --chown=nextjs:nodejs <<EOF /app/start.sh
#!/bin/sh
echo "Запуск миграций базы данных..."
cd /app && pnpm db:migrate
echo "Запуск приложения..."
exec node apps/web/server.js
EOF

RUN chmod +x /app/start.sh

CMD ["/app/start.sh"]
