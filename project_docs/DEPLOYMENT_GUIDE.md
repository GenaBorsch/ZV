# Руководство по развертыванию и эксплуатации

## 🚀 Быстрый старт

### Предварительные требования
- **Node.js 18+**, **pnpm 8+**
- **Docker** и **Docker Compose** (или `docker compose`)
- Доступ к исходному репозиторию

### Первый запуск проекта

#### 1. Подготовка окружения (один раз)
```bash
# Настроить доступ к Docker без sudo (потребуется пароль)
make docker-access
# Затем либо перелогиниться, либо в текущей сессии выполнить:
newgrp docker

# Установка pnpm (если не установлен)
pnpm -v || (corepack enable && corepack prepare pnpm@9 --activate)
make install
```

#### 2. Первый запуск
```bash
make first-run       # install → поднять стек → миграции → сиды
make dev             # запустить Next.js dev сервер (по умолчанию порт 3000)
```

Приложение будет доступно по адресу: **http://localhost:3000**

### Альтернативный способ (пошагово)

#### 1. Клонирование и установка
```bash
git clone <repository-url>
cd ZV
pnpm install
```

#### 2. Настройка окружения
```bash
cp env.example .env
# Отредактируйте .env файл с настройками БД и сервисов
```

#### 3. Запуск инфраструктуры
```bash
docker-compose up -d postgres minio
# или используйте make команды:
make start-stack     # поднять БД (Postgres) и Minio (полный стек)
```

#### 4. Настройка базы данных
```bash
pnpm db:generate     # генерация миграций из схемы
pnpm db:migrate      # применить миграции к БД
pnpm db:seed         # заполнить тестовыми данными
```

#### 5. Запуск приложения
```bash
pnpm dev            # Next.js dev сервер
```

## ⚙️ Настройка окружения

### Переменные окружения

**Обязательные переменные** (см. `env.example`):

```env
# База данных
DATABASE_URL=postgresql://zv_user:zv_password@localhost:5433/zvezdnoe_vereteno

# NextAuth
NEXTAUTH_SECRET=dev-secret-change-in-production
NEXTAUTH_URL=http://localhost:3000

# Публичный URL
PUBLIC_BASE_URL=http://localhost:3000
```

**Дополнительные переменные**:

```env
# S3/MinIO хранилище файлов
S3_ENDPOINT=http://localhost:9000
S3_ACCESS_KEY=zv_admin
S3_SECRET_KEY=zv_admin_password
S3_BUCKET_AVATARS=avatars
S3_BUCKET_UPLOADS=uploads
S3_BUCKET_DOCUMENTS=documents

# Email уведомления
EMAIL_FROM=noreply@zvezdnoe-vereteno.ru
SMTP_URL=smtp://user:pass@localhost:587

# Telegram интеграция (опционально)
TELEGRAM_BOT_TOKEN=your_bot_token
TELEGRAM_WEBHOOK_URL=https://your-domain.com/api/telegram/webhook

# Платежи YooKassa
YKS_SHOP_ID=your_shop_id
YKS_SECRET=your_secret_key

# Флаги функций
FEATURE_PAYMENTS=false
FEATURE_TELEGRAM=false
```

**⚠️ Важно**: правки `.env` выполняются вручную владельцем проекта. Провайдер оплаты: только YooKassa.

### Docker Compose конфигурация

**Основной файл** (`docker-compose.yml`):
- **`postgres`**: PostgreSQL 15-alpine, порт `5433→5432`, пользователь `zv_user`, БД `zvezdnoe_vereteno`
- **`minio`**: RELEASE.2024-01-16, порты `9000` (API) и `9001` (Console)
- **Volume'ы**: `postgres_data`, `minio_data`

**Проверка, что контейнеры работают:**
```bash
docker ps
```

### Порты и доступ

