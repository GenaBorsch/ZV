"use client";

import { CharacterDtoType } from '@zv/contracts';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';

interface CharacterCardProps {
  character: CharacterDtoType;
  onEdit?: (character: CharacterDtoType) => void;
  onDelete?: (character: CharacterDtoType) => void;
  onView?: (character: CharacterDtoType) => void;
  showActions?: boolean;
  compact?: boolean;
}

export function CharacterCard({ 
  character, 
  onEdit, 
  onDelete, 
  onView, 
  showActions = true,
  compact = false 
}: CharacterCardProps) {
  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit?.(character);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(`Вы уверены, что хотите удалить персонажа "${character.name}"?`)) {
      onDelete?.(character);
    }
  };

  const handleView = () => {
    onView?.(character);
  };

  return (
    <Card 
      className={`character-card cursor-pointer hover:shadow-md transition-shadow flex flex-col h-full ${compact ? 'p-3' : ''}`}
      onClick={handleView}
    >
      <CardHeader className={compact ? 'pb-2' : 'pb-3'}>
        <div className="flex items-start space-x-3">
          {/* Левая колонка: Аватарка и статус */}
          <div className="flex-shrink-0 flex flex-col items-center space-y-2">
            {character.avatarUrl && (
              <div className="w-12 h-12 rounded-full bg-accent/30 flex items-center justify-center overflow-hidden">
                <img 
                  src={character.avatarUrl} 
                  alt={character.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    // Если изображение не загрузилось, показываем инициалы
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    const parent = target.parentElement;
                    if (parent) {
                      parent.innerHTML = character.name.charAt(0).toUpperCase();
                      parent.className += ' text-sm font-medium text-foreground';
                    }
                  }}
                />
              </div>
            )}
            {!character.avatarUrl && (
              <div className="w-12 h-12 rounded-full bg-accent/30 flex items-center justify-center">
                <span className="text-sm font-medium text-foreground">
                  {character.name.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            
            {/* Статус под аватаркой */}
            <span className={`status-badge px-2 py-1 rounded-full font-medium whitespace-nowrap text-xs ${
              character.isAlive 
                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
            }`}>
              {character.isAlive ? 'ЖИВ' : 'МЕРТВ'}
            </span>
            
            {/* Дата смерти под статусом */}
            {!character.isAlive && character.deathDate && (
              <span className="text-xs text-muted-foreground whitespace-nowrap text-center">
                ⚰️ {character.deathDate}
              </span>
            )}
          </div>
          
          {/* Правая колонка: Имя и архетип */}
          <div className="min-w-0 flex-1">
            <CardTitle className="text-base font-medium text-foreground">
              {character.name}
            </CardTitle>
            {character.archetype && (
              <p className="text-sm text-muted-foreground">{character.archetype}</p>
            )}
          </div>
        </div>
      </CardHeader>
      
      {!compact && (
        <CardContent className="pt-0 flex-1 flex flex-col">
          <div className="flex items-center text-base text-muted-foreground mb-4">
            <span className="flex items-center font-medium">
              📊 Уровень {character.level}
            </span>
          </div>
          
          {showActions && onEdit && (
            <div className="mt-auto pt-3 border-t border-border">
              <Button
                variant="outline"
                onClick={handleEdit}
                className="w-full"
              >
                Редактировать
              </Button>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}
