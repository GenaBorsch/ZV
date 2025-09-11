# 🚀 Полное руководство по развертыванию

Комплексное руководство по развертыванию **Звёздного Веретена** в различных окружениях.

---

## 📋 Общие требования

### Системные требования
- **Node.js 18+** и **pnpm**
- **Docker** и **Docker Compose**
- **PostgreSQL 15+** (может быть в контейнере)
- **MinIO** или S3-совместимое хранилище (может быть в контейнере)

### Минимальные ресурсы сервера
- **RAM**: 2GB (рекомендуется 4GB)
- **CPU**: 1 vCPU (рекомендуется 2 vCPU)
- **Диск**: 20GB свободного места
- **Сеть**: стабильное интернет-соединение

---

## ⚡ Быстрый старт (EasyPanel)

### 1. Подготовка образа

```bash
# Клонирование и сборка
git clone <repository-url>
cd ZV
docker build -f docker/Dockerfile.prod -t zv-app:latest .
```

### 2. Настройка в EasyPanel

**Создание приложения:**
- **Type**: `Docker Image`
- **Image**: `zv-app:latest`
- **Port**: `80`
- **Health Check**: `/api/health`

### 3. Обязательные переменные окружения

```env
# База данных (обязательно)
DATABASE_URL=postgresql://user:pass@db-host:5432/zvezdnoe_vereteno

# Аутентификация (обязательно)
NEXTAUTH_SECRET=your-super-secret-32-chars-minimum
NEXTAUTH_URL=https://your-domain.com
PUBLIC_BASE_URL=https://your-domain.com

# MinIO/S3 файловое хранилище (обязательно)
S3_ENDPOINT=https://your-minio-host
S3_ACCESS_KEY=your-access-key
S3_SECRET_KEY=your-secret-key
S3_BUCKET_AVATARS=avatars
S3_BUCKET_DOCUMENTS=documents
S3_BUCKET_UPLOADS=uploads

# Тестовые данные (опционально)
CREATE_DEMO_ACCOUNTS=true

# Дополнительные функции (опционально)
FEATURE_PAYMENTS=false
FEATURE_TELEGRAM=false
NODE_ENV=production
```

### 4. Автоматическая инициализация

При деплое автоматически выполняется:
1. ✅ Применение миграций БД
2. ✅ Создание активного сезона
3. ✅ Инициализация MinIO бакетов
4. ✅ Создание тестовых аккаунтов (если `CREATE_DEMO_ACCOUNTS=true`)

### 5. Проверка развертывания

После деплоя проверьте:
- `https://your-domain.com/api/health` - должен вернуть `{"status":"ok"}`
- `https://your-domain.com/` - главная страница
- `https://your-domain.com/auth/login` - страница входа

### 6. Тестовые аккаунты

Если установлена переменная `CREATE_DEMO_ACCOUNTS=true`:

- **👑 Администратор**: `demoadmin@zvezdnoe-vereteno.ru` / `demo1234`
- **🛡️ Модератор**: `demomoderator@zvezdnoe-vereteno.ru` / `demo1234`  
- **🎯 Мастер**: `demomaster@zvezdnoe-vereteno.ru` / `demo1234`
- **🎮 Игрок**: `demoplayer@zvezdnoe-vereteno.ru` / `demo1234`

**⚠️ ВАЖНО**: Удалите эти аккаунты после тестирования в продакшне!

---

## 🐳 Docker развертывание

### Полный стек (разработка)

```bash
# Запуск всей инфраструктуры
make start-stack

# Или вручную
docker-compose -f docker/docker-compose.yml up -d

# Применение миграций и создание тестовых данных
pnpm db:migrate
pnpm db:seed

# Запуск приложения в dev режиме
pnpm dev
```

### Продакшн с внешними сервисами

Если PostgreSQL и MinIO уже развернуты отдельно:

```bash
# 1. Настройка переменных окружения
cp config/env.server.example .env.server
# Отредактируйте .env.server с вашими данными

# 2. Сборка образа приложения
make app-build

# 3. Запуск только приложения
make app-up

# 4. Проверка статуса
make app-status

# 5. Просмотр логов
make app-logs
```

### Продакшн с Nginx

```bash
# 1. Сборка образа
make app-build

# 2. Настройка SSL сертификатов (опционально)
mkdir -p ssl/
# Поместите cert.pem и key.pem в папку ssl/

# 3. Запуск с Nginx
make app-up-nginx

# 4. Проверка
curl https://your-domain.com/api/health
```

---

## 🔧 Локальная разработка

