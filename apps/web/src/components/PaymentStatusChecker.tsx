'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface PaymentStatusCheckerProps {
  orderId: string;
  paymentId?: string;
  initialStatus: string;
}

export function PaymentStatusChecker({ orderId, paymentId, initialStatus }: PaymentStatusCheckerProps) {
  const [isChecking, setIsChecking] = useState(false);
  const [checkAttempts, setCheckAttempts] = useState(0);
  const router = useRouter();

  useEffect(() => {
    // Если заказ уже оплачен или отменён, не проверяем
    if (initialStatus === 'PAID' || initialStatus === 'CANCELLED') {
      return;
    }

    // Если нет paymentId, пытаемся получить его из заказа
    if (!paymentId) {
      console.log('No paymentId provided, skipping automatic status check');
      return;
    }

    const checkPaymentStatus = async () => {
      if (isChecking || checkAttempts >= 3) return;

      setIsChecking(true);
      setCheckAttempts(prev => prev + 1);

      try {
        console.log(`Checking payment status (attempt ${checkAttempts + 1}/3):`, paymentId);
        
        const response = await fetch('/api/payments/check-status', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ paymentId }),
        });

        if (response.ok) {
          const result = await response.json();
          console.log('Payment status check result:', result);

          // Если статус изменился, обновляем страницу
          if (result.status === 'succeeded' && result.processed) {
            console.log('Payment processed successfully, refreshing page...');
            router.refresh();
          } else if (result.status === 'canceled') {
            console.log('Payment was canceled, refreshing page...');
            router.refresh();
          }
        }
      } catch (error) {
        console.error('Error checking payment status:', error);
      } finally {
        setIsChecking(false);
      }
    };

    // Проверяем статус сразу при загрузке
    const initialTimeout = setTimeout(checkPaymentStatus, 1000);

    // Затем проверяем каждые 5 секунд, максимум 3 попытки
    const interval = setInterval(() => {
      if (checkAttempts < 3) {
        checkPaymentStatus();
      } else {
        clearInterval(interval);
      }
    }, 5000);

    return () => {
      clearTimeout(initialTimeout);
      clearInterval(interval);
    };
  }, [orderId, paymentId, initialStatus, isChecking, checkAttempts, router]);

  // Показываем индикатор только если проверяем и статус PENDING
  if (initialStatus === 'PENDING' && (isChecking || checkAttempts > 0)) {
    return (
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
          <div>
            <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
              Проверяем статус платежа...
            </p>
            <p className="text-xs text-blue-600 dark:text-blue-400">
              Попытка {checkAttempts} из 3
            </p>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
