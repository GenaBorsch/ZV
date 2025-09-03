"use client";

import { useState, useEffect } from 'react';
import { CreateGroupForm } from './CreateGroupForm';
import { GroupCreatedSuccess } from './GroupCreatedSuccess';
import { GroupDetailsModal } from './GroupDetailsModal';

interface Group {
  id: string;
  name: string;
  description: string | null;
  maxMembers: number;
  currentMembers: number;
  isRecruiting: boolean;
  format: 'ONLINE' | 'OFFLINE' | 'MIXED';
  place: string | null;
  referralCode: string | null;
  createdAt: string;
}

export function MasterDashboardContent() {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createdGroup, setCreatedGroup] = useState<any>(null);
  const [groups, setGroups] = useState<Group[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);

  // Загрузка групп с сервера
  const fetchGroups = async () => {
    try {
      const response = await fetch('/api/groups');
      if (response.ok) {
        const data = await response.json();
        setGroups(data.groups || []);
      }
    } catch (error) {
      console.error('Ошибка загрузки групп:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  const handleCreateSuccess = (data: any) => {
    setCreatedGroup(data);
    setShowCreateForm(false);
    // Перезагружаем список групп после создания
    fetchGroups();
  };

  const handleCreateAnother = () => {
    setCreatedGroup(null);
    setShowCreateForm(true);
  };

  return (
    <div className="px-4 py-6 sm:px-0">
      <h2 className="text-2xl font-bold text-foreground mb-6">
        Добро пожаловать в кабинет мастера!
      </h2>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-4 mb-8">
        <div className="card p-5">
          <div className="text-sm text-muted-foreground">Мои группы</div>
          <div className="text-lg font-medium">{groups.length}</div>
        </div>
        <div className="card p-5">
          <div className="text-sm text-muted-foreground">Всего игроков</div>
          <div className="text-lg font-medium">
            {groups.reduce((total, group) => total + group.currentMembers, 0)}
          </div>
        </div>
        <div className="card p-5">
          <div className="text-sm text-muted-foreground">Ближайшие игры</div>
          <div className="text-lg font-medium">0</div>
        </div>
        <div className="card p-5">
          <div className="text-sm text-muted-foreground">Отчёты</div>
          <div className="text-lg font-medium">0</div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Create Group Form or Success Message */}
          {createdGroup ? (
            <GroupCreatedSuccess
              group={createdGroup.group}
              referralCode={createdGroup.referralCode}
              referralLink={createdGroup.referralLink}
              onCreateAnother={handleCreateAnother}
            />
          ) : showCreateForm ? (
            <CreateGroupForm onSuccess={handleCreateSuccess} />
          ) : (
            /* Groups Section */
            <div className="card p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-foreground">Мои группы</h3>
                <button 
                  className="btn-primary"
                  onClick={() => setShowCreateForm(true)}
                >
                  Создать группу
                </button>
              </div>
              
              {isLoading ? (
                <div className="border border-dashed border-border rounded-lg p-6 text-center text-muted-foreground">
                  Загрузка групп...
                </div>
              ) : groups.length === 0 ? (
                <div className="border border-dashed border-border rounded-lg p-6 text-center text-muted-foreground">
                  У вас пока нет групп. Создайте первую, чтобы начать работу.
                </div>
              ) : (
                <div className="space-y-4">
                  {groups.map((group) => (
                    <div key={group.id} className="border border-border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="font-medium text-foreground">{group.name}</h4>
                          {group.description && (
                            <p className="text-sm text-muted-foreground mt-1">{group.description}</p>
                          )}
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          group.isRecruiting 
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                            : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                        }`}>
                          {group.isRecruiting ? 'Набор открыт' : 'Набор закрыт'}
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <div className="flex items-center space-x-4">
                          <span>👥 {group.currentMembers}/{group.maxMembers}</span>
                          <span>🎮 {group.format}</span>
                          {group.place && <span>📍 {group.place}</span>}
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <button 
                            className="text-primary hover:text-primary/80 text-sm font-medium"
                            onClick={() => setSelectedGroupId(group.id)}
                          >
                            📋 Подробнее
                          </button>
                          {group.referralCode && (
                            <>
                              <button 
                                className="text-primary hover:text-primary/80 text-sm font-medium"
                                onClick={() => {
                                  navigator.clipboard.writeText(group.referralCode!);
                                  alert('Код приглашения скопирован!');
                                }}
                                title="Скопировать код приглашения"
                              >
                                🔗 Код
                              </button>
                              <button 
                                className="text-primary hover:text-primary/80 text-sm font-medium"
                                onClick={() => {
                                  const link = `${window.location.origin}/join?code=${group.referralCode}`;
                                  navigator.clipboard.writeText(link);
                                  alert('Реферальная ссылка скопирована!');
                                }}
                                title="Скопировать реферальную ссылку"
                              >
                                📋 Ссылка
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Sessions Section */}
          <div className="card p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-foreground">Ближайшие игры</h3>
              <button className="btn-primary" disabled>
                Добавить игру
              </button>
            </div>
            <div className="border border-dashed border-border rounded-lg p-6 text-center text-muted-foreground">
              Нет запланированных игр.
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <div className="card p-6">
            <h3 className="text-lg font-medium text-foreground mb-4">Быстрые действия</h3>
            <div className="space-y-2">
              <button 
                className="w-full text-left px-3 py-2 text-sm text-foreground hover:bg-accent rounded-md"
                onClick={() => setShowCreateForm(true)}
              >
                Создать группу
              </button>
              <button 
                className="w-full text-left px-3 py-2 text-sm text-muted-foreground cursor-not-allowed rounded-md"
                disabled
              >
                Запланировать игру
              </button>
              <button 
                className="w-full text-left px-3 py-2 text-sm text-muted-foreground cursor-not-allowed rounded-md"
                disabled
              >
                Создать отчёт
              </button>
            </div>
          </div>

          <div className="card p-6">
            <h3 className="text-lg font-medium text-foreground mb-4">Статистика</h3>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Проведено игр:</span>
                <span className="font-medium">0</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Активных игроков:</span>
                <span className="font-medium">
                  {groups.reduce((total, group) => total + group.currentMembers, 0)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Набор открыт:</span>
                <span className="font-medium">
                  {groups.filter(group => group.isRecruiting).length}
                </span>
              </div>
            </div>
          </div>

          {showCreateForm && (
            <div className="card p-6">
              <button 
                className="w-full text-center px-3 py-2 text-sm text-muted-foreground hover:text-foreground rounded-md"
                onClick={() => setShowCreateForm(false)}
              >
                ← Отменить создание группы
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Модальное окно деталей группы */}
      {selectedGroupId && (
        <GroupDetailsModal
          groupId={selectedGroupId}
          onClose={() => setSelectedGroupId(null)}
          onUpdate={() => {
            fetchGroups(); // Перезагружаем список групп после обновления
          }}
        />
      )}
    </div>
  );
}