- **Next.js dev сервер**: порт `3000` (или `3001` если занят)
- **PostgreSQL**: хост-порт `5433` (проксируется в контейнер `5432`)
- **MinIO API**: `9000`
- **MinIO Console**: `9001` (admin: `zv_admin` / `zv_admin_password`)
- **Drizzle Studio**: переменная `STUDIO_PORT` (по умолчанию `4983`)

## 🛠️ Команды разработки

### Управление инфраструктурой
```bash
make start-stack     # поднять БД (Postgres) и Minio (полный стек)
make start-db        # поднять только Postgres
make stop            # остановить все контейнеры и локальные dev-процессы

# Если требуется явно через sudo (не рекомендуется):
make stop-docker-sudo
```

### Разработка
```bash
make dev             # Next.js dev сервер
make build           # сборка для продакшена
make start           # запуск прод-сервера после build
make lint            # линтинг кода
make format          # авто-исправление линта (web)
make typecheck       # проверка типов TypeScript
make test            # запуск тестов по пакетам
```

### База данных (Drizzle ORM)
```bash
make db-generate     # сгенерировать миграции из схемы
make db-migrate      # применить миграции к БД
make db-seed         # заполнить тестовыми данными
make db-push         # синхронизация схемы с БД (drizzle-kit push)
make db-reset        # сбросить схему public, затем migrate + seed
make db-studio       # открыть Drizzle Studio (CLI)
make db-studio-open  # открыть Studio и авто-открыть браузер
```

### Переопределение портов
Можно переопределять порты на лету:
```bash
make dev NEXT_PORT=4000
make db-studio-open STUDIO_PORT=5555
make stop NEXT_PORT=4000 STUDIO_PORT=5555
```

## 🔄 Перенос проекта на другую машину

### 1. Подготовка новой машины

**Предварительные требования:**
- Node.js 18+, pnpm 8+
- Docker и Docker Compose
- Доступ к исходному репозиторию и к данным (дамп БД, файлы S3/MinIO по необходимости)

**Клонирование и установка:**
```bash
git clone <repository-url>
cd ZV
pnpm install
```

### 2. Настройка окружения
```bash
cp env.example .env
# Отредактируйте .env (DATABASE_URL, NEXTAUTH_SECRET, SMTP, S3 и т.д.)
```

По умолчанию Postgres доступен на хост-порту `5433` (проксируется в контейнер `5432`).

### 3. Запуск инфраструктуры
```bash
make start-stack      # поднимет Postgres и MinIO
```

### 4. Миграция данных

#### Чистая установка:
```bash
pnpm db:generate
pnpm db:migrate
pnpm db:seed         # опционально - демо-данные
```

#### Восстановление из дампа (если переносите данные):
```bash
# Пример: дамп создан на старой машине через pg_dump
pg_dump -Fc -U zv_user -h 127.0.0.1 -p 5433 zvezdnoe_vereteno > backup.dump

# На новой машине (контейнер называется zv_postgres)
docker cp backup.dump zv_postgres:/backup.dump
docker exec -it zv_postgres bash -lc "pg_restore -U zv_user -d zvezdnoe_vereteno --clean --if-exists /backup.dump"
```

### 5. Перенос файлов MinIO (если используются)

**Установите mc (MinIO Client) на обеих машинах:**
```bash
# Настройте алиасы
mc alias set old http://OLD_HOST:9000 <ACCESS_KEY> <SECRET_KEY>
mc alias set new http://127.0.0.1:9000 zv_admin zv_admin_password

# Скопируйте нужные бакеты
mc mirror old/avatars new/avatars
mc mirror old/uploads new/uploads
mc mirror old/documents new/documents
```

### 6. Запуск приложения
```bash
pnpm dev
# или прод-режим
pnpm build && pnpm start
```

