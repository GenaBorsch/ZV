## Перенос проекта на другую машину

### Предварительные требования
- Node.js 18+, pnpm 8+
- Docker и Docker Compose (или `docker compose`)
- Доступ к исходному репозиторию и к данным (дамп БД, файлы S3/MinIO по необходимости)

### 1) Клонирование и установка
```bash
git clone <repository-url>
cd ZV
pnpm install
```

### 2) Окружение
Скопируйте пример и заполните значения под новую среду:
```bash
cp env.example .env
# Отредактируйте .env (DATABASE_URL, NEXTAUTH_SECRET, SMTP, S3 и т.д.)
```

По умолчанию Postgres доступен на хост-порту 5433 (проксируется в контейнер 5432).

### 3) Инфраструктура
```bash
make start-stack      # поднимет Postgres и MinIO
```

Проверка, что контейнеры работают:
```bash
docker ps
```

### 4) База данных
- Чистая установка:
```bash
pnpm db:generate
pnpm db:migrate
pnpm db:seed         # опционально
```

- Восстановление из дампа (если переносите данные):
```bash
# Пример: дамп создан на старой машине через pg_dump
pg_dump -Fc -U zv_user -h 127.0.0.1 -p 5433 zvezdnoe_vereteno > backup.dump

# На новой машине (контейнер называется zv_postgres)
docker cp backup.dump zv_postgres:/backup.dump
docker exec -it zv_postgres bash -lc "pg_restore -U zv_user -d zvezdnoe_vereteno --clean --if-exists /backup.dump"
```

### 5) Файлы в MinIO (если используются)
1. Установите mc (MinIO Client) на обеих машинах
2. Настройте алиасы:
```bash
mc alias set old http://OLD_HOST:9000 <ACCESS_KEY> <SECRET_KEY>
mc alias set new http://127.0.0.1:9000 zv_admin zv_admin_password
```
3. Скопируйте нужные бакеты:
```bash
mc mirror old/avatars new/avatars
mc mirror old/uploads new/uploads
mc mirror old/documents new/documents
```

### 6) Запуск приложения
```bash
pnpm dev
# или прод-режим
pnpm build && pnpm start
```

### 7) Частые проблемы
- Порт 3000 занят: используйте 3001 (Next dev сам переключится)
- Нет доступа к Docker без sudo: `make docker-access` и пере‑логиниться
- Ошибка подключения к БД: проверьте `DATABASE_URL` (порт 5433), что контейнер Postgres жив и доступен

### 8) Чек-лист после переноса
- Запуск dev сервера без ошибок
- Доступ к страницам `/auth/login`, `/player`
- Успешные миграции и наличие тестовых данных (если применялись)
- Доступ к MinIO Web Console: `http://localhost:9001`


