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

interface Group {
  id: string;
  name: string;
  description: string;
  currentMembers: number;
  maxMembers: number;
  members: Player[];
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
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [groups, setGroups] = useState<Group[]>([]);
  const [isLoadingGroups, setIsLoadingGroups] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [playersWithoutBattlepass, setPlayersWithoutBattlepass] = useState<string[]>([]);
  const [isCheckingBattlepasses, setIsCheckingBattlepasses] = useState(false);

  // Загрузка групп мастера
  const loadGroups = async () => {
    setIsLoadingGroups(true);
    try {
      const response = await fetch('/api/master/groups');
      if (response.ok) {
        const data = await response.json();
        setGroups(data.groups);
      } else {
        console.error('Failed to load groups');
      }
    } catch (error) {
      console.error('Error loading groups:', error);
    } finally {
      setIsLoadingGroups(false);
    }
  };

  // Загрузка групп при монтировании компонента
  useEffect(() => {
    loadGroups();
  }, []);

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
        const playersWithoutBp = data.playersWithoutBattlepass || [];
        setPlayersWithoutBattlepass(playersWithoutBp);
      }
    } catch (error) {
      console.error('Error checking battlepasses:', error);
    } finally {
      setIsCheckingBattlepasses(false);
    }
  };

  // Проверяем баттлпассы при изменении списка игроков
  useEffect(() => {
    const playerIds = selectedPlayers.map(p => p.id);
    checkPlayersBattlepasses(playerIds);
  }, [selectedPlayers]);

  // Добавить игрока из группы
  const addPlayer = (player: Player) => {
    if (!selectedPlayers.some(p => p.id === player.id)) {
      setSelectedPlayers(prev => [...prev, player]);
    }
  };

  // Удалить игрока
  const removePlayer = (playerId: string) => {
    setSelectedPlayers(prev => prev.filter(p => p.id !== playerId));
    // Очищаем ошибку если была
    if (errors.players) {
      setErrors(prev => ({ ...prev, players: '' }));
    }
  };

  // Валидация формы
  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!description.trim()) {
      newErrors.description = 'Описание игры обязательно';
    } else if (description.trim().length < 50) {
      newErrors.description = 'Описание должно содержать минимум 50 символов';
    }

    if (selectedPlayers.length === 0) {
      newErrors.players = 'Выберите хотя бы одного участника';
    }

    if (!selectedGroup) {
      newErrors.group = 'Выберите группу';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Отправка формы
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    const formData: CreateReportDtoType | UpdateReportDtoType = {
      description: description.trim(),
      highlights: highlights.trim() || undefined,
      playerIds: selectedPlayers.map(p => p.id),
    };

    // Добавляем ID для обновления
    if (initialData?.id) {
      (formData as UpdateReportDtoType).id = initialData.id;
    }

    await onSubmit(formData);
  };

  const isFormValid = description.trim().length >= 50 && selectedPlayers.length > 0 && selectedGroup;

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Search className="h-5 w-5" />
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
              placeholder="Подробно опишите что происходило в игре, какие события были важными, как развивались персонажи..."
              value={description}
              onChange={(e) => {
                setDescription(e.target.value);
                if (errors.description) {
                  setErrors(prev => ({ ...prev, description: '' }));
                }
              }}
              className={`min-h-[120px] resize-none ${errors.description ? 'border-red-500' : ''}`}
              maxLength={5000}
            />
            <div className="flex justify-between items-center">
              {errors.description ? (
                <p className="text-sm text-red-500 flex items-center gap-1">
                  <AlertCircle className="h-4 w-4" />
                  {errors.description}
                </p>
              ) : description.trim().length >= 50 ? (
                <p className="text-sm text-green-600 flex items-center gap-1">
                  <CheckCircle className="h-4 w-4" />
                  Требование выполнено
                </p>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Минимум 50 символов
                </p>
              )}
              <p className="text-sm text-muted-foreground">
                {description.length}/5000
              </p>
            </div>
          </div>

          {/* Дополнительные моменты */}
          <div className="space-y-2">
            <Label htmlFor="highlights">
              Дополнительные моменты (необязательно)
            </Label>
            <Textarea
              id="highlights"
              placeholder="Особые достижения игроков, интересные решения, забавные моменты..."
              value={highlights}
              onChange={(e) => setHighlights(e.target.value)}
              className="min-h-[80px] resize-none"
              maxLength={2000}
            />
            <p className="text-sm text-muted-foreground">
              Опишите что-то особенное, что произошло в игре
            </p>
          </div>

          {/* Выбор группы */}
          <div className="space-y-4">
            <Label>
              Выберите группу <span className="text-red-500">*</span>
            </Label>
            
            {isLoadingGroups ? (
              <p className="text-sm text-muted-foreground">Загрузка групп...</p>
            ) : groups.length === 0 ? (
              <div className="border rounded-lg p-4 text-center">
                <p className="text-muted-foreground">У вас пока нет групп</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Создайте группу и пригласите игроков, чтобы создавать отчеты
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {groups.map((group) => (
                  <div
                    key={group.id}
                    className={`border rounded-lg p-3 cursor-pointer transition-colors ${
                      selectedGroup?.id === group.id
                        ? 'border-primary bg-primary/5'
                        : 'hover:bg-muted'
                    }`}
                    onClick={() => setSelectedGroup(group)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{group.name}</p>
                        <p className="text-sm text-muted-foreground">{group.description}</p>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        <Users className="h-4 w-4 inline mr-1" />
                        {group.currentMembers}/{group.maxMembers}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {errors.group && (
              <p className="text-sm text-red-500 flex items-center gap-1">
                <AlertCircle className="h-4 w-4" />
                {errors.group}
              </p>
            )}
          </div>

          {/* Выбор игроков из группы */}
          {selectedGroup && (
            <div className="space-y-4">
              <Label>
                Участники игры <span className="text-red-500">*</span>
              </Label>
              
              {selectedGroup.members.length === 0 ? (
                <div className="border rounded-lg p-4 text-center">
                  <p className="text-muted-foreground">В группе пока нет участников</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {selectedGroup.members
                    .filter(member => member.status === 'ACTIVE')
                    .map((player) => (
                    <div
                      key={player.id}
                      className={`border rounded-lg p-3 cursor-pointer transition-colors ${
                        selectedPlayers.some(p => p.id === player.id)
                          ? 'border-green-500 bg-green-50'
                          : 'hover:bg-gray-50 hover:border-gray-300'
                      }`}
                      onClick={() => {
                        if (selectedPlayers.some(p => p.id === player.id)) {
                          removePlayer(player.id);
                        } else {
                          addPlayer(player);
                        }
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{player.name}</p>
                          <p className="text-sm text-muted-foreground">{player.email}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          {playersWithoutBattlepass.includes(player.id) && (
                            <AlertCircle className="h-4 w-4 text-yellow-500" title="Нет активных путёвок" />
                          )}
                          {selectedPlayers.some(p => p.id === player.id) ? (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          ) : (
                            <div className="w-4 h-4 border border-muted-foreground rounded" />
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              {errors.players && (
                <p className="text-sm text-red-500 flex items-center gap-1">
                  <AlertCircle className="h-4 w-4" />
                  {errors.players}
                </p>
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
                    className="flex items-center gap-2 pr-2 py-1"
                  >
                    <span>{player.name || player.email}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-5 w-5 p-0 hover:bg-destructive hover:text-destructive-foreground rounded-full"
                      onClick={() => removePlayer(player.id)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                ))}
              </div>
            </div>
          )}
          
          {isCheckingBattlepasses && (
            <div className="text-sm text-muted-foreground">
              Проверка путёвок игроков...
            </div>
          )}
          
          {playersWithoutBattlepass.length > 0 && (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
              <p className="text-base text-yellow-800 dark:text-yellow-200 flex items-center gap-2">
                <AlertCircle className="h-5 w-5" />
                Отчёт можно подать, но у некоторых игроков нет доступных игр в путёвках.
              </p>
              <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                При одобрении игры будут списаны только у тех, у кого есть активные путёвки.
              </p>
            </div>
          )}

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