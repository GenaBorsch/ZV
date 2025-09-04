# 🚀 Развертывание приложения с внешними сервисами

Эта инструкция для развертывания только веб-приложения, когда PostgreSQL и MinIO уже развернуты отдельно.

## 📋 Предварительные требования

### На сервере должны быть развернуты:
- **PostgreSQL** (версия 15+)
- **MinIO** или совместимое S3 хранилище  
- **Docker** и **Docker Compose**

### Подготовка внешних сервисов:

#### PostgreSQL:
- Создайте базу данных для приложения
- Создайте пользователя с правами на эту БД
- Убедитесь, что сервер доступен по сети

#### MinIO/S3:
- Создайте buckets: `avatars`, `documents`, `uploads`
- Настройте публичный доступ для buckets (если нужно)
- Получите Access Key и Secret Key

## 🔧 Настройка переменных окружения

1. **Скопируйте пример файла:**
   ```bash
   cp env.server.example .env.server
   ```

2. **Отредактируйте `.env.server`:**
   ```bash
   # База данных (обязательно)
   DATABASE_URL="postgresql://username:password@your-db-host:5432/database_name"
   
   # MinIO/S3 (обязательно)
   S3_ENDPOINT="https://your-minio-server.com"
   S3_ACCESS_KEY="your_access_key"
   S3_SECRET_KEY="your_secret_key"
   
   # NextAuth (обязательно)
   NEXTAUTH_SECRET="your_super_secret_32_chars_minimum"
   NEXTAUTH_URL="https://your-domain.com"
   
   # Основной URL (обязательно)
   PUBLIC_BASE_URL="https://your-domain.com"
   
   # Email настройки
   EMAIL_FROM="noreply@your-domain.com"
   SMTP_URL="smtp://user:pass@smtp.provider.com:587"
   ```

## 🚀 Развертывание

### Вариант 1: Только приложение

```bash
# 1. Соберите образ приложения
make app-build

# 2. Запустите приложение
make app-up

# 3. Проверьте статус
make app-status

# 4. Посмотрите логи
make app-logs
```

### Вариант 2: Приложение + Nginx

```bash
# 1. Соберите образ приложения
make app-build

# 2. Запустите с Nginx
make app-up-nginx

# 3. Проверьте статус
make app-status
```

## 🌐 Настройка SSL/HTTPS

### Для Nginx варианта:

1. **Поместите SSL сертификаты в папку `ssl/`:**
   ```
   ssl/
   ├── cert.pem
   └── key.pem
   ```

2. **Обновите `nginx.conf`** - раскомментируйте HTTPS блок и укажите ваш домен

3. **Перезапустите:**
   ```bash
   make app-down
   make app-up-nginx
   ```

## 🔍 Проверка развертывания

### 1. Health Check
```bash
curl http://your-domain.com/api/health
# Ожидаемый ответ: {"status":"ok","timestamp":"...","service":"zvezdnoe-vereteno"}
```

### 2. Проверка подключения к БД
```bash
# В логах должно быть:
make app-logs
# ✅ Подключение к базе данных успешно
# 🔄 Применение миграций базы данных...
# 🌟 Запуск Next.js приложения...
```

### 3. Проверка основных страниц
- Главная: `https://your-domain.com/`
- Регистрация: `https://your-domain.com/auth/register`
- Вход: `https://your-domain.com/auth/login`

## 🛠️ Управление

### Полезные команды:
```bash
# Статус контейнеров
make app-status

# Логи в реальном времени
make app-logs

# Перезапуск приложения
make app-down && make app-up

# Обновление приложения
make app-build && make app-down && make app-up
```

### Обновление приложения:
```bash
# 1. Получите новый код
git pull

# 2. Пересоберите образ
make app-build

# 3. Перезапустите
make app-down
make app-up
```

## 🔧 Локальное тестирование Docker образа

Для тестирования с локальной инфраструктурой:

```bash
# 1. Запустите dev инфраструктуру
make start-stack

# 2. Соберите образ приложения
make app-build

# 3. Запустите контейнер с сетью хоста (Linux)
docker run --rm --network host \
  -e DATABASE_URL="postgresql://zv_user:zv_password@localhost:5433/zvezdnoe_vereteno" \
  -e S3_ENDPOINT="http://localhost:9000" \
  -e S3_ACCESS_KEY="zv_admin" \
  -e S3_SECRET_KEY="zv_admin_password" \
  -e NEXTAUTH_SECRET="test-secret-key-32-chars-minimum-length" \
  -e NEXTAUTH_URL="http://localhost:3002" \
  -e PUBLIC_BASE_URL="http://localhost:3002" \
  -e PORT="3002" \
  zvezdnoe-vereteno:app
```

## 📊 Мониторинг

### Логи приложения:
```bash
# Последние 100 строк
docker logs zv_web_app --tail 100

# В реальном времени
make app-logs
```

### Использование ресурсов:
```bash
docker stats zv_web_app
```

### Health Check:
```bash
# Автоматически каждые 30 секунд
# Или вручную:
curl -f http://localhost:3000/api/health
```

## 🚨 Устранение проблем

### Приложение не запускается:
1. Проверьте переменные в `.env.server`
2. Убедитесь, что PostgreSQL и MinIO доступны
3. Проверьте логи: `make app-logs`

### Ошибки подключения к БД:
```bash
# Проверьте подключение вручную
docker run --rm postgres:15-alpine psql "your_DATABASE_URL" -c "SELECT 1"
```

### Ошибки с MinIO:
```bash
# Проверьте доступность
curl -I "your_S3_ENDPOINT"
```

## 📁 Структура файлов

```
/
├── Dockerfile.app              # Dockerfile только для приложения
├── docker-compose.app.yml      # Compose файл для приложения
├── .env.server                 # Переменные окружения (создайте сами)
├── env.server.example          # Пример переменных
├── nginx.conf                  # Конфигурация Nginx
├── ssl/                        # SSL сертификаты (создайте сами)
│   ├── cert.pem
│   └── key.pem
└── Makefile                    # Команды управления
```

## ⚡ Оптимизация производительности

### Для высокой нагрузки:
1. **Увеличьте ресурсы контейнера:**
   ```yaml
   # В docker-compose.app.yml
   deploy:
     resources:
       limits:
         memory: 2G
         cpus: '1.0'
   ```

2. **Настройте connection pooling для PostgreSQL**

3. **Используйте CDN для статических файлов**

---

**Важно**: Никогда не коммитьте файл `.env.server` в Git! Он содержит секретные данные.

Для получения помощи по командам: `make help`
