## Подсказки по Makefile

Этот файл — шпаргалка по основным сценариям работы с проектом.

### Подготовка окружения (один раз)
```bash
make docker-access   # настроить доступ к Docker без sudo (потребуется пароль)
# затем либо перелогиниться, либо в текущей сессии выполнить:
newgrp docker

pnpm -v || (corepack enable && corepack prepare pnpm@9 --activate)
make install
```

### Первый запуск проекта
```bash
make first-run       # install → поднять стек → миграции → сиды
make dev             # запустить Next.js dev сервер (по умолчанию порт 3000)
```

### Работа с инфраструктурой
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
make build           # сборка
make start           # запуск прод-сервера после build
make lint            # линтинг
make format          # авто-исправление линта (web)
make typecheck       # проверка типов
make test            # запуск тестов по пакетам (если настроены)
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

### Устранение неполадок

#### Проблемы со стилями (CSS не загружается)
Если стили слетели и приложение выглядит неправильно:
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

### Порты и параметры
- Next.js dev сервер: переменная `NEXT_PORT` (по умолчанию 3000)
- Drizzle Studio: переменная `STUDIO_PORT` (по умолчанию 4983)

Можно переопределять на лету:
```bash
make dev NEXT_PORT=4000
make db-studio-open STUDIO_PORT=5555
make stop NEXT_PORT=4000 STUDIO_PORT=5555
```

### Полезные примечания
- Доступ к Docker без sudo настраивается через `make docker-access`. Если после команды нет доступа — выйдите из сессии и войдите снова, либо выполните `newgrp docker`.
- Значения подключения к БД и другие секреты берутся из `.env`. Если потребуется изменить `.env`, пожалуйста, сообщите — мы не правим его автоматически.
- Для справки по командам используйте: `make help`.


