"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { MarkdownEditor } from '@/components/wiki/MarkdownEditor';
import type { WikiArticleWithDetails, WikiSectionWithChildren } from '@zv/contracts';

interface WikiArticleFormProps {
  article: WikiArticleWithDetails | null; // null для создания, объект для редактирования
  section: WikiSectionWithChildren;
  onSave: () => void;
  onCancel: () => void;
}

const ROLE_OPTIONS = [
  { value: 'PLAYER', label: 'Игрок' },
  { value: 'MASTER', label: 'Мастер' },
  { value: 'MODERATOR', label: 'Модератор' },
  { value: 'SUPERADMIN', label: 'Суперадмин' },
];

export function WikiArticleForm({ 
  article, 
  section, 
  onSave, 
  onCancel 
}: WikiArticleFormProps) {
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    contentMd: '',
    minRole: 'MASTER' as const,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEditing = !!article;

  // Инициализация формы
  useEffect(() => {
    if (article) {
      setFormData({
        title: article.title,
        slug: article.slug,
        contentMd: article.contentMd,
        minRole: article.minRole,
      });
    } else {
      setFormData({
        title: '',
        slug: '',
        contentMd: '',
        minRole: 'MASTER',
      });
    }
  }, [article]);

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
      // Автогенерация slug только при создании новой статьи
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
        sectionId: section.id,
      };

      const url = isEditing 
        ? `/api/wiki/articles/${article!.id}`
        : '/api/wiki/articles';
      
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
        throw new Error(errorData.error || 'Failed to save article');
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
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing 
              ? 'Редактировать статью' 
              : `Создать статью в разделе "${section.title}"`
            }
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="p-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Заголовок статьи</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="Введите заголовок статьи"
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
                placeholder="slug-stati"
                pattern="[a-z0-9\-]+"
                title="Только строчные буквы, цифры и дефисы"
                required
                disabled={loading}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="minRole">Минимальная роль для просмотра</Label>
            <Select
              value={formData.minRole}
              onValueChange={(value: any) => setFormData(prev => ({ ...prev, minRole: value }))}
              disabled={loading}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ROLE_OPTIONS.map((role) => (
                  <SelectItem key={role.value} value={role.value}>
                    {role.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Пользователи с этой ролью и выше смогут просматривать статью.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="content">Содержимое статьи</Label>
            <MarkdownEditor
              value={formData.contentMd}
              onChange={(value) => setFormData(prev => ({ ...prev, contentMd: value }))}
              disabled={loading}
            />
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
