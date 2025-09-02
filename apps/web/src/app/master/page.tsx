import Link from 'next/link';
import { LogoutButton } from '@/components/LogoutButton';

export default function MasterDashboard() {
  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="bg-card shadow-sm border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <h1 className="text-xl font-semibold text-foreground">
                Кабинет мастера
              </h1>
              <span className="px-2 py-1 text-xs font-medium bg-accent/30 text-foreground rounded-full">
                Мастер
              </span>
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
        <div className="px-4 py-6 sm:px-0">
          <h2 className="text-2xl font-bold text-foreground mb-6">
            Добро пожаловать!
          </h2>

          {/* Stats */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-4 mb-8">
            <div className="card p-5"><div className="text-sm text-muted-foreground">Мои группы</div><div className="text-lg font-medium">0</div></div>
            <div className="card p-5"><div className="text-sm text-muted-foreground">Всего игроков</div><div className="text-lg font-medium">0</div></div>
            <div className="card p-5"><div className="text-sm text-muted-foreground">Ближайшие игры</div><div className="text-lg font-medium">0</div></div>
            <div className="card p-5"><div className="text-sm text-muted-foreground">Отчёты</div><div className="text-lg font-medium">0</div></div>
          </div>

          {/* Main Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Groups */}
            <div className="lg:col-span-2 space-y-6">
              <div className="card p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium text-foreground">Мои группы</h3>
                  <button className="btn-primary">Создать группу</button>
                </div>
                <div className="border border-dashed border-border rounded-lg p-6 text-center text-muted-foreground">
                  У вас пока нет групп. Создайте первую, чтобы начать работу.
                </div>
              </div>

              <div className="card p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium text-foreground">Ближайшие игры</h3>
                  <button className="btn-primary">Добавить игру</button>
                </div>
                <div className="border border-dashed border-border rounded-lg p-6 text-center text-muted-foreground">
                  Нет запланированных игр.
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              <div className="card p-6">
                <h3 className="text-lg font-medium text-foreground mb-4">Мой профиль</h3>
                <div className="border border-dashed border-border rounded-lg p-6 text-center text-muted-foreground">
                  Профиль мастера ещё не заполнен.
                </div>
              </div>

              <div className="card p-6">
                <h3 className="text-lg font-medium text-foreground mb-4">Быстрые действия</h3>
                <div className="space-y-3">
                  <button className="btn-outline w-full text-left">📝 Написать отчёт</button>
                  <button className="btn-outline w-full text-left">👥 Управление игроками</button>
                </div>
              </div>

              <div className="card p-6">
                <h3 className="text-lg font-medium text-foreground mb-4">Последние отчёты</h3>
                <div className="border border-dashed border-border rounded-lg p-6 text-center text-muted-foreground">
                  Отчётов пока нет.
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

