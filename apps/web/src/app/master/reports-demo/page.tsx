"use client";

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  FileText, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Users, 
  Calendar,
  Plus,
  Search,
  AlertCircle
} from 'lucide-react';

// Демо-данные для тестирования
const demoReports = [
  {
    id: '1',
    description: 'Великолепная игра в подземельях старого замка. Игроки столкнулись с древним драконом и смогли его победить благодаря отличной командной работе. Особенно отличился паладин, который смог защитить всю группу.',
    highlights: 'Эпическая битва с драконом, спасение принцессы',
    status: 'PENDING' as const,
    players: [
      { id: '1', name: 'Алексей Воин', email: 'alex@test.com' },
      { id: '2', name: 'Мария Маг', email: 'maria@test.com' },
      { id: '3', name: 'Петр Плут', email: 'petr@test.com' },
    ],
    createdAt: '2025-01-10T19:30:00Z',
  },
  {
    id: '2',
    description: 'Исследование таинственного леса привело к открытию древнего артефакта. Игроки проявили отличные навыки решения головоломок.',
    highlights: 'Найден артефакт силы',
    status: 'APPROVED' as const,
    players: [
      { id: '4', name: 'Анна Лучник', email: 'anna@test.com' },
      { id: '5', name: 'Иван Клерик', email: 'ivan@test.com' },
    ],
    createdAt: '2025-01-09T18:00:00Z',
  },
  {
    id: '3',
    description: 'Короткая игра в таверне с интригами и политическими заговорами.',
    highlights: null,
    status: 'REJECTED' as const,
    rejectionReason: 'Недостаточно подробное описание событий игры. Добавьте больше деталей о том, что происходило.',
    players: [
      { id: '6', name: 'Ольга Бард', email: 'olga@test.com' },
    ],
    createdAt: '2025-01-08T20:15:00Z',
  },
];

const demoPlayers = [
  { id: '1', name: 'Алексей Воин', email: 'alex@test.com' },
  { id: '2', name: 'Мария Маг', email: 'maria@test.com' },
  { id: '3', name: 'Петр Плут', email: 'petr@test.com' },
  { id: '4', name: 'Анна Лучник', email: 'anna@test.com' },
  { id: '5', name: 'Иван Клерик', email: 'ivan@test.com' },
  { id: '6', name: 'Ольга Бард', email: 'olga@test.com' },
];

