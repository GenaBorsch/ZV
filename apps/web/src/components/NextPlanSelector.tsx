"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Sparkles, RefreshCw } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export interface NextPlanData {
  continuedFromReportId?: string;
  nextPlanText: string;
  monsterId: string;
  locationTextId: string;
  mainEventTextId: string;
  sideEventTextId: string;
}

interface Monster {
  id: string;
  title: string;
  imageUrl: string | null;
  description: string;
  status: 'AVAILABLE' | 'LOCKED';
}

interface StoryText {
  id: string;
  type: 'LOCATION' | 'MAIN_EVENT' | 'SIDE_EVENT';
  text: string;
  status: 'AVAILABLE' | 'LOCKED';
}

interface NextPlanSelectorProps {
  groupId: string | null;
  value: NextPlanData | null;
  onChange: (data: NextPlanData | null) => void;
}

export function NextPlanSelector({ groupId, value, onChange }: NextPlanSelectorProps) {
  const [isContinuation, setIsContinuation] = useState(false);
  const [previousPlan, setPreviousPlan] = useState<any>(null);
  const [isLoadingContinuation, setIsLoadingContinuation] = useState(false);

  const [monsters, setMonsters] = useState<Monster[]>([]);
  const [locations, setLocations] = useState<StoryText[]>([]);
  const [mainEvents, setMainEvents] = useState<StoryText[]>([]);
  const [sideEvents, setSideEvents] = useState<StoryText[]>([]);
  const [isLoadingElements, setIsLoadingElements] = useState(false);

  const [selectedMonster, setSelectedMonster] = useState<string>('');
  const [selectedLocation, setSelectedLocation] = useState<string>('');
  const [selectedMainEvent, setSelectedMainEvent] = useState<string>('');
  const [selectedSideEvent, setSelectedSideEvent] = useState<string>('');
  const [planText, setPlanText] = useState('');

  const [isLoadingLucky, setIsLoadingLucky] = useState(false);

  // Загрузка доступных элементов
  useEffect(() => {
    if (!groupId) return;
    loadAvailableElements();
  }, [groupId]);

  // Обновление value при изменении полей
  useEffect(() => {
    if (selectedMonster && selectedLocation && selectedMainEvent && selectedSideEvent && planText) {
      onChange({
        continuedFromReportId: isContinuation ? previousPlan?.report?.id : undefined,
        nextPlanText: planText,
        monsterId: selectedMonster,
        locationTextId: selectedLocation,
        mainEventTextId: selectedMainEvent,
        sideEventTextId: selectedSideEvent,
      });
    } else {
      onChange(null);
    }
  }, [selectedMonster, selectedLocation, selectedMainEvent, selectedSideEvent, planText, isContinuation, previousPlan]);

  // Загрузка предыдущего плана
  const loadPreviousPlan = async () => {
    if (!groupId) return;

    setIsLoadingContinuation(true);
    try {
      const res = await fetch(`/api/story-pool/continuation?groupId=${groupId}`);
      if (res.ok) {
        const data = await res.json();
        if (data.hasPreviousPlan) {
          setPreviousPlan(data);
          // Автоматически выбираем элементы из предыдущего плана
          setSelectedMonster(data.plan.monsterId);
          setSelectedLocation(data.plan.locationTextId);
          setSelectedMainEvent(data.plan.mainEventTextId);
          setSelectedSideEvent(data.plan.sideEventTextId);
        }
      }
    } catch (err) {
      console.error('Failed to load continuation:', err);
    } finally {
      setIsLoadingContinuation(false);
    }
  };

  // Обработчик чекбокса "Продолжение"
  const handleContinuationChange = (checked: boolean) => {
    setIsContinuation(checked);
    if (checked && !previousPlan) {
      loadPreviousPlan();
    } else if (!checked) {
      // Сброс выбора при отключении продолжения
      setSelectedMonster('');
      setSelectedLocation('');
      setSelectedMainEvent('');
      setSelectedSideEvent('');
    }
  };

  // Загрузка доступных элементов
  const loadAvailableElements = async () => {
    setIsLoadingElements(true);
    try {
      const [monstersRes, locationsRes, mainEventsRes, sideEventsRes] = await Promise.all([
        fetch('/api/story-pool/monsters/available?limit=100'),
        fetch('/api/story-pool/texts/available?type=LOCATION&limit=100'),
        fetch('/api/story-pool/texts/available?type=MAIN_EVENT&limit=100'),
        fetch('/api/story-pool/texts/available?type=SIDE_EVENT&limit=100'),
      ]);

      if (monstersRes.ok) {
        const data = await monstersRes.json();
        setMonsters(data.data || []);
      }
      if (locationsRes.ok) {
        const data = await locationsRes.json();
        setLocations(data.data || []);
      }
      if (mainEventsRes.ok) {
        const data = await mainEventsRes.json();
        setMainEvents(data.data || []);
      }
      if (sideEventsRes.ok) {
        const data = await sideEventsRes.json();
        setSideEvents(data.data || []);
      }
    } catch (err) {
      console.error('Failed to load elements:', err);
    } finally {
      setIsLoadingElements(false);
    }
  };

  // "Мне повезёт"
  const handleFeelingLucky = async () => {
    setIsLoadingLucky(true);
    try {
      const res = await fetch('/api/story-pool/feeling-lucky', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ groupId }),
      });

      if (res.ok) {
        const data = await res.json();
        setSelectedMonster(data.monsterId);
        setSelectedLocation(data.locationTextId);
        setSelectedMainEvent(data.mainEventTextId);
        setSelectedSideEvent(data.sideEventTextId);
      } else {
        const error = await res.json();
        alert('Ошибка: ' + (error.message || 'Не удалось сгенерировать сетку'));
      }
    } catch (err: any) {
      alert('Ошибка: ' + err.message);
    } finally {
      setIsLoadingLucky(false);
    }
  };

  if (!groupId) {
    return (
      <Card className="border-2 border-dashed">
        <CardHeader>
          <CardTitle>План следующей игры</CardTitle>
          <CardDescription>Сначала выберите группу</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="border-2 border-primary/20">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>План следующей игры</CardTitle>
            <CardDescription>Выберите сетку событий для следующей сессии</CardDescription>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleFeelingLucky}
            disabled={isLoadingLucky || isContinuation}
          >
            <Sparkles className="w-4 h-4 mr-2" />
            {isLoadingLucky ? 'Генерация...' : 'Мне повезёт'}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Продолжение */}
        <div className="flex items-center space-x-2">
          <Checkbox
            id="continuation"
            checked={isContinuation}
            onCheckedChange={handleContinuationChange}
            disabled={isLoadingContinuation}
          />
          <Label htmlFor="continuation" className="text-sm font-medium cursor-pointer">
            Продолжение предыдущей сессии (заблокированные элементы)
          </Label>
        </div>

        {isContinuation && previousPlan && (
          <div className="p-4 bg-muted rounded-lg text-sm">
            <p className="font-medium mb-2">Предыдущий план от {new Date(previousPlan.report.createdAt).toLocaleDateString()}:</p>
            <div className="space-y-1 text-muted-foreground">
              <p>🐉 Монстр: {previousPlan.plan.monster?.title}</p>
              <p>📍 Локация: {previousPlan.plan.location?.text.substring(0, 50)}...</p>
            </div>
          </div>
        )}

        {/* Выбор монстра */}
        <div className="space-y-2">
          <Label htmlFor="monster">Монстр *</Label>
          <Select
            value={selectedMonster}
            onValueChange={setSelectedMonster}
            disabled={isContinuation || isLoadingElements}
          >
            <SelectTrigger>
              <SelectValue placeholder="Выберите монстра" />
            </SelectTrigger>
            <SelectContent>
              {monsters.map((monster) => (
                <SelectItem key={monster.id} value={monster.id}>
                  {monster.title}
                  {monster.status === 'LOCKED' && ' 🔒'}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Выбор локации */}
        <div className="space-y-2">
          <Label htmlFor="location">Локация *</Label>
          <Select
            value={selectedLocation}
            onValueChange={setSelectedLocation}
            disabled={isContinuation || isLoadingElements}
          >
            <SelectTrigger>
              <SelectValue placeholder="Выберите локацию" />
            </SelectTrigger>
            <SelectContent>
              {locations.map((location) => (
                <SelectItem key={location.id} value={location.id}>
                  {location.text.substring(0, 60)}...
                  {location.status === 'LOCKED' && ' 🔒'}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Выбор главного события */}
        <div className="space-y-2">
          <Label htmlFor="mainEvent">Основное событие *</Label>
          <Select
            value={selectedMainEvent}
            onValueChange={setSelectedMainEvent}
            disabled={isContinuation || isLoadingElements}
          >
            <SelectTrigger>
              <SelectValue placeholder="Выберите основное событие" />
            </SelectTrigger>
            <SelectContent>
              {mainEvents.map((event) => (
                <SelectItem key={event.id} value={event.id}>
                  {event.text.substring(0, 60)}...
                  {event.status === 'LOCKED' && ' 🔒'}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Выбор побочного события */}
        <div className="space-y-2">
          <Label htmlFor="sideEvent">Побочное событие *</Label>
          <Select
            value={selectedSideEvent}
            onValueChange={setSelectedSideEvent}
            disabled={isContinuation || isLoadingElements}
          >
            <SelectTrigger>
              <SelectValue placeholder="Выберите побочное событие" />
            </SelectTrigger>
            <SelectContent>
              {sideEvents.map((event) => (
                <SelectItem key={event.id} value={event.id}>
                  {event.text.substring(0, 60)}...
                  {event.status === 'LOCKED' && ' 🔒'}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Текстовый план */}
        <div className="space-y-2">
          <Label htmlFor="planText">Описание плана следующей игры *</Label>
          <Textarea
            id="planText"
            value={planText}
            onChange={(e) => setPlanText(e.target.value)}
            placeholder="Опишите, что произойдёт в следующей сессии..."
            rows={5}
            maxLength={2000}
            required
          />
          <p className="text-xs text-muted-foreground">
            {planText.length} / 2000 символов
          </p>
        </div>

        {/* Превью выбранных элементов */}
        {(selectedMonster || selectedLocation || selectedMainEvent || selectedSideEvent) && (
          <div className="p-4 bg-primary/5 rounded-lg space-y-2">
            <p className="text-sm font-medium">Выбранная сетка:</p>
            <div className="grid grid-cols-2 gap-2 text-sm">
              {selectedMonster && (
                <div>
                  <Badge variant="outline">Монстр</Badge>
                  <p className="mt-1 text-muted-foreground">
                    {monsters.find(m => m.id === selectedMonster)?.title}
                  </p>
                </div>
              )}
              {selectedLocation && (
                <div>
                  <Badge variant="outline">Локация</Badge>
                  <p className="mt-1 text-muted-foreground line-clamp-2">
                    {locations.find(l => l.id === selectedLocation)?.text.substring(0, 50)}...
                  </p>
                </div>
              )}
              {selectedMainEvent && (
                <div>
                  <Badge variant="outline">Основное событие</Badge>
                  <p className="mt-1 text-muted-foreground line-clamp-2">
                    {mainEvents.find(e => e.id === selectedMainEvent)?.text.substring(0, 50)}...
                  </p>
                </div>
              )}
              {selectedSideEvent && (
                <div>
                  <Badge variant="outline">Побочное событие</Badge>
                  <p className="mt-1 text-muted-foreground line-clamp-2">
                    {sideEvents.find(e => e.id === selectedSideEvent)?.text.substring(0, 50)}...
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