### 7. Чек-лист после переноса
- ✅ Запуск dev сервера без ошибок
- ✅ Доступ к страницам `/auth/login`, `/player`
- ✅ Успешные миграции и наличие тестовых данных (если применялись)
- ✅ Доступ к MinIO Web Console: `http://localhost:9001`
- ✅ Тестирование системы отчётов мастеров (см. раздел "Тестирование системы отчётов")

## 🐛 Устранение неполадок

### Частые проблемы

#### Проблемы со стилями (CSS не загружается)
Если стили слетели и приложение выглядает неправильно:
```bash
# 1. Остановить dev сервер
pkill -f "next dev"

# 2. Очистить кэш Next.js
cd apps/web && rm -rf .next

# 3. Переустановить зависимости (при необходимости)
cd /home/damir/projects/ZV && pnpm --filter web install

# 4. Перезапустить сервер
make dev
```
После этого обновите страницу в браузере (Ctrl+F5).

#### Проблемы с базой данных
Если возникают ошибки о несуществующих колонках:
```bash
# Применить все миграции
DATABASE_URL="postgresql://zv_user:zv_password@localhost:5433/zvezdnoe_vereteno" make db-migrate

# Или сгенерировать и применить новые миграции
make db-generate
make db-migrate
```

#### Проблемы с Docker
- **Порт 3000 занят**: используйте 3001 (Next dev сам переключится)
- **Нет доступа к Docker без sudo**: `make docker-access` и пере‑логиниться
- **Ошибка подключения к БД**: проверьте `DATABASE_URL` (порт 5433), что контейнер Postgres жив и доступен

#### Проблемы с аутентификацией
- **Сервер поднялся на `:3001`**: переходите на `http://localhost:3001`
- **Ошибка модуля `bcrypt`**: используется `bcryptjs` (JS-версия). Убедитесь, что зависимости установлены: `pnpm -C apps/web i`
- **В URL видны `?email=&password=`**: перейдите на страницу напрямую, формы отправляются POST и не добавляют параметры

### Полезные примечания
- Доступ к Docker без sudo настраивается через `make docker-access`. Если после команды нет доступа — выйдите из сессии и войдите снова, либо выполните `newgrp docker`
- Значения подключения к БД и другие секреты берутся из `.env`. Если потребуется изменить `.env`, пожалуйста, сообщите — мы не правим его автоматически
- Для справки по командам используйте: `make help`

## 🧪 Тестирование после развертывания

### Демо-аккаунты для тестирования

**Основной администратор:**
- `admin@zvezdnoe-vereteno.ru` — SUPERADMIN — пароль: `admin1234`

**Демо-аккаунты (создаются сидом):**
- `demoadmin@zvezdnoe-vereteno.ru` — SUPERADMIN — пароль: `demo1234`
- `demomoderator@zvezdnoe-vereteno.ru` — MODERATOR — пароль: `demo1234`
- `demomaster@zvezdnoe-vereteno.ru` — MASTER — пароль: `demo1234`
- `demoplayer@zvezdnoe-vereteno.ru` — PLAYER — пароль: `demo1234`

**Страница входа**: `/auth/login`

**После входа происходит редирект на страницу в зависимости от роли:**
- MASTER → `/master`
- MODERATOR/SUPERADMIN → `/admin`
- иначе → `/player`

### Как применить сиды (если аккаунтов нет)

1. **Поднять БД:**
```bash
make start-db
```

2. **Применить миграции:**
```bash
DATABASE_URL=postgresql://zv_user:zv_password@localhost:5433/zvezdnoe_vereteno make db-migrate
```

3. **Заполнить сид-данными:**
```bash
DATABASE_URL=postgresql://zv_user:zv_password@localhost:5433/zvezdnoe_vereteno make db-seed
```

Сиды идемпотентны — повторный запуск не создаёт дублей.

### Создание дополнительных пользователей

```bash
DATABASE_URL=postgresql://zv_user:zv_password@localhost:5433/zvezdnoe_vereteno \
pnpm --filter db run create-user \
  --email=user@example.com \
  --password=password123 \
  --name="User Name" \
  --role=SUPERADMIN
```

