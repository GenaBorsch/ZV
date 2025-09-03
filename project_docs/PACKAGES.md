## Пакеты

### `packages/contracts`
- Назначение: единые типы API/DTO/Enums/Events для фронта и бэка
- Содержимое:
  - `api.ts`: `ApiResponse`, пагинация, фильтры поиска
  - `dto.ts`: zod-схемы для Auth, **Profiles** (обновлены), Characters, Groups, Sessions, Enrollments, Reports, Rules, Products, Orders, Battlepasses, Clubs
  - ✅ **`admin.ts`**: **новые zod-схемы для админ-панели** (AdminUsersListQuery, AdminUserDto, AdminManageUserRoles и др.)
  - `enums.ts`: перечисления домена (роли, статусы, провайдеры и др.)
  - `events.ts`: типы событий (платежи, записи, отчёты, пользователи, баттлпассы)
- Экспорт из `index.ts`

**Обновления в dto.ts:**
- ✅ **RegisterDto**: имя теперь опциональное при регистрации
- ✅ **UpdateProfileDto**: новые поля rpgExperience и contacts
- ✅ **ProfileDto**: полная схема с роль-специфичными полями
- ✅ **rpgExperienceEnum**: новое перечисление уровня опыта (NOVICE|INTERMEDIATE|VETERAN)

### `packages/db`
- Назначение: Drizzle ORM, схема, миграции, сиды
- `src/schema.ts`: модель данных проекта (Drizzle) - **обновлена схема пользователей**
- ✅ **`src/repositories/`**: **новый слой репозиториев для инкапсуляции бизнес-логики**
  - ✅ **`usersRepo.ts`**: методы для работы с пользователями (list, getById, update, delete и др.)
  - ✅ **`rolesRepo.ts`**: методы для управления ролями (add, remove, manageUserRoles и др.)
  - ✅ **`profilesRepo.ts`**: **новый репозиторий для управления профилями пользователей**
  - ✅ **`groupsRepo.ts`**: методы для работы с игровыми группами
- `src/create_user.ts`: скрипт для создания пользователей
- **Новая миграция 0004_absent_spiral.sql**: добавлены поля rpgExperience и contacts в таблицу users
- Скрипты в корне монорепо проксируют генерацию/миграции: `pnpm db:generate`, `pnpm db:migrate`, `pnpm db:seed`

### `packages/ui`
- Назначение: общий UI-кит (пока пустой/минимальный), предполагается интеграция shadcn/ui

### `packages/utils`
- Назначение: общие утилиты
- Содержимое:
  - `cn.ts`: слияние className
  - `validation.ts`: вспомогательная валидация
  - `date.ts`: даты/форматирование
  - `roles.ts`: утилиты по ролям
  - `index.ts`: агрегирующий экспорт


