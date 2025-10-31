"use client";

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useDebounce } from '@/lib/hooks/useDebounce';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AdminHeader } from '@/components/AdminHeader';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileUpload } from '@/components/FileUpload';

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

// Types
interface Monster {
  id: string;
  title: string;
  imageUrl: string | null;
  description: string;
  lastKnownLocation: string | null;
  bountyAlive: number | null;
  bountyDead: number | null;
  status: 'AVAILABLE' | 'LOCKED';
  lockedByReportId: string | null;
  lockedByGroupId: string | null;
  lockedAt: string | null;
  lockedByMasterName: string | null;
  lockedByMasterEmail: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface StoryText {
  id: string;
  type: 'LOCATION' | 'MAIN_EVENT' | 'SIDE_EVENT';
  title: string;
  text: string;
  status: 'AVAILABLE' | 'LOCKED';
  lockedByReportId: string | null;
  lockedByGroupId: string | null;
  lockedAt: string | null;
  lockedByMasterName: string | null;
  lockedByMasterEmail: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

const TYPE_LABELS = {
  LOCATION: 'Локация',
  MAIN_EVENT: 'Основное событие',
  SIDE_EVENT: 'Побочное событие',
};

const STATUS_LABELS = {
  AVAILABLE: 'Доступно',
  LOCKED: 'Заблокировано',
};

export default function AdminStoryPoolPage() {
  const [activeTab, setActiveTab] = useState('monsters');

  return (
    <div className="min-h-screen bg-background">
      <AdminHeader 
        title="Управление пулом событий"
        subtitle="Создание и управление монстрами и текстовыми элементами для игровых сессий"
        backLink={{
          href: "/admin",
          label: "Админ-панель"
        }}
      />
      
      <main className="container mx-auto py-8">

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="monsters">Монстры</TabsTrigger>
          <TabsTrigger value="location">Локации</TabsTrigger>
          <TabsTrigger value="main_event">Основные события</TabsTrigger>
          <TabsTrigger value="side_event">Побочные события</TabsTrigger>
        </TabsList>

        <TabsContent value="monsters" className="mt-6">
          <MonstersTab />
        </TabsContent>

        <TabsContent value="location" className="mt-6">
          <StoryTextsTab type="LOCATION" />
        </TabsContent>

        <TabsContent value="main_event" className="mt-6">
          <StoryTextsTab type="MAIN_EVENT" />
        </TabsContent>

        <TabsContent value="side_event" className="mt-6">
          <StoryTextsTab type="SIDE_EVENT" />
        </TabsContent>
      </Tabs>
      </main>
    </div>
  );
}

// Компонент для управления монстрами
function MonstersTab() {
  const [monsters, setMonsters] = useState<Monster[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingMonster, setEditingMonster] = useState<Monster | null>(null);

  const debouncedSearch = useDebounce(search, 300);

  // Загрузка монстров
  useEffect(() => {
    fetchMonsters();
  }, [debouncedSearch]);

  const fetchMonsters = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (debouncedSearch) params.set('search', debouncedSearch);
      params.set('limit', '100');
      // Не передаём isActive, чтобы получить все (и активные, и неактивные)

      const res = await fetch(`/api/admin/monsters?${params}`);
      if (!res.ok) throw new Error('Failed to fetch monsters');

      const data = await res.json();
      setMonsters(data.data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUnlock = async (id: string) => {
    if (!confirm('Разблокировать этот элемент?')) return;

    try {
      const res = await fetch(`/api/admin/monsters/${id}/unlock`, {
        method: 'PATCH',
      });

      if (!res.ok) throw new Error('Failed to unlock');
      await fetchMonsters();
    } catch (err: any) {
      alert('Ошибка: ' + err.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Удалить этот элемент? (Он будет помечен как неактивный)')) return;

    try {
      const res = await fetch(`/api/admin/monsters/${id}`, {
        method: 'DELETE',
      });

      if (!res.ok) throw new Error('Failed to delete');
      await fetchMonsters();
    } catch (err: any) {
      alert('Ошибка: ' + err.message);
    }
  };

  const openCreateDialog = () => {
    setEditingMonster(null);
    setDialogOpen(true);
  };

  const openEditDialog = (monster: Monster) => {
    setEditingMonster(monster);
    setDialogOpen(true);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <Input
          type="text"
          placeholder="Поиск по названию..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm text-base"
        />
        <Button onClick={openCreateDialog} size="lg">+ Добавить монстра</Button>
      </div>

      {loading && <div className="text-center py-8">Загрузка...</div>}
      {error && <div className="text-red-500 py-8">Ошибка: {error}</div>}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {monsters.map((monster) => (
          <Card key={monster.id} className={!monster.isActive ? 'opacity-50' : ''}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <CardTitle className="text-xl font-bold">{monster.title}</CardTitle>
                <Badge variant={monster.status === 'AVAILABLE' ? 'default' : 'destructive'}>
                  {STATUS_LABELS[monster.status]}
                </Badge>
              </div>
              {monster.lastKnownLocation && (
                <CardDescription>📍 {monster.lastKnownLocation}</CardDescription>
              )}
            </CardHeader>
            <CardContent>
              {monster.imageUrl && (
                <img
                  src={convertMinioUrlToApiUrl(monster.imageUrl)}
                  alt={monster.title}
                  className="w-full h-40 object-cover rounded-md mb-3"
                />
              )}
              <p className="text-base text-muted-foreground line-clamp-3">
                {monster.description}
              </p>
              {(monster.bountyAlive || monster.bountyDead) && (
                <div className="mt-3 text-base">
                  {monster.bountyAlive && <div>💰 Живым: {monster.bountyAlive}</div>}
                  {monster.bountyDead && <div>💀 Мёртвым: {monster.bountyDead}</div>}
                </div>
              )}
              {monster.status === 'LOCKED' && (
                <div className="mt-3 text-xs text-red-600">
                  🔒 Заблокирован с {new Date(monster.lockedAt!).toLocaleDateString()}
                  {monster.lockedByMasterName && (
                    <div className="mt-1">
                      Мастер: <span className="font-medium">{monster.lockedByMasterName}</span>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
            <CardFooter className="flex flex-col gap-3">
              <div className="flex gap-2 w-full">
                <Button
                  variant="outline"
                  size="default"
                  onClick={() => openEditDialog(monster)}
                  className="flex-1"
                >
                  Редактировать
                </Button>
                {monster.status === 'LOCKED' && (
                  <Button
                    variant="outline"
                    size="default"
                    onClick={() => handleUnlock(monster.id)}
                    className="flex-1"
                  >
                    🔓 Разблокировать
                  </Button>
                )}
              </div>
              <Button
                variant="destructive"
                size="default"
                onClick={() => handleDelete(monster.id)}
                className="w-full"
              >
                Удалить
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      <MonsterDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        monster={editingMonster}
        onSuccess={fetchMonsters}
      />
    </div>
  );
}

// Компонент для управления текстами
function StoryTextsTab({ type }: { type: 'LOCATION' | 'MAIN_EVENT' | 'SIDE_EVENT' }) {
  const [texts, setTexts] = useState<StoryText[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingText, setEditingText] = useState<StoryText | null>(null);

  const debouncedSearch = useDebounce(search, 300);

  // Загрузка текстов
  useEffect(() => {
    fetchTexts();
  }, [type, debouncedSearch]);

  const fetchTexts = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      params.set('type', type);
      if (debouncedSearch) params.set('search', debouncedSearch);
      params.set('limit', '100');
      // Не передаём isActive, чтобы получить все (и активные, и неактивные)

      const res = await fetch(`/api/admin/story-texts?${params}`);
      if (!res.ok) throw new Error('Failed to fetch story texts');

      const data = await res.json();
      setTexts(data.data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUnlock = async (id: string) => {
    if (!confirm('Разблокировать этот элемент?')) return;

    try {
      const res = await fetch(`/api/admin/story-texts/${id}/unlock`, {
        method: 'PATCH',
      });

      if (!res.ok) throw new Error('Failed to unlock');
      await fetchTexts();
    } catch (err: any) {
      alert('Ошибка: ' + err.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Удалить этот элемент? (Он будет помечен как неактивный)')) return;

    try {
      const res = await fetch(`/api/admin/story-texts/${id}`, {
        method: 'DELETE',
      });

      if (!res.ok) throw new Error('Failed to delete');
      await fetchTexts();
    } catch (err: any) {
      alert('Ошибка: ' + err.message);
    }
  };

  const openCreateDialog = () => {
    setEditingText(null);
    setDialogOpen(true);
  };

  const openEditDialog = (text: StoryText) => {
    setEditingText(text);
    setDialogOpen(true);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <Input
          type="text"
          placeholder="Поиск по тексту..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm text-base"
        />
        <Button onClick={openCreateDialog} size="lg">+ Добавить {TYPE_LABELS[type].toLowerCase()}</Button>
      </div>

      {loading && <div className="text-center py-8">Загрузка...</div>}
      {error && <div className="text-red-500 py-8">Ошибка: {error}</div>}

      <div className="grid grid-cols-1 gap-4">
        {texts.map((text) => (
          <Card key={text.id} className={!text.isActive ? 'opacity-50' : ''}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <CardTitle className="text-lg font-bold">
                  {text.title}
                </CardTitle>
                <Badge variant={text.status === 'AVAILABLE' ? 'default' : 'destructive'}>
                  {STATUS_LABELS[text.status]}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-base text-muted-foreground whitespace-pre-wrap">{text.text}</p>
              {text.status === 'LOCKED' && (
                <div className="mt-3 text-sm text-red-600">
                  🔒 Заблокирован с {new Date(text.lockedAt!).toLocaleDateString()}
                  {text.lockedByMasterName && (
                    <div className="mt-1">
                      Мастер: <span className="font-medium">{text.lockedByMasterName}</span>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
            <CardFooter className="flex flex-col gap-3">
              <div className="flex gap-2 w-full">
                <Button
                  variant="outline"
                  size="default"
                  onClick={() => openEditDialog(text)}
                  className="flex-1"
                >
                  Редактировать
                </Button>
                {text.status === 'LOCKED' && (
                  <Button
                    variant="outline"
                    size="default"
                    onClick={() => handleUnlock(text.id)}
                    className="flex-1"
                  >
                    🔓 Разблокировать
                  </Button>
                )}
              </div>
              <Button
                variant="destructive"
                size="default"
                onClick={() => handleDelete(text.id)}
                className="w-full"
              >
                Удалить
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      <StoryTextDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        text={editingText}
        type={type}
        onSuccess={fetchTexts}
      />
    </div>
  );
}

// Диалог создания/редактирования монстра
function MonsterDialog({
  open,
  onOpenChange,
  monster,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  monster: Monster | null;
  onSuccess: () => void;
}) {
  const [form, setForm] = useState({
    title: '',
    imageUrl: '',
    description: '',
    lastKnownLocation: '',
    bountyAlive: '',
    bountyDead: '',
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (monster) {
      setForm({
        title: monster.title,
        imageUrl: monster.imageUrl || '',
        description: monster.description,
        lastKnownLocation: monster.lastKnownLocation || '',
        bountyAlive: monster.bountyAlive?.toString() || '',
        bountyDead: monster.bountyDead?.toString() || '',
      });
    } else {
      setForm({
        title: '',
        imageUrl: '',
        description: '',
        lastKnownLocation: '',
        bountyAlive: '',
        bountyDead: '',
      });
    }
  }, [monster, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        title: form.title.trim(),
        imageUrl: form.imageUrl.trim() || null,
        description: form.description.trim(),
        lastKnownLocation: form.lastKnownLocation.trim() || null,
        bountyAlive: form.bountyAlive ? (isNaN(parseInt(form.bountyAlive)) ? null : parseInt(form.bountyAlive)) : null,
        bountyDead: form.bountyDead ? (isNaN(parseInt(form.bountyDead)) ? null : parseInt(form.bountyDead)) : null,
      };

      const res = monster
        ? await fetch(`/api/admin/monsters/${monster.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          })
        : await fetch('/api/admin/monsters', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          });

      if (!res.ok) {
        const error = await res.json();
        const errorMessage = error.details 
          ? `Ошибка валидации: ${error.details.map((d: any) => `${d.path.join('.')}: ${d.message}`).join(', ')}`
          : error.error || error.message || 'Failed to save';
        throw new Error(errorMessage);
      }

      onSuccess();
      onOpenChange(false);
    } catch (err: any) {
      alert('Ошибка: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{monster ? 'Редактировать монстра' : 'Создать монстра'}</DialogTitle>
          <DialogDescription>
            Заполните информацию о монстре для пула событий
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title">Название *</Label>
            <Input
              id="title"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              required
              maxLength={200}
            />
          </div>

          <div>
            <Label htmlFor="imageUrl">Изображение монстра</Label>
            <FileUpload
              type="monster-image"
              value={form.imageUrl}
              onChange={(url) => setForm({ ...form, imageUrl: url || '' })}
              accept="image/*"
              maxSizeMB={10}
              className="mt-2"
            />
          </div>

          <div>
            <Label htmlFor="description">Описание *</Label>
            <Textarea
              id="description"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              required
              rows={5}
            />
          </div>

          <div>
            <Label htmlFor="lastKnownLocation">Последняя известная локация</Label>
            <Input
              id="lastKnownLocation"
              value={form.lastKnownLocation}
              onChange={(e) => setForm({ ...form, lastKnownLocation: e.target.value })}
              maxLength={200}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="bountyAlive">Награда (живым)</Label>
              <Input
                id="bountyAlive"
                type="number"
                value={form.bountyAlive}
                onChange={(e) => setForm({ ...form, bountyAlive: e.target.value })}
                min="0"
              />
            </div>

            <div>
              <Label htmlFor="bountyDead">Награда (мёртвым)</Label>
              <Input
                id="bountyDead"
                type="number"
                value={form.bountyDead}
                onChange={(e) => setForm({ ...form, bountyDead: e.target.value })}
                min="0"
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Отмена
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Сохранение...' : monster ? 'Сохранить' : 'Создать'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// Диалог создания/редактирования текста
function StoryTextDialog({
  open,
  onOpenChange,
  text,
  type,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  text: StoryText | null;
  type: 'LOCATION' | 'MAIN_EVENT' | 'SIDE_EVENT';
  onSuccess: () => void;
}) {
  const [title, setTitle] = useState('');
  const [textContent, setTextContent] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (text) {
      setTitle(text.title);
      setTextContent(text.text);
    } else {
      setTitle('');
      setTextContent('');
    }
  }, [text, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        type,
        title,
        text: textContent,
      };

      const res = text
        ? await fetch(`/api/admin/story-texts/${text.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          })
        : await fetch('/api/admin/story-texts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Failed to save');
      }

      onSuccess();
      onOpenChange(false);
    } catch (err: any) {
      alert('Ошибка: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {text ? 'Редактировать' : 'Создать'} {TYPE_LABELS[type].toLowerCase()}
          </DialogTitle>
          <DialogDescription>
            Введите текст для {TYPE_LABELS[type].toLowerCase()}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title">Заголовок *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              maxLength={50}
              placeholder="Краткий заголовок (до 50 символов)"
            />
            <p className="text-sm text-muted-foreground mt-1">
              {title.length}/50 символов
            </p>
          </div>
          
          <div>
            <Label htmlFor="text">Текст *</Label>
            <Textarea
              id="text"
              value={textContent}
              onChange={(e) => setTextContent(e.target.value)}
              required
              rows={10}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Отмена
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Сохранение...' : text ? 'Сохранить' : 'Создать'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

