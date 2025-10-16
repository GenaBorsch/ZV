"use client";

import Link from 'next/link';
import { LogoutButton } from '@/components/LogoutButton';
import { NotificationBell } from '@/components/NotificationBell';
import { ArrowLeft, Home } from 'lucide-react';

interface AdminHeaderProps {
  title: string;
  subtitle?: string;
  backLink?: {
    href: string;
    label: string;
  };
  actions?: React.ReactNode;
}

export function AdminHeader({ title, subtitle, backLink, actions }: AdminHeaderProps) {
  return (
    <header className="bg-card shadow-sm border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-4">
            {backLink && (
              <Link 
                href={backLink.href} 
                className="text-muted-foreground hover:text-foreground flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                {backLink.label}
              </Link>
            )}
            <div>
              <h1 className="text-xl font-semibold text-foreground">
                {title}
              </h1>
              {subtitle && (
                <p className="text-sm text-muted-foreground">
                  {subtitle}
                </p>
              )}
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            {actions}
            <nav className="flex items-center space-x-4">
              <NotificationBell className="text-muted-foreground hover:text-foreground" />
              <Link 
                href="/admin" 
                className="text-muted-foreground hover:text-foreground flex items-center gap-2"
              >
                <Home className="h-4 w-4" />
                Админ-панель
              </Link>
              <Link href="/" className="text-muted-foreground hover:text-foreground">
                На главную
              </Link>
              <LogoutButton className="text-muted-foreground hover:text-foreground" />
            </nav>
          </div>
        </div>
      </div>
    </header>
  );
}
