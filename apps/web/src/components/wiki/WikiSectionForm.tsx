"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import type { WikiSectionWithChildren } from '@zv/contracts';

interface WikiSectionFormProps {
  section: WikiSectionWithChildren | null; // null для создания, объект для редактирования
  parentSection?: WikiSectionWithChildren; // родительский раздел для создания подраздела
  onSave: () => void;
  onCancel: () => void;
}

export function WikiSectionForm({ 
  section, 
  parentSection, 
  onSave, 
  onCancel 
}: WikiSectionFormProps) {
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    orderIndex: 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEditing = !!section;
  const isSubsection = !!parentSection;

  // Инициализация формы
  useEffect(() => {
    if (section) {
      setFormData({
        title: section.title,
        slug: section.slug,
        orderIndex: section.orderIndex,
      });
    } else {
      setFormData({
        title: '',
        slug: '',
        orderIndex: 0,
      });
    }
  }, [section]);

  // Автогенерация slug из title
  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[а-яё]/g, (match) => {
        const map: Record<string, string> = {
          'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'yo',
          'ж': 'zh', 'з': 'z', 'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm',
          'н': 'n', 'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u',
          'ф': 'f', 'х': 'h', 'ц': 'ts', 'ч': 'ch', 'ш': 'sh', 'щ': 'sch',
          'ъ': '', 'ы': 'y', 'ь': '', 'э': 'e', 'ю': 'yu', 'я': 'ya'
        };
        return map[match] || match;
      })
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const handleTitleChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      title: value,
      // Автогенерация slug только при создании нового раздела
      slug: !isEditing ? generateSlug(value) : prev.slug,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const payload = {
        ...formData,
        parentId: isEditing ? section?.parentId : (parentSection?.id || null),
      };

      const url = isEditing 
        ? `/api/wiki/sections/${section!.id}`
        : '/api/wiki/sections';
      
      const method = isEditing ? 'PATCH' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save section');
      }

      onSave();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Произошла ошибка');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open onOpenChange={onCancel}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEditing 
              ? 'Редактировать раздел' 
              : isSubsection 
                ? `Создать подраздел в "${parentSection!.title}"`
                : 'Создать раздел'
            }
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="title">Название раздела</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder="Введите название раздела"
              required
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="slug">Slug (URL)</Label>
            <Input
              id="slug"
              value={formData.slug}
              onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
              placeholder="slug-razdela"
              pattern="[a-z0-9\-]+"
              title="Только строчные буквы, цифры и дефисы"
              required
              disabled={loading}
            />
            <p className="text-xs text-muted-foreground">
              Используется в URL. Только строчные буквы, цифры и дефисы.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="orderIndex">Порядок сортировки</Label>
            <Input
              id="orderIndex"
              type="number"
              value={formData.orderIndex}
              onChange={(e) => setFormData(prev => ({ ...prev, orderIndex: parseInt(e.target.value) || 0 }))}
              placeholder="0"
              disabled={loading}
            />
            <p className="text-xs text-muted-foreground">
              Чем меньше число, тем выше в списке.
            </p>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={loading}
            >
              Отмена
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Сохранение...' : isEditing ? 'Сохранить' : 'Создать'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
