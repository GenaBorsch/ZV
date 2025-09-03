'use client';

import Link from 'next/link';
import { LogoutButton } from '@/components/LogoutButton';
import { PlayerDashboardContent } from '@/components/PlayerDashboardContent';
import { usePlayerCheck } from '@/lib/hooks/useRoleCheck';
import { useSession } from 'next-auth/react';

export default function PlayerDashboard() {
  const { isLoading, hasRequiredRole } = usePlayerCheck();
  const { data: session } = useSession();

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
  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="bg-card shadow-sm border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <h1 className="text-xl font-semibold text-foreground">
                Кабинет игрока
              </h1>
              <Link 
                href="/profile" 
                className="px-2 py-1 text-xs font-medium bg-accent/30 text-foreground rounded-full hover:bg-accent/50 transition-colors cursor-pointer"
                title="Редактировать профиль"
              >
                {session?.user?.name || 'Игрок'}
              </Link>
            </div>
            <nav className="flex space-x-4">
              <Link href="/" className="text-muted-foreground hover:text-foreground">
                На главную
              </Link>
              <LogoutButton className="text-muted-foreground hover:text-foreground" />
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <PlayerDashboardContent />
      </main>
    </div>
  );
}