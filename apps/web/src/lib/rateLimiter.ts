/**
 * Rate Limiter - защита от спама и атак
 * Простыми словами: ограничивает количество запросов от одного пользователя
 */

type Key = string;

type AttemptInfo = {
  count: number;
  firstAt: number; // timestamp в миллисекундах
};

// Настройки лимитов для разных типов запросов
export const RATE_LIMITS = {
  // Логин/регистрация - строгие лимиты (защита от подбора паролей)
  AUTH: {
    windowMs: 15 * 60 * 1000, // 15 минут
    maxAttempts: 5, // 5 попыток
  },
  
  // Обычные API запросы
  API: {
    windowMs: 60 * 1000, // 1 минута
    maxAttempts: 100, // 100 запросов
  },
  
  // Загрузка файлов
  UPLOAD: {
    windowMs: 60 * 60 * 1000, // 1 час
    maxAttempts: 10, // 10 файлов
  },
  
  // Создание отчетов (уже было в проекте)
  REPORTS: {
    windowMs: 60 * 60 * 1000, // 1 час
    maxAttempts: 10, // 10 отчетов
  },
} as const;

// Хранилище попыток (в памяти, для production лучше Redis)
const store = new Map<Key, AttemptInfo>();

/**
 * Получить IP адрес клиента из headers
 */
export function getClientIpFromHeaders(headers: Headers | Record<string, string | string[] | undefined> | undefined): string {
  if (!headers) return 'unknown';
  
  const getHeader = (name: string): string | undefined => {
    if (headers instanceof Headers) return headers.get(name) || undefined;
    const value = (headers as any)[name];
    if (Array.isArray(value)) return value[0];
    return value as string | undefined;
  };
  
  // Проверяем x-forwarded-for (для запросов через proxy/load balancer)
  const xff = getHeader('x-forwarded-for');
  if (xff) return xff.split(',')[0].trim();
  
  // Проверяем x-real-ip
  const realIp = getHeader('x-real-ip');
  if (realIp) return realIp;
  
  return 'unknown';
}

/**
 * Проверить, превышен ли лимит запросов
 * 
 * @param keyParts - части ключа (например: [ip, 'login'] или [userId, 'upload'])
 * @param limitConfig - настройки лимита (из RATE_LIMITS)
 * @returns true если лимит превышен, false если можно продолжать
 */
export function isRateLimited(
  keyParts: Array<string | undefined | null>,
  limitConfig: { windowMs: number; maxAttempts: number } = RATE_LIMITS.API
): boolean {
  const key = keyParts.filter(Boolean).join('|');
  if (!key) return false;
  
  const now = Date.now();
  const current = store.get(key);
  
  // Первый запрос - записываем
  if (!current) {
    store.set(key, { count: 1, firstAt: now });
    return false;
  }
  
  // Окно времени истекло - сбрасываем счетчик
  if (now - current.firstAt > limitConfig.windowMs) {
    store.set(key, { count: 1, firstAt: now });
    return false;
  }
  
  // Увеличиваем счетчик
  current.count += 1;
  store.set(key, current);
  
  // Проверяем превышение лимита
  return current.count > limitConfig.maxAttempts;
}

/**
 * Сбросить лимит для ключа (например, после успешного логина)
 */
export function resetRateLimit(keyParts: Array<string | undefined | null>): void {
  const key = keyParts.filter(Boolean).join('|');
  if (!key) return;
  store.delete(key);
}

/**
 * Получить информацию о текущем лимите
 */
export function getRateLimitInfo(
  keyParts: Array<string | undefined | null>,
  limitConfig: { windowMs: number; maxAttempts: number } = RATE_LIMITS.API
): { remaining: number; resetAt: number } | null {
  const key = keyParts.filter(Boolean).join('|');
  if (!key) return null;
  
  const current = store.get(key);
  if (!current) {
    return {
      remaining: limitConfig.maxAttempts,
      resetAt: Date.now() + limitConfig.windowMs,
    };
  }
  
  return {
    remaining: Math.max(0, limitConfig.maxAttempts - current.count),
    resetAt: current.firstAt + limitConfig.windowMs,
  };
}

/**
 * Очистка старых записей (нужно вызывать периодически)
 * Простыми словами: удаляет старые записи чтобы не засорять память
 */
export function cleanupOldEntries(): void {
  const now = Date.now();
  const maxWindowMs = Math.max(
    RATE_LIMITS.AUTH.windowMs,
    RATE_LIMITS.API.windowMs,
    RATE_LIMITS.UPLOAD.windowMs,
    RATE_LIMITS.REPORTS.windowMs
  );
  
  for (const [key, info] of store.entries()) {
    if (now - info.firstAt > maxWindowMs) {
      store.delete(key);
    }
  }
}

// Запускаем очистку каждые 5 минут
if (typeof setInterval !== 'undefined') {
  setInterval(cleanupOldEntries, 5 * 60 * 1000);
}
