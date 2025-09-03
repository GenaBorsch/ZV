"use client";

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CreateGroupDto } from '@zv/contracts';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

interface CreateGroupFormProps {
  onSuccess?: (data: { group: any; referralCode: string; referralLink: string }) => void;
}

export function CreateGroupForm({ onSuccess }: CreateGroupFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
    reset,
  } = useForm({
    resolver: zodResolver(CreateGroupDto),
    defaultValues: {
      name: '',
      description: '',
      maxMembers: 4,
      isRecruiting: false,
      format: 'ONLINE' as const,
      place: '',
    },
  });

  const format = watch('format');
  const isRecruiting = watch('isRecruiting');

  const onSubmit = async (data: any) => {
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/groups', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Ошибка при создании группы');
      }

      const result = await response.json();
      reset();
      onSuccess?.(result);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-card p-6 rounded-lg border border-border">
      <h3 className="text-lg font-semibold text-foreground mb-4">
        Создать новую группу
      </h3>

      {error && (
        <div className="mb-4 p-3 bg-destructive/10 text-destructive rounded-md text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Название */}
        <div>
          <Label htmlFor="name">Название группы *</Label>
          <Input
            id="name"
            {...register('name')}
            placeholder="Введите название группы"
            className="mt-1"
          />
          {errors.name && (
            <p className="text-sm text-destructive mt-1">{errors.name.message}</p>
          )}
        </div>

        {/* Описание */}
        <div>
          <Label htmlFor="description">Описание</Label>
          <Textarea
            id="description"
            {...register('description')}
            placeholder="Краткое описание группы (опционально)"
            className="mt-1"
            rows={3}
          />
          {errors.description && (
            <p className="text-sm text-destructive mt-1">{errors.description.message}</p>
          )}
        </div>

        {/* Максимальное количество участников */}
        <div>
          <Label htmlFor="maxMembers">Максимальное количество участников</Label>
          <Input
            id="maxMembers"
            type="number"
            min="1"
            max="10"
            {...register('maxMembers', { valueAsNumber: true })}
            className="mt-1"
          />
          {errors.maxMembers && (
            <p className="text-sm text-destructive mt-1">{errors.maxMembers.message}</p>
          )}
        </div>

        {/* Формат игры */}
        <div>
          <Label>Формат игры</Label>
          <Select
            value={format}
            onValueChange={(value) => setValue('format', value as any)}
          >
            <SelectTrigger className="mt-1">
              <SelectValue placeholder="Выберите формат игры" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ONLINE">Онлайн</SelectItem>
              <SelectItem value="OFFLINE">Оффлайн</SelectItem>
              <SelectItem value="MIXED">Смешанный</SelectItem>
            </SelectContent>
          </Select>
          {errors.format && (
            <p className="text-sm text-destructive mt-1">{errors.format.message}</p>
          )}
        </div>

        {/* Место проведения (только для оффлайн) */}
        {format === 'OFFLINE' && (
          <div>
            <Label htmlFor="place">Место проведения</Label>
            <Input
              id="place"
              {...register('place')}
              placeholder="Укажите место проведения игры"
              className="mt-1"
            />
            {errors.place && (
              <p className="text-sm text-destructive mt-1">{errors.place.message}</p>
            )}
          </div>
        )}

        {/* Открыт набор */}
        <div className="flex items-center space-x-2">
          <Switch
            id="isRecruiting"
            checked={isRecruiting}
            onCheckedChange={(checked) => setValue('isRecruiting', checked)}
          />
          <Label htmlFor="isRecruiting">Открыт набор в группу</Label>
        </div>
        <p className="text-sm text-muted-foreground">
          Если включено, группа будет видна в публичном списке для присоединения игроков
        </p>

        <Button type="submit" disabled={isSubmitting} className="w-full">
          {isSubmitting ? 'Создание...' : 'Создать группу'}
        </Button>
      </form>
    </div>
  );
}
