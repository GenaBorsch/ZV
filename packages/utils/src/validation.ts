/**
 * Проверяет корректность email адреса
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Проверяет корректность российского номера телефона
 */
export function validatePhone(phone: string): boolean {
  // Убираем все символы кроме цифр
  const cleanPhone = phone.replace(/\D/g, '');
  
  // Проверяем российские номера: +7XXXXXXXXXX или 8XXXXXXXXXX
  const phoneRegex = /^[78]\d{10}$/;
  return phoneRegex.test(cleanPhone);
}

/**
 * Форматирует номер телефона в читаемом виде
 */
export function formatPhone(phone: string): string {
  const cleanPhone = phone.replace(/\D/g, '');
  
  if (cleanPhone.length === 11 && (cleanPhone.startsWith('7') || cleanPhone.startsWith('8'))) {
    return `+7 (${cleanPhone.slice(1, 4)}) ${cleanPhone.slice(4, 7)}-${cleanPhone.slice(7, 9)}-${cleanPhone.slice(9)}`;
  }
  
  return phone;
}

