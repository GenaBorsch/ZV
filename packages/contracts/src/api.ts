// Базовый тип для API ответов
export interface ApiResponse<T = any> {
  ok: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Пагинация
export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Фильтры для запросов
export interface ScheduleFilters {
  from?: string;
  to?: string;
  groupId?: string;
  masterId?: string;
  format?: 'ONLINE' | 'OFFLINE' | 'MIXED';
}

export interface GroupsFilters {
  seasonId?: string;
  masterId?: string;
  clubId?: string;
  status?: 'ACTIVE' | 'INACTIVE';
}

export interface ReportsFilters {
  groupId?: string;
  seasonId?: string;
  masterId?: string;
  from?: string;
  to?: string;
}

// Поиск
export interface SearchParams {
  query: string;
  type?: 'users' | 'groups' | 'sessions' | 'products';
  limit?: number;
}

