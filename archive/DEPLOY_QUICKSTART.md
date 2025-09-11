# 🚀 Быстрый деплой в EasyPanel

## 1. Подготовка образа

```bash
# Соберите продакшн образ
docker build -f docker/Dockerfile.prod -t zv-app:latest .
```

## 2. Настройка в EasyPanel

**Создание приложения:**
- Type: `Docker Image`
- Image: `zv-app:latest`
- Port: `80`
- Health Check: `/api/health`

## 3. Обязательные переменные окружения

```env
# База данных
DATABASE_URL=postgresql://user:pass@db-host:5432/zvezdnoe_vereteno

# Аутентификация
NEXTAUTH_SECRET=your-super-secret-32-chars-minimum
NEXTAUTH_URL=https://your-domain.com
PUBLIC_BASE_URL=https://your-domain.com

# Тестовые аккаунты (опционально)
CREATE_DEMO_ACCOUNTS=true
```

## 4. Автоматическая инициализация

При деплое автоматически выполнится:
1. ✅ Применение миграций БД
2. ✅ Создание активного сезона
3. ✅ Создание тестовых аккаунтов (если `CREATE_DEMO_ACCOUNTS=true`)

## 5. Тестовые аккаунты

После деплоя доступны аккаунты:
- **👑 Админ**: `demoadmin@zvezdnoe-vereteno.ru` / `demo1234`
- **🛡️ Модератор**: `demomoderator@zvezdnoe-vereteno.ru` / `demo1234`
- **🎯 Мастер**: `demomaster@zvezdnoe-vereteno.ru` / `demo1234`
- **🎮 Игрок**: `demoplayer@zvezdnoe-vereteno.ru` / `demo1234`

## 6. Очистка тестовых данных

После тестирования удалите тестовые аккаунты:

```bash
# Из контейнера или локально
DATABASE_URL="your-prod-url" CONFIRM_CLEANUP=yes pnpm cleanup-production
```

## 🔗 Полная документация

Подробности в [EASYPANEL_DEPLOY.md](./EASYPANEL_DEPLOY.md)
