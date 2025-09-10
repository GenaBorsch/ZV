import { isRateLimited } from '@/lib/rateLimit';

// Проверка лимита для создания отчётов
export async function checkReportCreationLimit(userId: string): Promise<boolean> {
  // Простая проверка: не более 10 отчетов в час от одного пользователя
  const rateLimited = isRateLimited(['report-creation', userId]);
  return !rateLimited;
}

// Проверка лимита для модерации отчётов
export async function checkReportModerationLimit(userId: string): Promise<boolean> {
  // Простая проверка: не более 100 действий модерации в час
  const rateLimited = isRateLimited(['report-moderation', userId]);
  return !rateLimited;
}
