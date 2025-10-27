import Link from 'next/link';
import { NotificationBell } from '@/components/NotificationBell';
import { MobileMenu } from '@/components/MobileMenu';

export default function AdminDashboard() {
  const navItems = [];
  
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card shadow-sm border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2 md:space-x-4">
              <h1 className="text-base md:text-xl font-semibold text-foreground">
                Админ-панель
              </h1>
              <span className="hidden md:block px-2 py-1 text-xs font-medium bg-accent/30 text-foreground rounded-full">
                Модератор
              </span>
            </div>
            <nav className="flex items-center space-x-2 md:space-x-4">
              <NotificationBell className="text-muted-foreground hover:text-foreground" />
              <MobileMenu 
                navItems={navItems}
                title="Админ-панель"
                subtitle="Модератор"
              />
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <h2 className="text-2xl font-bold text-foreground mb-6">
            Панель управления сезоном
          </h2>

          {/* Stats */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-4 mb-8">
            <div className="card p-5"><div className="text-sm text-muted-foreground">Всего игроков</div><div className="text-lg font-medium">0</div></div>
            <div className="card p-5"><div className="text-sm text-muted-foreground">Активных мастеров</div><div className="text-lg font-medium">0</div></div>
            <div className="card p-5"><div className="text-sm text-muted-foreground">Активных групп</div><div className="text-lg font-medium">0</div></div>
            <div className="card p-5"><div className="text-sm text-muted-foreground">Доход за месяц</div><div className="text-lg font-medium">—</div></div>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="card p-6">
              <h3 className="text-lg font-medium text-foreground mb-4">Управление данными</h3>
              <div className="space-y-3">
                <Link href="/admin/groups" className="btn-outline w-full text-left">Группы и составы</Link>
                <Link href="/admin/reports" className="btn-outline w-full text-left">Отчёты по играм</Link>
                <Link href="/admin/payments" className="btn-outline w-full text-left">Платежи и путёвки</Link>
                <Link href="/admin/products" className="btn-outline w-full text-left">Офферы путёвок</Link>
                <Link href="/admin/story-pool" className="btn-outline w-full text-left">Пул событий</Link>
              </div>
            </div>

            <div className="card p-6">
              <h3 className="text-lg font-medium text-foreground mb-4">Контент и правила</h3>
              <div className="space-y-3">
                <Link href="/admin/rules" className="btn-outline w-full text-left">Правила и регламенты</Link>
                <Link href="/admin/schedule" className="btn-outline w-full text-left">Расписание игр</Link>
                <Link href="/admin/users" className="btn-outline w-full text-left">Управление пользователями</Link>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="mt-8">
            <div className="card p-6">
              <h3 className="text-lg font-medium text-foreground mb-4">Последние события</h3>
              <div className="border border-dashed border-border rounded-lg p-6 text-center text-muted-foreground">
                Событий пока нет.
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

