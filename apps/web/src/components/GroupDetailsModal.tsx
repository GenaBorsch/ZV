"use client";

import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Switch } from './ui/switch';
import { Label } from './ui/label';

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
  updatedAt: string;
}

interface Member {
  id: string;
  userId: string;
  nickname: string;
  email: string;
  status: 'ACTIVE' | 'INACTIVE' | 'BANNED';
  joinedAt: string;
}

interface GroupDetailsModalProps {
  groupId: string;
  onClose: () => void;
  onUpdate?: () => void;
}

export function GroupDetailsModal({ groupId, onClose, onUpdate }: GroupDetailsModalProps) {
  const [group, setGroup] = useState<Group | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editedGroup, setEditedGroup] = useState<Partial<Group>>({});

  // Загрузка деталей группы
  const fetchGroupDetails = async () => {
    try {
      const response = await fetch(`/api/groups/${groupId}`);
      if (response.ok) {
        const data = await response.json();
        setGroup(data.group);
        setMembers(data.members || []);
        setEditedGroup(data.group);
      } else {
        console.error('Ошибка загрузки деталей группы');
      }
    } catch (error) {
      console.error('Ошибка загрузки деталей группы:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchGroupDetails();
  }, [groupId]);

  // Сохранение изменений
  const handleSave = async () => {
    if (!group) return;

    setIsSaving(true);
    try {
      const response = await fetch(`/api/groups/${groupId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: editedGroup.name,
          description: editedGroup.description,
          maxMembers: editedGroup.maxMembers,
          isRecruiting: editedGroup.isRecruiting,
          format: editedGroup.format,
          place: editedGroup.format === 'ONLINE' ? null : editedGroup.place,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setGroup(data.group);
        setIsEditing(false);
        onUpdate?.();
        alert('Группа успешно обновлена!');
      } else {
        const error = await response.json();
        alert(`Ошибка: ${error.error}`);
      }
    } catch (error) {
      console.error('Ошибка сохранения:', error);
      alert('Произошла ошибка при сохранении');
    } finally {
      setIsSaving(false);
    }
  };

  // Удаление участника
  const handleRemoveMember = async (memberId: string, memberName: string) => {
    if (!confirm(`Вы уверены, что хотите удалить ${memberName} из группы?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/groups/${groupId}/members/${memberId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setMembers(members.filter(m => m.id !== memberId));
        setGroup(prev => prev ? { ...prev, currentMembers: prev.currentMembers - 1 } : null);
        alert('Участник удален из группы');
      } else {
        const error = await response.json();
        alert(`Ошибка: ${error.error}`);
      }
    } catch (error) {
      console.error('Ошибка удаления участника:', error);
      alert('Произошла ошибка при удалении участника');
    }
  };

  // Копирование реферальной ссылки
  const handleCopyReferralLink = () => {
    if (group?.referralCode) {
      const link = `${window.location.origin}/join?code=${group.referralCode}`;
      navigator.clipboard.writeText(link);
      alert('Реферальная ссылка скопирована!');
    }
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-card rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
          <div className="text-center text-muted-foreground">Загрузка...</div>
        </div>
      </div>
    );
  }

  if (!group) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-card rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
          <div className="text-center text-destructive">Группа не найдена</div>
          <div className="flex justify-end mt-4">
            <Button variant="outline" onClick={onClose}>Закрыть</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-card rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Заголовок */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-foreground">
            {isEditing ? 'Редактирование группы' : 'Детали группы'}
          </h2>
          <div className="flex gap-2">
            {!isEditing ? (
              <>
                <Button variant="outline" onClick={() => setIsEditing(true)}>
                  Редактировать
                </Button>
                <Button variant="outline" onClick={onClose}>Закрыть</Button>
              </>
            ) : (
              <>
                <Button onClick={handleSave} disabled={isSaving}>
                  {isSaving ? 'Сохранение...' : 'Сохранить'}
                </Button>
                <Button variant="outline" onClick={() => {
                  setIsEditing(false);
                  setEditedGroup(group);
                }}>
                  Отмена
                </Button>
              </>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Основная информация */}
          <div className="lg:col-span-2 space-y-6">
            {/* Детали группы */}
            <div className="card p-6">
              <h3 className="text-lg font-medium text-foreground mb-4">Информация о группе</h3>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Название группы</Label>
                  {isEditing ? (
                    <Input
                      id="name"
                      value={editedGroup.name || ''}
                      onChange={(e) => setEditedGroup(prev => ({ ...prev, name: e.target.value }))}
                      className="mt-1"
                    />
                  ) : (
                    <div className="mt-1 text-foreground font-medium">{group.name}</div>
                  )}
                </div>

                <div>
                  <Label htmlFor="description">Описание</Label>
                  {isEditing ? (
                    <Textarea
                      id="description"
                      value={editedGroup.description || ''}
                      onChange={(e) => setEditedGroup(prev => ({ ...prev, description: e.target.value }))}
                      className="mt-1"
                      rows={3}
                    />
                  ) : (
                    <div className="mt-1 text-muted-foreground break-words overflow-wrap-anywhere">
                      {group.description || 'Описание не указано'}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="maxMembers">Максимум участников</Label>
                    {isEditing ? (
                      <Input
                        id="maxMembers"
                        type="number"
                        min="1"
                        max="10"
                        value={editedGroup.maxMembers || 4}
                        onChange={(e) => setEditedGroup(prev => ({ ...prev, maxMembers: parseInt(e.target.value) }))}
                        className="mt-1"
                      />
                    ) : (
                      <div className="mt-1 text-foreground">{group.maxMembers}</div>
                    )}
                  </div>

                  <div>
                    <Label>Текущие участники</Label>
                    <div className="mt-1 text-foreground">{group.currentMembers}</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="format">Формат</Label>
                    {isEditing ? (
                      <Select
                        value={editedGroup.format || 'ONLINE'}
                        onValueChange={(value) => {
                          const newFormat = value as 'ONLINE' | 'OFFLINE' | 'MIXED';
                          setEditedGroup(prev => ({ 
                            ...prev, 
                            format: newFormat,
                            // Очищаем место при смене на ONLINE
                            place: newFormat === 'ONLINE' ? '' : prev.place
                          }));
                        }}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ONLINE">Онлайн</SelectItem>
                          <SelectItem value="OFFLINE">Офлайн</SelectItem>
                          <SelectItem value="MIXED">Смешанный</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <div className="mt-1 text-foreground">
                        {group.format === 'ONLINE' ? 'Онлайн' : 
                         group.format === 'OFFLINE' ? 'Офлайн' : 'Смешанный'}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center space-x-2 mt-6">
                    <Label htmlFor="isRecruiting">Набор открыт</Label>
                    {isEditing ? (
                      <Switch
                        id="isRecruiting"
                        checked={editedGroup.isRecruiting || false}
                        onCheckedChange={(checked) => setEditedGroup(prev => ({ ...prev, isRecruiting: checked }))}
                      />
                    ) : (
                      <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                        group.isRecruiting 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                      }`}>
                        {group.isRecruiting ? 'Открыт' : 'Закрыт'}
                      </div>
                    )}
                  </div>
                </div>

                {((isEditing && (editedGroup.format === 'OFFLINE' || editedGroup.format === 'MIXED')) || 
                  (!isEditing && (group.format === 'OFFLINE' || group.format === 'MIXED'))) && (
                  <div>
                    <Label htmlFor="place">Место проведения</Label>
                    {isEditing ? (
                      <Input
                        id="place"
                        value={editedGroup.place || ''}
                        onChange={(e) => setEditedGroup(prev => ({ ...prev, place: e.target.value }))}
                        className="mt-1"
                        placeholder="Укажите место проведения"
                      />
                    ) : (
                      <div className="mt-1 text-muted-foreground">
                        {group.place || 'Место не указано'}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Участники группы */}
            <div className="card p-6">
              <h3 className="text-lg font-medium text-foreground mb-4">
                Участники группы ({members.length})
              </h3>
              
              {members.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  В группе пока нет участников
                </div>
              ) : (
                <div className="space-y-3">
                  {members.map((member) => (
                    <div key={member.id} className="flex items-center justify-between p-3 border border-border rounded-lg">
                      <div>
                        <div className="font-medium text-foreground">{member.nickname}</div>
                        <div className="text-sm text-muted-foreground">{member.email}</div>
                        <div className="text-xs text-muted-foreground">
                          Присоединился: {new Date(member.joinedAt).toLocaleDateString('ru')}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          member.status === 'ACTIVE' 
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                            : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                        }`}>
                          {member.status === 'ACTIVE' ? 'Активен' : member.status}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRemoveMember(member.id, member.nickname)}
                          className="text-destructive hover:text-destructive"
                        >
                          Удалить
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Боковая панель */}
          <div className="space-y-6">
            {/* Код приглашения и реферальная ссылка */}
            {group.referralCode && (
              <div className="card p-4">
                <h4 className="font-medium text-foreground mb-3">Приглашение в группу</h4>
                
                <div className="space-y-3">
                  {/* Код приглашения */}
                  <div>
                    <Label className="text-sm text-muted-foreground">Код приглашения:</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <code className="flex-1 px-2 py-1 bg-muted rounded text-sm font-mono">
                        {group.referralCode}
                      </code>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          navigator.clipboard.writeText(group.referralCode!);
                          alert('Код приглашения скопирован!');
                        }}
                      >
                        📋
                      </Button>
                    </div>
                  </div>

                  {/* Реферальная ссылка */}
                  <div>
                    <Label className="text-sm text-muted-foreground">Реферальная ссылка:</Label>
                    <Button
                      variant="outline"
                      className="w-full mt-1"
                      onClick={handleCopyReferralLink}
                    >
                      📋 Скопировать ссылку
                    </Button>
                    <div className="mt-2 text-xs text-muted-foreground break-all">
                      {window.location.origin}/join?code={group.referralCode}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Статистика */}
            <div className="card p-4">
              <h4 className="font-medium text-foreground mb-3">Статистика</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Создана:</span>
                  <span className="font-medium">
                    {new Date(group.createdAt).toLocaleDateString('ru')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Обновлена:</span>
                  <span className="font-medium">
                    {new Date(group.updatedAt).toLocaleDateString('ru')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Заполненность:</span>
                  <span className="font-medium">
                    {Math.round((group.currentMembers / group.maxMembers) * 100)}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
