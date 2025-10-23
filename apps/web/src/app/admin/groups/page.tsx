'use client';

import { useState, useEffect } from 'react';
import { AdminHeader } from '@/components/AdminHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, ChevronRight, Users, Calendar, MapPin, Gamepad2, Mail, Phone, User, Search, Filter } from 'lucide-react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

interface GroupMember {
  id: string;
  playerId: string;
  userId: string;
  nickname: string | null;
  name: string | null;
  email: string;
  status: 'ACTIVE' | 'INACTIVE' | 'BANNED';
  joinedAt: string;
  rpgExperience: 'NOVICE' | 'INTERMEDIATE' | 'VETERAN' | null;
  contacts: string | null;
  notes: string | null;
  battlepassStats: {
    purchased: number;
    spent: number;
    remaining: number;
  };
}

interface Master {
  id: string;
  userId: string;
  name: string | null;
  email: string;
  bio: string | null;
  format: 'ONLINE' | 'OFFLINE' | 'MIXED';
  location: string | null;
  rpgExperience: 'NOVICE' | 'INTERMEDIATE' | 'VETERAN' | null;
  contacts: string | null;
}

interface Season {
  id: string;
  title: string;
  code: string;
  isActive: boolean;
}

interface BattlepassStats {
  totalPurchased: number;
  totalSpent: number;
  totalRemaining: number;
}

interface Group {
  id: string;
  name: string;
  description: string | null;
  maxMembers: number;
  isRecruiting: boolean;
  referralCode: string | null;
  format: 'ONLINE' | 'OFFLINE' | 'MIXED';
  place: string | null;
  createdAt: string;
  updatedAt: string;
  seasonId: string;
  masterId: string;
  clubId: string | null;
  currentMembers: number;
  master: Master;
  season: Season;
  members: GroupMember[];
  battlepassStats: BattlepassStats;
}

const FORMAT_LABELS = {
  ONLINE: 'Онлайн',
  OFFLINE: 'Офлайн',
  MIXED: 'Смешанный',
};

const STATUS_LABELS = {
  ACTIVE: 'Активный',
  INACTIVE: 'Неактивный',
  BANNED: 'Заблокирован',
};

const STATUS_COLORS = {
  ACTIVE: 'bg-green-100 text-green-800',
  INACTIVE: 'bg-gray-100 text-gray-800',
  BANNED: 'bg-red-100 text-red-800',
};

const RPG_EXPERIENCE_LABELS = {
  NOVICE: 'Новичок',
  INTERMEDIATE: 'Опытный',
  VETERAN: 'Ветеран',
};

