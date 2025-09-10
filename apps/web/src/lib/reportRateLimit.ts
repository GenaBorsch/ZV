import { rateLimit } from '@/lib/rateLimit';

// Rate limiting для создания отчётов: 10 отчётов в час на мастера
export const reportCreationRateLimit = rateLimit({
  interval: 60 * 60 * 1000, // 1 час в миллисекундах
  uniqueTokenPerInterval: 500, // Максимум 500 уникальных мастеров
});

// Rate limiting для модерации отчётов: 100 действий в час на администратора
export const reportModerationRateLimit = rateLimit({
  interval: 60 * 60 * 1000, // 1 час в миллисекундах
  uniqueTokenPerInterval: 50, // Максимум 50 уникальных администраторов
});

// Проверка лимита для создания отчётов
export async function checkReportCreationLimit(userId: string): Promise<boolean> {
  try {
    await reportCreationRateLimit.check(10, userId); // 10 отчётов в час
    return true;
  } catch {
    return false;
  }
}

// Проверка лимита для модерации отчётов
export async function checkReportModerationLimit(userId: string): Promise<boolean> {
  try {
    await reportModerationRateLimit.check(100, userId); // 100 действий в час
    return true;
  } catch {
    return false;
  }
}
