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
      className={`cursor-pointer hover:shadow-md transition-shadow flex flex-col h-full ${compact ? 'p-3' : ''}`}
      onClick={handleView}
    >
      <CardHeader className={compact ? 'pb-2' : 'pb-3'}>
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3 flex-1 min-w-0">
            {character.avatarUrl && (
              <div className="w-12 h-12 rounded-full bg-accent/30 flex items-center justify-center overflow-hidden flex-shrink-0">
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
              <div className="w-12 h-12 rounded-full bg-accent/30 flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-medium text-foreground">
                  {character.name.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            <div className="min-w-0 flex-1">
              <CardTitle className="text-base font-medium text-foreground">
                {character.name}
              </CardTitle>
              {character.archetype && (
                <p className="text-sm text-muted-foreground">{character.archetype}</p>
              )}
            </div>
          </div>
          
          <div className="flex flex-col items-end space-y-1 flex-shrink-0 ml-2">
            <span className={`px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
              character.isAlive 
                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
            }`}>
              {character.isAlive ? 'ЖИВ' : 'МЕРТВ'}
            </span>
            {!character.isAlive && character.deathDate && (
              <span className="text-xs text-muted-foreground whitespace-nowrap">
                ⚰️ {character.deathDate}
              </span>
            )}
          </div>
        </div>
      </CardHeader>
      
      {!compact && (
        <CardContent className="pt-0 flex-1 flex flex-col">
          <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
            <div className="flex items-center space-x-4">
              <span className="flex items-center font-medium">
                📊 Уровень {character.level}
              </span>
              {character.sheetUrl && (
                <span className="flex items-center">
                  📄 Есть лист
                </span>
              )}
            </div>
          </div>
          
          {showActions && onEdit && (
            <div className="mt-auto pt-3 border-t border-border">
              <Button
                variant="outline"
                size="sm"
                onClick={handleEdit}
                className="text-xs w-full"
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
