"use client";

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { JoinGroupForm } from './JoinGroupForm';
import { JoinGroupSuccess } from './JoinGroupSuccess';
import { PlayerGroupDetailsModal } from './PlayerGroupDetailsModal';
import { CharacterCard } from './CharacterCard';
import { CharacterForm } from './CharacterForm';
import { CharacterDetails } from './CharacterDetails';
import { PlayerApplicationsList } from './PlayerApplicationsList';
import { CharacterDtoType, CreateCharacterDtoType, UpdateCharacterDtoType } from '@zv/contracts';

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
  const { data: session } = useSession();
  const [showJoinForm, setShowJoinForm] = useState(false);
  const [joinedGroup, setJoinedGroup] = useState<any>(null);
  const [groups, setGroups] = useState<Group[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  
  // Characters state
  const [characters, setCharacters] = useState<CharacterDtoType[]>([]);
  const [charactersLoading, setCharactersLoading] = useState(true);
  const [showCharacterForm, setShowCharacterForm] = useState(false);
  const [selectedCharacter, setSelectedCharacter] = useState<CharacterDtoType | null>(null);
  const [editingCharacter, setEditingCharacter] = useState<CharacterDtoType | null>(null);
  const [characterFormLoading, setCharacterFormLoading] = useState(false);

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

  // Загрузка персонажей с сервера
  const fetchCharacters = async () => {
    try {
      setCharactersLoading(true);
      const response = await fetch('/api/v1/characters');
      if (response.ok) {
        const data = await response.json();
        setCharacters(data.characters || []);
      } else {
        console.error('Failed to fetch characters:', response.statusText);
      }
    } catch (error) {
      console.error('Ошибка загрузки персонажей:', error);
    } finally {
      setCharactersLoading(false);
    }
  };

  // Создание персонажа
  const handleCreateCharacter = async (data: CreateCharacterDtoType) => {
    try {
      setCharacterFormLoading(true);
      const response = await fetch('/api/v1/characters', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        const result = await response.json();
        setCharacters(prev => [...prev, result.character]);
        setShowCharacterForm(false);
        // Показываем toast-уведомление (если есть)
        console.log('Персонаж успешно создан');
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Ошибка создания персонажа');
      }
    } catch (error: any) {
      console.error('Ошибка создания персонажа:', error);
      alert(error.message || 'Ошибка создания персонажа');
    } finally {
      setCharacterFormLoading(false);
    }
  };

  // Обновление персонажа
  const handleUpdateCharacter = async (data: UpdateCharacterDtoType) => {
    if (!editingCharacter) return;

    try {
      setCharacterFormLoading(true);
      const response = await fetch(`/api/v1/characters/${editingCharacter.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        const result = await response.json();
        setCharacters(prev => prev.map(char => 
          char.id === editingCharacter.id ? result.character : char
        ));
        setEditingCharacter(null);
        setShowCharacterForm(false);
        if (selectedCharacter?.id === editingCharacter.id) {
          setSelectedCharacter(result.character);
        }
        console.log('Персонаж успешно обновлен');
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Ошибка обновления персонажа');
      }
    } catch (error: any) {
      console.error('Ошибка обновления персонажа:', error);
      alert(error.message || 'Ошибка обновления персонажа');
    } finally {
      setCharacterFormLoading(false);
    }
  };

  // Удаление персонажа
  const handleDeleteCharacter = async (character: CharacterDtoType) => {
    try {
      const response = await fetch(`/api/v1/characters/${character.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setCharacters(prev => prev.filter(char => char.id !== character.id));
        if (selectedCharacter?.id === character.id) {
          setSelectedCharacter(null);
        }
        console.log('Персонаж успешно удален');
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Ошибка удаления персонажа');
      }
    } catch (error: any) {
      console.error('Ошибка удаления персонажа:', error);
      alert(error.message || 'Ошибка удаления персонажа');
    }
  };

  useEffect(() => {
    fetchGroups();
    fetchCharacters();
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
        Добро пожаловать, {session?.user?.name || 'Игрок'}!
      </h2>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3 mb-8">
        <div className="card p-5">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-accent/30 rounded-md flex items-center justify-center">
                <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-muted-foreground truncate">Мои персонажи</dt>
                <dd className="text-lg font-medium text-foreground">{characters.length}</dd>
              </dl>
            </div>
          </div>
        </div>

        <div className="card p-5">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-accent/30 rounded-md flex items-center justify-center">
                <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
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
              <div className="w-8 h-8 bg-accent/30 rounded-md flex items-center justify-center">
                <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
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
                <div className="flex gap-2">
                  <a 
                    href="/player/search"
                    className="btn-primary"
                  >
                    🔍 Найти группу
                  </a>
                  <button 
                    className="btn-outline"
                    onClick={() => setShowJoinForm(true)}
                  >
                    По коду
                  </button>
                </div>
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
              <button 
                className="btn-primary"
                onClick={() => setShowCharacterForm(true)}
                disabled={characters.length >= 5}
              >
                {characters.length >= 5 ? 'Лимит достигнут' : 'Создать персонажа'}
              </button>
            </div>
            
            {charactersLoading ? (
              <div className="border border-dashed border-border rounded-lg p-6 text-center text-muted-foreground">
                Загрузка персонажей...
              </div>
            ) : characters.length === 0 ? (
              <div className="border border-dashed border-border rounded-lg p-6 text-center text-muted-foreground">
                У вас пока нет персонажей. Создайте первого персонажа, чтобы начать играть!
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {characters.map((character) => (
                  <CharacterCard
                    key={character.id}
                    character={character}
                    onEdit={(char) => {
                      setEditingCharacter(char);
                      setShowCharacterForm(true);
                    }}
                    onDelete={handleDeleteCharacter}
                    onView={setSelectedCharacter}
                    showActions={true}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Applications Section */}
          <PlayerApplicationsList />

          {/* Battlepass Section */}
          <div className="card p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-foreground">Баттлпасс</h3>
              <a href="/player/battlepass" className="btn-primary">
                Купить баттлпасс
              </a>
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
              <a 
                href="/player/search"
                className="block w-full text-left px-3 py-2 text-sm text-foreground hover:bg-accent rounded-md"
              >
                🔍 Найти группу
              </a>
              <button 
                className="w-full text-left px-3 py-2 text-sm text-foreground hover:bg-accent rounded-md"
                onClick={() => setShowJoinForm(true)}
              >
                Присоединиться по коду
              </button>
              <button 
                className={`w-full text-left px-3 py-2 text-sm rounded-md ${
                  characters.length >= 5 
                    ? 'text-muted-foreground cursor-not-allowed' 
                    : 'text-foreground hover:bg-accent'
                }`}
                onClick={() => setShowCharacterForm(true)}
                disabled={characters.length >= 5}
              >
                {characters.length >= 5 ? 'Лимит персонажей' : 'Создать персонажа'}
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
                <span className="font-medium">{characters.length}/5</span>
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

      {/* Character Form Modal */}
      {showCharacterForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-background rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <CharacterForm
                character={editingCharacter || undefined}
                onSubmit={editingCharacter ? handleUpdateCharacter : handleCreateCharacter}
                onCancel={() => {
                  setShowCharacterForm(false);
                  setEditingCharacter(null);
                }}
                isLoading={characterFormLoading}
              />
            </div>
          </div>
        </div>
      )}

      {/* Character Details Modal */}
      {selectedCharacter && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-background rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <CharacterDetails
                character={selectedCharacter}
                onEdit={(char) => {
                  setEditingCharacter(char);
                  setSelectedCharacter(null);
                  setShowCharacterForm(true);
                }}
                onDelete={(char) => {
                  handleDeleteCharacter(char);
                  setSelectedCharacter(null);
                }}
                onClose={() => setSelectedCharacter(null)}
                showActions={true}
                isOwner={true}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
