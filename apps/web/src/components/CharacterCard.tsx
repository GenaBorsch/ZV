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
      className={`cursor-pointer hover:shadow-md transition-shadow ${compact ? 'p-3' : ''}`}
      onClick={handleView}
    >
      <CardHeader className={compact ? 'pb-2' : ''}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {character.avatarUrl && (
              <div className="w-10 h-10 rounded-full bg-accent/30 flex items-center justify-center overflow-hidden">
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
              <div className="w-10 h-10 rounded-full bg-accent/30 flex items-center justify-center">
                <span className="text-sm font-medium text-foreground">
                  {character.name.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            <div>
              <CardTitle className="text-base font-medium text-foreground">
                {character.name}
              </CardTitle>
              {character.archetype && (
                <p className="text-sm text-muted-foreground">{character.archetype}</p>
              )}
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
              character.isAlive 
                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
            }`}>
              {character.isAlive ? 'Жив' : 'Мертв'}
            </span>
            {!character.isAlive && character.deathDate && (
              <span className="text-xs text-muted-foreground">
                ⚰️ {character.deathDate}
              </span>
            )}
          </div>
        </div>
      </CardHeader>
      
      {!compact && (
        <CardContent className="pt-0">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <div className="flex items-center space-x-4">
              <span>📊 Уровень {character.level}</span>
              {character.sheetUrl && (
                <span>📄 Есть лист</span>
              )}
            </div>
            
            {showActions && (
              <div className="flex space-x-2">
                {onEdit && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleEdit}
                    className="text-xs"
                  >
                    Редактировать
                  </Button>
                )}
                {onDelete && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDelete}
                    className="text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    Удалить
                  </Button>
                )}
              </div>
            )}
          </div>
          
          {character.backstory && (
            <div className="mt-3 pt-3 border-t border-border">
              <p className="text-sm text-muted-foreground line-clamp-2">
                {character.backstory}
              </p>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}
