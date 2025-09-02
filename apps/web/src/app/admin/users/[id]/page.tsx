"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AdminUpdateUserDto } from '@zv/contracts/admin';
import { z } from 'zod';

interface UserDetail {
  user: {
    id: string;
    name: string | null;
    email: string;
    tel: string | null;
    tgId: string | null;
    avatarUrl: string | null;
    createdAt: string;
    updatedAt: string;
  };
  roles: string[];
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

const ALL_ROLES = ['PLAYER', 'MASTER', 'MODERATOR', 'SUPERADMIN'];

type FormData = z.infer<typeof AdminUpdateUserDto>;

export default function AdminUserDetailPage() {
  const params = useParams() as { id: string };
  const router = useRouter();
  
  const [userDetail, setUserDetail] = useState<UserDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [rolesLoading, setRolesLoading] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showRolesDialog, setShowRolesDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm<FormData>({
    resolver: zodResolver(AdminUpdateUserDto)
  });

  // Загрузка данных пользователя
  const fetchUser = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/admin/users/${params.id}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Ошибка загрузки данных');
      }

      const data: UserDetail = await response.json();
      setUserDetail(data);
      
      // Заполнение формы текущими данными
      reset({
        name: data.user.name || '',
        email: data.user.email,
        tel: data.user.tel || '',
        tgId: data.user.tgId || '',
        avatarUrl: data.user.avatarUrl || '',
      });
    } catch (err) {
      console.error('Error fetching user:', err);
      setError(err instanceof Error ? err.message : 'Неизвестная ошибка');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, [params.id]);

  // Обновление пользователя
  const handleUpdateUser = async (data: FormData) => {
    try {
      setSaving(true);
      setError(null);

      const response = await fetch(`/api/admin/users/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Ошибка сохранения');
      }

      const updatedUser = await response.json();
      
      // Обновление состояния
      setUserDetail(prev => prev ? {
        ...prev,
        user: {
          ...prev.user,
          ...updatedUser,
        }
      } : null);
      
      setShowEditDialog(false);
      alert('Пользователь успешно обновлен');
    } catch (err) {
      console.error('Error updating user:', err);
      setError(err instanceof Error ? err.message : 'Ошибка обновления');
    } finally {
      setSaving(false);
    }
  };

  // Управление ролями
  const handleRoleToggle = async (role: string) => {
    if (!userDetail) return;

    try {
      setRolesLoading(true);
      setError(null);

      const hasRole = userDetail.roles.includes(role);
      const action = hasRole ? 'remove' : 'add';

      const response = await fetch(`/api/admin/users/${params.id}/roles`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          [action]: [role]
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Ошибка изменения ролей');
      }

      const { roles } = await response.json();
      
      // Обновление состояния
      setUserDetail(prev => prev ? {
        ...prev,
        roles
      } : null);
    } catch (err) {
      console.error('Error updating roles:', err);
      setError(err instanceof Error ? err.message : 'Ошибка изменения ролей');
    } finally {
      setRolesLoading(false);
    }
  };

  // Удаление пользователя
  const handleDeleteUser = async () => {
    try {
      setSaving(true);
      setError(null);

      const response = await fetch(`/api/admin/users/${params.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Ошибка удаления');
      }

      alert('Пользователь успешно удален');
      router.push('/admin/users');
    } catch (err) {
      console.error('Error deleting user:', err);
      setError(err instanceof Error ? err.message : 'Ошибка удаления');
    } finally {
      setSaving(false);
      setShowDeleteDialog(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground">Загрузка...</div>
      </div>
    );
  }

  if (error && !userDetail) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 text-destructive">
          {error}
        </div>
      </div>
    );
  }

  if (!userDetail) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground">Пользователь не найден</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card shadow-sm border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Link href="/admin/users" className="text-muted-foreground hover:text-foreground">
                ← Пользователи
              </Link>
              <h1 className="text-xl font-semibold text-foreground">
                {userDetail.user.name || userDetail.user.email}
              </h1>
            </div>
            <div className="flex space-x-2">
              <Button 
                onClick={() => setShowEditDialog(true)}
                className="btn-outline"
              >
                Редактировать
              </Button>
              <Button 
                onClick={() => setShowRolesDialog(true)}
                className="btn-outline"
                disabled={rolesLoading}
              >
                {rolesLoading ? 'Обновление...' : 'Управление ролями'}
              </Button>
              <Button 
                onClick={() => setShowDeleteDialog(true)}
                className="btn-outline text-destructive hover:bg-destructive hover:text-destructive-foreground"
              >
                Удалить
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {error && (
          <div className="mb-6 bg-destructive/10 border border-destructive/20 rounded-lg p-4 text-destructive">
            {error}
          </div>
        )}

        {/* Карточка пользователя */}
        <div className="bg-card rounded-lg border border-border p-6 mb-6">
          <div className="flex items-start space-x-6">
            {userDetail.user.avatarUrl ? (
              <img
                src={userDetail.user.avatarUrl}
                alt=""
                className="w-20 h-20 rounded-full object-cover"
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-accent flex items-center justify-center text-2xl font-medium">
                {userDetail.user.name?.charAt(0)?.toUpperCase() || userDetail.user.email.charAt(0).toUpperCase()}
              </div>
            )}
            
            <div className="flex-1 space-y-4">
              <div>
                <h2 className="text-2xl font-bold">
                  {userDetail.user.name || 'Без имени'}
                </h2>
                <p className="text-muted-foreground">{userDetail.user.email}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Телефон:</span>
                  <span className="ml-2">{userDetail.user.tel || 'Не указан'}</span>
                </div>
                <div>
                  <span className="font-medium">Telegram:</span>
                  <span className="ml-2">{userDetail.user.tgId ? `@${userDetail.user.tgId}` : 'Не указан'}</span>
                </div>
                <div>
                  <span className="font-medium">Регистрация:</span>
                  <span className="ml-2">{formatDate(userDetail.user.createdAt)}</span>
                </div>
                <div>
                  <span className="font-medium">Обновление:</span>
                  <span className="ml-2">{formatDate(userDetail.user.updatedAt)}</span>
                </div>
              </div>

              <div>
                <span className="font-medium text-sm">Роли:</span>
                <div className="flex flex-wrap gap-2 mt-2">
                  {userDetail.roles.map((role) => (
                    <span
                      key={role}
                      className={`px-3 py-1 text-sm font-medium rounded-full ${
                        ROLE_COLORS[role as keyof typeof ROLE_COLORS] || 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {ROLE_LABELS[role as keyof typeof ROLE_LABELS] || role}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Диалог редактирования */}
        {showEditDialog && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-card rounded-lg border border-border p-6 w-full max-w-md mx-4">
              <h3 className="text-lg font-semibold mb-4">Редактирование пользователя</h3>
              
              <form onSubmit={handleSubmit(handleUpdateUser)} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Имя</label>
                  <Input
                    {...register('name')}
                    placeholder="Имя пользователя"
                  />
                  {errors.name && (
                    <p className="text-sm text-destructive mt-1">{errors.name.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Email</label>
                  <Input
                    {...register('email')}
                    type="email"
                    placeholder="email@example.com"
                  />
                  {errors.email && (
                    <p className="text-sm text-destructive mt-1">{errors.email.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Телефон</label>
                  <Input
                    {...register('tel')}
                    placeholder="+7 (999) 123-45-67"
                  />
                  {errors.tel && (
                    <p className="text-sm text-destructive mt-1">{errors.tel.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Telegram ID</label>
                  <Input
                    {...register('tgId')}
                    placeholder="username"
                  />
                  {errors.tgId && (
                    <p className="text-sm text-destructive mt-1">{errors.tgId.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">URL аватара</label>
                  <Input
                    {...register('avatarUrl')}
                    placeholder="https://example.com/avatar.jpg"
                  />
                  {errors.avatarUrl && (
                    <p className="text-sm text-destructive mt-1">{errors.avatarUrl.message}</p>
                  )}
                </div>

                <div className="flex space-x-2 pt-4">
                  <Button 
                    type="submit" 
                    disabled={saving}
                    className="flex-1"
                  >
                    {saving ? 'Сохранение...' : 'Сохранить'}
                  </Button>
                  <Button 
                    type="button"
                    onClick={() => setShowEditDialog(false)}
                    className="btn-outline"
                  >
                    Отмена
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Диалог управления ролями */}
        {showRolesDialog && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-card rounded-lg border border-border p-6 w-full max-w-md mx-4">
              <h3 className="text-lg font-semibold mb-4">Управление ролями</h3>
              
              <div className="space-y-3">
                {ALL_ROLES.map((role) => (
                  <label key={role} className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={userDetail.roles.includes(role)}
                      onChange={() => handleRoleToggle(role)}
                      disabled={rolesLoading}
                      className="rounded border-border"
                    />
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      ROLE_COLORS[role as keyof typeof ROLE_COLORS]
                    }`}>
                      {ROLE_LABELS[role as keyof typeof ROLE_LABELS]}
                    </span>
                  </label>
                ))}
              </div>

              <div className="flex space-x-2 pt-4">
                <Button 
                  onClick={() => setShowRolesDialog(false)}
                  className="flex-1"
                >
                  Готово
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Диалог удаления */}
        {showDeleteDialog && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-card rounded-lg border border-border p-6 w-full max-w-md mx-4">
              <h3 className="text-lg font-semibold mb-4">Подтверждение удаления</h3>
              
              <p className="text-muted-foreground mb-6">
                Вы действительно хотите удалить пользователя <strong>{userDetail.user.name || userDetail.user.email}</strong>? 
                Это действие нельзя отменить.
              </p>

              <div className="flex space-x-2">
                <Button 
                  onClick={handleDeleteUser}
                  disabled={saving}
                  className="flex-1 bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                >
                  {saving ? 'Удаление...' : 'Удалить'}
                </Button>
                <Button 
                  onClick={() => setShowDeleteDialog(false)}
                  className="btn-outline"
                >
                  Отмена
                </Button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