export default function AdminGroupsPage() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formatFilter, setFormatFilter] = useState<string>('all');
  const [seasonFilter, setSeasonFilter] = useState<string>('all');
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchGroups();
  }, []);

  const fetchGroups = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/groups');
      if (!response.ok) {
        throw new Error('Ошибка загрузки данных');
      }
      const data = await response.json();
      setGroups(data.groups);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Неизвестная ошибка');
    } finally {
      setLoading(false);
    }
  };

  const toggleGroupExpansion = (groupId: string) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(groupId)) {
      newExpanded.delete(groupId);
    } else {
      newExpanded.add(groupId);
    }
    setExpandedGroups(newExpanded);
  };

  const filteredGroups = groups.filter(group => {
    const matchesSearch = !searchTerm || 
      group.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      group.master.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      group.season.title.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFormat = formatFilter === 'all' || group.format === formatFilter;
    const matchesSeason = seasonFilter === 'all' || group.seasonId === seasonFilter;
    
    return matchesSearch && matchesFormat && matchesSeason;
  });

  const seasons = Array.from(
    new Map(groups.map(g => [g.season.id, g.season])).values()
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <AdminHeader 
          title="Управление группами"
          subtitle="Просмотр всех групп и их участников"
          backLink={{
            href: "/admin",
            label: "Админ-панель"
          }}
        />
        <main className="container mx-auto py-8">
          <div className="flex items-center justify-center py-12">
            <div className="text-muted-foreground">Загрузка...</div>
          </div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <AdminHeader 
          title="Управление группами"
          subtitle="Просмотр всех групп и их участников"
          backLink={{
            href: "/admin",
            label: "Админ-панель"
          }}
        />
        <main className="container mx-auto py-8">
          <div className="flex items-center justify-center py-12">
            <div className="text-red-500">Ошибка: {error}</div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <AdminHeader 
        title="Управление группами"
        subtitle="Просмотр всех групп и их участников"
        backLink={{
          href: "/admin",
          label: "Админ-панель"
        }}
      />
      
      <main className="container mx-auto py-8">
        {/* Фильтры и поиск */}
        <div className="mb-6 space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Поиск по названию группы, мастеру или сезону..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={formatFilter} onValueChange={setFormatFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Формат игры" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все форматы</SelectItem>
                <SelectItem value="ONLINE">Онлайн</SelectItem>
                <SelectItem value="OFFLINE">Офлайн</SelectItem>
                <SelectItem value="MIXED">Смешанный</SelectItem>
              </SelectContent>
            </Select>
            <Select value={seasonFilter} onValueChange={setSeasonFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Сезон" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все сезоны</SelectItem>
                {seasons.map(season => (
                  <SelectItem key={season.id} value={season.id}>
                    {season.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Статистика */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <div>
                  <div className="text-sm text-muted-foreground">Всего групп</div>
                  <div className="text-2xl font-bold">{groups.length}</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <div>
                  <div className="text-sm text-muted-foreground">Всего участников</div>
                  <div className="text-2xl font-bold">
                    {groups.reduce((sum, group) => sum + group.currentMembers, 0)}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Gamepad2 className="h-4 w-4 text-muted-foreground" />
                <div>
                  <div className="text-sm text-muted-foreground">Куплено баттлпассов</div>
                  <div className="text-2xl font-bold">
                    {groups.reduce((sum, group) => sum + group.battlepassStats.totalPurchased, 0)}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Gamepad2 className="h-4 w-4 text-muted-foreground" />
                <div>
                  <div className="text-sm text-muted-foreground">Осталось игр</div>
                  <div className="text-2xl font-bold">
                    {groups.reduce((sum, group) => sum + group.battlepassStats.totalRemaining, 0)}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Список групп */}
        <div className="space-y-4">
          {filteredGroups.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center text-muted-foreground">
                Группы не найдены
              </CardContent>
            </Card>
          ) : (
            filteredGroups.map(group => (
              <Card key={group.id}>
                <Collapsible>
                  <CollapsibleTrigger asChild>
                    <CardHeader 
                      className="cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => toggleGroupExpansion(group.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {expandedGroups.has(group.id) ? (
                            <ChevronDown className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                          )}
                          <div>
                            <CardTitle className="text-lg">{group.name}</CardTitle>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="outline">{FORMAT_LABELS[group.format]}</Badge>
                              <Badge variant={group.isRecruiting ? "default" : "secondary"}>
                                {group.isRecruiting ? 'Набор открыт' : 'Набор закрыт'}
                              </Badge>
                              <Badge variant="outline">{group.season.title}</Badge>
                            </div>
                          </div>
                        </div>
                        <div className="text-right text-sm text-muted-foreground">
                          <div>{group.currentMembers} / {group.maxMembers} участников</div>
                          <div>{format(new Date(group.createdAt), 'dd.MM.yyyy', { locale: ru })}</div>
                        </div>
                      </div>
                    </CardHeader>
                  </CollapsibleTrigger>
                  
                  <CollapsibleContent>
                    <CardContent className="pt-0">
                      <Tabs defaultValue="info" className="w-full">
                        <TabsList className="grid w-full grid-cols-4">
                          <TabsTrigger value="info">Информация</TabsTrigger>
                          <TabsTrigger value="master">Мастер</TabsTrigger>
                          <TabsTrigger value="members">Участники</TabsTrigger>
                          <TabsTrigger value="stats">Статистика</TabsTrigger>
                        </TabsList>
                        
                        <TabsContent value="info" className="mt-4">
                          <div className="space-y-4">
                            {group.description && (
                              <div>
                                <h4 className="font-medium mb-2">Описание</h4>
                                <p className="text-muted-foreground">{group.description}</p>
                              </div>
                            )}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <h4 className="font-medium mb-2">Основная информация</h4>
                                <div className="space-y-2 text-sm">
                                  <div className="flex justify-between">
                                    <span className="text-muted-foreground">Формат:</span>
                                    <span>{FORMAT_LABELS[group.format]}</span>
                                  </div>
                                  {group.place && (
                                    <div className="flex justify-between">
                                      <span className="text-muted-foreground">Место:</span>
                                      <span>{group.place}</span>
                                    </div>
                                  )}
                                  <div className="flex justify-between">
                                    <span className="text-muted-foreground">Создана:</span>
                                    <span>{format(new Date(group.createdAt), 'dd.MM.yyyy HH:mm', { locale: ru })}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-muted-foreground">Обновлена:</span>
                                    <span>{format(new Date(group.updatedAt), 'dd.MM.yyyy HH:mm', { locale: ru })}</span>
                                  </div>
                                </div>
                              </div>
                              <div>
                                <h4 className="font-medium mb-2">Сезон</h4>
                                <div className="space-y-2 text-sm">
                                  <div className="flex justify-between">
                                    <span className="text-muted-foreground">Название:</span>
                                    <span>{group.season.title}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-muted-foreground">Код:</span>
                                    <span>{group.season.code}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-muted-foreground">Статус:</span>
                                    <Badge variant={group.season.isActive ? "default" : "secondary"}>
                                      {group.season.isActive ? 'Активный' : 'Неактивный'}
                                    </Badge>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </TabsContent>
                        
                        <TabsContent value="master" className="mt-4">
                          <div className="space-y-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                                <User className="h-5 w-5 text-primary" />
                              </div>
                              <div>
                                <h4 className="font-medium">{group.master.name || 'Без имени'}</h4>
                                <p className="text-sm text-muted-foreground">{group.master.email}</p>
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <h5 className="font-medium mb-2">Контактная информация</h5>
                                <div className="space-y-2 text-sm">
                                  {group.master.contacts && (
                                    <div className="flex items-center gap-2">
                                      <Mail className="h-4 w-4 text-muted-foreground" />
                                      <span>{group.master.contacts}</span>
                                    </div>
                                  )}
                                  <div className="flex items-center gap-2">
                                    <Gamepad2 className="h-4 w-4 text-muted-foreground" />
                                    <span>{FORMAT_LABELS[group.master.format]}</span>
                                  </div>
                                  {group.master.location && (
                                    <div className="flex items-center gap-2">
                                      <MapPin className="h-4 w-4 text-muted-foreground" />
                                      <span>{group.master.location}</span>
                                    </div>
                                  )}
                                  {group.master.rpgExperience && (
                                    <div className="flex items-center gap-2">
                                      <User className="h-4 w-4 text-muted-foreground" />
                                      <span>{RPG_EXPERIENCE_LABELS[group.master.rpgExperience]}</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                              {group.master.bio && (
                                <div>
                                  <h5 className="font-medium mb-2">О мастере</h5>
                                  <p className="text-sm text-muted-foreground">{group.master.bio}</p>
                                </div>
                              )}
                            </div>
                          </div>
                        </TabsContent>
                        
                        <TabsContent value="members" className="mt-4">
                          <div className="space-y-4">
                            {group.members.length === 0 ? (
                              <div className="text-center text-muted-foreground py-8">
                                Участников пока нет
                              </div>
                            ) : (
                              <div className="grid gap-3">
                                {group.members.map(member => (
                                  <div key={member.id} className="p-4 border rounded-lg">
                                    <div className="flex items-center justify-between mb-3">
                                      <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                                          <User className="h-4 w-4 text-primary" />
                                        </div>
                                        <div>
                                          <div className="font-medium">
                                            {member.nickname || member.name || 'Без имени'}
                                          </div>
                                          <div className="text-sm text-muted-foreground">
                                            {member.email}
                                          </div>
                                        </div>
                                      </div>
                                      <div className="text-right text-sm">
                                        <Badge className={STATUS_COLORS[member.status]}>
                                          {STATUS_LABELS[member.status]}
                                        </Badge>
                                        <div className="text-muted-foreground mt-1">
                                          {format(new Date(member.joinedAt), 'dd.MM.yyyy', { locale: ru })}
                                        </div>
                                      </div>
                                    </div>
                                    
                                    {/* Статистика по баттлпассам */}
                                    <div className="grid grid-cols-3 gap-3 pt-3 border-t">
                                      <div className="text-center">
                                        <div className="text-lg font-bold text-green-600">
                                          {member.battlepassStats.purchased}
                                        </div>
                                        <div className="text-xs text-muted-foreground">Куплено</div>
                                      </div>
                                      <div className="text-center">
                                        <div className="text-lg font-bold text-blue-600">
                                          {member.battlepassStats.spent}
                                        </div>
                                        <div className="text-xs text-muted-foreground">Потрачено</div>
                                      </div>
                                      <div className="text-center">
                                        <div className="text-lg font-bold text-orange-600">
                                          {member.battlepassStats.remaining}
                                        </div>
                                        <div className="text-xs text-muted-foreground">Осталось</div>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </TabsContent>
                        
                        <TabsContent value="stats" className="mt-4">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <Card>
                              <CardContent className="p-4">
                                <div className="text-center">
                                  <div className="text-2xl font-bold text-green-600">
                                    {group.battlepassStats.totalPurchased}
                                  </div>
                                  <div className="text-sm text-muted-foreground">Куплено игр</div>
                                </div>
                              </CardContent>
                            </Card>
                            <Card>
                              <CardContent className="p-4">
                                <div className="text-center">
                                  <div className="text-2xl font-bold text-blue-600">
                                    {group.battlepassStats.totalSpent}
                                  </div>
                                  <div className="text-sm text-muted-foreground">Потрачено игр</div>
                                </div>
                              </CardContent>
                            </Card>
                            <Card>
                              <CardContent className="p-4">
                                <div className="text-center">
                                  <div className="text-2xl font-bold text-orange-600">
                                    {group.battlepassStats.totalRemaining}
                                  </div>
                                  <div className="text-sm text-muted-foreground">Осталось игр</div>
                                </div>
                              </CardContent>
                            </Card>
                          </div>
                        </TabsContent>
                      </Tabs>
                    </CardContent>
                  </CollapsibleContent>
                </Collapsible>
              </Card>
            ))
          )}
        </div>
      </main>
    </div>
  );
}
