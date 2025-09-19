"use client";

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { JoinGroupDto } from '@zv/contracts';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface JoinGroupFormProps {
  onSuccess?: (data: { group: any; message: string }) => void;
}

export function JoinGroupForm({ onSuccess }: JoinGroupFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({
    resolver: zodResolver(JoinGroupDto),
    defaultValues: {
      referralCode: '',
    },
  });

  const onSubmit = async (data: any) => {
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/groups/join', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Ошибка при присоединении к группе');
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
        Присоединиться к группе
      </h3>
      
      <p className="text-base text-muted-foreground mb-4">
        Введите код приглашения, который вам предоставил мастер группы.
      </p>

      {error && (
        <div className="mb-4 p-3 bg-destructive/10 text-destructive rounded-md text-base">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <Label htmlFor="referralCode">Код приглашения *</Label>
          <Input
            id="referralCode"
            {...register('referralCode')}
            placeholder="Введите код приглашения"
            className="mt-1 font-mono"
          />
          {errors.referralCode && (
            <p className="text-base text-destructive mt-1">{errors.referralCode.message}</p>
          )}
        </div>

        <Button type="submit" disabled={isSubmitting} className="w-full">
          {isSubmitting ? 'Присоединение...' : 'Присоединиться к группе'}
        </Button>
      </form>

      <div className="mt-4 p-3 bg-muted/50 rounded-md text-base">
        <p className="font-medium text-foreground mb-1">Как получить код?</p>
        <p className="text-muted-foreground">
          Код приглашения предоставляет мастер группы. Он может поделиться с вами ссылкой или отдельным кодом.
        </p>
      </div>
    </div>
  );
}
