/**
 * Определяет правильный URL для редиректа в зависимости от ролей пользователя
 */
export function getRedirectUrlByRoles(roles: string[]): string {
  if (roles.includes('SUPERADMIN') || roles.includes('MODERATOR')) {
    return '/admin';
  }
  
  if (roles.includes('MASTER')) {
    return '/master';
  }
  
  if (roles.includes('PLAYER')) {
    return '/player';
  }
  
  // По умолчанию для пользователей без ролей
  return '/';
}

/**
 * Проверяет, нужно ли пользователю заполнить профиль
 */
export function needsProfileCompletion(user: { name?: string | null }): boolean {
  return !user.name;
}
