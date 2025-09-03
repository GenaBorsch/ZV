import type { Metadata } from 'next';
import './globals.css';
import Link from 'next/link';
import { LogoutButton } from '@/components/LogoutButton';
import { Providers } from '@/components/Providers';
import { getServerSession } from 'next-auth';
import { cookies } from 'next/headers';

export const metadata: Metadata = {
  title: 'Звёздное Веретено - Личные кабинеты',
  description: 'Личные кабинеты для проведения игры по НРИ "Звёздное Веретено"',
  keywords: 'НРИ, ролевые игры, Звёздное Веретено, личные кабинеты',
};

export default function RootLayout({ children, }: { children: React.ReactNode; }) {
  return (
    <html lang="ru">
      <body>
        <Providers>
          <header className="border-b">
            <div className="container mx-auto flex items-center justify-between py-3">
              <Link href="/" className="font-semibold">Звёздное Веретено</Link>
              <nav className="flex items-center gap-3">
                <Link href="/player" className="hover:underline">ЛК Игрока</Link>
                <LogoutButton className="btn-outline" />
              </nav>
            </div>
          </header>
          <div className="min-h-screen">
            {children}
          </div>
        </Providers>
      </body>
    </html>
  );
}

