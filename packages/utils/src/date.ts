import { format, isToday, isTomorrow, isYesterday } from 'date-fns';
import { ru } from 'date-fns/locale';

/**
 * Форматирует дату в читаемом виде
 */
export function formatDate(date: Date | string, formatStr: string = 'dd.MM.yyyy'): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return format(dateObj, formatStr, { locale: ru });
}

/**
 * Форматирует дату и время
 */
export function formatDateTime(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return format(dateObj, 'dd.MM.yyyy HH:mm', { locale: ru });
}

/**
 * Проверяет, является ли дата сегодняшней
 */
export function isTodayDate(date: Date | string): boolean {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return isToday(dateObj);
}

/**
 * Проверяет, является ли дата завтрашней
 */
export function isTomorrowDate(date: Date | string): boolean {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return isTomorrow(dateObj);
}

/**
 * Проверяет, является ли дата вчерашней
 */
export function isYesterdayDate(date: Date | string): boolean {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return isYesterday(dateObj);
}

/**
 * Возвращает относительное время (сегодня, завтра, вчера или дату)
 */
export function getRelativeDate(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  if (isToday(dateObj)) return 'Сегодня';
  if (isTomorrow(dateObj)) return 'Завтра';
  if (isYesterday(dateObj)) return 'Вчера';
  
  return formatDate(dateObj);
}

/**
 * Форматирует длительность в минутах в читаемом виде
 */
export function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  
  if (hours === 0) return `${mins} мин`;
  if (mins === 0) return `${hours} ч`;
  return `${hours} ч ${mins} мин`;
}

