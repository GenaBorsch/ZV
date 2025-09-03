import Link from 'next/link';
import { LogoutButton } from '@/components/LogoutButton';
import { MasterDashboardContent } from '@/components/MasterDashboardContent';

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
        <MasterDashboardContent />
      </main>
    </div>
  );
}

