"use client";

import { useState, useEffect } from 'react';
import { CharacterDtoType, CreateCharacterDtoType, UpdateCharacterDtoType } from '@zv/contracts';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Switch } from './ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';

interface CharacterFormProps {
  character?: CharacterDtoType;
  onSubmit: (data: CreateCharacterDtoType | UpdateCharacterDtoType) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
  title?: string;
}

export function CharacterForm({ 
  character, 
  onSubmit, 
  onCancel, 
  isLoading = false,
  title 
}: CharacterFormProps) {
  const [formData, setFormData] = useState({
    name: character?.name || '',
    archetype: character?.archetype || '',
    level: character?.level || 1,
    avatarUrl: character?.avatarUrl || '',
    backstory: character?.backstory || '',
    journal: character?.journal || '',
    isAlive: character?.isAlive ?? true,
    deathDate: character?.deathDate || '',
    notes: character?.notes || '',
    sheetUrl: character?.sheetUrl || '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const isEditing = !!character;
  const formTitle = title || (isEditing ? `Редактировать ${character.name}` : 'Создать персонажа');

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Имя персонажа обязательно';
    } else if (formData.name.length > 255) {
      newErrors.name = 'Имя персонажа не должно превышать 255 символов';
    }

    if (formData.archetype && formData.archetype.length > 100) {
      newErrors.archetype = 'Архетип не должен превышать 100 символов';
    }

    if (formData.level < 1) {
      newErrors.level = 'Уровень должен быть не менее 1';
    }

    if (formData.avatarUrl && !/^https?:\/\/.+/.test(formData.avatarUrl)) {
      newErrors.avatarUrl = 'Некорректная ссылка на аватар';
    }

    if (formData.backstory && formData.backstory.length > 5000) {
      newErrors.backstory = 'Предыстория не должна превышать 5000 символов';
    }

    if (formData.journal && formData.journal.length > 5000) {
      newErrors.journal = 'Журнал не должен превышать 5000 символов';
    }

    if (formData.deathDate && !/^\d{2}\.\d{2}\.\d{3}$/.test(formData.deathDate)) {
      newErrors.deathDate = 'Дата смерти должна быть в формате дд.мм.ггг';
    }

    if (formData.sheetUrl && !/^https?:\/\/.+/.test(formData.sheetUrl)) {
      newErrors.sheetUrl = 'Некорректная ссылка на лист персонажа';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      await onSubmit(formData);
    } catch (error) {
      console.error('Error submitting character form:', error);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  // Автоматически устанавливаем дату смерти при смене статуса на "мертв"
  useEffect(() => {
    if (!formData.isAlive && !formData.deathDate) {
      const now = new Date();
      const day = String(now.getDate()).padStart(2, '0');
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const year = String(now.getFullYear()).slice(-3); // последние 3 цифры года
      setFormData(prev => ({ ...prev, deathDate: `${day}.${month}.${year}` }));
    }
  }, [formData.isAlive]);

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>{formTitle}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Основная информация */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Имя персонажа *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Введите имя персонажа"
                className={errors.name ? 'border-red-500' : ''}
              />
              {errors.name && <p className="text-sm text-red-500 mt-1">{errors.name}</p>}
            </div>

            <div>
              <Label htmlFor="archetype">Архетип</Label>
              <Input
                id="archetype"
                value={formData.archetype}
                onChange={(e) => handleInputChange('archetype', e.target.value)}
                placeholder="Например: Воин, Маг, Вор"
                className={errors.archetype ? 'border-red-500' : ''}
              />
              {errors.archetype && <p className="text-sm text-red-500 mt-1">{errors.archetype}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="level">Уровень</Label>
              <Input
                id="level"
                type="number"
                min="1"
                value={formData.level}
                onChange={(e) => handleInputChange('level', parseInt(e.target.value) || 1)}
                className={errors.level ? 'border-red-500' : ''}
              />
              {errors.level && <p className="text-sm text-red-500 mt-1">{errors.level}</p>}
            </div>

            <div>
              <Label htmlFor="avatarUrl">URL аватара</Label>
              <Input
                id="avatarUrl"
                value={formData.avatarUrl}
                onChange={(e) => handleInputChange('avatarUrl', e.target.value)}
                placeholder="https://example.com/avatar.jpg"
                className={errors.avatarUrl ? 'border-red-500' : ''}
              />
              {errors.avatarUrl && <p className="text-sm text-red-500 mt-1">{errors.avatarUrl}</p>}
            </div>
          </div>

          {/* Статус и дата смерти */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="isAlive"
                checked={formData.isAlive}
                onCheckedChange={(checked) => handleInputChange('isAlive', checked)}
              />
              <Label htmlFor="isAlive">Персонаж жив</Label>
            </div>

            {!formData.isAlive && (
              <div>
                <Label htmlFor="deathDate">Дата смерти (дд.мм.ггг)</Label>
                <Input
                  id="deathDate"
                  value={formData.deathDate}
                  onChange={(e) => handleInputChange('deathDate', e.target.value)}
                  placeholder="01.01.024"
                  className={errors.deathDate ? 'border-red-500' : ''}
                />
                {errors.deathDate && <p className="text-sm text-red-500 mt-1">{errors.deathDate}</p>}
              </div>
            )}
          </div>

          {/* Предыстория */}
          <div>
            <Label htmlFor="backstory">Предыстория</Label>
            <Textarea
              id="backstory"
              value={formData.backstory}
              onChange={(e) => handleInputChange('backstory', e.target.value)}
              placeholder="Расскажите историю персонажа..."
              rows={4}
              className={errors.backstory ? 'border-red-500' : ''}
            />
            <p className="text-xs text-muted-foreground mt-1">
              {formData.backstory.length}/5000 символов
            </p>
            {errors.backstory && <p className="text-sm text-red-500 mt-1">{errors.backstory}</p>}
          </div>

          {/* Журнал */}
          <div>
            <Label htmlFor="journal">Журнал</Label>
            <Textarea
              id="journal"
              value={formData.journal}
              onChange={(e) => handleInputChange('journal', e.target.value)}
              placeholder="Записи о приключениях персонажа..."
              rows={4}
              className={errors.journal ? 'border-red-500' : ''}
            />
            <p className="text-xs text-muted-foreground mt-1">
              {formData.journal.length}/5000 символов
            </p>
            {errors.journal && <p className="text-sm text-red-500 mt-1">{errors.journal}</p>}
          </div>

          {/* Дополнительные поля */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="sheetUrl">Ссылка на лист персонажа</Label>
              <Input
                id="sheetUrl"
                value={formData.sheetUrl}
                onChange={(e) => handleInputChange('sheetUrl', e.target.value)}
                placeholder="https://example.com/character-sheet"
                className={errors.sheetUrl ? 'border-red-500' : ''}
              />
              {errors.sheetUrl && <p className="text-sm text-red-500 mt-1">{errors.sheetUrl}</p>}
            </div>
          </div>

          {/* Заметки */}
          <div>
            <Label htmlFor="notes">Заметки</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              placeholder="Дополнительные заметки..."
              rows={3}
            />
          </div>

          {/* Кнопки */}
          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isLoading}
            >
              Отмена
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
            >
              {isLoading ? 'Сохранение...' : (isEditing ? 'Сохранить' : 'Создать')}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