### Быстрый старт

```bash
# Установка зависимостей
pnpm install

# Настройка окружения
cp config/env.example .env.local

# Запуск инфраструктуры
make start-stack

# Применение миграций
pnpm db:migrate

# Создание тестовых данных
pnpm db:seed

# Запуск разработки
pnpm dev
```

### Полезные команды разработки

```bash
# База данных
pnpm db:studio          # Открыть Drizzle Studio
pnpm db:migrate         # Применить миграции
pnpm db:seed            # Создать тестовые данные
pnpm cleanup-demo       # Удалить тестовые данные

# Тестирование
pnpm test               # Unit тесты
pnpm test:coverage      # Тесты с покрытием
pnpm test:e2e           # E2E тесты

# Инфраструктура
make start-stack        # Запустить PostgreSQL + MinIO
make stop-stack         # Остановить инфраструктуру
make logs              # Посмотреть логи
make restart-stack     # Перезапустить инфраструктуру
```

---

## 🌐 Настройка внешних сервисов

### PostgreSQL

#### Создание базы данных:
```sql
CREATE DATABASE zvezdnoe_vereteno;
CREATE USER zv_user WITH ENCRYPTED PASSWORD 'secure_password';
GRANT ALL PRIVILEGES ON DATABASE zvezdnoe_vereteno TO zv_user;
```

#### Строка подключения:
```env
DATABASE_URL="postgresql://zv_user:secure_password@db-host:5432/zvezdnoe_vereteno"
```

### MinIO/S3

#### Создание бакетов:
```bash
# Через MinIO Client (mc)
mc alias set myminio https://your-minio-host access_key secret_key
mc mb myminio/avatars
mc mb myminio/documents  
mc mb myminio/uploads

# Настройка политик доступа
mc anonymous set public myminio/avatars
mc anonymous set public myminio/uploads
# documents остается приватным
```

#### Переменные окружения:
```env
S3_ENDPOINT="https://your-minio-host"
S3_ACCESS_KEY="your_access_key"
S3_SECRET_KEY="your_secret_key"
S3_BUCKET_AVATARS="avatars"
S3_BUCKET_DOCUMENTS="documents"
S3_BUCKET_UPLOADS="uploads"
```

---

## 🔐 Настройка безопасности

### SSL/HTTPS

