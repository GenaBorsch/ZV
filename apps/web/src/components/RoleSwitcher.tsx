'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

interface RoleSwitcherProps {
  className?: string;
  label?: string;
  fullWidth?: boolean;
}

export function RoleSwitcher({ className, label, fullWidth }: RoleSwitcherProps) {
  const { data: session, update } = useSession();
  const router = useRouter();
  const [isChanging, setIsChanging] = useState(false);

  const roles = (session?.user as any)?.roles || [];
  const activeRole = (session?.user as any)?.activeRole;
  
  // Если роли меньше 2, не показываем переключатель
  if (roles.length < 2) return null;

  const handleRoleChange = async (role: string) => {
    try {
      setIsChanging(true);
      
      // Обновляем сессию
      const result = await update({
        activeRole: role,
      });

      // Небольшая задержка для обновления сессии
      await new Promise(resolve => setTimeout(resolve, 100));

      // Перенаправляем в соответствующий кабинет
      const redirectPaths: Record<string, string> = {
        'MASTER': '/master',
        'PLAYER': '/player',
        'MODERATOR': '/admin',
        'SUPERADMIN': '/admin',
      };

      const redirectPath = redirectPaths[role] || '/';
      
      // Используем window.location для полной перезагрузки страницы
      window.location.href = redirectPath;
    } catch (error) {
      console.error('Error changing role:', error);
      alert('Ошибка при смене роли');
      setIsChanging(false);
    }
  };

  const roleNames: Record<string, string> = {
    'MASTER': 'Мастер',
    'PLAYER': 'Игрок',
    'MODERATOR': 'Модератор',
    'SUPERADMIN': 'Администратор',
  };

  const roleIcons: Record<string, string> = {
    'MASTER': '🎲',
    'PLAYER': '🎭',
    'MODERATOR': '🛡️',
    'SUPERADMIN': '👑',
  };

  return (
    <div className={`relative ${fullWidth ? 'w-full' : ''} ${className || ''}`}>
      {label && <label className="block text-sm text-muted-foreground mb-1">{label}</label>}
      <select
        value={activeRole || ''}
        onChange={(e) => handleRoleChange(e.target.value)}
        disabled={isChanging}
        className={`bg-background border border-border rounded-md px-3 py-1.5 text-sm text-foreground hover:bg-accent transition-colors cursor-pointer disabled:opacity-50 ${fullWidth ? 'w-full' : ''}`}
        title="Выбрать роль"
      >
        {roles.map((role: string) => (
          <option key={role} value={role}>
            {roleIcons[role]} {roleNames[role]}
          </option>
        ))}
      </select>
    </div>
  );
}

