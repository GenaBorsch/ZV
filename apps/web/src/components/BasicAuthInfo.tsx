"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';

export function BasicAuthInfo() {
  const [showInfo, setShowInfo] = useState(false);

  // Показываем только если базовая аутентификация включена
  if (!process.env.NEXT_PUBLIC_BASIC_AUTH_ENABLED) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Button
        variant="outline"
        size="sm"
        onClick={() => setShowInfo(!showInfo)}
        className="bg-yellow-50 border-yellow-200 text-yellow-800 hover:bg-yellow-100"
      >
        🔒 Dev Mode
      </Button>
      
      {showInfo && (
        <div className="absolute bottom-12 right-0 bg-white border border-yellow-200 rounded-lg shadow-lg p-4 min-w-[300px]">
          <div className="text-sm text-gray-600">
            <h3 className="font-semibold text-yellow-800 mb-2">
              🔒 Сайт защищен паролем
            </h3>
            <p className="mb-2">
              Для доступа используется HTTP Basic Authentication.
            </p>
            <p className="text-xs text-gray-500">
              Чтобы отключить защиту, удалите переменные BASIC_AUTH_USER и BASIC_AUTH_PASSWORD из настроек окружения.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
