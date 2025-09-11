"use client";

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp, Copy, Check } from 'lucide-react';

const testAccounts = [
  {
    role: '👑 Администратор',
    email: 'demoadmin@zvezdnoe-vereteno.ru',
    password: 'demo1234',
    description: 'Полный доступ к админ-панели, управление пользователями и системой'
  },
  {
    role: '🛡️ Модератор',
    email: 'demomoderator@zvezdnoe-vereteno.ru',
    password: 'demo1234',
    description: 'Модерация контента и пользователей'
  },
  {
    role: '🎯 Мастер',
    email: 'demomaster@zvezdnoe-vereteno.ru',
    password: 'demo1234',
    description: 'Создание и ведение игровых групп, управление персонажами'
  },
  {
    role: '🎮 Игрок',
    email: 'demoplayer@zvezdnoe-vereteno.ru',
    password: 'demo1234',
    description: 'Участие в играх, создание персонажей'
  }
];

export function TestAccountsInfo() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState<string | null>(null);

  const handleCopyEmail = async (email: string) => {
    try {
      await navigator.clipboard.writeText(email);
      setCopiedEmail(email);
      setTimeout(() => setCopiedEmail(null), 2000);
    } catch (err) {
      // Fallback для старых браузеров
      const textArea = document.createElement('textarea');
      textArea.value = email;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopiedEmail(email);
      setTimeout(() => setCopiedEmail(null), 2000);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">🧪 Тестовые аккаунты</CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="h-8 px-2"
          >
            {isExpanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">
          Для тестирования системы доступны готовые аккаунты
        </p>
      </CardHeader>
      
      {isExpanded && (
        <CardContent className="pt-0">
          <div className="space-y-3">
            {testAccounts.map((account, index) => (
              <div
                key={index}
                className="p-3 rounded-lg border border-border bg-muted/30"
              >
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-foreground">
                    {account.role}
                  </h4>
                  <div className="flex items-center space-x-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCopyEmail(account.email)}
                      className="h-6 px-2 text-xs"
                    >
                      {copiedEmail === account.email ? (
                        <Check className="h-3 w-3" />
                      ) : (
                        <Copy className="h-3 w-3" />
                      )}
                    </Button>
                  </div>
                </div>
                
                <div className="space-y-1 text-sm">
                  <div className="flex items-center space-x-2">
                    <span className="text-muted-foreground min-w-0">Email:</span>
                    <code className="text-xs bg-muted px-1.5 py-0.5 rounded font-mono">
                      {account.email}
                    </code>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-muted-foreground">Пароль:</span>
                    <code className="text-xs bg-muted px-1.5 py-0.5 rounded font-mono">
                      {account.password}
                    </code>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {account.description}
                  </p>
                </div>
              </div>
            ))}
            
            <div className="mt-4 p-3 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800">
              <p className="text-sm text-blue-700 dark:text-blue-300">
                <strong>💡 Подсказка:</strong> После входа происходит автоматическое перенаправление: 
                MASTER → <code className="bg-blue-100 dark:bg-blue-900 px-1 rounded">/master</code>, 
                ADMIN/MODERATOR → <code className="bg-blue-100 dark:bg-blue-900 px-1 rounded">/admin</code>, 
                остальные → <code className="bg-blue-100 dark:bg-blue-900 px-1 rounded">/player</code>
              </p>
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
}
