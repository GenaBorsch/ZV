"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Plus, 
  FileText, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Users, 
  Calendar,
  Edit,
  Eye,
  AlertCircle
} from 'lucide-react';
import { ReportForm } from './ReportForm';
import { CreateReportDtoType, UpdateReportDtoType, ReportDtoType } from '@zv/contracts';

interface ReportWithPlayers {
  id: string;
  sessionId: string | null;
  masterId: string;
  masterName: string;
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

export function MasterReportsContent() {
  const [reports, setReports] = useState<ReportWithPlayers[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingReport, setEditingReport] = useState<ReportWithPlayers | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('all');

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

  // Создание отчёта
  const handleCreateReport = async (data: CreateReportDtoType) => {
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        const result = await response.json();
        setReports(prev => [result.report, ...prev]);
        setShowCreateForm(false);
      } else {
        const error = await response.json();
        console.error('Failed to create report:', error);
        alert('Ошибка при создании отчёта: ' + (error.error || 'Неизвестная ошибка'));
      }
    } catch (error) {
      console.error('Error creating report:', error);
      alert('Ошибка при создании отчёта');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Обновление отчёта
  const handleUpdateReport = async (data: UpdateReportDtoType) => {
    if (!editingReport) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/reports/${editingReport.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        await loadReports(); // Перезагружаем список
        setEditingReport(null);
      } else {
        const error = await response.json();
        console.error('Failed to update report:', error);
        alert('Ошибка при обновлении отчёта: ' + (error.error || 'Неизвестная ошибка'));
      }
    } catch (error) {
      console.error('Error updating report:', error);
      alert('Ошибка при обновлении отчёта');
    } finally {
      setIsSubmitting(false);
    }
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

  if (showCreateForm) {
    return (
      <div className="min-h-screen bg-background p-4">
        <ReportForm
          title="Создать отчёт о игре"
          onSubmit={handleCreateReport}
          onCancel={() => setShowCreateForm(false)}
          isLoading={isSubmitting}
        />
      </div>
    );
  }

  if (editingReport) {
    return (
      <div className="min-h-screen bg-background p-4">
        <ReportForm
          title="Редактировать отчёт"
          initialData={{
            id: editingReport.id,
            sessionId: editingReport.sessionId || undefined,
            description: editingReport.description,
            highlights: editingReport.highlights || undefined,
            players: editingReport.players,
          }}
          onSubmit={handleUpdateReport}
          onCancel={() => setEditingReport(null)}
          isLoading={isSubmitting}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card shadow-sm border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <h1 className="text-xl font-semibold text-foreground flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Отчёты о играх
              </h1>
            </div>
            <Button onClick={() => setShowCreateForm(true)} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Создать отчёт
            </Button>
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
              {filteredReports.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium text-foreground mb-2">Нет отчётов</h3>
                    <p className="text-muted-foreground text-center mb-4">
                      {activeTab === 'all' 
                        ? 'Вы ещё не создали ни одного отчёта о игре'
                        : `Нет отчётов со статусом "${getStatusInfo(activeTab.toUpperCase()).text}"`
                      }
                    </p>
                    {activeTab === 'all' && (
                      <Button onClick={() => setShowCreateForm(true)} className="flex items-center gap-2">
                        <Plus className="h-4 w-4" />
                        Создать первый отчёт
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4">
                  {filteredReports.map((report) => {
                    const statusInfo = getStatusInfo(report.status);
                    const StatusIcon = statusInfo.icon;
                    const canEdit = report.status === 'PENDING' || report.status === 'REJECTED';

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
                            <div className="flex gap-2">
                              {canEdit && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setEditingReport(report)}
                                  className="flex items-center gap-1"
                                >
                                  <Edit className="h-3 w-3" />
                                  Редактировать
                                </Button>
                              )}
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
                                <p className="text-sm text-muted-foreground line-clamp-2">
                                  {report.highlights}
                                </p>
                              </div>
                            )}

                            {/* Игроки */}
                            <div>
                              <p className="text-sm font-medium mb-2">Участники:</p>
                              <div className="flex flex-wrap gap-1">
                                {report.players.slice(0, 5).map((player) => (
                                  <Badge key={player.id} variant="outline" className="text-xs">
                                    {player.name || player.email}
                                  </Badge>
                                ))}
                                {report.players.length > 5 && (
                                  <Badge variant="outline" className="text-xs">
                                    +{report.players.length - 5} ещё
                                  </Badge>
                                )}
                              </div>
                            </div>

                            {/* Причина отклонения */}
                            {report.status === 'REJECTED' && report.rejectionReason && (
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
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}
      </main>
    </div>
  );
}
