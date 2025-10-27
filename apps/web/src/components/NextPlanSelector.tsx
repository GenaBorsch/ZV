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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

// Функция для преобразования MinIO URL в API URL
function convertMinioUrlToApiUrl(url: string): string {
  // Если это уже API URL, возвращаем как есть
  if (url.startsWith('/api/files/')) {
    return url;
  }
  
  // Если это полный URL (http/https), извлекаем путь
  if (url.startsWith('http://') || url.startsWith('https://')) {
    try {
      const urlObj = new URL(url);
      const path = urlObj.pathname;
      // Если путь начинается с /uploads/, возвращаем как есть
      if (path.startsWith('/uploads/')) {
        return `/api/files${path}`;
      }
      // Иначе добавляем /uploads/
      return `/api/files/uploads${path}`;
    } catch (e) {
      // Если не удалось распарсить URL, возвращаем как есть
      return url;
    }
  }
  
  // Если это относительный путь
  if (url.startsWith('/')) {
    // Если путь не начинается с uploads/, добавляем его с monsters/
    if (!url.startsWith('/uploads/')) {
      return `/api/files/uploads/monsters${url}`;
    }
    // Если уже начинается с /uploads/, добавляем monsters/ после uploads/
    const remainingPath = url.substring('/uploads/'.length);
    if (remainingPath && !remainingPath.startsWith('monsters/')) {
      return `/api/files/uploads/monsters/${remainingPath}`;
    }
    return `/api/files${url}`;
  }
  
  // Если путь не начинается с /, добавляем полный путь с monsters/
  return `/api/files/uploads/monsters/${url}`;
}

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
  lastKnownLocation?: string | null;
  bountyAlive?: number | null;
  bountyDead?: number | null;
}

interface StoryText {
  id: string;
  type: 'LOCATION' | 'MAIN_EVENT' | 'SIDE_EVENT';
  title: string;
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

  // Состояние для модальных окон
  const [previewDialog, setPreviewDialog] = useState<{
    type: 'monster' | 'location' | 'mainEvent' | 'sideEvent' | null;
    item: Monster | StoryText | null;
  }>({ type: null, item: null });

  const [selectionDialog, setSelectionDialog] = useState<{
    type: 'monster' | 'location' | 'mainEvent' | 'sideEvent' | null;
  }>({ type: null });

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

  // Функции для работы с модальными окнами
  const openSelection = (type: 'monster' | 'location' | 'mainEvent' | 'sideEvent') => {
    setSelectionDialog({ type });
  };

  const closeSelection = () => {
    setSelectionDialog({ type: null });
  };

  const openPreview = (type: 'monster' | 'location' | 'mainEvent' | 'sideEvent', item: Monster | StoryText) => {
    setPreviewDialog({ type, item });
    closeSelection();
  };

  const closePreview = () => {
    setPreviewDialog({ type: null, item: null });
  };

