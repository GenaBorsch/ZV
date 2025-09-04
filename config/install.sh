#!/bin/bash

echo "🚀 Установка зависимостей для Звёздное Веретено..."

# Проверяем наличие pnpm
if ! command -v pnpm &> /dev/null; then
    echo "❌ pnpm не установлен. Устанавливаем..."
    npm install -g pnpm
fi

# Устанавливаем зависимости
echo "📦 Устанавливаем зависимости..."
pnpm install

# Генерируем Prisma клиент
echo "🔧 Генерируем артефакты Drizzle (миграции/конфиг, если требуется)..."
cd packages/db
pnpm generate
cd ../..

# Собираем пакеты
echo "🏗️ Собираем пакеты..."
pnpm --filter @zv/db build
pnpm --filter @zv/contracts build
pnpm --filter @zv/utils build
pnpm --filter @zv/ui build

echo "✅ Установка завершена!"
echo ""
echo "📋 Следующие шаги:"
echo "1. Скопируйте env.example в .env и настройте переменные"
echo "2. Запустите инфраструктуру: make start-stack"
echo "3. Примените миграции: pnpm db:migrate"
echo "4. Заполните базу тестовыми данными: pnpm db:seed"
echo "5. Запустите приложение: pnpm dev"