**Доступные роли**: `PLAYER`, `MASTER`, `MODERATOR`, `SUPERADMIN`

### Тестовые сценарии

#### 🎯 Быстрый тест-сценарий системы групп

**1. Тест создания группы (Мастер):**
```
Логин: demomaster@zvezdnoe-vereteno.ru / demo1234
URL: http://localhost:3000/master
Действия:
- Нажать "Создать группу"
- Заполнить: название, описание, участники (например, 5)
- Выбрать формат (ONLINE/OFFLINE/MIXED)
- Включить "Набор открыт"
- Создать группу
- Скопировать реферальную ссылку из модального окна
```

**2. Тест присоединения (Игрок):**
```
Логин: demoplayer@zvezdnoe-vereteno.ru / demo1234
Способ A - Прямая ссылка:
- Вставить скопированную ссылку в адресную строку
- Автоматическое присоединение

Способ B - Ручной ввод:
- URL: http://localhost:3000/player
- Нажать "Присоединиться к группе"
- Ввести код приглашения (UUID из ссылки)
- Подтвердить присоединение
```

**3. Проверка результата:**
```
Кабинет игрока (/player):
- Группа появилась в списке "Мои группы"
- Счётчик групп увеличился
- Кнопка "📋 Подробнее" открывает детали

Кабинет мастера (/master):
- Количество участников увеличилось
- В деталях группы появился новый игрок
```

#### 📊 Тестирование системы отчётов мастеров

**1. Создание отчёта (Мастер):**
```
Логин: demomaster@zvezdnoe-vereteno.ru / demo1234
URL: http://localhost:3000/master/reports-demo
Действия:
- Нажать "Создать отчёт"
- Заполнить описание игры (минимум 50 символов)
- Добавить дополнительные моменты (опционально)
- Нажать "Добавить игрока" и выбрать из списка
- Проверить валидацию и предупреждения о баттлпассах
- Создать отчёт
- Проверить появление в списке со статусом "На рассмотрении"
```

**2. Модерация отчётов (Администратор):**
```
Логин: demoadmin@zvezdnoe-vereteno.ru / demo1234
URL: http://localhost:3000/demo-admin-reports
Действия:
- Проверить список отчётов на модерации
- Одобрить отчёт - проверить автоматическое списание игр
- Отклонить отчёт с указанием причины
- Проверить обновление счётчиков и статусов
- Проверить уведомления (иконка колокольчика)
```

**3. История отчётов (Игрок):**
```
Логин: demoplayer@zvezdnoe-vereteno.ru / demo1234
URL: http://localhost:3000/player/reports
Действия:
- Просмотр отчётов, где игрок участвовал
- Проверка статусов и причин отклонения
- Проверка уведомлений о списании игр
```

#### Тест админ-панели
```
Логин: demoadmin@zvezdnoe-vereteno.ru / demo1234
URL: http://localhost:3000/admin/users
Действия:
- Поиск пользователей
- Фильтрация по ролям
- Редактирование пользователя
- Управление ролями
```

## 🚀 Продакшен развертывание

### Эскиз деплоя
- **Варианты**: Docker контейнер Next.js (standalone), внешние сервисы Postgres/MinIO
- **Секреты и ENV** в CI/CD хранятся в Secret Store
- **Миграции** выполняются до старта приложения

### Домены
- **Основной сайт**: `zvezdnoe-vereteno.ru` (Tilda)
- **Личные кабинеты**: `app.zvezdnoe-vereteno.ru` (Next.js)

### Переменные продакшена
```env
NODE_ENV=production
NEXTAUTH_URL=https://app.zvezdnoe-vereteno.ru
DATABASE_URL=postgresql://user:pass@prod-host:5432/zvezdnoe_vereteno
# ... остальные переменные с продакшен значениями
```

**Последнее обновление**: Декабрь 2024
