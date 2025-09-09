"use client";

import { useState, useEffect } from 'react';
import { Button } from './ui/button';

interface Group {
  id: string;
  name: string;
  description: string | null;
  maxMembers: number;
  isRecruiting: boolean;
  format: 'ONLINE' | 'OFFLINE' | 'MIXED';
  place: string | null;
  createdAt: Date;
  updatedAt: Date;
  seasonId: string;
  masterId: string;
  clubId: string | null;
  currentMembers: number;
}

interface Member {
  id: string;
  userId: string;
  playerProfileId: string;
  nickname: string | null;
  email: string;
  status: 'ACTIVE' | 'INACTIVE' | 'BANNED';
  joinedAt: Date;
}

interface PlayerGroupDetailsModalProps {
  groupId: string;
  onClose: () => void;
  onLeave: () => void;
}

export function PlayerGroupDetailsModal({ groupId, onClose, onLeave }: PlayerGroupDetailsModalProps) {
  const [group, setGroup] = useState<Group | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [masterInfo, setMasterInfo] = useState<{ nickname: string | null; email: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  useEffect(() => {
    fetchGroupDetails();
  }, [groupId]);

  const fetchGroupDetails = async () => {
    try {
      const response = await fetch(`/api/groups/${groupId}/details`);
      if (response.ok) {
        const data = await response.json();
        setGroup(data.group);
        setMembers(data.members);

        // Получить информацию о мастере
        const masterResponse = await fetch(`/api/users/${data.group.masterId}`);
        if (masterResponse.ok) {
          const masterData = await masterResponse.json();
          setMasterInfo(masterData);
        }
      } else {
        console.error('Failed to fetch group details');
      }
    } catch (error) {
      console.error('Error fetching group details:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLeaveGroup = async () => {
    setIsLeaving(true);
    try {
      const response = await fetch(`/api/groups/${groupId}/leave`, {
        method: 'POST',
      });

      if (response.ok) {
        onLeave();
        onClose();
      } else {
        const data = await response.json();
        alert(data.error || 'Не удалось покинуть группу');
      }
    } catch (error) {
      console.error('Error leaving group:', error);
      alert('Произошла ошибка при выходе из группы');
    } finally {
      setIsLeaving(false);
      setShowLeaveConfirm(false);
    }
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-background rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
          <div className="text-center">Загрузка...</div>
        </div>
      </div>
    );
  }

  if (!group) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-background rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
          <div className="text-center text-red-500">Группа не найдена</div>
          <div className="flex justify-center mt-4">
            <Button onClick={onClose}>Закрыть</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-background rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-2xl font-bold text-foreground">{group.name}</h2>
            <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium mt-2 ${
              group.isRecruiting 
                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
            }`}>
              {group.isRecruiting ? 'Набор открыт' : 'Набор закрыт'}
            </span>
          </div>
          <Button variant="outline" onClick={onClose}>✕</Button>
        </div>

        {/* Group Info */}
        <div className="space-y-4 mb-6">
          {group.description && (
            <div>
              <h3 className="font-medium text-foreground mb-2">Описание</h3>
              <p className="text-muted-foreground break-words overflow-wrap-anywhere">{group.description}</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Участники:</span>
              <span className="ml-2 font-medium">{group.currentMembers}/{group.maxMembers}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Формат:</span>
              <span className="ml-2 font-medium">{group.format}</span>
            </div>
            {group.place && (
              <div className="col-span-2">
                <span className="text-muted-foreground">Место:</span>
                <span className="ml-2 font-medium break-words overflow-wrap-anywhere">{group.place}</span>
              </div>
            )}
            <div className="col-span-2">
              <span className="text-muted-foreground">Создана:</span>
              <span className="ml-2 font-medium">{new Date(group.createdAt).toLocaleDateString('ru')}</span>
            </div>
          </div>
        </div>

        {/* Master Info */}
        {masterInfo && (
          <div className="mb-6">
            <h3 className="font-medium text-foreground mb-3">Мастер группы</h3>
            <div className="border border-border rounded-lg p-4 bg-accent/10">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-accent/30 rounded-full flex items-center justify-center mr-3">
                  👑
                </div>
                <div>
                  <div className="font-medium text-foreground">
                    {masterInfo.nickname || 'Не указан'}
                  </div>
                  <div className="text-sm text-muted-foreground">{masterInfo.email}</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Members List */}
        <div className="mb-6">
          <h3 className="font-medium text-foreground mb-3">Участники группы ({members.length})</h3>
          <div className="space-y-2">
            {members.map((member) => (
              <div key={member.id} className="border border-border rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-accent/30 rounded-full flex items-center justify-center mr-3">
                      👤
                    </div>
                    <div>
                      <div className="font-medium text-foreground">
                        {member.nickname || 'Не указан'}
                      </div>
                      <div className="text-sm text-muted-foreground">{member.email}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-muted-foreground">
                      Присоединился: {new Date(member.joinedAt).toLocaleDateString('ru')}
                    </div>
                    <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium mt-1 ${
                      member.status === 'ACTIVE' 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                    }`}>
                      {member.status === 'ACTIVE' ? 'Активен' : member.status}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-between">
          <Button variant="outline" onClick={onClose}>
            Закрыть
          </Button>
          
          <Button 
            variant="destructive" 
            onClick={() => setShowLeaveConfirm(true)}
            disabled={isLeaving}
          >
            {isLeaving ? 'Выход...' : 'Покинуть группу'}
          </Button>
        </div>

        {/* Leave Confirmation Modal */}
        {showLeaveConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center" style={{ zIndex: 60 }}>
            <div className="bg-background rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-bold text-foreground mb-4">Подтверждение</h3>
              <p className="text-muted-foreground mb-6">
                Вы уверены, что хотите покинуть группу "{group.name}"? 
                Это действие нельзя будет отменить.
              </p>
              <div className="flex justify-end space-x-3">
                <Button 
                  variant="outline" 
                  onClick={() => setShowLeaveConfirm(false)}
                  disabled={isLeaving}
                >
                  Отмена
                </Button>
                <Button 
                  variant="destructive" 
                  onClick={handleLeaveGroup}
                  disabled={isLeaving}
                >
                  {isLeaving ? 'Выход...' : 'Да, покинуть'}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
