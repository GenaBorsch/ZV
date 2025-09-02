import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="bg-card shadow-sm border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-foreground">
                Звёздное Веретено
              </h1>
            </div>
            <nav className="flex space-x-8">
              <Link 
                href="/auth/login" 
                className="text-muted-foreground hover:text-foreground px-3 py-2 rounded-md text-sm font-medium"
              >
                Войти
              </Link>
              <Link 
                href="/auth/register" 
                className="btn-primary"
              >
                Регистрация
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-6xl">
            Добро пожаловать в сезон
            <span className="block text-primary">«Звёздное Веретено»</span>
          </h1>
          <p className="mt-6 text-lg leading-8 text-muted-foreground max-w-3xl mx-auto">
            Присоединяйтесь к эпическому приключению в мире НРИ! Управляйте своими персонажами, 
            участвуйте в захватывающих играх и станьте частью легендарного сезона.
          </p>
          <div className="mt-10 flex items-center justify-center gap-x-6">
            <Link 
              href="/auth/register" 
              className="btn-primary text-lg px-8 py-4"
            >
              Начать приключение
            </Link>
            <Link 
              href="/about" 
              className="btn-outline text-lg px-8 py-4"
            >
              Узнать больше
            </Link>
          </div>
        </div>

        {/* Features */}
        <div className="mt-32 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          <div className="card p-6">
            <div className="w-12 h-12 bg-accent/30 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">Личный кабинет игрока</h3>
            <p className="text-muted-foreground">
              Управляйте персонажами, записывайтесь на игры и отслеживайте свой прогресс в сезоне.
            </p>
          </div>

          <div className="card p-6">
            <div className="w-12 h-12 bg-accent/30 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">Кабинет мастера</h3>
            <p className="text-muted-foreground">
              Создавайте группы, управляйте играми и ведите отчёты о проведённых сессиях.
            </p>
          </div>

          <div className="card p-6">
            <div className="w-12 h-12 bg-accent/30 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">Баттлпассы</h3>
            <p className="text-muted-foreground">
              Выбирайте подходящий тариф: на весь сезон, на 4 игры или разовое участие.
            </p>
          </div>
        </div>

        {/* CTA Section */}
        <div className="mt-32 bg-card rounded-2xl shadow-xl p-8 text-center">
          <h2 className="text-3xl font-bold text-foreground mb-4">
            Готовы к приключениям?
          </h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            Присоединяйтесь к сообществу игроков и мастеров. Создавайте незабываемые истории 
            и станьте легендой сезона «Звёздное Веретено».
          </p>
          <Link 
            href="/auth/register" 
            className="btn-primary text-lg px-8 py-4"
          >
            Создать аккаунт
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-foreground text-background mt-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-lg font-semibold mb-4">Звёздное Веретено</h3>
              <p className="opacity-80">
                Личные кабинеты для проведения игры по НРИ с микросервисной архитектурой.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Ссылки</h3>
              <ul className="space-y-2 opacity-80">
                <li><Link href="/rules" className="hover:text-background">Правила</Link></li>
                <li><Link href="/schedule" className="hover:text-background">Расписание</Link></li>
                <li><Link href="/support" className="hover:text-background">Поддержка</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Контакты</h3>
              <ul className="space-y-2 opacity-80">
                <li>Email: info@zvezdnoe-vereteno.ru</li>
                <li>Сайт: zvezdnoe-vereteno.ru</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-border mt-8 pt-8 text-center opacity-80">
            <p>&copy; 2025 Звёздное Веретено. Все права защищены.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

