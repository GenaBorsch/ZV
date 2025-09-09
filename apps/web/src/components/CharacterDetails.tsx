"use client";

import { CharacterDtoType } from '@zv/contracts';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';

interface CharacterDetailsProps {
  character: CharacterDtoType;
  onEdit?: (character: CharacterDtoType) => void;
  onDelete?: (character: CharacterDtoType) => void;
  onClose?: () => void;
  showActions?: boolean;
  isOwner?: boolean;
}

export function CharacterDetails({ 
  character, 
  onEdit, 
  onDelete, 
  onClose, 
  showActions = true,
  isOwner = false
}: CharacterDetailsProps) {
  const handleEdit = () => {
    onEdit?.(character);
  };

  const handleDelete = () => {
    if (confirm(`Вы уверены, что хотите удалить персонажа "${character.name}"?`)) {
      onDelete?.(character);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('ru-RU', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateString;
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Заголовок */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {character.avatarUrl && (
                <div className="w-16 h-16 rounded-full bg-accent/30 flex items-center justify-center overflow-hidden">
                  <img 
                    src={character.avatarUrl} 
                    alt={character.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      const parent = target.parentElement;
                      if (parent) {
                        parent.innerHTML = character.name.charAt(0).toUpperCase();
                        parent.className += ' text-xl font-bold text-foreground';
                      }
                    }}
                  />
                </div>
              )}
              {!character.avatarUrl && (
                <div className="w-16 h-16 rounded-full bg-accent/30 flex items-center justify-center">
                  <span className="text-xl font-bold text-foreground">
                    {character.name.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
              <div>
                <CardTitle className="text-2xl">{character.name}</CardTitle>
                {character.archetype && (
                  <p className="text-lg text-muted-foreground">{character.archetype}</p>
                )}
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                character.isAlive 
                  ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                  : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
              }`}>
                {character.isAlive ? '🟢 Жив' : '🔴 Мертв'}
              </span>
              {!character.isAlive && character.deathDate && (
                <span className="text-sm text-muted-foreground">
                  ⚰️ {character.deathDate}
                </span>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Основная информация */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Уровень</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-primary">{character.level}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Создан</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {formatDate(character.createdAt)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Обновлен</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {formatDate(character.updatedAt)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Детальная информация */}
      <Card>
        <CardContent className="p-0">
          <Tabs defaultValue="backstory" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="backstory">Предыстория</TabsTrigger>
              <TabsTrigger value="journal">Журнал</TabsTrigger>
              <TabsTrigger value="notes">Заметки</TabsTrigger>
              <TabsTrigger value="links">Ссылки</TabsTrigger>
            </TabsList>
            
            <TabsContent value="backstory" className="p-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-foreground">Предыстория персонажа</h3>
                {character.backstory ? (
                  <div className="prose prose-sm max-w-none">
                    <p className="whitespace-pre-wrap text-foreground leading-relaxed break-words overflow-wrap-anywhere">
                      {character.backstory}
                    </p>
                  </div>
                ) : (
                  <p className="text-muted-foreground italic">Предыстория не указана</p>
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="journal" className="p-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-foreground">Журнал приключений</h3>
                {character.journal ? (
                  <div className="prose prose-sm max-w-none">
                    <p className="whitespace-pre-wrap text-foreground leading-relaxed break-words overflow-wrap-anywhere">
                      {character.journal}
                    </p>
                  </div>
                ) : (
                  <p className="text-muted-foreground italic">Записей в журнале пока нет</p>
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="notes" className="p-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-foreground">Заметки</h3>
                {character.notes ? (
                  <div className="prose prose-sm max-w-none">
                    <p className="whitespace-pre-wrap text-foreground leading-relaxed break-words overflow-wrap-anywhere">
                      {character.notes}
                    </p>
                  </div>
                ) : (
                  <p className="text-muted-foreground italic">Заметок нет</p>
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="links" className="p-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Ссылки</h3>
                <div className="space-y-2">
                  {character.sheetUrl && (
                    <div>
                      <p className="text-sm font-medium text-foreground">Лист персонажа:</p>
                      <a 
                        href={character.sheetUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-primary hover:underline text-sm break-all overflow-wrap-anywhere"
                      >
                        {character.sheetUrl}
                      </a>
                    </div>
                  )}
                  {character.avatarUrl && (
                    <div>
                      <p className="text-sm font-medium text-foreground">Аватар:</p>
                      <a 
                        href={character.avatarUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-primary hover:underline text-sm break-all overflow-wrap-anywhere"
                      >
                        {character.avatarUrl}
                      </a>
                    </div>
                  )}
                  {!character.sheetUrl && !character.avatarUrl && (
                    <p className="text-muted-foreground italic">Ссылок нет</p>
                  )}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Действия */}
      {showActions && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between items-center">
              <div className="text-sm text-muted-foreground">
                {character.updatedBy && (
                  <p>Последнее изменение внесено администратором</p>
                )}
              </div>
              
              <div className="flex space-x-2">
                {onClose && (
                  <Button variant="outline" onClick={onClose}>
                    Закрыть
                  </Button>
                )}
                {onEdit && isOwner && (
                  <Button onClick={handleEdit}>
                    Редактировать
                  </Button>
                )}
                {onDelete && isOwner && (
                  <Button 
                    variant="destructive" 
                    onClick={handleDelete}
                  >
                    Удалить персонажа
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
