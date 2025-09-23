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
import { getBattlepassStatusLabel, getBattlepassStatusClasses } from '@/lib/utils';

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

  // Battlepasses state
  const [battlepasses, setBattlepasses] = useState<any[]>([]);
  const [battlepassesLoading, setBattlepassesLoading] = useState(true);

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

  // Загрузка баттлпассов с сервера
  const fetchBattlepasses = async () => {
    try {
      setBattlepassesLoading(true);
      const response = await fetch('/api/player/battlepasses');
      if (response.ok) {
        const data = await response.json();
        setBattlepasses(data.battlepasses || []);
      } else {
        console.error('Failed to fetch battlepasses:', response.statusText);
      }
    } catch (error) {
      console.error('Ошибка загрузки баттлпассов:', error);
    } finally {
      setBattlepassesLoading(false);
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
    fetchBattlepasses();
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
                            <p className="text-base text-muted-foreground mt-1">{group.description}</p>
                          )}
                        </div>
                        <span className={`status-badge px-3 py-2 rounded-full font-medium ${
                          group.isRecruiting 
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                            : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                        }`}>
                          {group.isRecruiting ? 'Набор открыт' : 'Набор закрыт'}
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between text-base text-muted-foreground">
                        <div className="flex items-center space-x-4">
                          <span>👥 {group.currentMembers}/{group.maxMembers}</span>
                          <span>🎮 {group.format}</span>
                          {group.place && <span>📍 {group.place}</span>}
                        </div>
                        
                        <button
                          className="text-primary hover:text-primary/80 text-base font-medium"
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


          {/* Battlepass Section */}
          <div className="card p-6">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-3">
                <h3 className="text-lg font-medium text-foreground">Путёвки</h3>
                {battlepasses.length > 0 && (
                  <div className="flex items-center gap-2 px-3 py-1 bg-primary/10 rounded-full">
                    <span className="text-sm font-medium text-primary">
                      Осталось игр: {battlepasses.reduce((total, bp) => total + (bp.usesLeft || 0), 0)}
                    </span>
                  </div>
                )}
              </div>
              <a href="/player/battlepass" className="btn-primary">
                Купить путёвки
              </a>
            </div>
            
            {battlepassesLoading ? (
              <div className="border border-dashed border-border rounded-lg p-6 text-center text-muted-foreground">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto mb-2"></div>
                Загрузка...
              </div>
            ) : battlepasses.length > 0 ? (
              <div className="space-y-3">
                {battlepasses.map((bp) => (
                  <div key={bp.id} className="border border-border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="font-medium text-foreground">
                          {bp.kind === 'SEASON' ? 'Сезонная путёвка' : 
                           bp.kind === 'SINGLE' ? 'Разовая путёвка' : 
                           'Путёвка'}
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          Статус: {getBattlepassStatusLabel(bp.status)}
                        </p>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getBattlepassStatusClasses(bp.status)}`}>
                        {getBattlepassStatusLabel(bp.status)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">
                        Использований: <span className="font-medium text-foreground">{bp.usesLeft} из {bp.usesTotal}</span>
                      </span>
                      <span className="text-xs text-muted-foreground">
                        Создан: {new Date(bp.createdAt).toLocaleDateString('ru-RU')}
                      </span>
                    </div>
                    {bp.usesLeft > 0 && (
                      <div className="mt-2">
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div 
                            className="bg-green-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${(bp.usesLeft / bp.usesTotal) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="border border-dashed border-border rounded-lg p-6 text-center text-muted-foreground">
                У вас нет активных путёвок.
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <div className="card p-6">
            <h3 className="text-lg font-medium text-foreground mb-4">Быстрые действия</h3>
            <div className="space-y-2">
              <a 
                href="/player/search"
                className="block w-full text-left px-3 py-3 text-base text-foreground hover:bg-accent rounded-md"
              >
                🔍 Найти группу
              </a>
              <button 
                className="w-full text-left px-3 py-3 text-base text-foreground hover:bg-accent rounded-md"
                onClick={() => setShowJoinForm(true)}
              >
                Присоединиться по коду
              </button>
              <button 
                className={`w-full text-left px-3 py-3 text-base rounded-md ${
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
                className="block w-full text-left px-3 py-3 text-base text-foreground hover:bg-accent rounded-md"
              >
                Купить путёвки
              </a>
            </div>
          </div>

          {/* Applications Section */}
          <PlayerApplicationsList />


          {showJoinForm && (
            <div className="card p-6">
              <button 
                className="w-full text-center px-3 py-2 text-base text-muted-foreground hover:text-foreground rounded-md"
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
