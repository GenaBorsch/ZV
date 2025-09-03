# 🚀 Инструкция по развертыванию в продакшене

## 📋 Подготовка к деплою

### 1. Системные требования
- Docker 20.10+
- Docker Compose 2.0+
- Минимум 2GB RAM
- Минимум 10GB свободного места на диске

### 2. Настройка переменных окружения

Скопируйте пример файла переменных:
```bash
cp env.prod.example .env.prod
```

Отредактируйте `.env.prod` и установите следующие **обязательные** переменные:

```bash
# === КРИТИЧЕСКИ ВАЖНЫЕ НАСТРОЙКИ ===
# Смените на сильные пароли!
POSTGRES_PASSWORD=your_strong_db_password_here
MINIO_ROOT_PASSWORD=your_strong_minio_password_here
NEXTAUTH_SECRET=your_32_char_random_secret_key_here

# Укажите ваш домен или IP
NEXTAUTH_URL=https://your-domain.com
PUBLIC_BASE_URL=https://your-domain.com

# Email настройки (для уведомлений)
EMAIL_FROM=noreply@your-domain.com
SMTP_URL=smtp://username:password@smtp.gmail.com:587
```

### 3. Опциональные настройки

```bash
# YooKassa (если используете платежи)
YKS_SHOP_ID=your_shop_id
YKS_SECRET=your_secret_key

# Telegram Bot (если используете)
TELEGRAM_BOT_TOKEN=your_bot_token
TELEGRAM_WEBHOOK_URL=https://your-domain.com/api/telegram/webhook
```

## 🔧 Развертывание

### Способ 1: Используя Makefile (рекомендуется)

```bash
# 1. Соберите Docker образ
make prod-build

# 2. Запустите продакшен стек
make prod-up

# 3. Проверьте логи
make prod-logs
```

### Способ 2: Используя Docker Compose напрямую

```bash
# 1. Соберите образ
docker build -t zvezdnoe-vereteno:latest .

# 2. Запустите стек
docker compose -f docker-compose.prod.yml --env-file .env.prod up -d

# 3. Проверьте статус
docker compose -f docker-compose.prod.yml ps
```

## 🔍 Проверка развертывания

### 1. Проверьте доступность сервисов

```bash
# Веб-приложение
curl http://localhost:3000/api/health

# MinIO Console (если включен)
curl http://localhost:9001

# PostgreSQL (внутри контейнера)
docker exec zv_postgres_prod pg_isready -U zv_user
```

### 2. Проверьте логи

```bash
# Логи веб-приложения
docker logs zv_web_prod

# Логи базы данных
docker logs zv_postgres_prod

# Логи MinIO
docker logs zv_minio_prod
```

## 🌐 Настройка домена и SSL

### 1. Настройка Nginx (включено в стек)

Nginx контейнер уже настроен как reverse proxy. Для SSL:

1. Поместите SSL сертификаты в папку `ssl/`:
   ```
   ssl/
   ├── cert.pem
   └── key.pem
   ```

2. Раскомментируйте HTTPS блок в `nginx.conf`

3. Перезапустите стек:
   ```bash
   make prod-down && make prod-up
   ```

### 2. Настройка DNS

Направьте ваш домен на IP сервера:
```
A record: your-domain.com → YOUR_SERVER_IP
```

## 📊 Мониторинг и обслуживание

### Полезные команды

```bash
# Остановить стек
make prod-down

# Перезапустить только веб-приложение
docker compose -f docker-compose.prod.yml --env-file .env.prod restart web

# Обновить образ приложения
make prod-build && docker compose -f docker-compose.prod.yml --env-file .env.prod up -d web

# Бэкап базы данных
docker exec zv_postgres_prod pg_dump -U zv_user zvezdnoe_vereteno > backup_$(date +%Y%m%d_%H%M%S).sql

# Восстановление базы данных
docker exec -i zv_postgres_prod psql -U zv_user zvezdnoe_vereteno < backup_file.sql
```

### Мониторинг ресурсов

```bash
# Использование ресурсов контейнерами
docker stats

# Размер volumes
docker system df

# Логи с ротацией (последние 100 строк)
docker logs --tail 100 zv_web_prod
```

## 🔧 Настройки производительности

### 1. Для высокой нагрузки

В `.env.prod` добавьте:
```bash
# Увеличьте количество воркеров Nginx
NGINX_WORKER_PROCESSES=auto

# Настройки для PostgreSQL
POSTGRES_MAX_CONNECTIONS=200
POSTGRES_SHARED_BUFFERS=256MB
```

### 2. Ограничение ресурсов

В `docker-compose.prod.yml` можно добавить:
```yaml
deploy:
  resources:
    limits:
      memory: 1G
      cpus: '0.5'
```

## 🚨 Устранение проблем

### Проблема: Контейнер не запускается

1. Проверьте логи: `docker logs CONTAINER_NAME`
2. Проверьте переменные окружения в `.env.prod`
3. Убедитесь, что порты не заняты: `netstat -tlnp | grep :3000`

### Проблема: База данных недоступна

1. Проверьте статус PostgreSQL: `docker exec zv_postgres_prod pg_isready`
2. Проверьте подключение: `docker exec zv_postgres_prod psql -U zv_user -l`

### Проблема: MinIO недоступно

1. Проверьте логи MinIO: `docker logs zv_minio_prod`
2. Проверьте создание buckets: `docker logs zv_minio_setup`

## 📞 Поддержка

При возникновении проблем:

1. Соберите информацию:
   ```bash
   docker compose -f docker-compose.prod.yml ps
   docker logs zv_web_prod > web.log
   docker logs zv_postgres_prod > db.log
   ```

2. Проверьте конфигурацию:
   ```bash
   cat .env.prod | grep -v PASSWORD | grep -v SECRET
   ```

3. Опишите проблему с приложением логов и конфигурации.

---

**Важно**: Никогда не коммитьте файл `.env.prod` в Git! Он содержит секретные данные.
