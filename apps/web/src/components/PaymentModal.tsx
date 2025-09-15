'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  paymentUrl: string;
  onSuccess?: () => void;
}

export function PaymentModal({ isOpen, onClose, paymentUrl, onSuccess }: PaymentModalProps) {
  const [countdown, setCountdown] = useState(5);
  const [showPayment, setShowPayment] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setCountdown(5);
      setShowPayment(false);
      return;
    }

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setShowPayment(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      
      {/* Modal */}
      <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {showPayment ? 'Оплата заказа' : 'Подготовка к оплате'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {!showPayment ? (
            // Preloader with countdown
            <div className="text-center py-12">
              <div className="mb-6">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full mb-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
                <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-2">
                  Подготавливаем страницу оплаты...
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Переход к оплате через <span className="font-bold text-blue-600 text-2xl">{countdown}</span> секунд
                </p>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-4">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-1000 ease-linear"
                    style={{ width: `${((5 - countdown) / 5) * 100}%` }}
                  ></div>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Мы подготавливаем безопасное соединение с платежной системой YooKassa
                </p>
              </div>
            </div>
          ) : (
            // Payment redirect
            <div className="text-center py-12">
              <div className="mb-6">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full mb-4">
                  <div className="w-8 h-8 text-green-600 text-2xl">🚀</div>
                </div>
                <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-4">
                  Готово к оплате!
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Нажмите кнопку ниже, чтобы открыть безопасную страницу оплаты YooKassa в новой вкладке
                </p>
                <button
                  onClick={() => {
                    window.open(paymentUrl, '_blank');
                    onClose();
                  }}
                  className="btn-primary px-8 py-3 text-lg"
                >
                  🔗 Открыть страницу оплаты
                </button>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-4">
                  После нажатия модальное окно закроется, а страница оплаты откроется в новой вкладке
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
          <div className="flex justify-between items-center text-sm text-gray-600 dark:text-gray-400">
            <span>🔒 Защищенное соединение</span>
            {showPayment && (
              <span>Платежная система: YooKassa</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
