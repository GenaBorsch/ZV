"use client";

import Link from 'next/link';
import { NotificationBell } from '@/components/NotificationBell';
import { MobileMenu } from '@/components/MobileMenu';
import { LogoutButton } from '@/components/LogoutButton';
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
  const navItems = [
    { label: 'Админ-панель', href: '/admin' },
  ];

  return (
    <header className="bg-card shadow-sm border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-2 md:space-x-4">
            {backLink && (
              <Link 
                href={backLink.href} 
                className="text-muted-foreground hover:text-foreground flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                <span className="hidden md:inline">{backLink.label}</span>
              </Link>
            )}
            <div>
              <h1 className="text-base md:text-xl font-semibold text-foreground">
                {title}
              </h1>
              {subtitle && (
                <p className="text-xs md:text-sm text-muted-foreground">
                  {subtitle}
                </p>
              )}
            </div>
          </div>
          
          <div className="flex items-center space-x-2 md:space-x-4">
            {actions}
            <nav className="flex items-center space-x-2 md:space-x-4">
              <NotificationBell className="text-muted-foreground hover:text-foreground" />
              {/* Desktop navigation */}
              <div className="hidden md:flex items-center space-x-4">
                <Link 
                  href="/admin" 
                  className="text-muted-foreground hover:text-foreground flex items-center gap-2"
                >
                  <Home className="h-4 w-4" />
                  Админ-панель
                </Link>
                <LogoutButton className="text-muted-foreground hover:text-foreground" />
              </div>
              {/* Mobile menu */}
              <MobileMenu 
                navItems={navItems}
                title={title}
                subtitle={subtitle}
              />
            </nav>
          </div>
        </div>
      </div>
    </header>
  );
}
