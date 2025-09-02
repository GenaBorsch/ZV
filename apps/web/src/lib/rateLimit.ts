type Key = string;

type AttemptInfo = {
  count: number;
  firstAt: number; // ms
};

const windowMs = 10 * 60 * 1000; // 10 минут
const maxAttempts = 5;

const store = new Map<Key, AttemptInfo>();

export function getClientIpFromHeaders(headers: Headers | Record<string, string | string[] | undefined> | undefined): string {
  if (!headers) return 'unknown';
  const getHeader = (name: string): string | undefined => {
    if (headers instanceof Headers) return headers.get(name) || undefined;
    const value = (headers as any)[name];
    if (Array.isArray(value)) return value[0];
    return value as string | undefined;
  };
  const xff = getHeader('x-forwarded-for');
  if (xff) return xff.split(',')[0].trim();
  const realIp = getHeader('x-real-ip');
  if (realIp) return realIp;
  return 'unknown';
}

export function isRateLimited(keyParts: Array<string | undefined | null>): boolean {
  const key = keyParts.filter(Boolean).join('|');
  if (!key) return false;
  const now = Date.now();
  const current = store.get(key);
  if (!current) {
    store.set(key, { count: 1, firstAt: now });
    return false;
  }
  // Сбрасываем по окну
  if (now - current.firstAt > windowMs) {
    store.set(key, { count: 1, firstAt: now });
    return false;
  }
  current.count += 1;
  store.set(key, current);
  return current.count > maxAttempts;
}

export function resetRateLimit(keyParts: Array<string | undefined | null>): void {
  const key = keyParts.filter(Boolean).join('|');
  if (!key) return;
  store.delete(key);
}