  const selectItem = (type: 'monster' | 'location' | 'mainEvent' | 'sideEvent', item: Monster | StoryText) => {
    switch (type) {
      case 'monster':
        setSelectedMonster(item.id);
        break;
      case 'location':
        setSelectedLocation(item.id);
        break;
      case 'mainEvent':
        setSelectedMainEvent(item.id);
        break;
      case 'sideEvent':
        setSelectedSideEvent(item.id);
        break;
    }
    closePreview();
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
              <p>📍 Локация: {previousPlan.plan.location?.title}</p>
            </div>
          </div>
        )}

        {/* Выбор монстра */}
        <div className="space-y-2">
          <Label htmlFor="monster">Монстр *</Label>
          <Button
            type="button"
            variant="outline"
            className="w-full justify-start"
            onClick={() => openSelection('monster')}
            disabled={isContinuation || isLoadingElements}
          >
            {selectedMonster ? monsters.find(m => m.id === selectedMonster)?.title : "Выберите монстра"}
          </Button>
        </div>

        {/* Выбор локации */}
        <div className="space-y-2">
          <Label htmlFor="location">Локация *</Label>
          <Button
            type="button"
            variant="outline"
            className="w-full justify-start"
            onClick={() => openSelection('location')}
            disabled={isContinuation || isLoadingElements}
          >
            {selectedLocation ? locations.find(l => l.id === selectedLocation)?.title : "Выберите локацию"}
          </Button>
        </div>

        {/* Выбор главного события */}
        <div className="space-y-2">
          <Label htmlFor="mainEvent">Основное событие *</Label>
          <Button
            type="button"
            variant="outline"
            className="w-full justify-start"
            onClick={() => openSelection('mainEvent')}
            disabled={isContinuation || isLoadingElements}
          >
            {selectedMainEvent ? mainEvents.find(e => e.id === selectedMainEvent)?.title : "Выберите основное событие"}
          </Button>
        </div>

        {/* Выбор побочного события */}
        <div className="space-y-2">
          <Label htmlFor="sideEvent">Побочное событие *</Label>
          <Button
            type="button"
            variant="outline"
            className="w-full justify-start"
            onClick={() => openSelection('sideEvent')}
            disabled={isContinuation || isLoadingElements}
          >
            {selectedSideEvent ? sideEvents.find(e => e.id === selectedSideEvent)?.title : "Выберите побочное событие"}
          </Button>
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
                  <p className="mt-1 font-medium">
                    {locations.find(l => l.id === selectedLocation)?.title}
                  </p>
                  <p className="mt-1 text-muted-foreground text-xs line-clamp-2">
                    {locations.find(l => l.id === selectedLocation)?.text}
                  </p>
                </div>
              )}
              {selectedMainEvent && (
                <div>
                  <Badge variant="outline">Основное событие</Badge>
                  <p className="mt-1 font-medium">
                    {mainEvents.find(e => e.id === selectedMainEvent)?.title}
                  </p>
                  <p className="mt-1 text-muted-foreground text-xs line-clamp-2">
                    {mainEvents.find(e => e.id === selectedMainEvent)?.text}
                  </p>
                </div>
              )}
              {selectedSideEvent && (
                <div>
                  <Badge variant="outline">Побочное событие</Badge>
                  <p className="mt-1 font-medium">
                    {sideEvents.find(e => e.id === selectedSideEvent)?.title}
                  </p>
                  <p className="mt-1 text-muted-foreground text-xs line-clamp-2">
                    {sideEvents.find(e => e.id === selectedSideEvent)?.text}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>

      {/* Модальное окно для выбора элементов */}
      <Dialog open={selectionDialog.type !== null} onOpenChange={closeSelection}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>
              {selectionDialog.type === 'monster' && 'Выберите монстра'}
              {selectionDialog.type === 'location' && 'Выберите локацию'}
              {selectionDialog.type === 'mainEvent' && 'Выберите основное событие'}
              {selectionDialog.type === 'sideEvent' && 'Выберите побочное событие'}
            </DialogTitle>
            <DialogDescription>
              Нажмите на элемент для подробного просмотра
            </DialogDescription>
          </DialogHeader>

          <div className="overflow-y-auto max-h-[60vh] space-y-2">
            {selectionDialog.type === 'monster' && monsters.map((monster) => (
              <div 
                key={monster.id} 
                className="p-4 border rounded-lg hover:bg-accent hover:text-accent-foreground cursor-pointer transition-colors"
                onClick={() => openPreview('monster', monster)}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h4 className="font-medium">{monster.title}</h4>
                    <p className="text-sm text-muted-foreground hover:text-accent-foreground/70 mt-1 line-clamp-2">{monster.description}</p>
                    {monster.lastKnownLocation && (
                      <p className="text-xs text-muted-foreground hover:text-accent-foreground/60 mt-1">📍 {monster.lastKnownLocation}</p>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    {monster.status === 'LOCKED' && <span className="text-red-500 text-sm">🔒</span>}
                    {(monster.bountyAlive || monster.bountyDead) && (
                      <div className="text-xs text-muted-foreground">
                        {monster.bountyAlive && <div>💰 {monster.bountyAlive}</div>}
                        {monster.bountyDead && <div>💀 {monster.bountyDead}</div>}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {(selectionDialog.type === 'location' || selectionDialog.type === 'mainEvent' || selectionDialog.type === 'sideEvent') && 
              (selectionDialog.type === 'location' ? locations : 
               selectionDialog.type === 'mainEvent' ? mainEvents : sideEvents).map((item) => (
              <div 
                key={item.id} 
                className="p-4 border rounded-lg hover:bg-accent hover:text-accent-foreground cursor-pointer transition-colors"
                onClick={() => openPreview(selectionDialog.type!, item)}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h4 className="font-medium">{item.title}</h4>
                    <p className="text-sm text-muted-foreground hover:text-accent-foreground/70 mt-1 line-clamp-3">{item.text}</p>
                  </div>
                  {item.status === 'LOCKED' && <span className="text-red-500 text-sm">🔒</span>}
                </div>
              </div>
            ))}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={closeSelection}>
              Отмена
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Модальное окно для предварительного просмотра */}
      <Dialog open={previewDialog.type !== null} onOpenChange={closePreview}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {previewDialog.type === 'monster' && 'Монстр'}
              {previewDialog.type === 'location' && 'Локация'}
              {previewDialog.type === 'mainEvent' && 'Основное событие'}
              {previewDialog.type === 'sideEvent' && 'Побочное событие'}
            </DialogTitle>
            <DialogDescription>
              Подробная информация о выбранном элементе
            </DialogDescription>
          </DialogHeader>

          {previewDialog.item && (
            <div className="space-y-4">
              {previewDialog.type === 'monster' && (
                <div>
                  <h3 className="text-lg font-semibold">{(previewDialog.item as Monster).title}</h3>
                  {(previewDialog.item as Monster).imageUrl && (
                    <img 
                      src={convertMinioUrlToApiUrl((previewDialog.item as Monster).imageUrl!)} 
                      alt={(previewDialog.item as Monster).title}
                      className="w-full h-48 object-cover rounded-lg mt-2"
                    />
                  )}
                  <div className="mt-4 space-y-2">
                    <div>
                      <h4 className="font-medium">Описание:</h4>
                      <p className="text-muted-foreground">{(previewDialog.item as Monster).description}</p>
                    </div>
                    {(previewDialog.item as Monster).lastKnownLocation && (
                      <div>
                        <h4 className="font-medium">Последнее известное местоположение:</h4>
                        <p className="text-muted-foreground">{(previewDialog.item as Monster).lastKnownLocation}</p>
                      </div>
                    )}
                    <div className="flex gap-4">
                      {(previewDialog.item as Monster).bountyAlive && (
                        <div>
                          <h4 className="font-medium">Награда живым:</h4>
                          <p className="text-muted-foreground">{(previewDialog.item as Monster).bountyAlive} золота</p>
                        </div>
                      )}
                      {(previewDialog.item as Monster).bountyDead && (
                        <div>
                          <h4 className="font-medium">Награда мертвым:</h4>
                          <p className="text-muted-foreground">{(previewDialog.item as Monster).bountyDead} золота</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {(previewDialog.type === 'location' || previewDialog.type === 'mainEvent' || previewDialog.type === 'sideEvent') && (
                <div>
                  <h3 className="text-lg font-semibold">{(previewDialog.item as StoryText).title}</h3>
                  <div className="mt-4">
                    <h4 className="font-medium">Описание:</h4>
                    <p className="text-muted-foreground whitespace-pre-wrap">{(previewDialog.item as StoryText).text}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={closePreview}>
              Отмена
            </Button>
            <Button onClick={() => previewDialog.item && selectItem(previewDialog.type!, previewDialog.item!)}>
              Выбрать
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

