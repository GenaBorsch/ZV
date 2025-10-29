"use client";

import { Badge } from '@/components/ui/badge';
import { 
  FileText, 
  Calendar,
  Shield,
  MessageCircle
} from 'lucide-react';
import type { WikiArticleWithDetails } from '@zv/contracts';

interface WikiArticlesListUserProps {
  articles: WikiArticleWithDetails[];
  onArticleSelect: (article: WikiArticleWithDetails) => void;
  loading?: boolean;
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

// Скелетон для статьи
function ArticleSkeleton() {
  return (
    <div className="border rounded-lg p-4 animate-pulse">
      <div className="space-y-3">
        <div className="flex items-start gap-3">
          <div className="h-5 w-5 bg-muted rounded flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-muted rounded w-3/4" />
            <div className="h-4 bg-muted rounded w-1/2" />
          </div>
        </div>
        <div className="flex gap-3">
          <div className="h-6 bg-muted rounded w-16" />
          <div className="h-6 bg-muted rounded w-20" />
        </div>
        <div className="h-3 bg-muted rounded w-24" />
      </div>
    </div>
  );
}

export function WikiArticlesListUser({ articles, onArticleSelect, loading = false }: WikiArticlesListUserProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  // Показываем скелетоны во время загрузки
  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <ArticleSkeleton key={i} />
        ))}
      </div>
    );
  }

  // Показываем пустое состояние только после загрузки
  if (articles.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p className="text-lg mb-2">В этом разделе пока нет статей</p>
        <p className="text-sm">Статьи появятся здесь, когда администраторы их добавят</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
      {articles.map((article) => (
        <div
          key={article.id}
          className="group border rounded-lg p-4 hover:bg-accent/50 cursor-pointer transition-colors"
          onClick={() => onArticleSelect(article)}
        >
          <div className="space-y-3">
            {/* Заголовок */}
            <div className="flex items-start gap-3">
              <FileText className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <h3 className="font-medium group-hover:text-primary transition-colors line-clamp-2">
                  {article.title}
                </h3>
              </div>
            </div>

            {/* Метаинформация */}
            <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
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
                <span className="text-xs">
                  {formatDate(article.lastUpdatedAt)}
                </span>
              </div>

              {article.commentsCount !== undefined && article.commentsCount > 0 && (
                <div className="flex items-center gap-1">
                  <MessageCircle className="h-3 w-3" />
                  <span className="text-xs">
                    {article.commentsCount}
                  </span>
                </div>
              )}
            </div>

            {/* Автор */}
            {article.author && (
              <div className="text-xs text-muted-foreground">
                Автор: {article.author.name || article.author.email}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
