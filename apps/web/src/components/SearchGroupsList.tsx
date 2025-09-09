"use client";

import { useState, useEffect } from 'react';
import { useDebounce } from '@/lib/hooks/useDebounce';
import { GroupSearchCard } from './GroupSearchCard';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';

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

interface Season {
  id: string;
  title: string;
  code: string;
  isActive: boolean;
}

export function SearchGroupsList() {
  const [groups, setGroups] = useState<GroupWithMasterAndSeason[]>([]);
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [applicationSuccess, setApplicationSuccess] = useState<{groupName: string} | null>(null);

  // Фильтры и поиск
  const [search, setSearch] = useState('');
  const [selectedFormat, setSelectedFormat] = useState<string>('all');
  const [selectedSeason, setSelectedSeason] = useState<string>('all');

  const debouncedSearch = useDebounce(search, 300);

  // Загрузка групп
  const fetchGroups = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (debouncedSearch) params.append('search', debouncedSearch);
      if (selectedFormat && selectedFormat !== 'all') params.append('format', selectedFormat);
      if (selectedSeason && selectedSeason !== 'all') params.append('seasonId', selectedSeason);

      const response = await fetch(`/api/groups/search?${params.toString()}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Ошибка загрузки групп');
      }

      const data = await response.json();
      setGroups(data.groups || []);
    } catch (error: any) {
      console.error('Ошибка загрузки групп:', error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Загрузка активных сезонов
  const fetchSeasons = async () => {
    try {
      const response = await fetch('/api/seasons?active=true');
      if (response.ok) {
        const data = await response.json();
        setSeasons(data.seasons || []);
      }
    } catch (error) {
      console.error('Ошибка загрузки сезонов:', error);
    }
  };

  // Отправка заявки на вступление в группу
  const handleApplyToGroup = async (groupId: string, groupName: string) => {
    try {
      const response = await fetch(`/api/groups/${groupId}/apply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}), // Можно добавить сообщение в будущем
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Ошибка при отправке заявки');
      }

      const result = await response.json();
      setApplicationSuccess({ groupName });
      
      // Обновляем список групп
      fetchGroups();
    } catch (error: any) {
      console.error('Ошибка отправки заявки:', error);
      alert(error.message);
    }
  };

  // Загрузка данных при изменении фильтров
  useEffect(() => {
    fetchGroups();
  }, [debouncedSearch, selectedFormat, selectedSeason]);

  // Загрузка сезонов при монтировании
  useEffect(() => {
    fetchSeasons();
  }, []);


  return (
    <div className="space-y-6">
      {/* Фильтры и поиск */}
      <div className="card p-6">
        <div className="space-y-4">
          <div>
            <Label htmlFor="search" className="text-sm font-medium text-foreground mb-2 block">
              Поиск по названию группы или имени мастера
            </Label>
            <Input
              id="search"
              placeholder="Введите название группы или имя мастера..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium text-foreground mb-2 block">
                Формат игры
              </Label>
              <Select value={selectedFormat} onValueChange={setSelectedFormat}>
                <SelectTrigger>
                  <SelectValue placeholder="Все форматы" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все форматы</SelectItem>
                  <SelectItem value="ONLINE">Онлайн</SelectItem>
                  <SelectItem value="OFFLINE">Оффлайн</SelectItem>
                  <SelectItem value="MIXED">Смешанный</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-sm font-medium text-foreground mb-2 block">
                Сезон
              </Label>
              <Select value={selectedSeason} onValueChange={setSelectedSeason}>
                <SelectTrigger>
                  <SelectValue placeholder="Все сезоны" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все сезоны</SelectItem>
                  {seasons.map((season) => (
                    <SelectItem key={season.id} value={season.id}>
                      {season.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {(search || (selectedFormat && selectedFormat !== 'all') || (selectedSeason && selectedSeason !== 'all')) && (
            <div className="flex items-center justify-between pt-2 border-t border-border">
              <p className="text-sm text-muted-foreground">
                {isLoading ? 'Поиск...' : `Найдено групп: ${groups.length}`}
              </p>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearch('');
                  setSelectedFormat('all');
                  setSelectedSeason('all');
                }}
              >
                Сбросить фильтры
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Результаты поиска */}
      <div>
        {error ? (
          <div className="card p-6 text-center">
            <div className="text-destructive mb-2">Ошибка загрузки</div>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={fetchGroups} variant="outline">
              Попробовать снова
            </Button>
          </div>
        ) : isLoading ? (
          <div className="card p-6 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Загрузка групп...</p>
          </div>
        ) : groups.length === 0 ? (
          <div className="card p-6 text-center">
            <div className="text-muted-foreground mb-2">Групп не найдено</div>
            <p className="text-sm text-muted-foreground">
              {search || (selectedFormat && selectedFormat !== 'all') || (selectedSeason && selectedSeason !== 'all')
                ? 'Попробуйте изменить параметры поиска'
                : 'В данный момент нет доступных групп для присоединения'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {groups.map((group) => (
              <GroupSearchCard
                key={group.id}
                group={group}
                onApply={() => handleApplyToGroup(group.id, group.name)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Уведомление об успешной отправке заявки */}
      {applicationSuccess && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="text-center">
              <div className="text-green-600 text-4xl mb-4">✅</div>
              <h3 className="text-lg font-medium text-foreground mb-2">
                Заявка отправлена!
              </h3>
              <p className="text-muted-foreground mb-4">
                Ваша заявка на вступление в группу "{applicationSuccess.groupName}" успешно отправлена. 
                Мастер группы рассмотрит её и даст ответ.
              </p>
              <Button 
                onClick={() => setApplicationSuccess(null)}
                className="btn-primary"
              >
                Понятно
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
