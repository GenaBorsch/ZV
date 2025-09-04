"use client";

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CharacterCard } from '@/components/CharacterCard';
import { CharacterForm } from '@/components/CharacterForm';
import { CharacterDetails } from '@/components/CharacterDetails';
import { CharacterDtoType } from '@zv/contracts';

// Пример данных персонажа для демонстрации
const exampleCharacter: CharacterDtoType = {
  id: 'example-id',
  playerId: 'player-id',
  name: 'Арагорн',
  archetype: 'Следопыт',
  level: 15,
  avatarUrl: 'https://images.unsplash.com/photo-1566492031773-4f4e44671d66?w=150&h=150&fit=crop&crop=face',
  backstory: 'Наследник престола Гондора, скрывающийся под именем Бродяжника. Долгие годы защищал границы от тьмы, ожидая своего часа.',
  journal: 'День 1: Встретил хоббитов в Пригожине. Странная компания...\nДень 15: Битва при Хельмовой Пади. Мы победили, но какой ценой.',
  isAlive: true,
  deathDate: null,
  notes: 'Владеет мечом Андурил. Имеет особую связь с эльфами.',
  sheetUrl: 'https://example.com/character-sheet',
  updatedBy: null,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const deadCharacter: CharacterDtoType = {
  ...exampleCharacter,
  id: 'dead-example-id',
  name: 'Боромир',
  archetype: 'Воин',
  level: 12,
  isAlive: false,
  deathDate: '25.02.019',
  backstory: 'Сын правителя Гондора, благородный воин, павший в бою защищая хоббитов.',
  avatarUrl: null,
};

export default function StylePage() {
  const [showCharacterForm, setShowCharacterForm] = useState(false);
  const [selectedCharacter, setSelectedCharacter] = useState<CharacterDtoType | null>(null);
  const [switchValue, setSwitchValue] = useState(true);
  const [selectValue, setSelectValue] = useState('');

  const handleCharacterSubmit = async (data: any) => {
    console.log('Character form submitted:', data);
    setShowCharacterForm(false);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card shadow-sm border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <h1 className="text-xl font-semibold text-foreground">
                Гид по стилям компонентов
              </h1>
            </div>
            <nav className="flex space-x-4">
              <a href="/" className="text-muted-foreground hover:text-foreground">
                На главную
              </a>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="space-y-8">
          {/* Описание */}
          <Card>
            <CardHeader>
              <CardTitle>О странице стилей</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Эта страница демонстрирует все UI компоненты, используемые в системе "Звёздное Веретено". 
                Здесь можно увидеть, как выглядят и работают различные элементы интерфейса.
              </p>
            </CardContent>
          </Card>

          {/* Цветовая палитра */}
          <Card>
            <CardHeader>
              <CardTitle>Цветовая палитра</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <div className="w-full h-16 bg-background border border-border rounded"></div>
                  <p className="text-xs text-center">Background</p>
                </div>
                <div className="space-y-2">
                  <div className="w-full h-16 bg-foreground rounded"></div>
                  <p className="text-xs text-center">Foreground</p>
                </div>
                <div className="space-y-2">
                  <div className="w-full h-16 bg-card border border-border rounded"></div>
                  <p className="text-xs text-center">Card</p>
                </div>
                <div className="space-y-2">
                  <div className="w-full h-16 bg-primary rounded"></div>
                  <p className="text-xs text-center text-primary-foreground">Primary</p>
                </div>
                <div className="space-y-2">
                  <div className="w-full h-16 bg-muted rounded"></div>
                  <p className="text-xs text-center">Muted</p>
                </div>
                <div className="space-y-2">
                  <div className="w-full h-16 bg-accent rounded"></div>
                  <p className="text-xs text-center">Accent</p>
                </div>
                <div className="space-y-2">
                  <div className="w-full h-16 bg-destructive rounded"></div>
                  <p className="text-xs text-center text-destructive-foreground">Destructive</p>
                </div>
                <div className="space-y-2">
                  <div className="w-full h-16 border border-border rounded"></div>
                  <p className="text-xs text-center">Border</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Кнопки */}
          <Card>
            <CardHeader>
              <CardTitle>Кнопки</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  <Button>Primary Button</Button>
                  <Button variant="outline">Outline Button</Button>
                  <Button variant="secondary">Secondary Button</Button>
                  <Button variant="ghost">Ghost Button</Button>
                  <Button variant="link">Link Button</Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button size="sm">Small</Button>
                  <Button size="default">Default</Button>
                  <Button size="lg">Large</Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button disabled>Disabled</Button>
                  <Button variant="outline" disabled>Disabled Outline</Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Формы */}
          <Card>
            <CardHeader>
              <CardTitle>Элементы форм</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="example-input">Текстовое поле</Label>
                    <Input id="example-input" placeholder="Введите текст..." />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="example-select">Выпадающий список</Label>
                    <Select value={selectValue} onValueChange={setSelectValue}>
                      <SelectTrigger>
                        <SelectValue placeholder="Выберите опцию" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="option1">Опция 1</SelectItem>
                        <SelectItem value="option2">Опция 2</SelectItem>
                        <SelectItem value="option3">Опция 3</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="example-textarea">Многострочное поле</Label>
                  <Textarea id="example-textarea" placeholder="Введите многострочный текст..." rows={3} />
                </div>
                <div className="flex items-center space-x-2">
                  <Switch id="example-switch" checked={switchValue} onCheckedChange={setSwitchValue} />
                  <Label htmlFor="example-switch">Переключатель</Label>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Вкладки */}
          <Card>
            <CardHeader>
              <CardTitle>Вкладки</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Tabs defaultValue="tab1" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="tab1">Вкладка 1</TabsTrigger>
                  <TabsTrigger value="tab2">Вкладка 2</TabsTrigger>
                  <TabsTrigger value="tab3">Вкладка 3</TabsTrigger>
                </TabsList>
                <TabsContent value="tab1" className="p-6">
                  <p className="text-muted-foreground">Содержимое первой вкладки</p>
                </TabsContent>
                <TabsContent value="tab2" className="p-6">
                  <p className="text-muted-foreground">Содержимое второй вкладки</p>
                </TabsContent>
                <TabsContent value="tab3" className="p-6">
                  <p className="text-muted-foreground">Содержимое третьей вкладки</p>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Карточки персонажей */}
          <Card>
            <CardHeader>
              <CardTitle>Карточки персонажей</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <CharacterCard
                  character={exampleCharacter}
                  onEdit={() => console.log('Edit character')}
                  onDelete={() => console.log('Delete character')}
                  onView={setSelectedCharacter}
                  showActions={true}
                />
                <CharacterCard
                  character={deadCharacter}
                  onView={setSelectedCharacter}
                  showActions={false}
                />
                <CharacterCard
                  character={{ ...exampleCharacter, id: 'compact-example', name: 'Компактная карточка' }}
                  onView={setSelectedCharacter}
                  compact={true}
                  showActions={false}
                />
              </div>
            </CardContent>
          </Card>

          {/* Кнопки для демонстрации модальных окон */}
          <Card>
            <CardHeader>
              <CardTitle>Модальные окна</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                <Button onClick={() => setShowCharacterForm(true)}>
                  Показать форму персонажа
                </Button>
                <Button onClick={() => setSelectedCharacter(exampleCharacter)}>
                  Показать детали персонажа
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Типографика */}
          <Card>
            <CardHeader>
              <CardTitle>Типографика</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h1 className="text-4xl font-bold text-foreground">Заголовок H1</h1>
                  <h2 className="text-3xl font-semibold text-foreground">Заголовок H2</h2>
                  <h3 className="text-2xl font-medium text-foreground">Заголовок H3</h3>
                  <h4 className="text-xl font-medium text-foreground">Заголовок H4</h4>
                </div>
                <div>
                  <p className="text-foreground">Обычный текст с нормальным весом.</p>
                  <p className="text-muted-foreground">Приглушенный текст для второстепенной информации.</p>
                  <p className="text-sm text-muted-foreground">Мелкий текст для подписей и примечаний.</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Статусы и индикаторы */}
          <Card>
            <CardHeader>
              <CardTitle>Статусы и индикаторы</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                    Активный
                  </span>
                  <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                    Ожидание
                  </span>
                  <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                    Неактивный
                  </span>
                  <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200">
                    Нейтральный
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Character Form Modal */}
      {showCharacterForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-background rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <CharacterForm
                onSubmit={handleCharacterSubmit}
                onCancel={() => setShowCharacterForm(false)}
                title="Пример формы персонажа"
              />
            </div>
          </div>
        </div>
      )}

      {/* Character Details Modal */}
      {selectedCharacter && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-background rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <CharacterDetails
                character={selectedCharacter}
                onClose={() => setSelectedCharacter(null)}
                showActions={false}
                isOwner={false}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
