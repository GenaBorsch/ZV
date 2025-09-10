# 🚀 Развертывание в EasyPanel

## Быстрый старт

### 1. Подготовка образа

```bash
# В корне проекта
docker build -f docker/Dockerfile.app -t zv-app:latest .
```

### 2. Настройка в EasyPanel

**Создание приложения:**
- Type: `Docker Image`
- Image: `zv-app:latest`
- Port: `3000`
- Health Check: `/api/health`

### 3. Переменные окружения

```env
# ✅ Обязательные
DATABASE_URL=postgresql://user:pass@db-host:5432/zvezdnoe_vereteno
NEXTAUTH_SECRET=your-super-secret-32-chars-minimum
NEXTAUTH_URL=https://your-domain.com
PUBLIC_BASE_URL=https://your-domain.com

# 📦 MinIO/S3 (для файлов)
S3_ENDPOINT=https://your-minio-host
S3_ACCESS_KEY=your-access-key
S3_SECRET_KEY=your-secret-key
S3_BUCKET_AVATARS=avatars
S3_BUCKET_DOCUMENTS=documents
S3_BUCKET_UPLOADS=uploads

# 🔧 Дополнительные
NODE_ENV=production
FEATURE_PAYMENTS=false
FEATURE_TELEGRAM=false
```

### 4. Настройка БД

**Перед деплоем выполните миграции:**
```bash
DATABASE_URL="postgresql://user:pass@prod-host:5432/db" pnpm db:migrate
DATABASE_URL="postgresql://user:pass@prod-host:5432/db" pnpm db:seed
```

### 5. Проверка

После деплоя проверьте:
- `https://your-domain.com/api/health` - должен вернуть `{"status":"ok"}`
- `https://your-domain.com/` - главная страница
- `https://your-domain.com/auth/login` - страница входа

## 🚨 Важно

1. **PostgreSQL** - обязательно нужна внешняя БД
2. **NEXTAUTH_SECRET** - должен быть минимум 32 символа
3. **Миграции** - применяйте до деплоя каждой новой версии
4. **Домен** - обновите NEXTAUTH_URL и PUBLIC_BASE_URL на ваш домен

## 🆘 Устранение проблем

**Приложение не запускается:**
- Проверьте логи в EasyPanel
- Убедитесь, что все обязательные переменные установлены
- Проверьте подключение к БД

**Ошибки аутентификации:**
- Убедитесь, что NEXTAUTH_URL соответствует вашему домену
- Проверьте NEXTAUTH_SECRET (минимум 32 символа)

**База данных недоступна:**
- Проверьте DATABASE_URL
- Убедитесь, что применили миграции
- Проверьте сетевые настройки БД

---

📚 **Полная документация**: [DEPLOYMENT_GUIDE.md](./project_docs/DEPLOYMENT_GUIDE.md)
