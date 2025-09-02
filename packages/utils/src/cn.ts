import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Объединяет CSS классы с помощью clsx и tailwind-merge
 * Позволяет избежать конфликтов Tailwind CSS классов
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

