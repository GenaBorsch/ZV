import type { Metadata } from 'next';
import Script from 'next/script';
import './globals.css';
import { Providers } from '@/components/Providers';
import { BasicAuthInfo } from '@/components/BasicAuthInfo';

export const metadata: Metadata = {
  title: 'Звёздное Веретено - Личные кабинеты',
  description: 'Личные кабинеты для проведения игры по НРИ "Звёздное Веретено"',
  keywords: 'НРИ, ролевые игры, Звёздное Веретено, личные кабинеты',
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
    other: [
      { url: '/android-chrome-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/android-chrome-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
  },
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
        <Script id="replain-settings" strategy="beforeInteractive">
          {`window.replainSettings = { id: '7ac00e66-9a9f-4485-b28c-6cec7357d135' };`}
        </Script>
        <Script src="https://widget.replain.cc/dist/client.js" strategy="afterInteractive" />
      </body>
    </html>
  );
}

