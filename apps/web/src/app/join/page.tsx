"use client";

// Принудительно делаем страницу динамической
export const dynamic = 'force-dynamic';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { JoinGroupSuccess } from '@/components/JoinGroupSuccess';

function JoinPageContent() {
  const { data: session, status } = useSession();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<any>(null);
  
  const referralCode = searchParams.get('code');

  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session) {
      // Перенаправляем на авторизацию с callback
      const callbackUrl = `/join?code=${referralCode}`;
      router.push(`/auth/login?callbackUrl=${encodeURIComponent(callbackUrl)}`);
      return;
    }

    // Проверяем роль пользователя
    const userRoles = (session.user as any)?.roles || [];
    if (!userRoles.includes('PLAYER')) {
      setError('Только игроки могут присоединяться к группам');
      return;
    }

    // Если есть код и пользователь авторизован, автоматически присоединяемся
    if (referralCode && !isJoining && !success) {
      handleJoin();
    }
  }, [session, status, referralCode]);

  const handleJoin = async () => {
    if (!referralCode) {
      setError('Код приглашения не найден в ссылке');
      return;
    }

    setIsJoining(true);
    setError(null);

    try {
      const response = await fetch('/api/groups/join', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ referralCode }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Ошибка при присоединении к группе');
      }

      const result = await response.json();
      setSuccess(result);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsJoining(false);
    }
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Загрузка...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card shadow-sm border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <h1 className="text-xl font-semibold text-foreground">
                Звёздное Веретено
              </h1>
            </div>
            <nav className="flex space-x-4">
              <Link href="/" className="text-muted-foreground hover:text-foreground">
                На главную
              </Link>
              {session && (
                <Link 
                  href="/player" 
                  className="text-muted-foreground hover:text-foreground"
                >
                  Мой кабинет
                </Link>
              )}
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-3xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-foreground mb-4">
            Присоединение к группе
          </h2>
          <p className="text-lg text-muted-foreground">
            Вас пригласили присоединиться к игровой группе
          </p>
        </div>

        {success ? (
          <div className="max-w-2xl mx-auto">
            <JoinGroupSuccess
              group={success.group}
              message={success.message}
            />
            <div className="mt-6 text-center">
              <Link href="/player" className="btn-primary">
                Перейти в кабинет игрока
              </Link>
            </div>
          </div>
        ) : error ? (
          <div className="max-w-2xl mx-auto">
            <div className="bg-card p-6 rounded-lg border border-border">
              <div className="flex items-center mb-4">
                <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center mr-3">
                  <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-foreground">
                  Ошибка присоединения
                </h3>
              </div>
              
              <div className="mb-6">
                <p className="text-destructive mb-4">{error}</p>
                
                {error.includes('Неверный код') && (
                  <div className="p-3 bg-muted/50 rounded-md text-sm">
                    <p className="font-medium text-foreground mb-1">Возможные причины:</p>
                    <ul className="text-muted-foreground space-y-1">
                      <li>• Код приглашения устарел или неверный</li>
                      <li>• Ссылка была повреждена при копировании</li>
                      <li>• Группа была удалена</li>
                    </ul>
                  </div>
                )}
                
                {error.includes('заполнена') && (
                  <div className="p-3 bg-muted/50 rounded-md text-sm">
                    <p className="text-muted-foreground">
                      В группе больше нет свободных мест. Свяжитесь с мастером группы для получения информации о других доступных группах.
                    </p>
                  </div>
                )}
              </div>

              <div className="flex gap-3">
                <Button 
                  onClick={handleJoin}
                  disabled={isJoining}
                  variant="outline"
                >
                  {isJoining ? 'Повтор...' : 'Попробовать еще раз'}
                </Button>
                <Link href="/player" className="btn-primary">
                  Перейти в кабинет
                </Link>
              </div>
            </div>
          </div>
        ) : isJoining ? (
          <div className="max-w-2xl mx-auto">
            <div className="bg-card p-6 rounded-lg border border-border text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Присоединяемся к группе...
              </h3>
              <p className="text-muted-foreground">
                Пожалуйста, подождите
              </p>
            </div>
          </div>
        ) : (
          <div className="max-w-2xl mx-auto">
            <div className="bg-card p-6 rounded-lg border border-border text-center">
              <h3 className="text-lg font-semibold text-foreground mb-4">
                Код приглашения не найден
              </h3>
              <p className="text-muted-foreground mb-6">
                Проверьте правильность ссылки или обратитесь к мастеру группы.
              </p>
              <Link href="/player" className="btn-primary">
                Перейти в кабинет игрока
              </Link>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default function JoinPage() {
  return (
    <Suspense fallback={<div className="flex justify-center items-center min-h-screen">Загрузка...</div>}>
      <JoinPageContent />
    </Suspense>
  );
}
