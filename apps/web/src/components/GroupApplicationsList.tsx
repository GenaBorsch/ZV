"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PlayerProfileModal } from './PlayerProfileModal';

interface GroupApplication {
  id: string;
  groupId: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'WITHDRAWN';
  message: string | null;
  masterResponse: string | null;
  createdAt: string;
  updatedAt: string;
  player: {
    id: string;
    userId: string;
    nickname: string | null;
    notes: string | null;
    user: {
      id: string;
      name: string | null;
      email: string;
      rpgExperience: 'NOVICE' | 'INTERMEDIATE' | 'VETERAN' | null;
      contacts: string | null;
    };
  };
}

interface GroupApplicationsListProps {
  groupId: string;
  groupName: string;
  onApplicationUpdate?: () => void;
}

const statusMap = {
  PENDING: { label: 'Ожидает', color: 'text-yellow-600 bg-yellow-50' },
  APPROVED: { label: 'Принята', color: 'text-green-600 bg-green-50' },
  REJECTED: { label: 'Отклонена', color: 'text-red-600 bg-red-50' },
  WITHDRAWN: { label: 'Отозвана', color: 'text-gray-600 bg-gray-50' },
};

const experienceMap = {
  NOVICE: 'Новичок',
  INTERMEDIATE: 'Опытный',
  VETERAN: 'Ветеран',
};

export function GroupApplicationsList({ groupId, groupName, onApplicationUpdate }: GroupApplicationsListProps) {
  const [applications, setApplications] = useState<GroupApplication[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPlayer, setSelectedPlayer] = useState<GroupApplication['player'] | null>(null);
  const [processingApplicationId, setProcessingApplicationId] = useState<string | null>(null);

  // Загрузка заявок
  const fetchApplications = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`/api/groups/${groupId}/applications`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Ошибка загрузки заявок');
      }

      const data = await response.json();
      setApplications(data.applications || []);
    } catch (error: any) {
      console.error('Ошибка загрузки заявок:', error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, [groupId]);

  // Обработка заявки (принятие/отклонение)
  const handleApplicationAction = async (applicationId: string, action: 'approve' | 'reject', masterResponse?: string) => {
    try {
      setProcessingApplicationId(applicationId);

      const response = await fetch(`/api/groups/applications/${applicationId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action,
          masterResponse,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Ошибка обработки заявки');
      }

      // Обновляем список заявок
      await fetchApplications();
      
      // Уведомляем родительский компонент об изменениях
      if (onApplicationUpdate) {
        onApplicationUpdate();
      }

    } catch (error: any) {
      console.error('Ошибка обработки заявки:', error);
      alert(error.message);
    } finally {
      setProcessingApplicationId(null);
    }
  };

  const pendingApplications = applications.filter(app => app.status === 'PENDING');
  const processedApplications = applications.filter(app => app.status !== 'PENDING');

  if (isLoading) {
    return (
      <div className="card p-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Загрузка заявок...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card p-6">
        <div className="text-center text-red-600">
          <p>Ошибка загрузки заявок: {error}</p>
          <Button 
            onClick={fetchApplications}
            className="mt-2"
            variant="outline"
          >
            Попробовать снова
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Новые заявки */}
      {pendingApplications.length > 0 && (
        <div>
          <h3 className="text-lg font-medium text-foreground mb-4">
            Новые заявки ({pendingApplications.length})
          </h3>
          <div className="space-y-4">
            {pendingApplications.map((application) => (
              <Card key={application.id} className="border-yellow-200">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div>
                        <CardTitle className="text-base">
                          {application.player.user.name || 'Без имени'}
                        </CardTitle>
                        <div className="text-sm text-muted-foreground">
                          {application.player.user.rpgExperience && (
                            <span>Опыт: {experienceMap[application.player.user.rpgExperience]} • </span>
                          )}
                          <span>{new Date(application.createdAt).toLocaleDateString('ru-RU')}</span>
                        </div>
                      </div>
                    </div>
                    <div className={`px-2 py-1 rounded-full text-xs font-medium ${statusMap[application.status].color}`}>
                      {statusMap[application.status].label}
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="pt-0">
                  {application.message && (
                    <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm text-muted-foreground mb-1">Сообщение от игрока:</p>
                      <p className="text-sm">{application.message}</p>
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    <Button
                      onClick={() => setSelectedPlayer(application.player)}
                      variant="outline"
                      size="sm"
                    >
                      👤 Профиль
                    </Button>
                    
                    <Button
                      onClick={() => handleApplicationAction(application.id, 'approve')}
                      className="bg-green-600 hover:bg-green-700 text-white"
                      size="sm"
                      disabled={processingApplicationId === application.id}
                    >
                      {processingApplicationId === application.id ? '⏳' : '✅'} Принять
                    </Button>
                    
                    <Button
                      onClick={() => {
                        const reason = prompt('Причина отклонения (необязательно):');
                        if (reason !== null) { // null означает отмену
                          handleApplicationAction(application.id, 'reject', reason || undefined);
                        }
                      }}
                      variant="destructive"
                      size="sm"
                      disabled={processingApplicationId === application.id}
                    >
                      {processingApplicationId === application.id ? '⏳' : '❌'} Отклонить
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Обработанные заявки */}
      {processedApplications.length > 0 && (
        <div>
          <h3 className="text-lg font-medium text-foreground mb-4">
            История заявок ({processedApplications.length})
          </h3>
          <div className="space-y-3">
            {processedApplications.map((application) => (
              <Card key={application.id} className="border-gray-200">
                <CardContent className="py-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div>
                        <p className="font-medium text-sm">
                          {application.player.user.name || 'Без имени'}
                        </p>
                        <div className="text-xs text-muted-foreground">
                          {new Date(application.updatedAt).toLocaleDateString('ru-RU')}
                          {application.masterResponse && (
                            <span> • {application.masterResponse}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className={`px-2 py-1 rounded-full text-xs font-medium ${statusMap[application.status].color}`}>
                      {statusMap[application.status].label}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Пустое состояние */}
      {applications.length === 0 && (
        <div className="card p-6 text-center">
          <div className="text-muted-foreground mb-2">Заявок пока нет</div>
          <p className="text-sm text-muted-foreground">
            Когда игроки подадут заявки на вступление в группу "{groupName}", они появятся здесь
          </p>
        </div>
      )}

      {/* Модальное окно с профилем игрока */}
      {selectedPlayer && (
        <PlayerProfileModal
          player={selectedPlayer}
          onClose={() => setSelectedPlayer(null)}
        />
      )}
    </div>
  );
}
