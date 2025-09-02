"use client";

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useDebounce } from '@/lib/hooks/useDebounce';

interface User {
  id: string;
  name: string | null;
  email: string;
  tel: string | null;
  tgId: string | null;
  avatarUrl: string | null;
  roles: string[];
  createdAt: string;
  updatedAt: string;
}

interface UsersResponse {
  items: User[];
  page: number;
  pageSize: number;
  total: number;
}

const ROLE_LABELS = {
  PLAYER: 'Игрок',
  MASTER: 'Мастер',
  MODERATOR: 'Модератор',
  SUPERADMIN: 'Суперадмин'
};

const ROLE_COLORS = {
  PLAYER: 'bg-blue-100 text-blue-800',
  MASTER: 'bg-green-100 text-green-800',
  MODERATOR: 'bg-yellow-100 text-yellow-800',
  SUPERADMIN: 'bg-red-100 text-red-800'
};

export default function AdminUsersPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  
  // Параметры фильтрации и поиска
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [selectedRoles, setSelectedRoles] = useState<string[]>(
    searchParams.getAll('roles[]') || []
  );
  const [sortBy, setSortBy] = useState(searchParams.get('sortBy') || 'createdAt');
  const [sortDir, setSortDir] = useState(searchParams.get('sortDir') || 'desc');
  const [page, setPage] = useState(parseInt(searchParams.get('page') || '1'));
  const [pageSize, setPageSize] = useState(parseInt(searchParams.get('pageSize') || '20'));

  const debouncedSearch = useDebounce(search, 300);

  // Обновление URL при изменении параметров
  const updateUrl = useCallback((params: Record<string, string | string[]>) => {
    const url = new URL(window.location.href);
    url.pathname = '/admin/users';
    
    // Очистка существующих параметров
    url.search = '';
    
    // Добавление новых параметров
    Object.entries(params).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        value.forEach(v => url.searchParams.append(`${key}[]`, v));
      } else if (value) {
        url.searchParams.set(key, value);
      }
    });

    router.push(url.toString());
  }, [router]);

  // Загрузка данных
  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      params.set('page', page.toString());
      params.set('pageSize', pageSize.toString());
      params.set('sortBy', sortBy);
      params.set('sortDir', sortDir);
      
      if (debouncedSearch) {
        params.set('search', debouncedSearch);
      }
      
      selectedRoles.forEach(role => {
        params.append('roles[]', role);
      });

      const response = await fetch(`/api/admin/users?${params.toString()}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Ошибка загрузки данных');
      }

      const data: UsersResponse = await response.json();
      setUsers(data.items);
      setTotal(data.total);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError(err instanceof Error ? err.message : 'Неизвестная ошибка');
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, sortBy, sortDir, debouncedSearch, selectedRoles]);

  // Загрузка данных при изменении параметров
  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Обновление URL при изменении параметров поиска
  useEffect(() => {
    const params: Record<string, string | string[]> = {
      page: page.toString(),
      pageSize: pageSize.toString(),
      sortBy,
      sortDir,
    };

    if (debouncedSearch) {
      params.search = debouncedSearch;
    }

    if (selectedRoles.length > 0) {
      params['roles'] = selectedRoles;
    }

    updateUrl(params);
  }, [page, pageSize, sortBy, sortDir, debouncedSearch, selectedRoles, updateUrl]);

  const handleRoleToggle = (role: string) => {
    setSelectedRoles(prev => 
      prev.includes(role) 
        ? prev.filter(r => r !== role)
        : [...prev, role]
    );
    setPage(1); // Сброс на первую страницу при изменении фильтров
  };

  const handleSort = (newSortBy: string) => {
    if (sortBy === newSortBy) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(newSortBy);
      setSortDir('asc');
    }
    setPage(1);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getSortIcon = (column: string) => {
    if (sortBy !== column) return '↕️';
    return sortDir === 'asc' ? '↑' : '↓';
  };

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card shadow-sm border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Link href="/admin" className="text-muted-foreground hover:text-foreground">
                ← Админ-панель
              </Link>
              <h1 className="text-xl font-semibold text-foreground">
                Управление пользователями
              </h1>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Фильтры и поиск */}
        <div className="mb-6 space-y-4">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Поиск */}
            <div className="flex-1">
              <Input
                type="text"
                placeholder="Поиск по имени, email, телефону или Telegram ID..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="w-full"
              />
            </div>

            {/* Размер страницы */}
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(parseInt(e.target.value));
                setPage(1);
              }}
              className="input w-auto"
            >
              <option value={10}>10 на странице</option>
              <option value={20}>20 на странице</option>
              <option value={50}>50 на странице</option>
              <option value={100}>100 на странице</option>
            </select>
          </div>

          {/* Фильтр по ролям */}
          <div className="flex flex-wrap gap-2">
            <span className="text-sm font-medium text-muted-foreground">Роли:</span>
            {Object.entries(ROLE_LABELS).map(([role, label]) => (
              <button
                key={role}
                onClick={() => handleRoleToggle(role)}
                className={`px-3 py-1 text-xs font-medium rounded-full border transition-colors ${
                  selectedRoles.includes(role)
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-background text-muted-foreground border-border hover:bg-accent'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Счетчик результатов */}
          <div className="text-sm text-muted-foreground">
            Найдено пользователей: <span className="font-medium">{total}</span>
          </div>
        </div>

        {/* Таблица */}
        {error ? (
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 text-destructive">
            {error}
          </div>
        ) : loading ? (
          <div className="bg-card rounded-lg border border-border p-8 text-center">
            <div className="text-muted-foreground">Загрузка...</div>
          </div>
        ) : users.length === 0 ? (
          <div className="bg-card rounded-lg border border-border p-8 text-center">
            <div className="text-muted-foreground">Пользователи не найдены</div>
          </div>
        ) : (
          <div className="bg-card rounded-lg border border-border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-accent/30">
                  <tr>
                    <th className="text-left p-4 font-medium">
                      <button
                        onClick={() => handleSort('name')}
                        className="flex items-center space-x-1 hover:text-foreground"
                      >
                        <span>Пользователь</span>
                        <span className="text-xs">{getSortIcon('name')}</span>
                      </button>
                    </th>
                    <th className="text-left p-4 font-medium">
                      <button
                        onClick={() => handleSort('email')}
                        className="flex items-center space-x-1 hover:text-foreground"
                      >
                        <span>Email</span>
                        <span className="text-xs">{getSortIcon('email')}</span>
                      </button>
                    </th>
                    <th className="text-left p-4 font-medium">Роли</th>
                    <th className="text-left p-4 font-medium">
                      <button
                        onClick={() => handleSort('createdAt')}
                        className="flex items-center space-x-1 hover:text-foreground"
                      >
                        <span>Регистрация</span>
                        <span className="text-xs">{getSortIcon('createdAt')}</span>
                      </button>
                    </th>
                    <th className="text-left p-4 font-medium">Действия</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id} className="border-t border-border hover:bg-accent/10">
                      <td className="p-4">
                        <div className="flex items-center space-x-3">
                          {user.avatarUrl ? (
                            <img
                              src={user.avatarUrl}
                              alt=""
                              className="w-8 h-8 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-xs font-medium">
                              {user.name?.charAt(0)?.toUpperCase() || user.email.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div>
                            <div className="font-medium">
                              {user.name || 'Без имени'}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {user.tel && <span>📞 {user.tel}</span>}
                              {user.tel && user.tgId && ' • '}
                              {user.tgId && <span>@{user.tgId}</span>}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-sm">{user.email}</td>
                      <td className="p-4">
                        <div className="flex flex-wrap gap-1">
                          {user.roles.map((role) => (
                            <span
                              key={role}
                              className={`px-2 py-1 text-xs font-medium rounded-full ${
                                ROLE_COLORS[role as keyof typeof ROLE_COLORS] || 'bg-gray-100 text-gray-800'
                              }`}
                            >
                              {ROLE_LABELS[role as keyof typeof ROLE_LABELS] || role}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="p-4 text-sm text-muted-foreground">
                        {formatDate(user.createdAt)}
                      </td>
                      <td className="p-4">
                        <Link
                          href={`/admin/users/${user.id}`}
                          className="text-primary hover:text-primary/80 text-sm font-medium"
                        >
                          Управление
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Пагинация */}
            {totalPages > 1 && (
              <div className="border-t border-border p-4 flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  Страница {page} из {totalPages}
                </div>
                <div className="flex space-x-2">
                  <Button
                    onClick={() => setPage(Math.max(1, page - 1))}
                    disabled={page <= 1}
                    className="btn-outline"
                  >
                    Назад
                  </Button>
                  <Button
                    onClick={() => setPage(Math.min(totalPages, page + 1))}
                    disabled={page >= totalPages}
                    className="btn-outline"
                  >
                    Вперед
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