export default function MasterReportsDemoPage() {
  const [reports, setReports] = useState(demoReports);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [description, setDescription] = useState('');
  const [highlights, setHighlights] = useState('');
  const [selectedPlayers, setSelectedPlayers] = useState<typeof demoPlayers>([]);
  const [playerSearch, setPlayerSearch] = useState('');
  const [showPlayerSearch, setShowPlayerSearch] = useState(false);

  // Фильтрация отчётов
  const filteredReports = reports.filter(report => {
    switch (activeTab) {
      case 'pending':
        return report.status === 'PENDING';
      case 'approved':
        return report.status === 'APPROVED';
      case 'rejected':
        return report.status === 'REJECTED';
      default:
        return true;
    }
  });

  // Поиск игроков
  const searchResults = demoPlayers.filter(player => 
    (player.name.toLowerCase().includes(playerSearch.toLowerCase()) ||
     player.email.toLowerCase().includes(playerSearch.toLowerCase())) &&
    !selectedPlayers.some(selected => selected.id === player.id)
  );

  // Получение информации о статусе
  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'PENDING':
        return { icon: Clock, color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200', text: 'На рассмотрении' };
      case 'APPROVED':
        return { icon: CheckCircle, color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200', text: 'Одобрен' };
      case 'REJECTED':
        return { icon: XCircle, color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200', text: 'Отклонён' };
      default:
        return { icon: Clock, color: 'bg-gray-100 text-gray-800', text: 'Неизвестно' };
    }
  };

  // Форматирование даты
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Создание отчёта (демо)
  const handleCreateReport = () => {
    if (description.length < 50 || selectedPlayers.length === 0) {
      alert('Заполните все обязательные поля');
      return;
    }

    const newReport = {
      id: String(reports.length + 1),
      description,
      highlights: highlights || null,
      status: 'PENDING' as const,
      players: selectedPlayers,
      createdAt: new Date().toISOString(),
    };

    setReports([newReport, ...reports]);
    setDescription('');
    setHighlights('');
    setSelectedPlayers([]);
    setShowCreateForm(false);
    alert('Отчёт успешно создан!');
  };

  if (showCreateForm) {
    return (
      <div className="min-h-screen bg-background p-4">
        <Card className="w-full max-w-4xl mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Создать отчёт о игре (ДЕМО)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Описание игры */}
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Описание игры <span className="text-red-500">*</span>
                </label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Подробно опишите что происходило в игре, какие события были важными..."
                  rows={6}
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
                  <span>{description.length}/5000</span>
                </div>
              </div>

              {/* Дополнительные моменты */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Дополнительные моменты</label>
                <Textarea
                  value={highlights}
                  onChange={(e) => setHighlights(e.target.value)}
                  placeholder="Особые достижения игроков, интересные решения..."
                  rows={3}
                />
              </div>

              {/* Выбор игроков */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">
                    Участники игры <span className="text-red-500">*</span>
                  </label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowPlayerSearch(!showPlayerSearch)}
                  >
                    <Search className="h-4 w-4 mr-2" />
                    Добавить игрока
                  </Button>
                </div>

                {showPlayerSearch && (
                  <div className="border rounded-lg p-4 space-y-3">
                    <Input
                      placeholder="Поиск игроков по имени или email..."
                      value={playerSearch}
                      onChange={(e) => setPlayerSearch(e.target.value)}
                    />
                    
                    {searchResults.length > 0 && (
                      <div className="space-y-2 max-h-40 overflow-y-auto">
                        {searchResults.map((player) => (
                          <div
                            key={player.id}
                            className="flex items-center justify-between p-2 border rounded cursor-pointer hover:bg-muted"
                            onClick={() => {
                              setSelectedPlayers([...selectedPlayers, player]);
                              setPlayerSearch('');
                              setShowPlayerSearch(false);
                            }}
                          >
                            <div>
                              <p className="font-medium">{player.name}</p>
                              <p className="text-sm text-muted-foreground">{player.email}</p>
                            </div>
                            <Button size="sm" variant="outline">
                              Добавить
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {selectedPlayers.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Выбранные игроки ({selectedPlayers.length}):</p>
                    <div className="flex flex-wrap gap-2">
                      {selectedPlayers.map((player) => (
                        <Badge
                          key={player.id}
                          variant="secondary"
                          className="flex items-center gap-2"
                        >
                          <span>{player.name}</span>
                          <button
                            onClick={() => setSelectedPlayers(selectedPlayers.filter(p => p.id !== player.id))}
                            className="ml-1 hover:bg-destructive hover:text-destructive-foreground rounded"
                          >
                            ×
                          </button>
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Кнопки */}
              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => setShowCreateForm(false)}
                >
                  Отмена
                </Button>
                <Button
                  onClick={handleCreateReport}
                  disabled={description.length < 50 || selectedPlayers.length === 0}
                >
                  Создать отчёт
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card shadow-sm border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-xl font-semibold text-foreground flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Отчёты о играх (ДЕМО)
            </h1>
            <Button onClick={() => setShowCreateForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Создать отчёт
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="all">
              Все ({reports.length})
            </TabsTrigger>
            <TabsTrigger value="pending">
              На рассмотрении ({reports.filter(r => r.status === 'PENDING').length})
            </TabsTrigger>
            <TabsTrigger value="approved">
              Одобрены ({reports.filter(r => r.status === 'APPROVED').length})
            </TabsTrigger>
            <TabsTrigger value="rejected">
              Отклонены ({reports.filter(r => r.status === 'REJECTED').length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="space-y-4">
            {filteredReports.map((report) => {
              const statusInfo = getStatusInfo(report.status);
              const StatusIcon = statusInfo.icon;

              return (
                <Card key={report.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Badge className={`${statusInfo.color} flex items-center gap-1`}>
                            <StatusIcon className="h-3 w-3" />
                            {statusInfo.text}
                          </Badge>
                          <span className="text-sm text-muted-foreground flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {formatDate(report.createdAt)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Users className="h-4 w-4" />
                          {report.players.length} игрок{report.players.length === 1 ? '' : report.players.length < 5 ? 'а' : 'ов'}
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent>
                    <div className="space-y-4">
                      {/* Описание */}
                      <div>
                        <p className="text-foreground line-clamp-3">
                          {report.description}
                        </p>
                      </div>

                      {/* Дополнительные моменты */}
                      {report.highlights && (
                        <div className="border-l-2 border-muted pl-4">
                          <p className="text-sm text-muted-foreground font-medium mb-1">
                            Дополнительные моменты:
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {report.highlights}
                          </p>
                        </div>
                      )}

                      {/* Игроки */}
                      <div>
                        <p className="text-sm font-medium mb-2">Участники:</p>
                        <div className="flex flex-wrap gap-1">
                          {report.players.map((player) => (
                            <Badge key={player.id} variant="outline" className="text-xs">
                              {player.name}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      {/* Причина отклонения */}
                      {report.status === 'REJECTED' && 'rejectionReason' in report && (
                        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                          <p className="text-sm font-medium text-red-800 dark:text-red-200 mb-1">
                            Причина отклонения:
                          </p>
                          <p className="text-sm text-red-700 dark:text-red-300">
                            {report.rejectionReason}
                          </p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
