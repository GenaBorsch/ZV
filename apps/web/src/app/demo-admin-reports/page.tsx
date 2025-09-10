"use client";

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  FileText, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Users, 
  Calendar,
  User,
  Mail
} from 'lucide-react';

// Демо-данные для админ-панели
const initialReports = [
  {
    id: '4',
    description: 'Увлекательное приключение в заброшенной крепости. Группа героев исследовала древние подземелья, сражалась с нежитью и разгадывала головоломки. В финале удалось найти легендарный артефакт и спасти пленников.',
    highlights: 'Отличная командная работа, особенно впечатлила тактика воина при защите группы',
    status: 'PENDING' as const,
    masterName: 'Дмитрий Мастер',
    masterEmail: 'master@test.com',
    players: [
      { id: '1', name: 'Алексей Воин', email: 'alex@test.com' },
      { id: '2', name: 'Мария Маг', email: 'maria@test.com' },
    ],
    createdAt: '2025-09-10T13:12:00Z',
  },
  {
    id: '1',
    description: 'Великолепная игра в подземельях старого замка. Игроки столкнулись с древним драконом и смогли его победить благодаря отличной командной работе. Особенно отличился паладин, который смог защитить всю группу.',
    highlights: 'Эпическая битва с драконом, спасение принцессы',
    status: 'PENDING' as const,
    masterName: 'Дмитрий Мастер',
    masterEmail: 'master@test.com',
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
    masterName: 'Анна Мастер',
    masterEmail: 'anna.master@test.com',
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
    masterName: 'Петр Мастер',
    masterEmail: 'petr.master@test.com',
    players: [
      { id: '6', name: 'Ольга Бард', email: 'olga@test.com' },
    ],
    createdAt: '2025-01-08T20:15:00Z',
  },
];

export default function DemoAdminReportsPage() {
  const [reports, setReports] = useState(initialReports);
  const [activeTab, setActiveTab] = useState('pending');
  const [selectedReport, setSelectedReport] = useState<typeof initialReports[0] | null>(null);
  const [showModerationModal, setShowModerationModal] = useState(false);
  const [moderationAction, setModerationAction] = useState<'approve' | 'reject' | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

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

  // Открыть модерацию
  const openModeration = (report: typeof initialReports[0], action: 'approve' | 'reject') => {
    setSelectedReport(report);
    setModerationAction(action);
    setShowModerationModal(true);
    setRejectionReason('');
  };

  // Подтвердить модерацию
  const confirmModeration = () => {
    if (!selectedReport || !moderationAction) return;
    
    if (moderationAction === 'reject' && !rejectionReason.trim()) {
      alert('Укажите причину отклонения');
      return;
    }

    const newStatus = moderationAction === 'approve' ? 'APPROVED' : 'REJECTED';
    
    setReports(prev => prev.map(report => 
      report.id === selectedReport.id 
        ? { ...report, status: newStatus, rejectionReason: moderationAction === 'reject' ? rejectionReason : undefined }
        : report
    ));

    setShowModerationModal(false);
    setSelectedReport(null);
    setModerationAction(null);
    setRejectionReason('');
    
    alert(`Отчёт ${moderationAction === 'approve' ? 'одобрен' : 'отклонён'}!`);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card shadow-sm border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-xl font-semibold text-foreground flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Модерация отчётов (ДЕМО)
            </h1>
            <Badge variant="outline" className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              Ожидают: {reports.filter(r => r.status === 'PENDING').length}
            </Badge>
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
              const canModerate = report.status === 'PENDING';

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
                        
                        {/* Информация о мастере */}
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {report.masterName}
                          </div>
                          <div className="flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {report.masterEmail}
                          </div>
                          <div className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {report.players.length} игрок{report.players.length === 1 ? '' : report.players.length < 5 ? 'а' : 'ов'}
                          </div>
                        </div>
                      </div>
                      
                      {/* Действия */}
                      {canModerate && (
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openModeration(report, 'approve')}
                            className="text-green-600 border-green-200 hover:bg-green-50"
                          >
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Одобрить
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openModeration(report, 'reject')}
                            className="text-red-600 border-red-200 hover:bg-red-50"
                          >
                            <XCircle className="h-3 w-3 mr-1" />
                            Отклонить
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardHeader>
                  
                  <CardContent>
                    <div className="space-y-4">
                      {/* Описание */}
                      <div>
                        <h4 className="text-sm font-medium mb-2">Описание игры:</h4>
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                          {report.description}
                        </p>
                      </div>

                      {/* Дополнительные моменты */}
                      {report.highlights && (
                        <div className="border-l-2 border-muted pl-4">
                          <h4 className="text-sm font-medium mb-2">Дополнительные моменты:</h4>
                          <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                            {report.highlights}
                          </p>
                        </div>
                      )}

                      {/* Игроки */}
                      <div>
                        <h4 className="text-sm font-medium mb-2">Участники ({report.players.length}):</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                          {report.players.map((player) => (
                            <div key={player.id} className="flex items-center gap-2 p-2 bg-muted rounded text-sm">
                              <User className="h-3 w-3 text-muted-foreground" />
                              <div>
                                <p className="font-medium">{player.name}</p>
                                <p className="text-xs text-muted-foreground">{player.email}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Причина отклонения */}
                      {report.status === 'REJECTED' && 'rejectionReason' in report && (
                        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                          <h4 className="text-sm font-medium text-red-800 dark:text-red-200 mb-1">
                            Причина отклонения:
                          </h4>
                          <p className="text-sm text-red-700 dark:text-red-300 whitespace-pre-wrap">
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

      {/* Модальное окно модерации */}
      {showModerationModal && selectedReport && moderationAction && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {moderationAction === 'approve' ? (
                  <>
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    Одобрить отчёт
                  </>
                ) : (
                  <>
                    <XCircle className="h-5 w-5 text-red-600" />
                    Отклонить отчёт
                  </>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-muted p-4 rounded-lg">
                <h4 className="font-medium mb-2">Отчёт от {selectedReport.masterName}</h4>
                <p className="text-sm text-muted-foreground line-clamp-3">
                  {selectedReport.description}
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  Участников: {selectedReport.players.length}
                </p>
              </div>

              {moderationAction === 'approve' ? (
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                  <p className="text-sm text-green-800 dark:text-green-200">
                    При одобрении отчёта у каждого участника будет списана 1 игра из активного баттлпасса.
                    Если у игрока нет доступных игр, списание не произойдёт, но отчёт всё равно будет одобрен.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Причина отклонения <span className="text-red-500">*</span>
                  </label>
                  <Textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Укажите подробную причину отклонения отчёта..."
                    rows={4}
                  />
                  <p className="text-sm text-muted-foreground">
                    Мастер получит уведомление с указанной причиной и сможет исправить отчёт.
                  </p>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowModerationModal(false);
                    setSelectedReport(null);
                    setRejectionReason('');
                    setModerationAction(null);
                  }}
                >
                  Отмена
                </Button>
                <Button
                  onClick={confirmModeration}
                  disabled={moderationAction === 'reject' && !rejectionReason.trim()}
                  className={moderationAction === 'approve' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}
                >
                  {moderationAction === 'approve' ? 'Одобрить' : 'Отклонить'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
