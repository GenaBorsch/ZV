## Демо-аккаунты

Для демонстрации в базе подготовлены следующие аккаунты:

**Основной администратор:**
- admin@zvezdnoe-vereteno.ru — SUPERADMIN — пароль: admin1234

**Демо-аккаунты (создаются сидом):**
- demoadmin@zvezdnoe-vereteno.ru — SUPERADMIN — пароль: demo1234
- demomoderator@zvezdnoe-vereteno.ru — MODERATOR — пароль: demo1234
- demomaster@zvezdnoe-vereteno.ru — MASTER — пароль: demo1234
- demoplayer@zvezdnoe-vereteno.ru — PLAYER — пароль: demo1234

Страница входа: `/auth/login`

После входа происходит редирект на страницу в зависимости от роли:

- MASTER → `/master`
- MODERATOR/SUPERADMIN → `/admin`
- иначе → `/player`

### Как применить сиды (если аккаунтов нет)

1) Поднять БД:
```bash
make start-db
```

2) Применить миграции:
```bash
DATABASE_URL=postgresql://zv_user:zv_password@localhost:5433/zvezdnoe_vereteno make db-migrate
```

3) Заполнить сид-данными:
```bash
DATABASE_URL=postgresql://zv_user:zv_password@localhost:5433/zvezdnoe_vereteno make db-seed
```

Сиды идемпотентны — повторный запуск не создаёт дублей.

### Как создать нового пользователя

Для создания нового пользователя используйте команду:

```bash
DATABASE_URL=postgresql://zv_user:zv_password@localhost:5433/zvezdnoe_vereteno \
pnpm --filter db run create-user \
  --email=user@example.com \
  --password=password123 \
  --name="User Name" \
  --role=SUPERADMIN
```

Доступные роли: `PLAYER`, `MASTER`, `MODERATOR`, `SUPERADMIN`

## 🧪 Тестирование функциональности групп

### 🎯 Быстрый тест-сценарий

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

### 🔍 Детальное тестирование

#### Функции мастера

**Создание групп:**
- ✅ Валидация полей формы (название 3-50 символов)
- ✅ Автогенерация referralCode (UUID)
- ✅ Условное отображение поля "Место" для OFFLINE/MIXED
- ✅ Сохранение и отображение в списке

**Управление группами:**
- ✅ Редактирование всех параметров группы
- ✅ Баг-фикс: очистка поля "Место" при смене на ONLINE
- ✅ Копирование кода приглашения (🔗 Код)
- ✅ Копирование полной ссылки (📋 Ссылка)

**Управление участниками:**
- ✅ Просмотр состава группы с деталями
- ✅ Информация о каждом участнике (nickname, email, дата присоединения)
- ✅ Удаление участников из группы
- ✅ Автообновление счётчиков после изменений

#### Функции игрока

**Присоединение к группам:**
- ✅ По прямой реферальной ссылке `/join?code=UUID`
- ✅ По коду в кабинете игрока
- ✅ Автосоздание профиля игрока при первом присоединении
- ✅ Валидация: группа существует, набор открыт, есть места

**Управление участием:**
- ✅ Просмотр списка своих групп
- ✅ Детальная информация о группе и составе
- ✅ Выход из группы с подтверждением
- ✅ Автообновление списка после изменений

### ⚠️ Тест-кейсы для проверки ошибок

**Негативные сценарии:**
```
1. Несуществующий код:
   - Ввести случайный UUID → "Неверный код приглашения"

2. Закрытый набор:
   - Мастер: выключить "Набор открыт" в группе
   - Игрок: попытка присоединения → "Набор в группу закрыт"

3. Заполненная группа:
   - Создать группу на 1 участника
   - Присоединить 1 игрока
   - Попытка присоединения второго → "Группа заполнена"

4. Повторное присоединение:
   - Попытка присоединиться к той же группе → "Уже участник"

5. Доступ без авторизации:
   - Открыть реферальную ссылку без входа → редирект на /auth/login
```

### 🚀 Автоматизированное тестирование

**Для создания тестовых данных:**
```bash
# Создание дополнительных игроков
DATABASE_URL="postgresql://zv_user:zv_password@localhost:5433/zvezdnoe_vereteno" \
pnpm --filter db run create-user \
  --email=testplayer1@example.com \
  --password=test1234 \
  --role=PLAYER

DATABASE_URL="postgresql://zv_user:zv_password@localhost:5433/zvezdnoe_vereteno" \
pnpm --filter db run create-user \
  --email=testplayer2@example.com \
  --password=test1234 \
  --role=PLAYER
```

**Проверка через API (curl):**
```bash
# Получить список групп (требует аутентификацию)
curl -H "Authorization: Bearer <token>" http://localhost:3000/api/groups

# Присоединиться к группе
curl -X POST http://localhost:3000/api/groups/join \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"referralCode":"<UUID>"}'
```

### 📊 Мониторинг и отладка

**Логи для отслеживания:**
- Создание групп: `POST /api/groups 201`
- Присоединение: `POST /api/groups/join 200`
- Ошибки: `POST /api/groups/join 404/409`
- Детали группы: `GET /api/groups/[id]/details 200`

**Проверка в базе данных:**
```sql
-- Просмотр созданных групп
SELECT g.name, g.referral_code, g.max_members, g.is_recruiting 
FROM groups g;

-- Участники групп
SELECT g.name, pp.nickname, u.email, gm.created_at
FROM groups g
JOIN group_members gm ON g.id = gm.group_id
JOIN player_profiles pp ON gm.player_id = pp.id
JOIN users u ON pp.user_id = u.id;
```


