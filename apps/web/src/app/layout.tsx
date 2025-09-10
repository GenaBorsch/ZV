import type { Metadata } from 'next';
import './globals.css';
import { Providers } from '@/components/Providers';
import { BasicAuthInfo } from '@/components/BasicAuthInfo';

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
          <div className="min-h-screen">
            {children}
          </div>
          <BasicAuthInfo />
        </Providers>
      </body>
    </html>
  );
}

