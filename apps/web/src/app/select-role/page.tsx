'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession, signIn } from 'next-auth/react';
import Link from 'next/link';

export default function SelectRolePage() {
  const { data: session, update } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const roles = (session?.user as any)?.roles || [];

  const handleRoleSelect = async (role: string) => {
    try {
      setIsLoading(true);
      
      // Устанавливаем активную роль через update сессии
      await update({
        activeRole: role,
      });

      // Перенаправляем в соответствующий кабинет
      const redirectPaths: Record<string, string> = {
        'MASTER': '/master',
        'PLAYER': '/player',
        'MODERATOR': '/admin',
        'SUPERADMIN': '/admin',
      };

      const redirectPath = redirectPaths[role] || '/';
      router.push(redirectPath);
    } catch (error) {
      console.error('Error selecting role:', error);
      alert('Ошибка при выборе роли');
    } finally {
      setIsLoading(false);
    }
  };

  const roleInfo: Record<string, { name: string; description: string; icon: string; path: string }> = {
    'MASTER': {
      name: 'Мастер',
      description: 'Управление игровыми группами, создание отчётов, проведение сессий',
      icon: '🎲',
      path: '/master',
    },
    'PLAYER': {
      name: 'Игрок',
      description: 'Участие в игровых группах, управление персонажами, покупка путёвок',
      icon: '🎭',
      path: '/player',
    },
    'MODERATOR': {
      name: 'Модератор',
      description: 'Модерация контента, управление пользователями и заявками',
      icon: '🛡️',
      path: '/admin',
    },
    'SUPERADMIN': {
      name: 'Администратор',
      description: 'Полный доступ к системе, управление всеми ресурсами и пользователями',
      icon: '👑',
      path: '/admin',
    },
  };

  // Если роли загружаются
  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Загрузка...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Выберите роль</h1>
          <p className="text-muted-foreground">
            Выберите роль для работы в системе
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {roles.map((role: string) => {
            const info = roleInfo[role];
            if (!info) return null;

            return (
              <button
                key={role}
                onClick={() => handleRoleSelect(role)}
                disabled={isLoading}
                className="card p-6 text-left hover:bg-accent/50 transition-colors relative group"
              >
                <div className="flex items-start space-x-4">
                  <div className="text-4xl">{info.icon}</div>
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-foreground mb-2">
                      {info.name}
                    </h3>
                    <p className="text-muted-foreground mb-4">
                      {info.description}
                    </p>
                    {isLoading ? (
                      <div className="flex items-center justify-center py-2">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
                      </div>
                    ) : (
                      <div className="flex items-center text-primary font-medium">
                        Перейти в кабинет
                        <svg className="ml-2 w-5 h-5 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        <div className="text-center mt-8">
          <Link href="/profile" className="text-muted-foreground hover:text-foreground text-sm">
            Профиль
          </Link>
        </div>
      </div>
    </div>
  );
}