#### Для Nginx развертывания:
1. Получите SSL сертификат (Let's Encrypt, Cloudflare, etc.)
2. Поместите сертификаты в папку `ssl/`:
   ```
   ssl/
   ├── cert.pem
   └── key.pem
   ```
3. Обновите `docker/nginx.conf` с вашим доменом
4. Перезапустите: `make app-down && make app-up-nginx`

#### Для EasyPanel/облачных платформ:
SSL обычно настраивается автоматически через платформу.

### Переменные безопасности

```env
# Обязательные для безопасности
NEXTAUTH_SECRET="minimum-32-characters-random-string"
NEXTAUTH_URL="https://your-production-domain.com"

# Рекомендуемые
NODE_ENV="production"
```

### Firewall правила

Откройте только необходимые порты:
- **80** (HTTP) - для редиректа на HTTPS
- **443** (HTTPS) - основной трафик
- **5432** (PostgreSQL) - только для приложения
- **9000** (MinIO) - только для приложения

---

## 📊 Мониторинг и логирование

### Health Check

```bash
# Проверка состояния приложения
curl -f https://your-domain.com/api/health

# Ожидаемый ответ:
{
  "status": "ok",
  "timestamp": "2025-09-11T14:00:00.000Z",
  "service": "zvezdnoe-vereteno"
}
```

### Логи

```bash
# Docker логи
docker logs zv_web_app --tail 100 -f

# Через Makefile
make app-logs

# Системные логи (systemd)
journalctl -u docker -f
```

### Мониторинг ресурсов

```bash
# Использование ресурсов контейнерами
docker stats

# Место на диске
df -h

# Память и CPU
htop
```

---

## 🔄 Обновление приложения

### Автоматическое обновление

```bash
#!/bin/bash
# update-app.sh

# 1. Получение нового кода
git pull origin main

# 2. Сборка нового образа
docker build -f docker/Dockerfile.prod -t zv-app:latest .

# 3. Остановка старого контейнера
docker stop zv_web_app

# 4. Запуск нового контейнера
docker run -d \
  --name zv_web_app \
  --env-file .env.server \
  -p 3000:3000 \
  --restart unless-stopped \
  zv-app:latest

# 5. Проверка здоровья
sleep 10
curl -f http://localhost:3000/api/health || exit 1

echo "Приложение успешно обновлено!"
```

### Ручное обновление

```bash
# 1. Получение нового кода
git pull

# 2. Пересборка образа
make app-build

# 3. Перезапуск
make app-down
make app-up

# 4. Проверка
make app-status
curl -f http://localhost:3000/api/health
```

### Откат к предыдущей версии

```bash
# Если обновление неуспешно, вернитесь к предыдущему образу
docker tag zv-app:latest zv-app:backup
git checkout previous-working-commit
make app-build
make app-down && make app-up
```

---

## 🚨 Устранение проблем

### Приложение не запускается

1. **Проверьте переменные окружения:**
   ```bash
   # Убедитесь, что все обязательные переменные установлены
   env | grep -E "(DATABASE_URL|NEXTAUTH_SECRET|S3_ENDPOINT)"
   ```

2. **Проверьте подключение к БД:**
   ```bash
   # Тест подключения к PostgreSQL
   docker run --rm postgres:15-alpine psql "$DATABASE_URL" -c "SELECT 1"
   ```

3. **Проверьте логи:**
   ```bash
   make app-logs
   ```

### Ошибки аутентификации

1. **Проверьте NEXTAUTH_SECRET:**
   - Должен быть минимум 32 символа
   - Одинаковый во всех экземплярах приложения

2. **Проверьте NEXTAUTH_URL:**
   - Должен соответствовать реальному домену
   - Включать протокол (https://)

### Проблемы с файлами (MinIO)

1. **Проверьте доступность MinIO:**
   ```bash
   curl -I "$S3_ENDPOINT"
   ```

2. **Проверьте права доступа к бакетам:**
   ```bash
   # Через MinIO Client
   mc ls myminio/
   mc stat myminio/avatars
   ```

3. **Проверьте переменные S3:**
   ```bash
   env | grep S3_
   ```

### Проблемы с производительностью

1. **Увеличьте ресурсы контейнера:**
   ```yaml
   # В docker-compose.yml
   deploy:
     resources:
       limits:
         memory: 2G
         cpus: '1.0'
   ```

2. **Настройте connection pooling для PostgreSQL**

3. **Используйте CDN для статических файлов**

### База данных недоступна

1. **Проверьте строку подключения:**
   ```bash
   echo $DATABASE_URL
   ```

2. **Проверьте сетевую доступность:**
   ```bash
   telnet db-host 5432
   ```

3. **Проверьте миграции:**
   ```bash
   pnpm db:migrate
   ```

---

## 📁 Структура конфигурационных файлов

```
ZV/
├── config/
│   ├── env.example          # Пример для разработки
│   ├── env.prod.example     # Пример для продакшна
│   └── env.server.example   # Пример для сервера
├── docker/
│   ├── docker-compose.yml      # Полный стек (dev)
│   ├── docker-compose.prod.yml # Продакшн стек
│   ├── docker-compose.app.yml  # Только приложение
│   ├── Dockerfile.prod         # Продакшн образ
│   ├── Dockerfile.app          # Образ только приложения
│   └── nginx.conf              # Конфигурация Nginx
├── ssl/                        # SSL сертификаты (создать вручную)
│   ├── cert.pem
│   └── key.pem
├── .env.local                  # Локальная разработка (создать)
├── .env.server                 # Сервер (создать)
└── Makefile                    # Команды управления
```

---

## 🎯 Рекомендации для продакшна

### Безопасность
- ✅ Используйте сильные пароли для всех сервисов
- ✅ Настройте SSL/HTTPS
- ✅ Регулярно обновляйте зависимости
- ✅ Ограничьте сетевой доступ к БД и MinIO
- ✅ Удалите тестовые аккаунты после настройки

### Производительность
- ✅ Используйте connection pooling для PostgreSQL
- ✅ Настройте CDN для статических файлов
- ✅ Мониторьте использование ресурсов
- ✅ Настройте автоматические бэкапы БД

### Надежность
- ✅ Настройте автоматические бэкапы
- ✅ Используйте health checks
- ✅ Настройте мониторинг и алерты
- ✅ Документируйте процедуры восстановления

---

## 📞 Поддержка

При возникновении проблем:

1. Проверьте [техническую документацию](./TECHNICAL_DOCUMENTATION.md)
2. Изучите логи приложения
3. Проверьте health check endpoint
4. Убедитесь в корректности переменных окружения

**Контакты разработчиков**: [указать контактные данные]

---

**Последнее обновление**: Сентябрь 2025