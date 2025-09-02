type Role = 'PLAYER' | 'MASTER' | 'MODERATOR' | 'SUPERADMIN';

/**
 * Проверяет наличие конкретной роли у пользователя
 */
export function hasRole(userRoles: Role[], requiredRole: Role): boolean {
  return userRoles.includes(requiredRole);
}

/**
 * Проверяет наличие любой из указанных ролей у пользователя
 */
export function hasAnyRole(userRoles: Role[], requiredRoles: Role[]): boolean {
  return requiredRoles.some(role => userRoles.includes(role));
}

/**
 * Проверяет, является ли пользователь игроком
 */
export function isPlayer(userRoles: Role[]): boolean {
  return hasRole(userRoles, 'PLAYER');
}

/**
 * Проверяет, является ли пользователь мастером
 */
export function isMaster(userRoles: Role[]): boolean {
  return hasRole(userRoles, 'MASTER');
}

/**
 * Проверяет, является ли пользователь модератором
 */
export function isModerator(userRoles: Role[]): boolean {
  return hasRole(userRoles, 'MODERATOR');
}

/**
 * Проверяет, является ли пользователь суперадмином
 */
export function isSuperAdmin(userRoles: Role[]): boolean {
  return hasRole(userRoles, 'SUPERADMIN');
}

/**
 * Проверяет, имеет ли пользователь административные права
 */
export function isAdmin(userRoles: Role[]): boolean {
  return hasAnyRole(userRoles, ['MODERATOR', 'SUPERADMIN']);
}

