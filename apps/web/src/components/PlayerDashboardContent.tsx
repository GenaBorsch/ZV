"use client";

import { useState, useEffect } from 'react';
import { JoinGroupForm } from './JoinGroupForm';
import { JoinGroupSuccess } from './JoinGroupSuccess';
import { PlayerGroupDetailsModal } from './PlayerGroupDetailsModal';

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

export function PlayerDashboardContent() {
  const [showJoinForm, setShowJoinForm] = useState(false);
  const [joinedGroup, setJoinedGroup] = useState<any>(null);
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

  const handleJoinSuccess = (data: any) => {
    setJoinedGroup(data);
    setShowJoinForm(false);
    // Перезагружаем список групп после присоединения
    fetchGroups();
  };

  const handleJoinAnother = () => {
    setJoinedGroup(null);
    setShowJoinForm(true);
  };

  return (
    <div className="px-4 py-6 sm:px-0">
      <h2 className="text-2xl font-bold text-foreground mb-6">
        Добро пожаловать в кабинет игрока!
      </h2>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3 mb-8">
        <div className="card p-5">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-accent/30 rounded-md flex items-center justify-center" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-muted-foreground truncate">Мои персонажи</dt>
                <dd className="text-lg font-medium text-foreground">0</dd>
              </dl>
            </div>
          </div>
        </div>

        <div className="card p-5">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-accent/30 rounded-md flex items-center justify-center" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-muted-foreground truncate">Мои группы</dt>
                <dd className="text-lg font-medium text-foreground">{groups.length}</dd>
              </dl>
            </div>
          </div>
        </div>

        <div className="card p-5">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-accent/30 rounded-md flex items-center justify-center" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-muted-foreground truncate">Ближайшие игры</dt>
                <dd className="text-lg font-medium text-foreground">0</dd>
              </dl>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Join Group Form or Success Message */}
          {joinedGroup ? (
            <JoinGroupSuccess
              group={joinedGroup.group}
              message={joinedGroup.message}
              onJoinAnother={handleJoinAnother}
            />
          ) : showJoinForm ? (
            <JoinGroupForm onSuccess={handleJoinSuccess} />
          ) : (
            /* Groups Section */
            <div className="card p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-foreground">Мои группы</h3>
                <button 
                  className="btn-primary"
                  onClick={() => setShowJoinForm(true)}
                >
                  Присоединиться к группе
                </button>
              </div>
              
              {isLoading ? (
                <div className="border border-dashed border-border rounded-lg p-6 text-center text-muted-foreground">
                  Загрузка групп...
                </div>
              ) : groups.length === 0 ? (
                <div className="border border-dashed border-border rounded-lg p-6 text-center text-muted-foreground">
                  Вы пока не состоите в игровых группах. Присоединитесь к группе, чтобы начать играть.
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
                        
                        <button
                          className="text-primary hover:text-primary/80 text-sm font-medium"
                          onClick={() => setSelectedGroupId(group.id)}
                        >
                          📋 Подробнее
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Characters Section */}
          <div className="card p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-foreground">Мои персонажи</h3>
              <button className="btn-primary" disabled>
                Создать персонажа
              </button>
            </div>
            <div className="border border-dashed border-border rounded-lg p-6 text-center text-muted-foreground">
              У вас пока нет персонажей.
            </div>
          </div>

          {/* Battlepass Section */}
          <div className="card p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-foreground">Баттлпасс</h3>
              <button className="btn-primary">
                Купить баттлпасс
              </button>
            </div>
            <div className="border border-dashed border-border rounded-lg p-6 text-center text-muted-foreground">
              У вас нет активного баттлпасса.
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
                onClick={() => setShowJoinForm(true)}
              >
                Присоединиться к группе
              </button>
              <button 
                className="w-full text-left px-3 py-2 text-sm text-muted-foreground cursor-not-allowed rounded-md"
                disabled
              >
                Создать персонажа
              </button>
              <a 
                href="/player/battlepass"
                className="block w-full text-left px-3 py-2 text-sm text-foreground hover:bg-accent rounded-md"
              >
                Купить баттлпасс
              </a>
            </div>
          </div>

          <div className="card p-6">
            <h3 className="text-lg font-medium text-foreground mb-4">Статистика</h3>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Сыграно игр:</span>
                <span className="font-medium">0</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Активных групп:</span>
                <span className="font-medium">{groups.length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Персонажей:</span>
                <span className="font-medium">0</span>
              </div>
            </div>
          </div>

          {showJoinForm && (
            <div className="card p-6">
              <button 
                className="w-full text-center px-3 py-2 text-sm text-muted-foreground hover:text-foreground rounded-md"
                onClick={() => setShowJoinForm(false)}
              >
                ← Отменить присоединение
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Group Details Modal */}
      {selectedGroupId && (
        <PlayerGroupDetailsModal
          groupId={selectedGroupId}
          onClose={() => setSelectedGroupId(null)}
          onLeave={() => {
            fetchGroups(); // Reload groups after leaving
          }}
        />
      )}
    </div>
  );
}
