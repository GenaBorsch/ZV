"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface GroupCreatedSuccessProps {
  group: {
    id: string;
    name: string;
    description: string | null;
    maxMembers: number;
    currentMembers: number;
    format: string;
    place: string | null;
  };
  referralCode: string;
  referralLink: string;
  onCreateAnother?: () => void;
}

export function GroupCreatedSuccess({ 
  group, 
  referralCode, 
  referralLink, 
  onCreateAnother 
}: GroupCreatedSuccessProps) {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div className="bg-card p-6 rounded-lg border border-border">
      <div className="flex items-center mb-4">
        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3">
          <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-foreground">
          Группа успешно создана!
        </h3>
      </div>

      {/* Информация о группе */}
      <div className="bg-muted/50 p-4 rounded-md mb-6">
        <h4 className="font-medium text-foreground mb-2">{group.name}</h4>
        {group.description && (
          <p className="text-sm text-muted-foreground mb-2">{group.description}</p>
        )}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-muted-foreground">Участники:</span>
            <span className="ml-2 font-medium">{group.currentMembers}/{group.maxMembers}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Формат:</span>
            <span className="ml-2 font-medium">
              {group.format === 'ONLINE' ? 'Онлайн' : 
               group.format === 'OFFLINE' ? 'Оффлайн' : 'Смешанный'}
            </span>
          </div>
          {group.place && (
            <div className="col-span-2">
              <span className="text-muted-foreground">Место:</span>
              <span className="ml-2 font-medium">{group.place}</span>
            </div>
          )}
        </div>
      </div>

      {/* Реферальная ссылка */}
      <div className="space-y-4">
        <div>
          <Label>Ссылка для приглашения игроков</Label>
          <div className="flex gap-2 mt-1">
            <Input 
              value={referralLink} 
              readOnly 
              className="flex-1 font-mono text-sm"
            />
            <Button 
              onClick={() => copyToClipboard(referralLink)}
              variant="outline"
              size="sm"
            >
              {copied ? 'Скопировано!' : 'Копировать'}
            </Button>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Поделитесь этой ссылкой с игроками для автоматического присоединения к группе
          </p>
        </div>

        <div>
          <Label>Код приглашения</Label>
          <div className="flex gap-2 mt-1">
            <Input 
              value={referralCode} 
              readOnly 
              className="flex-1 font-mono text-sm"
            />
            <Button 
              onClick={() => copyToClipboard(referralCode)}
              variant="outline"
              size="sm"
            >
              {copied ? 'Скопировано!' : 'Копировать'}
            </Button>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Игроки могут ввести этот код в своем кабинете для присоединения
          </p>
        </div>

        {onCreateAnother && (
          <Button 
            onClick={onCreateAnother} 
            variant="outline" 
            className="w-full"
          >
            Создать еще одну группу
          </Button>
        )}
      </div>
    </div>
  );
}
