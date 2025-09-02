## Пакеты

### `packages/contracts`
- Назначение: единые типы API/DTO/Enums/Events для фронта и бэка
- Содержимое:
  - `api.ts`: `ApiResponse`, пагинация, фильтры поиска
  - `dto.ts`: zod-схемы для Auth, Profiles, Characters, Groups, Sessions, Enrollments, Reports, Rules, Products, Orders, Battlepasses, Clubs
  - `enums.ts`: перечисления домена (роли, статусы, провайдеры и др.)
  - `events.ts`: типы событий (платежи, записи, отчёты, пользователи, баттлпассы)
- Экспорт из `index.ts`

### `packages/db`
- Назначение: Drizzle ORM, схема, миграции, сиды
- `src/schema.ts`: модель данных проекта (Drizzle)
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


