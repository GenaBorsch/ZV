'use client';

// Принудительно делаем страницу динамической
export const dynamic = 'force-dynamic';

import { useState, useEffect, Suspense } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { UpdateProfileDto, UpdateMasterProfileDto } from '@zv/contracts';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { FileUpload } from '@/components/FileUpload';
import { useSession, getSession, signOut, signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getRedirectUrlByRoles } from '@/lib/redirectUtils';

interface ProfileData {
  id: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
  rpgExperience: 'NOVICE' | 'INTERMEDIATE' | 'VETERAN' | null;
  contacts: string | null;
  playerProfile: {
    nickname: string | null;
    notes: string | null;
  } | null;
  masterProfile: {
    bio: string | null;
    format: 'ONLINE' | 'OFFLINE' | 'MIXED';
    location: string | null;
    clubId: string | null;
  } | null;
  roles: string[];
  createdAt: string;
  updatedAt: string;
}

function ProfilePageContent() {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const isWelcome = searchParams.get('welcome') === 'true';
  const callbackUrl = searchParams.get('callbackUrl');
  
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [redirecting, setRedirecting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isEditing, setIsEditing] = useState(isWelcome); // Автоматически включаем редактирование для новых пользователей

  // Состояния для редактирования профиля мастера
  const [masterError, setMasterError] = useState('');
  const [masterSuccess, setMasterSuccess] = useState('');
  const [isEditingMaster, setIsEditingMaster] = useState(false);
  const [masterSaving, setMasterSaving] = useState(false);

  // Форма для основной информации
  const mainForm = useForm({
    resolver: zodResolver(UpdateProfileDto),
    defaultValues: {
      name: '',
      avatarUrl: '',
      rpgExperience: undefined as any,
      contacts: '',
    }
  });

  // Форма для профиля мастера
  const masterForm = useForm({
    resolver: zodResolver(UpdateMasterProfileDto),
    defaultValues: {
      bio: '',
      format: 'ONLINE' as 'ONLINE' | 'OFFLINE' | 'MIXED',
      location: '',
      clubId: '',
    }
  });

  // Загрузка профиля
  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      router.push('/auth/login');
      return;
    }

    fetchProfile();
  }, [session, status, router]);

  const fetchProfile = async () => {
    try {
      const response = await fetch('/api/profile');
      if (!response.ok) {
        throw new Error('Failed to fetch profile');
      }
      const data = await response.json();
      const profileData = data.profile as ProfileData;
      setProfile(profileData);

      // Заполняем форму текущими данными
      mainForm.reset({
        name: profileData.name || '',
        avatarUrl: profileData.avatarUrl || '',
        rpgExperience: profileData.rpgExperience || undefined,
        contacts: profileData.contacts || '',
      });

      // Заполняем форму мастера, если есть данные
      if (profileData.masterProfile) {
        masterForm.reset({
          bio: profileData.masterProfile.bio || '',
          format: profileData.masterProfile.format || 'ONLINE' as 'ONLINE' | 'OFFLINE' | 'MIXED',
          location: profileData.masterProfile.location || '',
          clubId: profileData.masterProfile.clubId || '',
        });
      }
    } catch (err) {
      setError('Не удалось загрузить профиль');
      console.error('Error fetching profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
    setError('');
    setSuccess('');
  };

  const handleCancel = () => {
    setIsEditing(false);
    setError('');
    setSuccess('');
    // Сбрасываем форму к исходным значениям
    if (profile) {
      mainForm.reset({
        name: profile.name || '',
        avatarUrl: profile.avatarUrl || '',
        rpgExperience: profile.rpgExperience || undefined,
        contacts: profile.contacts || '',
      });
    }
  };

  const handleMainSubmit = async (data: any) => {
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const responseData = await response.json();
      
      if (!response.ok) {
        throw new Error(responseData.error || 'Failed to update profile');
      }

      const updatedProfile = responseData.profile;
      
      setSuccess('Профиль обновлен!');
      await fetchProfile(); // Перезагружаем профиль
      
      // Выходим из режима редактирования, если это не welcome страница
      if (!isWelcome) {
        setIsEditing(false);
      }
      
      // Показываем индикатор редиректа
      setRedirecting(true);
      
      // Если обновили имя, нужно обновить сессию NextAuth
      if (data.name) {
        setTimeout(async () => {
          const targetUrl = callbackUrl || getRedirectUrlByRoles(updatedProfile?.roles || ['PLAYER']);
          
          console.log('Profile redirect debug:', {
            callbackUrl,
            updatedProfile,
            targetUrl,
            roles: updatedProfile?.roles,
            hasName: !!data.name
          });
          
          // Принудительно обновляем NextAuth сессию
          try {
            console.log('Triggering NextAuth session update...');
            
            // Обновляем сессию NextAuth с trigger: 'update'
            await update();
            
            // Даем время на обновление и перенаправляем
            setTimeout(() => {
              console.log('Redirecting after session update to:', targetUrl);
              window.location.href = targetUrl;
            }, 500);
            
          } catch (error) {
            console.error('Error during session refresh:', error);
            window.location.href = targetUrl;
          }
        }, 1500);
      } else {
        // Если имя не обновлялось, просто убираем индикатор
        setTimeout(() => {
          setRedirecting(false);
        }, 1500);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  // Обработчики для редактирования профиля мастера
  const handleEditMaster = () => {
    setIsEditingMaster(true);
    setMasterError('');
    setMasterSuccess('');
  };

  const handleCancelMaster = () => {
    setIsEditingMaster(false);
    setMasterError('');
    setMasterSuccess('');
    // Сбрасываем форму к исходным значениям
    if (profile?.masterProfile) {
      masterForm.reset({
        bio: profile.masterProfile.bio || '',
        format: profile.masterProfile.format || 'ONLINE' as 'ONLINE' | 'OFFLINE' | 'MIXED',
        location: profile.masterProfile.location || '',
        clubId: profile.masterProfile.clubId || '',
      });
    }
  };

  const handleMasterSubmit = async (data: any) => {
    setMasterSaving(true);
    setMasterError('');
    setMasterSuccess('');

    try {
      const response = await fetch('/api/profile/master', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const responseData = await response.json();
      
      if (!response.ok) {
        throw new Error(responseData.error || 'Не удалось обновить профиль мастера');
      }

      setMasterSuccess('Профиль мастера обновлен!');
      await fetchProfile(); // Перезагружаем профиль
      setIsEditingMaster(false);
    } catch (err: any) {
      setMasterError(err.message);
    } finally {
      setMasterSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-4">
        <div className="flex justify-center items-center h-64">
          <div className="text-lg">Загрузка профиля...</div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="container mx-auto p-4">
        <div className="text-center text-red-600">
          Не удалось загрузить профиль
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 max-w-2xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">
          {isWelcome ? 'Добро пожаловать!' : 'Мой профиль'}
        </h1>
        <p className="text-gray-600">
          {isWelcome 
            ? 'Пожалуйста, заполните свой профиль, чтобы другие участники могли лучше вас узнать'
            : 'Управляйте своей информацией и настройками'
          }
        </p>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md text-red-600">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-md text-green-600">
          {success} 
          {redirecting && (
            <span className="ml-2">
              Перенаправляем в личный кабинет...
              <span className="inline-block animate-spin ml-1">⏳</span>
            </span>
          )}
        </div>
      )}

      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Основная информация</h2>
        
        {!isEditing ? (
          // Режим просмотра
          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium text-gray-600">Имя</Label>
              <div className="mt-1 text-base text-gray-900">
                {profile.name || 'Не указано'}
              </div>
            </div>

            <div>
              <Label className="text-sm font-medium text-gray-600">Аватар</Label>
              <div className="mt-1 text-base text-gray-900">
                {profile.avatarUrl ? (
                  <div className="flex items-center space-x-3">
                    <img 
                      src={profile.avatarUrl} 
                      alt="Аватар" 
                      className="w-10 h-10 rounded-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                    <span className="text-sm text-blue-600 truncate max-w-xs">{profile.avatarUrl}</span>
                  </div>
                ) : (
                  'Не указан'
                )}
              </div>
            </div>

            <div>
              <Label className="text-sm font-medium text-gray-600">Опыт в НРИ</Label>
              <div className="mt-1 text-base text-gray-900">
                {profile.rpgExperience === 'NOVICE' ? 'Новичок' :
                 profile.rpgExperience === 'INTERMEDIATE' ? 'Средний уровень' :
                 profile.rpgExperience === 'VETERAN' ? 'Ветеран' : 'Не указан'}
              </div>
            </div>

            <div>
              <Label className="text-sm font-medium text-gray-600">Контакты для связи</Label>
              <div className="mt-1 text-base text-gray-900">
                {profile.contacts || 'Не указаны'}
              </div>
            </div>

            <Button onClick={handleEdit} className="w-full">
              Редактировать профиль
            </Button>
          </div>
        ) : (
          // Режим редактирования
          <form onSubmit={mainForm.handleSubmit(handleMainSubmit)} className="space-y-4">
            <div>
              <Label htmlFor="name">Имя *</Label>
              <Input
                id="name"
                {...mainForm.register('name')}
                placeholder="Как к вам обращаться?"
              />
              {mainForm.formState.errors.name && (
                <p className="text-sm text-red-600 mt-1">
                  {mainForm.formState.errors.name.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="avatarUrl">Аватар</Label>
              <FileUpload
                type="avatar"
                value={mainForm.watch('avatarUrl') || undefined}
                onChange={(url) => mainForm.setValue('avatarUrl', url || '')}
                accept="image/*"
                maxSizeMB={5}
                disabled={saving}
                className="mt-2"
              />
              {mainForm.formState.errors.avatarUrl && (
                <p className="text-sm text-red-600 mt-1">
                  {mainForm.formState.errors.avatarUrl.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="rpgExperience">Опыт в НРИ</Label>
              <Select 
                onValueChange={(value) => mainForm.setValue('rpgExperience', value as any)}
                defaultValue={mainForm.getValues('rpgExperience') || ''}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Выберите уровень опыта" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NOVICE">Новичок</SelectItem>
                  <SelectItem value="INTERMEDIATE">Средний уровень</SelectItem>
                  <SelectItem value="VETERAN">Ветеран</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="contacts">Контакты для связи</Label>
              <Input
                id="contacts"
                {...mainForm.register('contacts')}
                placeholder="Телефон, VK, Telegram и т.д."
              />
              {mainForm.formState.errors.contacts && (
                <p className="text-sm text-red-600 mt-1">
                  {mainForm.formState.errors.contacts.message}
                </p>
              )}
            </div>

            <div className="flex space-x-3">
              <Button type="submit" disabled={saving || redirecting} className="flex-1">
                {saving ? 'Сохранение...' : redirecting ? 'Перенаправляем...' : 'Сохранить'}
              </Button>
              {!isWelcome && (
                <Button type="button" 
                onClick={handleCancel} className="flex-1 bg-gray-200 text-gray-700 hover:bg-gray-300">
                  Отменить
                </Button>
              )}
            </div>
          </form>
        )}

        {/* Секция профиля мастера */}
        {(profile?.roles.includes('MASTER') || profile?.roles.includes('SUPERADMIN') || profile?.roles.includes('MODERATOR')) && (
          <div className="bg-white shadow rounded-lg p-6 mt-6">
            <h2 className="text-xl font-semibold mb-4">Профиль мастера</h2>
            
            {masterError && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md text-red-600">
                {masterError}
              </div>
            )}

            {masterSuccess && (
              <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-md text-green-600">
                {masterSuccess}
              </div>
            )}
            
            {!isEditingMaster ? (
              // Режим просмотра
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium text-gray-600">О себе как мастере</Label>
                  <div className="mt-1 text-base text-gray-900">
                    {profile.masterProfile?.bio || 'Не указано'}
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium text-gray-600">Формат игр</Label>
                  <div className="mt-1 text-base text-gray-900">
                    {profile.masterProfile?.format === 'ONLINE' ? 'Онлайн' :
                     profile.masterProfile?.format === 'OFFLINE' ? 'Оффлайн' :
                     profile.masterProfile?.format === 'MIXED' ? 'Смешанный' : 'Не указан'}
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium text-gray-600">Локация</Label>
                  <div className="mt-1 text-base text-gray-900">
                    {profile.masterProfile?.location || 'Не указана'}
                  </div>
                </div>

                <Button onClick={handleEditMaster} className="w-full">
                  Редактировать профиль мастера
                </Button>
              </div>
            ) : (
              // Режим редактирования
              <form onSubmit={masterForm.handleSubmit(handleMasterSubmit)} className="space-y-4">
                <div>
                  <Label htmlFor="masterBio">О себе как мастере</Label>
                  <Textarea
                    id="masterBio"
                    {...masterForm.register('bio')}
                    placeholder="Расскажите о своем опыте и стиле ведения игр"
                    rows={4}
                  />
                  {masterForm.formState.errors.bio && (
                    <p className="text-sm text-red-600 mt-1">
                      {masterForm.formState.errors.bio.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="masterFormat">Формат игр</Label>
                  <Select 
                    onValueChange={(value) => masterForm.setValue('format', value as any)}
                    defaultValue={masterForm.getValues('format')}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Выберите формат" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ONLINE">Онлайн</SelectItem>
                      <SelectItem value="OFFLINE">Оффлайн</SelectItem>
                      <SelectItem value="MIXED">Смешанный</SelectItem>
                    </SelectContent>
                  </Select>
                  {masterForm.formState.errors.format && (
                    <p className="text-sm text-red-600 mt-1">
                      {masterForm.formState.errors.format.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="masterLocation">Локация</Label>
                  <Input
                    id="masterLocation"
                    {...masterForm.register('location')}
                    placeholder="Город или район"
                  />
                  {masterForm.formState.errors.location && (
                    <p className="text-sm text-red-600 mt-1">
                      {masterForm.formState.errors.location.message}
                    </p>
                  )}
                </div>

                <div className="flex space-x-3">
                  <Button type="submit" disabled={masterSaving} className="flex-1">
                    {masterSaving ? 'Сохранение...' : 'Сохранить'}
                  </Button>
                  <Button type="button" 
                    onClick={handleCancelMaster} className="flex-1 bg-gray-200 text-gray-700 hover:bg-gray-300">
                    Отменить
                  </Button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* Показываем дополнительную информацию о профиле */}
        <div className="mt-8 pt-6 border-t">
          <h3 className="text-lg font-medium mb-3">Информация об аккаунте</h3>
          <div className="space-y-2 text-sm text-gray-600">
            <p><strong>Email:</strong> {profile.email}</p>
            <p><strong>Роли:</strong> {profile.roles.join(', ')}</p>
            {profile.playerProfile && (
              <div>
                <p><strong>Никнейм игрока:</strong> {profile.playerProfile.nickname || 'Не указан'}</p>
                {profile.playerProfile.notes && (
                  <p><strong>Заметки игрока:</strong> {profile.playerProfile.notes}</p>
                )}
              </div>
            )}
            {profile.masterProfile && (
              <div>
                <p><strong>Формат мастера:</strong> {profile.masterProfile.format}</p>
                {profile.masterProfile.bio && (
                  <p><strong>О мастере:</strong> {profile.masterProfile.bio}</p>
                )}
                {profile.masterProfile.location && (
                  <p><strong>Локация:</strong> {profile.masterProfile.location}</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <Suspense fallback={<div className="flex justify-center items-center min-h-screen">Загрузка профиля...</div>}>
      <ProfilePageContent />
    </Suspense>
  );
}