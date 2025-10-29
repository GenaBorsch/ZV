"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, 
  Edit, 
  Trash2, 
  MoreHorizontal,
  Calendar,
  Shield
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { WikiArticleWithDetails } from '@zv/contracts';

interface WikiArticlesListProps {
  articles: WikiArticleWithDetails[];
  onArticleEdit: (article: WikiArticleWithDetails) => void;
}

const ROLE_LABELS = {
  PLAYER: 'Игрок',
  MASTER: 'Мастер',
  MODERATOR: 'Модератор',
  SUPERADMIN: 'Суперадмин'
};

const ROLE_COLORS = {
  PLAYER: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  MASTER: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  MODERATOR: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  SUPERADMIN: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
};

export function WikiArticlesList({ articles, onArticleEdit }: WikiArticlesListProps) {
  const [loading, setLoading] = useState(false);

  const handleDelete = async (article: WikiArticleWithDetails) => {
    if (!confirm(`Вы уверены, что хотите удалить статью "${article.title}"?`)) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/wiki/articles/${article.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete article');
      }

      // Обновляем список статей
      window.location.reload(); // Простое решение для обновления
    } catch (error) {
      console.error('Error deleting article:', error);
      alert(error instanceof Error ? error.message : 'Ошибка при удалении статьи');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (articles.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>В этом разделе пока нет статей</p>
      </div>
    );
  }

  return (
    <div className={`space-y-3 ${loading ? 'opacity-50 pointer-events-none' : ''}`}>
      {articles.map((article) => (
        <div
          key={article.id}
          className="group border rounded-lg p-4 hover:bg-accent/50 transition-colors"
        >
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              {/* Заголовок */}
              <div className="flex items-center gap-2 mb-2">
                <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <h3 className="font-medium truncate">{article.title}</h3>
              </div>

              {/* Метаинформация */}
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Shield className="h-3 w-3" />
                  <Badge 
                    variant="secondary" 
                    className={`text-xs ${ROLE_COLORS[article.minRole]}`}
                  >
                    {ROLE_LABELS[article.minRole]}
                  </Badge>
                </div>

                <div className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  <span>{formatDate(article.lastUpdatedAt)}</span>
                </div>

                {article.author && (
                  <div>
                    Автор: {article.author.name || article.author.email}
                  </div>
                )}

                {article.commentsCount !== undefined && article.commentsCount > 0 && (
                  <div>
                    Комментариев: {article.commentsCount}
                  </div>
                )}
              </div>
            </div>

            {/* Меню действий */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onArticleEdit(article)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Редактировать
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => handleDelete(article)}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Удалить
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      ))}
    </div>
  );
}
