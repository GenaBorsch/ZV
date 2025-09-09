"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface PlayerApplication {
  id: string;
  groupId: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'WITHDRAWN';
  message: string | null;
  masterResponse: string | null;
  createdAt: string;
  updatedAt: string;
}

const statusMap = {
  PENDING: { 
    label: 'На рассмотрении', 
    color: 'text-yellow-600 bg-yellow-50 border-yellow-200',
    icon: '⏳'
  },
  APPROVED: { 
    label: 'Принята', 
    color: 'text-green-600 bg-green-50 border-green-200',
    icon: '✅'
  },
  REJECTED: { 
    label: 'Отклонена', 
    color: 'text-red-600 bg-red-50 border-red-200',
    icon: '❌'
  },
  WITHDRAWN: { 
    label: 'Отозвана', 
    color: 'text-gray-600 bg-gray-50 border-gray-200',
    icon: '↩️'
  },
};

export function PlayerApplicationsList() {
  const [applications, setApplications] = useState<PlayerApplication[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Загрузка заявок игрока
  const fetchApplications = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/groups/applications/my');
      
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
  }, []);

  if (isLoading) {
    return (
      <div className="card p-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-sm text-muted-foreground">Загрузка заявок...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card p-6">
        <div className="text-center text-red-600">
          <p className="text-sm">Ошибка загрузки заявок: {error}</p>
        </div>
      </div>
    );
  }

  if (applications.length === 0) {
    return (
      <div className="card p-6">
        <div className="text-center">
          <div className="text-4xl mb-2">📝</div>
          <h3 className="font-medium text-foreground mb-1">Заявок пока нет</h3>
          <p className="text-sm text-muted-foreground">
            Когда вы подадите заявки на вступление в группы, они появятся здесь
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium text-foreground">
        Мои заявки ({applications.length})
      </h3>
      
      <div className="space-y-3">
        {applications.map((application) => {
          const statusInfo = statusMap[application.status];
          
          return (
            <Card key={application.id} className={`border ${statusInfo.color.split(' ').pop()}`}>
              <CardContent className="py-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-lg">{statusInfo.icon}</span>
                      <div>
                        <p className="font-medium text-sm">Заявка в группу</p>
                        <p className="text-xs text-muted-foreground">
                          Подана {new Date(application.createdAt).toLocaleDateString('ru-RU')}
                        </p>
                      </div>
                    </div>

                    {application.message && (
                      <div className="mb-3">
                        <p className="text-xs text-muted-foreground mb-1">Ваше сообщение:</p>
                        <p className="text-sm bg-gray-50 p-2 rounded text-gray-700">
                          {application.message}
                        </p>
                      </div>
                    )}

                    {application.masterResponse && (
                      <div className="mb-3">
                        <p className="text-xs text-muted-foreground mb-1">Ответ мастера:</p>
                        <p className="text-sm bg-blue-50 p-2 rounded text-blue-700">
                          {application.masterResponse}
                        </p>
                      </div>
                    )}

                    {application.status !== 'PENDING' && (
                      <p className="text-xs text-muted-foreground">
                        Обработана {new Date(application.updatedAt).toLocaleDateString('ru-RU')}
                      </p>
                    )}
                  </div>

                  <div className={`px-2 py-1 rounded-full text-xs font-medium ${statusInfo.color}`}>
                    {statusInfo.label}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
