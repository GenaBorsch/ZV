'use client';

import Link from 'next/link';
import { LogoutButton } from '@/components/LogoutButton';
import { MobileMenu } from '@/components/MobileMenu';
import { MasterDashboardContent } from '@/components/MasterDashboardContent';
import { NotificationBell } from '@/components/NotificationBell';
import { RoleSwitcher } from '@/components/RoleSwitcher';
import { useMasterCheck } from '@/lib/hooks/useRoleCheck';
import { useSession } from 'next-auth/react';

export default function MasterDashboard() {
  const { isLoading, hasRequiredRole } = useMasterCheck();
  const { data: session } = useSession();

  const navItems = [
    { label: 'Отчёты', href: '/master/reports' },
    { label: 'База знаний', href: '/wiki' },
    { label: 'Профиль', href: '/profile' },
  ];

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
            <div className="flex items-center space-x-2 md:space-x-4">
              <h1 className="text-base md:text-xl font-semibold text-foreground">
                Кабинет мастера
              </h1>
              <Link 
                href="/profile" 
                className="hidden md:block px-2 py-1 text-xs font-medium bg-accent/30 text-foreground rounded-full hover:bg-accent/50 transition-colors cursor-pointer"
                title="Редактировать профиль"
              >
                {session?.user?.name || 'Мастер'}
              </Link>
            </div>
            <nav className="flex items-center space-x-2 md:space-x-4">
              <NotificationBell className="text-muted-foreground hover:text-foreground" />
              {/* Desktop navigation */}
              <div className="hidden md:flex items-center space-x-4">
                <RoleSwitcher />
                <Link href="/master/reports" className="text-muted-foreground hover:text-foreground">
                  Отчёты
                </Link>
                <Link href="/wiki" className="text-muted-foreground hover:text-foreground">
                  База знаний
                </Link>
                <LogoutButton className="text-muted-foreground hover:text-foreground" />
              </div>
              {/* Mobile menu */}
              <MobileMenu 
                navItems={navItems}
                title="Кабинет мастера"
                subtitle={session?.user?.name || 'Мастер'}
              />
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <MasterDashboardContent />
      </main>
    </div>
  );
}

