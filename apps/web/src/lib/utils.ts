import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Локализация статусов путёвок
export function getBattlepassStatusLabel(status: string): string {
  switch (status) {
    case 'ACTIVE':
      return 'Активна';
    case 'USED_UP':
      return 'Использована';
    case 'EXPIRED':
      return 'Истекла';
    default:
      return status;
  }
}

// Стили для статусов путёвок
export function getBattlepassStatusClasses(status: string): string {
  switch (status) {
    case 'ACTIVE':
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    case 'USED_UP':
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    case 'EXPIRED':
      return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
    default:
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
  }
}
