import { beforeAll, afterAll } from 'vitest';

// Мок для process.env если нужно
beforeAll(() => {
  // Настройка тестового окружения
  process.env.NODE_ENV = 'test';
});

afterAll(() => {
  // Очистка после тестов
});
