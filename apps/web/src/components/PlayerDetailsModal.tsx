"use client";

import { useState, useEffect } from 'react';
import { CharacterDtoType } from '@zv/contracts';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { CharacterCard } from './CharacterCard';
import { CharacterDetails } from './CharacterDetails';

interface PlayerProfile {
  id: string;
  nickname: string | null;
  notes: string | null;
  user: {
    id: string;
    name: string | null;
    email: string;
    avatarUrl: string | null;
  };
}

interface PlayerDetailsModalProps {
  playerId: string;
  playerProfile?: PlayerProfile;
  onClose: () => void;
  className?: string;
}

export function PlayerDetailsModal({ 
  playerId, 
  playerProfile, 
  onClose, 
  className 
}: PlayerDetailsModalProps) {
  const [characters, setCharacters] = useState<CharacterDtoType[]>([]);
  const [selectedCharacter, setSelectedCharacter] = useState<CharacterDtoType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Загружаем персонажей игрока
  useEffect(() => {
    const fetchCharacters = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Здесь нужно будет реализовать API для получения персонажей игрока мастером
        // Пока заглушка
        const response = await fetch(`/api/v1/players/${playerId}/characters`);
        
        if (!response.ok) {
          throw new Error('Не удалось загрузить персонажей');
        }

        const data = await response.json();
        setCharacters(data.characters || []);
      } catch (err: any) {
        console.error('Error fetching player characters:', err);
        setError(err.message || 'Ошибка загрузки персонажей');
      } finally {
        setIsLoading(false);
      }
    };

    if (playerId) {
      fetchCharacters();
    }
  }, [playerId]);

  const handleCharacterSelect = (character: CharacterDtoType) => {
    setSelectedCharacter(character);
  };

  const handleBackToList = () => {
    setSelectedCharacter(null);
  };

  const handleModalClick = (e: React.MouseEvent) => {
    // Предотвращаем закрытие при клике внутри модального окна
    e.stopPropagation();
  };

  if (selectedCharacter) {
    return (
      <div 
        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
        onClick={onClose}
      >
        <div 
          className="bg-background rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto"
          onClick={handleModalClick}
        >
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <Button variant="outline" onClick={handleBackToList}>
                ← Назад к списку
              </Button>
              <Button variant="outline" onClick={onClose}>
                ✕ Закрыть
              </Button>
            </div>
            <CharacterDetails
              character={selectedCharacter}
              showActions={false}
              isOwner={false}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className={`fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 ${className || ''}`}
      onClick={onClose}
    >
      <div 
        className="bg-background rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto"
        onClick={handleModalClick}
      >
        <Card className="border-0 shadow-none">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl">
                Профиль игрока
              </CardTitle>
              <Button variant="outline" onClick={onClose}>
                ✕ Закрыть
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Информация об игроке */}
            {playerProfile && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Информация об игроке</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center space-x-4">
                    {playerProfile.user.avatarUrl && (
                      <div className="w-12 h-12 rounded-full bg-accent/30 flex items-center justify-center overflow-hidden">
                        <img 
                          src={playerProfile.user.avatarUrl} 
                          alt={playerProfile.user.name || 'Игрок'}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    {!playerProfile.user.avatarUrl && (
                      <div className="w-12 h-12 rounded-full bg-accent/30 flex items-center justify-center">
                        <span className="text-lg font-medium text-foreground">
                          {(playerProfile.user.name || playerProfile.user.email).charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                    <div>
                      <h3 className="font-medium text-foreground">
                        {playerProfile.user.name || 'Без имени'}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {playerProfile.user.email}
                      </p>
                      {playerProfile.nickname && (
                        <p className="text-sm text-muted-foreground">
                          Никнейм: {playerProfile.nickname}
                        </p>
                      )}
                    </div>
                  </div>
                  {playerProfile.notes && (
                    <div className="mt-4 pt-4 border-t border-border">
                      <h4 className="text-sm font-medium text-foreground mb-2">О себе:</h4>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                        {playerProfile.notes}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Персонажи игрока */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  Персонажи игрока ({characters.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading && (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                    <p className="mt-2 text-muted-foreground">Загрузка персонажей...</p>
                  </div>
                )}

                {error && (
                  <div className="text-center py-8">
                    <p className="text-red-500 mb-4">{error}</p>
                    <Button 
                      variant="outline" 
                      onClick={() => window.location.reload()}
                    >
                      Попробовать снова
                    </Button>
                  </div>
                )}

                {!isLoading && !error && characters.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    У игрока пока нет персонажей
                  </div>
                )}

                {!isLoading && !error && characters.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {characters.map((character) => (
                      <CharacterCard
                        key={character.id}
                        character={character}
                        onView={handleCharacterSelect}
                        showActions={false}
                        compact={true}
                      />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
