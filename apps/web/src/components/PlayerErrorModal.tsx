"use client";

import { AlertTriangle, X, UserX } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface PlayerErrorModalProps {
  isOpen: boolean;
  onClose: () => void;
  playersWithoutGames: string[];
}

export function PlayerErrorModal({
  isOpen,
  onClose,
  playersWithoutGames
}: PlayerErrorModalProps) {
  if (!isOpen) return null;

  const handleModalClick = (e: React.MouseEvent) => {
    // Предотвращаем закрытие при клике внутри модального окна
    e.stopPropagation();
  };

  return (
    <div 
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <Card 
        className="w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        onClick={handleModalClick}
      >
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-3">
              <div className="p-2 bg-red-100 dark:bg-red-900 rounded-full">
                <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-foreground">
                  Невозможно создать отчёт
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  У некоторых игроков нет доступных игр
                </p>
              </div>
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Описание проблемы */}
          <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <h3 className="font-medium text-red-900 dark:text-red-100 mb-2">
              Проблема с путёвками
            </h3>
            <p className="text-sm text-red-800 dark:text-red-200">
              Следующие игроки не имеют активных игр в своих путёвках. 
              Для создания отчёта все участники должны иметь доступные игры.
            </p>
          </div>

          {/* Список игроков */}
          <div className="space-y-3">
            <h4 className="font-medium text-foreground">
              Игроки без доступных игр:
            </h4>
            <div className="space-y-3">
              {playersWithoutGames.map((playerName, index) => (
                <div 
                  key={index}
                  className="flex items-center gap-3 p-4 bg-card border border-border rounded-lg"
                >
                  <div className="p-2 bg-red-100 dark:bg-red-900 rounded-full">
                    <UserX className="h-4 w-4 text-red-600 dark:text-red-400" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{playerName}</p>
                    <p className="text-sm text-muted-foreground">
                      Нет активных игр в путёвках
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Рекомендации */}
          <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
              Что делать дальше?
            </h4>
            <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
              <li>• <strong>Свяжитесь с игроком</strong> и попросите пополнить путёвки</li>
              <li>• <strong>Отложите создание отчёта</strong> до решения проблемы</li>
            </ul>
          </div>

          {/* Кнопки действий */}
          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <Button
              variant="outline"
              onClick={onClose}
            >
              Отменить создание отчёта
            </Button>
            <Button
              onClick={onClose}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              Понятно
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
