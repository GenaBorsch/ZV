"use client";

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface GroupWithMasterAndSeason {
  id: string;
  name: string;
  description: string | null;
  maxMembers: number;
  currentMembers: number;
  isRecruiting: boolean;
  format: 'ONLINE' | 'OFFLINE' | 'MIXED';
  place: string | null;
  createdAt: string;
  updatedAt: string;
  master: {
    id: string;
    name: string | null;
    bio: string | null;
    format: 'ONLINE' | 'OFFLINE' | 'MIXED';
    location: string | null;
    rpgExperience: 'NOVICE' | 'INTERMEDIATE' | 'VETERAN' | null;
    contacts: string | null;
  };
  season: {
    id: string;
    title: string;
    code: string;
    isActive: boolean;
  };
}

interface GroupSearchCardProps {
  group: GroupWithMasterAndSeason;
  onApply: () => void;
}

const formatMap = {
  ONLINE: 'Онлайн',
  OFFLINE: 'Оффлайн',
  MIXED: 'Смешанный',
};

const experienceMap = {
  NOVICE: 'Новичок',
  INTERMEDIATE: 'Опытный',
  VETERAN: 'Ветеран',
};

export function GroupSearchCard({ group, onApply }: GroupSearchCardProps) {
  const formatGroup = formatMap[group.format];
  const formatMaster = formatMap[group.master.format];
  const experienceText = group.master.rpgExperience ? experienceMap[group.master.rpgExperience] : null;

  return (
    <Card className="h-full hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <CardTitle className="text-lg font-semibold text-foreground mb-1">
              {group.name}
            </CardTitle>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="px-2 py-1 bg-accent/30 rounded-full">
                {group.season.title}
              </span>
              <span className="px-2 py-1 bg-primary/10 text-primary rounded-full">
                {formatGroup}
              </span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm font-medium text-foreground">
              {group.currentMembers}/{group.maxMembers}
            </div>
            <div className="text-xs text-muted-foreground">участников</div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Описание группы */}
        {group.description && (
          <div>
            <p className="text-sm text-muted-foreground line-clamp-2">
              {group.description}
            </p>
          </div>
        )}

        {/* Информация о месте проведения */}
        {group.place && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>📍</span>
            <span>{group.place}</span>
          </div>
        )}

        {/* Информация о мастере */}
        <div className="border-t border-border pt-4">
          <div className="flex items-start justify-between mb-2">
            <div>
              <h4 className="text-sm font-medium text-foreground">
                Мастер: {group.master.name || 'Не указано'}
              </h4>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>{formatMaster}</span>
                {group.master.location && (
                  <>
                    <span>•</span>
                    <span>{group.master.location}</span>
                  </>
                )}
                {experienceText && (
                  <>
                    <span>•</span>
                    <span>{experienceText}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {group.master.bio && (
            <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
              {group.master.bio}
            </p>
          )}

          {group.master.contacts && (
            <div className="text-xs text-muted-foreground mb-3">
              <span className="font-medium">Контакты:</span> {group.master.contacts}
            </div>
          )}
        </div>

        {/* Кнопка присоединения */}
        <div className="pt-2">
          <Button 
            onClick={onApply}
            className="w-full"
            disabled={group.currentMembers >= group.maxMembers || !group.isRecruiting}
          >
            {group.currentMembers >= group.maxMembers 
              ? 'Группа заполнена' 
              : !group.isRecruiting 
                ? 'Набор закрыт'
                : '📝 Отправить заявку'
            }
          </Button>
        </div>

        {/* Дата создания */}
        <div className="text-xs text-muted-foreground text-center pt-1">
          Создана {new Date(group.createdAt).toLocaleDateString('ru-RU')}
        </div>
      </CardContent>
    </Card>
  );
}
