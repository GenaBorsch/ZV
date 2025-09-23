"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  FileText, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Users, 
  Calendar,
  Eye,
  AlertCircle,
  RotateCcw,
  User,
  Mail
} from 'lucide-react';
import { ModerateReportDtoType } from '@zv/contracts';

interface ReportWithPlayers {
  id: string;
  sessionId: string | null;
  masterId: string;
  masterName: string;
  masterEmail: string;
  description: string;
  highlights: string | null;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
  rejectionReason: string | null;
  players: Array<{
    id: string;
    name: string;
    email: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

export function AdminReportsContent() {
  const [reports, setReports] = useState<ReportWithPlayers[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pending');
  const [selectedReport, setSelectedReport] = useState<ReportWithPlayers | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showModerationForm, setShowModerationForm] = useState(false);
  const [moderationAction, setModerationAction] = useState<'approve' | 'reject' | null>(null);

  // Загрузка отчётов
  const loadReports = async () => {
    try {
      const response = await fetch('/api/reports');
      if (response.ok) {
        const data = await response.json();
        setReports(data.reports);
      } else {
        console.error('Failed to load reports');
      }
    } catch (error) {
      console.error('Error loading reports:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, []);

  // Модерация отчёта
  const handleModeration = async (reportId: string, action: 'approve' | 'reject', reason?: string) => {
    setIsSubmitting(true);
    try {
      const data: ModerateReportDtoType = {
        action,
        rejectionReason: action === 'reject' ? reason : undefined,
      };

      const response = await fetch(`/api/reports/${reportId}?action=moderate`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        await loadReports(); // Перезагружаем список
        setShowModerationForm(false);
        setSelectedReport(null);
        setRejectionReason('');
        setModerationAction(null);
      } else {
        const error = await response.json();
        console.error('Failed to moderate report:', error);
        alert('Ошибка при модерации отчёта: ' + (error.error || 'Неизвестная ошибка'));
      }
    } catch (error) {
      console.error('Error moderating report:', error);
      alert('Ошибка при модерации отчёта');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Отмена одобренного отчёта (только SUPERADMIN)
  const handleCancelReport = async (reportId: string) => {
    if (!confirm('Вы уверены, что хотите отменить одобрение отчёта? Это вернёт игры в путёвки игроков.')) {
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/reports/${reportId}?action=cancel`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      if (response.ok) {
        await loadReports();
        alert('Отчёт успешно отменён');
      } else {
        const error = await response.json();
        console.error('Failed to cancel report:', error);
        alert('Ошибка при отмене отчёта: ' + (error.error || 'Неизвестная ошибка'));
      }
    } catch (error) {
      console.error('Error cancelling report:', error);
      alert('Ошибка при отмене отчёта');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Открыть форму модерации
  const openModerationForm = (report: ReportWithPlayers, action: 'approve' | 'reject') => {
    setSelectedReport(report);
    setModerationAction(action);
    setShowModerationForm(true);
    if (action === 'approve') {
      setRejectionReason('');
    }
  };

  // Подтвердить модерацию
  const confirmModeration = () => {
    if (!selectedReport || !moderationAction) return;
    
    if (moderationAction === 'reject' && !rejectionReason.trim()) {
      alert('Укажите причину отклонения');
      return;
    }

    handleModeration(selectedReport.id, moderationAction, rejectionReason.trim());
  };

  // Фильтрация отчётов по статусу
  const filteredReports = reports.filter(report => {
    switch (activeTab) {
      case 'pending':
        return report.status === 'PENDING';
      case 'approved':
        return report.status === 'APPROVED';
      case 'rejected':
        return report.status === 'REJECTED';
      case 'cancelled':
        return report.status === 'CANCELLED';
      default:
        return true;
    }
  });

  // Получение иконки и цвета статуса
  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'PENDING':
        return { icon: Clock, color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200', text: 'На рассмотрении' };
      case 'APPROVED':
        return { icon: CheckCircle, color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200', text: 'Одобрен' };
      case 'REJECTED':
        return { icon: XCircle, color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200', text: 'Отклонён' };
      case 'CANCELLED':
        return { icon: AlertCircle, color: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200', text: 'Отменён' };
      default:
        return { icon: Clock, color: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200', text: 'Неизвестно' };
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

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card shadow-sm border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <h1 className="text-xl font-semibold text-foreground flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Модерация отчётов
              </h1>
            </div>
            <div className="flex items-center gap-2">
                <Badge variant="outline" className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                Ожидают: {reports.filter(r => r.status === 'PENDING').length}
              </Badge>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <p className="text-muted-foreground">Загрузка отчётов...</p>
          </div>
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-5">
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
              <TabsTrigger value="cancelled">
                Отменены ({reports.filter(r => r.status === 'CANCELLED').length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="space-y-4">
              {filteredReports.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium text-foreground mb-2">Нет отчётов</h3>
                    <p className="text-muted-foreground text-center">
                      {activeTab === 'all' 
                        ? 'В системе пока нет отчётов'
                        : `Нет отчётов со статусом "${getStatusInfo(activeTab.toUpperCase()).text}"`
                      }
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4">
                  {filteredReports.map((report) => {
                    const statusInfo = getStatusInfo(report.status);
                    const StatusIcon = statusInfo.icon;
                    const canModerate = report.status === 'PENDING';
                    const canCancel = report.status === 'APPROVED'; // Только SUPERADMIN в реальности

                    return (
                      <Card key={report.id} className="hover:shadow-md transition-shadow">
                        <CardHeader>
                          <div className="flex items-start justify-between">
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <Badge className={`${statusInfo.color} flex items-center gap-1`}>
                                  <StatusIcon className="h-4 w-4" />
                                  {statusInfo.text}
                                </Badge>
                                <span className="text-base text-muted-foreground flex items-center gap-1">
                                  <Calendar className="h-4 w-4" />
                                  {formatDate(report.createdAt)}
                                </span>
                              </div>
                              
                              {/* Информация о мастере */}
                              <div className="flex items-center gap-4 text-base text-muted-foreground">
                                <div className="flex items-center gap-1">
                                  <User className="h-4 w-4" />
                                  {report.masterName || 'Без имени'}
                                </div>
                                <div className="flex items-center gap-1">
                                  <Mail className="h-4 w-4" />
                                  {report.masterEmail}
                                </div>
                                <div className="flex items-center gap-1">
                                  <Users className="h-4 w-4" />
                                  {report.players.length} игрок{report.players.length === 1 ? '' : report.players.length < 5 ? 'а' : 'ов'}
                                </div>
                              </div>
                            </div>
                            
                            {/* Действия */}
                            <div className="flex gap-2">
                              {canModerate && (
                                <>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => openModerationForm(report, 'approve')}
                                    className="flex items-center gap-1"
                                    disabled={isSubmitting}
                                  >
                                    <CheckCircle className="h-4 w-4" />
                                    Одобрить
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => openModerationForm(report, 'reject')}
                                    className="flex items-center gap-1"
                                    disabled={isSubmitting}
                                  >
                                    <XCircle className="h-4 w-4" />
                                    Отклонить
                                  </Button>
                                </>
                              )}
                              {canCancel && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleCancelReport(report.id)}
                                  className="flex items-center gap-1"
                                  disabled={isSubmitting}
                                >
                                  <RotateCcw className="h-4 w-4" />
                                  Отменить
                                </Button>
                              )}
                            </div>
                          </div>
                        </CardHeader>
                        
                        <CardContent>
                          <div className="space-y-4">
                            {/* Описание */}
                            <div>
                              <h4 className="text-base font-medium mb-2">Описание игры:</h4>
                              <p className="text-base text-foreground whitespace-pre-wrap">
                                {report.description}
                              </p>
                            </div>

                            {/* Дополнительные моменты */}
                            {report.highlights && (
                              <div className="border-l-2 border-muted pl-4">
                                <h4 className="text-base font-medium mb-2">Дополнительные моменты:</h4>
                                <p className="text-base text-foreground whitespace-pre-wrap">
                                  {report.highlights}
                                </p>
                              </div>
                            )}

                            {/* Игроки */}
                            <div>
                              <h4 className="text-base font-medium mb-2">Участники ({report.players.length}):</h4>
                              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                                {report.players.map((player) => (
                                  <div key={player.id} className="flex items-center gap-2 p-3 bg-card border border-border rounded text-base">
                                    <User className="h-4 w-4 text-foreground" />
                                    <div>
                                      <p className="font-medium text-foreground">{player.name || 'Без имени'}</p>
                                      <p className="text-sm text-muted-foreground">{player.email}</p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* Причина отклонения */}
                            {report.status === 'REJECTED' && report.rejectionReason && (
                              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                                <h4 className="text-base font-medium text-red-800 dark:text-red-200 mb-1">
                                  Причина отклонения:
                                </h4>
                                <p className="text-base text-red-700 dark:text-red-300 whitespace-pre-wrap">
                                  {report.rejectionReason}
                                </p>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}
      </main>

      {/* Модальное окно модерации */}
      {showModerationForm && selectedReport && moderationAction && (
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
                    При одобрении отчёта у каждого участника будет списана 1 игра из активной путёвки.
                    Если у игрока нет доступных игр, списание не произойдёт, но отчёт всё равно будет одобрен.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <Label htmlFor="rejection-reason">
                    Причина отклонения <span className="text-red-500">*</span>
                  </Label>
                  <Textarea
                    id="rejection-reason"
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Укажите подробную причину отклонения отчёта..."
                    rows={4}
                    className={!rejectionReason.trim() ? 'border-red-500' : ''}
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
                    setShowModerationForm(false);
                    setSelectedReport(null);
                    setRejectionReason('');
                    setModerationAction(null);
                  }}
                  disabled={isSubmitting}
                >
                  Отмена
                </Button>
                <Button
                  onClick={confirmModeration}
                  disabled={isSubmitting || (moderationAction === 'reject' && !rejectionReason.trim())}
                  variant={moderationAction === 'approve' ? 'default' : 'destructive'}
                >
                  {isSubmitting ? 'Обработка...' : moderationAction === 'approve' ? 'Одобрить' : 'Отклонить'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
