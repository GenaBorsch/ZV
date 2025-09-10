"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  FileText, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Users, 
  Calendar,
  AlertCircle,
  ArrowLeft,
  User,
  Mail
} from 'lucide-react';

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

export function PlayerReportsContent() {
  const [reports, setReports] = useState<ReportWithPlayers[]>([]);
  const [isLoading, setIsLoading] = useState(true);
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

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card shadow-sm border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Link 
                href="/player" 
                className="text-muted-foreground hover:text-foreground flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Назад
              </Link>
              <h1 className="text-xl font-semibold text-foreground flex items-center gap-2">
                <FileText className="h-5 w-5" />
                История игр
              </h1>
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
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="all">
                Все ({reports.length})
              </TabsTrigger>
              <TabsTrigger value="approved">
                Засчитаны ({reports.filter(r => r.status === 'APPROVED').length})
              </TabsTrigger>
              <TabsTrigger value="pending">
                На рассмотрении ({reports.filter(r => r.status === 'PENDING').length})
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
                    <p className="text-muted-foreground text-center">
                      {activeTab === 'all' 
                        ? 'Вы ещё не участвовали в играх с отчётами'
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
                                  Мастер: {report.masterName || 'Без имени'}
                                </div>
                                <div className="flex items-center gap-1">
                                  <Users className="h-3 w-3" />
                                  {report.players.length} участник{report.players.length === 1 ? '' : report.players.length < 5 ? 'а' : 'ов'}
                                </div>
                              </div>
                            </div>
                          </div>
                        </CardHeader>
                        
                        <CardContent>
                          <div className="space-y-4">
                            {/* Описание */}
                            <div>
                              <h4 className="text-sm font-medium mb-2">Что происходило в игре:</h4>
                              <p className="text-sm text-muted-foreground whitespace-pre-wrap line-clamp-4">
                                {report.description}
                              </p>
                            </div>

                            {/* Дополнительные моменты */}
                            {report.highlights && (
                              <div className="border-l-2 border-muted pl-4">
                                <h4 className="text-sm font-medium mb-2">Особые моменты:</h4>
                                <p className="text-sm text-muted-foreground whitespace-pre-wrap line-clamp-3">
                                  {report.highlights}
                                </p>
                              </div>
                            )}

                            {/* Участники */}
                            <div>
                              <h4 className="text-sm font-medium mb-2">Участники игры:</h4>
                              <div className="flex flex-wrap gap-1">
                                {report.players.slice(0, 8).map((player) => (
                                  <Badge key={player.id} variant="outline" className="text-xs">
                                    {player.name || player.email}
                                  </Badge>
                                ))}
                                {report.players.length > 8 && (
                                  <Badge variant="outline" className="text-xs">
                                    +{report.players.length - 8} ещё
                                  </Badge>
                                )}
                              </div>
                            </div>

                            {/* Результат для игрока */}
                            {report.status === 'APPROVED' && (
                              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
                                <p className="text-sm text-green-800 dark:text-green-200 flex items-center gap-2">
                                  <CheckCircle className="h-4 w-4" />
                                  Игра засчитана! Списана 1 игра из вашего баттлпасса.
                                </p>
                              </div>
                            )}

                            {/* Причина отклонения */}
                            {report.status === 'REJECTED' && report.rejectionReason && (
                              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                                <h4 className="text-sm font-medium text-red-800 dark:text-red-200 mb-1">
                                  Причина отклонения:
                                </h4>
                                <p className="text-sm text-red-700 dark:text-red-300 whitespace-pre-wrap">
                                  {report.rejectionReason}
                                </p>
                              </div>
                            )}

                            {/* Информация об отмене */}
                            {report.status === 'CANCELLED' && (
                              <div className="bg-gray-50 dark:bg-gray-900/20 border border-gray-200 dark:border-gray-800 rounded-lg p-3">
                                <p className="text-sm text-gray-800 dark:text-gray-200 flex items-center gap-2">
                                  <AlertCircle className="h-4 w-4" />
                                  Отчёт был отменён администратором. Игра возвращена в ваш баттлпасс.
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
