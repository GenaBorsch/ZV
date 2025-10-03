"use client";

import { Button } from '@/components/ui/button';

interface PlayerProfileModalProps {
  player: {
    id: string;
    userId: string;
    nickname: string | null;
    notes: string | null;
    user: {
      id: string;
      name: string | null;
      email: string;
      rpgExperience: 'NOVICE' | 'INTERMEDIATE' | 'VETERAN' | null;
      contacts: string | null;
    };
  };
  onClose: () => void;
}

const experienceMap = {
  NOVICE: 'Новичок',
  INTERMEDIATE: 'Опытный',
  VETERAN: 'Ветеран',
};

export function PlayerProfileModal({ player, onClose }: PlayerProfileModalProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-foreground">
            Профиль игрока
          </h2>
          <Button
            onClick={onClose}
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-foreground"
          >
            ✕
          </Button>
        </div>

        <div className="space-y-4">
          {/* Основная информация */}
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Имя</label>
              <p className="text-foreground">
                {player.user.name || 'Не указано'}
              </p>
            </div>


            <div>
              <label className="text-sm font-medium text-muted-foreground">Email</label>
              <p className="text-foreground">{player.user.email}</p>
            </div>

            {player.user.rpgExperience && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">Опыт в НРИ</label>
                <p className="text-foreground">
                  {experienceMap[player.user.rpgExperience]}
                </p>
              </div>
            )}

            {player.user.contacts && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">Контакты</label>
                <p className="text-foreground">{player.user.contacts}</p>
              </div>
            )}

            {player.notes && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">Заметки</label>
                <p className="text-foreground">{player.notes}</p>
              </div>
            )}
          </div>


          {/* Кнопки действий */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button
              onClick={onClose}
              variant="outline"
            >
              Закрыть
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
