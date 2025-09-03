'use client';

import { ReactNode } from 'react';
import Link from 'next/link';
import { usePlayerCheck } from '@/lib/hooks/useRoleCheck';

interface PlayerPageWrapperProps {
  children: ReactNode;
}

export function PlayerPageWrapper({ children }: PlayerPageWrapperProps) {
  const { isLoading, hasRequiredRole } = usePlayerCheck();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Загрузка...</p>
        </div>
      </div>
    );
  }

  if (!hasRequiredRole) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">Доступ запрещен</h1>
          <p className="text-muted-foreground mb-4">У вас нет прав для доступа к этой странице.</p>
          <Link href="/" className="text-primary hover:underline">
            Вернуться на главную
          </Link>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
