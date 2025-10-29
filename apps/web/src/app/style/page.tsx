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
              <h1 className="text-base md:text-xl font-semibold text-foreground">
                Гид по стилям компонентов
              </h1>
            </div>
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
              <div className="space-y-6">
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
                
                <div>
                  <h4 className="text-sm font-medium mb-3 text-muted-foreground">Красные кнопки (btn-primary) для центральной панели</h4>
                  <div className="space-y-3">
                    <div className="flex flex-wrap gap-2">
                      <a href="#" className="btn-primary" onClick={(e) => e.preventDefault()}>
                        🔍 Найти группу
                      </a>
                      <a href="#" className="btn-primary" onClick={(e) => e.preventDefault()}>
                        Купить путёвки
                      </a>
                      <button className="btn-primary">
                        Создать персонажа
                      </button>
                    </div>
                    <div className="text-sm text-muted-foreground space-y-1">
                      <p>• <strong>Класс:</strong> <code className="bg-accent px-1 rounded">btn-primary</code></p>
                      <p>• <strong>Цвет:</strong> Красный фон (bg-primary) с белым текстом (text-primary-foreground)</p>
                      <p>• <strong>Hover:</strong> Затемнение фона (hover:bg-primary/90) с сохранением белого текста (hover:text-primary-foreground)</p>
                      <p>• <strong>Важно:</strong> При наведении текст всегда остается белым, зеленый текст - это ошибка!</p>
                    </div>
                  </div>
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
            <CardContent>
              <div className="space-y-6">
                <div>
                  <h4 className="text-sm font-medium mb-3">Красные кнопки-вкладки с белым текстом</h4>
                  <Tabs defaultValue="tab1" className="w-full">
                    <TabsList className="grid w-full grid-cols-3">
                      <TabsTrigger value="tab1">Предыстория</TabsTrigger>
                      <TabsTrigger value="tab2">Журнал</TabsTrigger>
                      <TabsTrigger value="tab3">Заметки</TabsTrigger>
                    </TabsList>
                    <TabsContent value="tab1" className="p-6 border border-border rounded-md mt-4">
                      <div className="space-y-2">
                        <h5 className="font-medium text-foreground">Предыстория персонажа</h5>
                        <p className="text-muted-foreground">
                          Наследник престола Гондора, скрывающийся под именем Бродяжника. 
                          Долгие годы защищал границы от тьмы, ожидая своего часа.
                        </p>
                      </div>
                    </TabsContent>
                    <TabsContent value="tab2" className="p-6 border border-border rounded-md mt-4">
                      <div className="space-y-2">
                        <h5 className="font-medium text-foreground">Журнал приключений</h5>
                        <p className="text-muted-foreground">
                          День 1: Встретил хоббитов в Пригожине. Странная компания...
                          <br />
                          День 15: Битва при Хельмовой Пади. Мы победили, но какой ценой.
                        </p>
                      </div>
                    </TabsContent>
                    <TabsContent value="tab3" className="p-6 border border-border rounded-md mt-4">
                      <div className="space-y-2">
                        <h5 className="font-medium text-foreground">Заметки</h5>
                        <p className="text-muted-foreground">
                          Владеет мечом Андурил. Имеет особую связь с эльфами.
                        </p>
                      </div>
                    </TabsContent>
                  </Tabs>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium mb-3">Пример использования в карточке персонажа</h4>
                  <div className="text-sm text-muted-foreground">
                    Такие же вкладки используются в модальном окне деталей персонажа для навигации 
                    между разделами: предыстория, журнал, заметки и ссылки.
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Карточки персонажей */}
          <Card>
            <CardHeader>
              <CardTitle>Карточки персонажей</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                <CharacterCard
                  character={exampleCharacter}
                  onEdit={() => console.log('Edit character')}
                  onView={setSelectedCharacter}
                  showActions={true}
                />
                <CharacterCard
                  character={deadCharacter}
                  onEdit={() => console.log('Edit character')}
                  onView={setSelectedCharacter}
                  showActions={true}
                />
                <CharacterCard
                  character={{ ...exampleCharacter, id: 'compact-example', name: 'Компактная карточка' }}
                  onView={setSelectedCharacter}
                  compact={true}
                  showActions={false}
                />
                <CharacterCard
                  character={{ 
                    ...exampleCharacter, 
                    id: 'long-name-example', 
                    name: 'Персонаж с очень длинным именем который должен поместиться',
                    archetype: 'Архетип с длинным названием для тестирования',
                    backstory: 'Очень длинная предыстория персонажа, которая должна корректно обрезаться и не ломать верстку карточки. Здесь много текста, чтобы проверить, как работает line-clamp.'
                  }}
                  onEdit={() => console.log('Edit character')}
                  onView={setSelectedCharacter}
                  showActions={true}
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
              <div className="space-y-6">
                <div>
                  <h4 className="text-sm font-medium mb-3 text-muted-foreground">Шрифты системы</h4>
                  <div className="space-y-2 text-sm">
                    <p><strong>Заголовки:</strong> Balkara Condensed (современная интерпретация средневековых форм)</p>
                    <p><strong>Основной текст:</strong> Truetypewriter (моноширинный шрифт в стиле пишущей машинки)</p>
                  </div>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium mb-3 text-muted-foreground">Заголовки (Balkara Condensed)</h4>
                  <div className="space-y-2">
                    <h1 className="text-4xl font-bold text-foreground">ЗАГОЛОВОК H1 - BALKARA CONDENSED</h1>
                    <h2 className="text-3xl font-semibold text-foreground">ЗАГОЛОВОК H2 - BALKARA CONDENSED</h2>
                    <h3 className="text-2xl font-medium text-foreground">ЗАГОЛОВОК H3 - BALKARA CONDENSED</h3>
                    <h4 className="text-xl font-medium text-foreground">ЗАГОЛОВОК H4 - BALKARA CONDENSED</h4>
                  </div>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium mb-3 text-muted-foreground">Основной текст (Truetypewriter)</h4>
                  <div className="space-y-2">
                    <p className="text-foreground">
                      Это обычный текст, набранный шрифтом Truetypewriter. 
                      Он имитирует текст, напечатанный на пишущей машинке, 
                      что придает особую атмосферу и стиль тексту.
                    </p>
                    <p className="text-muted-foreground">
                      Приглушенный текст для второстепенной информации. 
                      Моноширинные шрифты хорошо подходят для создания 
                      ретро-атмосферы и улучшения читаемости.
                    </p>
                  </div>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium mb-3 text-muted-foreground">Пример комбинации</h4>
                  <div className="p-4 border border-border rounded-lg">
                    <h3 className="text-xl font-medium text-foreground mb-2">ЗАГОЛОВОК СТАТЬИ</h3>
                    <p className="text-foreground leading-relaxed">
                      В мире настольных ролевых игр каждый персонаж имеет свою уникальную 
                      историю. Система "Звёздное Веретено" позволяет игрокам создавать 
                      глубоких и проработанных героев с богатой предысторией.
                    </p>
                  </div>
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
                <div className="flex flex-wrap gap-3">
                  <span className="status-badge px-3 py-2 rounded-full font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                    Активный
                  </span>
                  <span className="status-badge px-3 py-2 rounded-full font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                    Ожидание
                  </span>
                  <span className="status-badge px-3 py-2 rounded-full font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                    Неактивный
                  </span>
                  <span className="status-badge px-3 py-2 rounded-full font-medium bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200">
                    Нейтральный
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Hover эффекты */}
          <Card>
            <CardHeader>
              <CardTitle>Hover эффекты</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <h4 className="text-sm font-medium mb-3 text-muted-foreground">Правильные hover эффекты</h4>
                  <div className="space-y-3">
                    <div className="p-4 border rounded-lg hover:bg-accent hover:text-accent-foreground cursor-pointer transition-colors">
                      <h5 className="font-medium">Правильный hover эффект</h5>
                      <p className="text-sm text-muted-foreground hover:text-accent-foreground/70 mt-1">
                        Используйте hover:bg-accent + hover:text-accent-foreground для хорошей контрастности
                      </p>
                    </div>
                    
                    <div className="p-4 border rounded-lg hover:bg-primary hover:text-primary-foreground cursor-pointer transition-colors">
                      <h5 className="font-medium">Альтернативный hover эффект</h5>
                      <p className="text-sm text-muted-foreground hover:text-primary-foreground/70 mt-1">
                        Или hover:bg-primary + hover:text-primary-foreground для более яркого эффекта
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium mb-3 text-muted-foreground">Неправильные hover эффекты (НЕ ИСПОЛЬЗУЙТЕ)</h4>
                  <div className="space-y-3">
                    <div className="p-4 border rounded-lg hover:bg-muted cursor-pointer transition-colors">
                      <h5 className="font-medium">Неправильный hover эффект</h5>
                      <p className="text-sm text-muted-foreground mt-1">
                        ❌ hover:bg-muted создает серый текст на сером фоне - плохая читаемость!
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium mb-3 text-muted-foreground">Примеры для боковой панели</h4>
                  <div className="space-y-2 border rounded-lg p-4 bg-card">
                    <a 
                      href="#"
                      className="block w-full text-left px-3 py-3 text-base text-foreground hover:bg-accent hover:text-accent-foreground rounded-md transition-colors"
                      onClick={(e) => e.preventDefault()}
                    >
                      🔍 Найти группу
                    </a>
                    <a 
                      href="#"
                      className="block w-full text-left px-3 py-3 text-base text-foreground hover:bg-accent hover:text-accent-foreground rounded-md transition-colors"
                      onClick={(e) => e.preventDefault()}
                    >
                      Купить путёвки
                    </a>
                    <button 
                      className="w-full text-left px-3 py-3 text-base text-foreground hover:bg-accent hover:text-accent-foreground rounded-md transition-colors"
                      onClick={(e) => e.preventDefault()}
                    >
                      Создать персонажа
                    </button>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium mb-3 text-muted-foreground">Рекомендации</h4>
                  <div className="text-sm space-y-2 text-muted-foreground">
                    <p>• <strong>Для интерактивных элементов боковой панели:</strong> используйте <code className="bg-accent px-1 rounded">hover:bg-accent hover:text-accent-foreground transition-colors</code></p>
                    <p>• <strong>Для кнопок и важных элементов:</strong> используйте hover:bg-primary + hover:text-primary-foreground</p>
                    <p>• <strong>Для второстепенного текста:</strong> добавляйте /70 или /60 для полупрозрачности</p>
                    <p>• <strong>Всегда добавляйте:</strong> transition-colors для плавной анимации</p>
                    <p>• <strong>Избегайте:</strong> hover:bg-accent без hover:text-accent-foreground (теряется контраст)</p>
                  </div>
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
