"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { X, Search, Users, AlertCircle, CheckCircle } from 'lucide-react';
import { CreateReportDtoType, UpdateReportDtoType } from '@zv/contracts';

interface Player {
  id: string;
  name: string;
  email: string;
}

interface ReportFormProps {
  onSubmit: (data: CreateReportDtoType | UpdateReportDtoType) => Promise<void>;
  onCancel: () => void;
  initialData?: {
    id?: string;
    sessionId?: string;
    description: string;
    highlights?: string;
    players: Player[];
  };
  title?: string;
  isLoading?: boolean;
}

export function ReportForm({ 
  onSubmit, 
  onCancel, 
  initialData, 
  title = "Создать отчёт о игре", 
  isLoading = false 
}: ReportFormProps) {
  const [description, setDescription] = useState(initialData?.description || '');
  const [highlights, setHighlights] = useState(initialData?.highlights || '');
  const [selectedPlayers, setSelectedPlayers] = useState<Player[]>(initialData?.players || []);
  const [playerSearch, setPlayerSearch] = useState('');
  const [searchResults, setSearchResults] = useState<Player[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPlayerSearch, setShowPlayerSearch] = useState(false);
  const [playersWithoutBattlepass, setPlayersWithoutBattlepass] = useState<string[]>([]);
  const [isCheckingBattlepasses, setIsCheckingBattlepasses] = useState(false);

  // Поиск игроков
  const searchPlayers = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const response = await fetch(`/api/players?search=${encodeURIComponent(query)}&limit=10`);
      if (response.ok) {
        const data = await response.json();
        // Фильтруем уже выбранных игроков
        const filteredResults = data.players.filter(
          (player: Player) => !selectedPlayers.some(selected => selected.id === player.id)
        );
        setSearchResults(filteredResults);
      }
    } catch (error) {
      console.error('Error searching players:', error);
    } finally {
      setIsSearching(false);
    }
  };

  // Debounced поиск
  useEffect(() => {
    const timer = setTimeout(() => {
      if (playerSearch) {
        searchPlayers(playerSearch);
      } else {
        setSearchResults([]);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [playerSearch, selectedPlayers]);

  // Проверка баттлпассов у игроков
  const checkPlayersBattlepasses = async (playerIds: string[]) => {
    if (playerIds.length === 0) {
      setPlayersWithoutBattlepass([]);
      return;
    }

    setIsCheckingBattlepasses(true);
    try {
      const response = await fetch('/api/players/check-battlepasses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerIds }),
      });

      if (response.ok) {
        const data = await response.json();
        const playersWithoutGames = data.playersWithoutGames.map((p: any) => p.name);
        setPlayersWithoutBattlepass(playersWithoutGames);
      } else {
        console.error('Failed to check battlepasses');
        setPlayersWithoutBattlepass([]);
      }
    } catch (error) {
      console.error('Error checking battlepasses:', error);
      setPlayersWithoutBattlepass([]);
    } finally {
      setIsCheckingBattlepasses(false);
    }
  };

  // Добавить игрока
  const addPlayer = (player: Player) => {
    const newPlayers = [...selectedPlayers, player];
    setSelectedPlayers(newPlayers);
    setPlayerSearch('');
    setSearchResults([]);
    setShowPlayerSearch(false);
    // Очищаем ошибку если была
    if (errors.players) {
      setErrors(prev => ({ ...prev, players: '' }));
    }
    // Проверяем баттлпассы
    checkPlayersBattlepasses(newPlayers.map(p => p.id));
  };

  // Удалить игрока
  const removePlayer = (playerId: string) => {
    const newPlayers = selectedPlayers.filter(player => player.id !== playerId);
    setSelectedPlayers(newPlayers);
    // Перепроверяем баттлпассы
    checkPlayersBattlepasses(newPlayers.map(p => p.id));
  };

  // Валидация формы
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!description.trim()) {
      newErrors.description = 'Описание игры обязательно';
    } else if (description.trim().length < 50) {
      newErrors.description = 'Описание должно содержать минимум 50 символов';
    } else if (description.trim().length > 5000) {
      newErrors.description = 'Описание не должно превышать 5000 символов';
    }

    if (selectedPlayers.length === 0) {
      newErrors.players = 'Выберите хотя бы одного игрока';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Обработка отправки формы
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    const formData = {
      description: description.trim(),
      highlights: highlights.trim() || undefined,
      playerIds: selectedPlayers.map(player => player.id),
      sessionId: initialData?.sessionId,
    };

    try {
      await onSubmit(formData);
    } catch (error) {
      console.error('Error submitting report:', error);
    }
  };

  const isFormValid = description.trim().length >= 50 && selectedPlayers.length > 0;

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Описание игры */}
          <div className="space-y-2">
            <Label htmlFor="description">
              Описание игры <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Подробно опишите что происходило в игре, какие события были важными, как развивались персонажи..."
              rows={6}
              className={errors.description ? 'border-red-500' : ''}
            />
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>
                {description.length < 50 && description.length > 0 && (
                  <span className="text-orange-600">
                    Минимум 50 символов (осталось {50 - description.length})
                  </span>
                )}
                {description.length >= 50 && (
                  <span className="text-green-600 flex items-center gap-1">
                    <CheckCircle className="h-4 w-4" />
                    Требование выполнено
                  </span>
                )}
              </span>
              <span className={description.length > 5000 ? 'text-red-600' : ''}>
                {description.length}/5000
              </span>
            </div>
            {errors.description && (
              <p className="text-red-500 text-sm flex items-center gap-1">
                <AlertCircle className="h-4 w-4" />
                {errors.description}
              </p>
            )}
          </div>

          {/* Дополнительные моменты */}
          <div className="space-y-2">
            <Label htmlFor="highlights">Дополнительные моменты (необязательно)</Label>
            <Textarea
              id="highlights"
              value={highlights}
              onChange={(e) => setHighlights(e.target.value)}
              placeholder="Особые достижения игроков, интересные решения, забавные моменты..."
              rows={3}
            />
            <p className="text-sm text-muted-foreground">
              Опишите что-то особенное, что произошло в игре
            </p>
          </div>

          {/* Выбор игроков */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>
                Участники игры <span className="text-red-500">*</span>
              </Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowPlayerSearch(!showPlayerSearch)}
                className="flex items-center gap-2"
              >
                <Search className="h-4 w-4" />
                Добавить игрока
              </Button>
            </div>

            {/* Поиск игроков */}
            {showPlayerSearch && (
              <div className="border rounded-lg p-4 space-y-3">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Поиск игроков по имени или email..."
                    value={playerSearch}
                    onChange={(e) => setPlayerSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
                
                {isSearching && (
                  <p className="text-sm text-muted-foreground">Поиск...</p>
                )}
                
                {searchResults.length > 0 && (
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {searchResults.map((player) => (
                      <div
                        key={player.id}
                        className="flex items-center justify-between p-2 border rounded cursor-pointer hover:bg-muted"
                        onClick={() => addPlayer(player)}
                      >
                        <div>
                          <p className="font-medium">{player.name || 'Без имени'}</p>
                          <p className="text-sm text-muted-foreground">{player.email}</p>
                        </div>
                        <Button size="sm" variant="outline">
                          Добавить
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
                
                {playerSearch && !isSearching && searchResults.length === 0 && (
                  <p className="text-sm text-muted-foreground">Игроки не найдены</p>
                )}
              </div>
            )}

            {/* Выбранные игроки */}
            {selectedPlayers.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium">Выбранные игроки ({selectedPlayers.length}):</p>
                <div className="flex flex-wrap gap-2">
                  {selectedPlayers.map((player) => (
                    <Badge
                      key={player.id}
                      variant="secondary"
                      className="flex items-center gap-2 pr-1"
                    >
                      <span>{player.name || player.email}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-4 w-4 p-0 hover:bg-destructive hover:text-destructive-foreground"
                        onClick={() => removePlayer(player.id)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {errors.players && (
              <p className="text-red-500 text-sm flex items-center gap-1">
                <AlertCircle className="h-4 w-4" />
                {errors.players}
              </p>
            )}

            {/* Предупреждение о игроках без баттлпассов */}
            {isCheckingBattlepasses && (
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  Проверяем баттлпассы у игроков...
                </p>
              </div>
            )}
            
            {playersWithoutBattlepass.length > 0 && (
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
                <p className="text-sm text-yellow-800 dark:text-yellow-200 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  Отчёт можно подать, но у некоторых игроков нет доступных игр в баттлпассе.
                </p>
                <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-1">
                  При одобрении игры будут списаны только у тех, у кого есть активные баттлпассы.
                </p>
              </div>
            )}
          </div>

          {/* Кнопки */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isLoading}
            >
              Отмена
            </Button>
            <Button
              type="submit"
              disabled={!isFormValid || isLoading}
              className="min-w-[120px]"
            >
              {isLoading ? 'Отправка...' : initialData?.id ? 'Обновить' : 'Отправить'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
