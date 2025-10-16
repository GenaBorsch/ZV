# 🌟 Звёздное Веретено - Система управления НРИ-сезонами

**Комплексная платформа для организации и проведения настольных ролевых игр с системой баттлпассов, управлением группами и отчетностью.**

> 📚 **Полная документация проекта**: [project_docs/README.md](./project_docs/README.md)

## 🎯 Основные возможности

- **👥 Управление пользователями** - регистрация, профили, роли и права доступа
- **🎲 Система групп** - создание, поиск и управление игровыми группами  
- **📊 Баттлпассы** - монетизация через систему сезонных пропусков
- **📝 Отчеты по играм** - детальная отчетность для мастеров и администраторов
- **📁 Управление файлами** - безопасная загрузка через MinIO с автоматической очисткой
- **💰 Платежная система** - интеграция с YooKassa (опционально)
- **🔔 Система уведомлений** - информирование пользователей о важных событиях
- **📱 Адаптивный дизайн** - полная поддержка мобильных устройств

## 🏗️ Технологический стек

**Frontend**: Next.js 15 + React 18 + TypeScript + Tailwind CSS + shadcn/ui  
**Backend**: Next.js API Routes + PostgreSQL + Drizzle ORM + NextAuth v4  
**Файлы**: MinIO S3-совместимое хранилище с безопасной загрузкой  
**Инфраструктура**: Docker + Docker Compose + pnpm workspaces

## 🚀 Быстрый старт

### Предварительные требования

- Node.js 18+ и pnpm
- Docker & Docker Compose

### 1. Клонирование и установка

```bash
git clone <repository-url>
cd ZV
pnpm install
```

### 2. Настройка окружения

```bash
# Скопируйте пример конфигурации
cp config/env.example .env.local

# Запустите инфраструктуру (PostgreSQL + MinIO)
make start-stack

# Примените миграции и создайте тестовые данные
pnpm db:migrate
pnpm db:seed
```

### 3. Запуск разработки

```bash
pnpm dev
# Приложение доступно на http://localhost:3000
```

## 🧪 Тестовые аккаунты

После инициализации доступны следующие тестовые аккаунты:

- **👑 Администратор**: `demoadmin@zvezdnoe-vereteno.ru` / `demo1234`
- **🛡️ Модератор**: `demomoderator@zvezdnoe-vereteno.ru` / `demo1234`  
- **🎯 Мастер**: `demomaster@zvezdnoe-vereteno.ru` / `demo1234`
- **🎮 Игрок**: `demoplayer@zvezdnoe-vereteno.ru` / `demo1234`

## 🛡️ Безопасность файлов

Система включает многоуровневую защиту при загрузке файлов:

- **Проверка MIME-типа** - валидация заголовка Content-Type
- **Проверка расширения** - блокировка опасных расширений (.exe, .bat, .cmd)
- **Магические байты** - определение реального типа файла по содержимому
- **Автоудаление** - старые файлы удаляются при обновлении
- **Ограничение размера** - 5МБ для аватаров, 10МБ для документов

Тестирование безопасности: `http://localhost:3000/test-security`

## 📁 Структура проекта

```
ZV/
├── apps/web/                   # Основное Next.js приложение
├── packages/
│   ├── contracts/              # TypeScript типы и схемы
│   ├── db/                     # База данных и миграции
│   ├── ui/                     # Переиспользуемые UI компоненты
│   └── utils/                  # Общие утилиты
├── docker/                     # Docker конфигурации
├── config/                     # Примеры конфигурации
└── project_docs/               # Документация проекта
```

## 🔧 Полезные команды

```bash
# Разработка
pnpm dev                # Запуск в режиме разработки
pnpm build              # Сборка приложения
pnpm start              # Запуск собранного приложения

# База данных
pnpm db:migrate         # Применить миграции
pnpm db:seed            # Создать тестовые данные
pnpm db:studio          # Открыть Drizzle Studio
pnpm cleanup-demo       # Удалить тестовые данные

# Инфраструктура
make start-stack        # Запустить PostgreSQL + MinIO
make stop-stack         # Остановить инфраструктуру
make logs               # Посмотреть логи

# Тестирование
pnpm test               # Unit тесты
pnpm test:coverage      # Тесты с покрытием
```

## 🚀 Развертывание

### Быстрый деплой (EasyPanel)

```bash
# Сборка образа
docker build -f docker/Dockerfile.prod -t zv-app:latest .

# Настройка в EasyPanel:
# - Type: Docker Image
# - Image: zv-app:latest  
# - Port: 80
# - Health Check: /api/health
```

### Обязательные переменные окружения

```env
# База данных
DATABASE_URL="postgresql://user:pass@host:5432/db"

# Аутентификация
NEXTAUTH_SECRET="your-super-secret-32-chars-minimum"
NEXTAUTH_URL="https://your-domain.com"
PUBLIC_BASE_URL="https://your-domain.com"

# MinIO файловое хранилище
S3_ENDPOINT="https://your-minio-host"
S3_ACCESS_KEY="your-access-key"
S3_SECRET_KEY="your-secret-key"
S3_BUCKET_AVATARS="avatars"
S3_BUCKET_DOCUMENTS="documents"
S3_BUCKET_UPLOADS="uploads"
```

## 📚 Документация

- **[Полная документация](./project_docs/README.md)** - детальное описание проекта
- **[Техническая документация](./project_docs/TECHNICAL_DOCUMENTATION.md)** - архитектура и API
- **[Руководство по развертыванию](./project_docs/DEPLOYMENT_GUIDE.md)** - инструкции по деплою
- **[Руководство по тестированию](./project_docs/TESTING_GUIDE.md)** - тестирование и QA
- **[Управление пользователями](./project_docs/ADMIN_USERS.md)** - работа с ролями и правами
- **[Юридические документы](./project_docs/LEGAL_DOCUMENTS.md)** - правовое соответствие
- **[Архивные материалы](./project_docs/ARCHIVE_DEPLOYMENT_NOTES.md)** - устаревшие инструкции

## 📈 Текущий статус

**Версия**: 1.0.0  
**Статус**: Production Ready  
**Последнее обновление**: Сентябрь 2025

### Реализованные функции ✅
- Система пользователей и ролей
- Управление группами и заявками
- Баттлпассы и платежная система
- Отчеты по играм
- Безопасная загрузка файлов с автоудалением (аватары, товары, персонажи)
- Адаптивный интерфейс
- Система уведомлений

## 🆘 Поддержка

При возникновении проблем:

1. Проверьте [документацию](./project_docs/)
2. Изучите логи: `make logs`
3. Проверьте health check: `curl http://localhost:3000/api/health`
4. Протестируйте безопасность файлов: `http://localhost:3000/test-security`

---

**Контакты разработчиков**: [указать контактные данные]