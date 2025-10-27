'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LogoutButton } from './LogoutButton';
import { RoleSwitcher } from './RoleSwitcher';

interface MobileMenuProps {
  navItems: Array<{
    label: string;
    href: string;
    icon?: React.ReactNode;
  }>;
  title: string;
  subtitle?: string;
}

export function MobileMenu({ navItems, title, subtitle }: MobileMenuProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="md:hidden">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="p-2"
      >
        {isOpen ? (
          <X className="h-5 w-5" />
        ) : (
          <Menu className="h-5 w-5" />
        )}
      </Button>

      {isOpen && (
        <>
          {/* Overlay */}
          <div 
            className="fixed inset-0 bg-black/50 z-40" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Menu */}
          <div className="fixed top-16 right-0 bottom-0 left-0 bg-card border-t border-border z-50 overflow-y-auto">
            <div className="p-4">
              <div className="mb-4 pb-4 border-b border-border">
                <h2 className="text-lg font-semibold">{title}</h2>
                {subtitle && (
                  <p className="text-sm text-muted-foreground">{subtitle}</p>
                )}
              </div>
              
              <div className="space-y-2">
                {navItems.map((item, index) => (
                  <Link
                    key={index}
                    href={item.href}
                    onClick={() => setIsOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-accent transition-colors"
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </Link>
                ))}
              </div>
              
              <div className="mt-4 pt-4 border-t border-border space-y-4">
                <RoleSwitcher fullWidth className="px-4" />
              </div>
              
              <div className="mt-4 pt-4 border-t border-border">
                <div className="px-4 py-3">
                  <LogoutButton className="w-full" />
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </nav>
  );
}

