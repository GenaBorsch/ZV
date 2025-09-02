## Демо-аккаунты

Для демонстрации в базе подготовлены следующие аккаунты (создаются сидом):

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


