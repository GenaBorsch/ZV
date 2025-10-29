"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, 
  Calendar, 
  User, 
  Shield, 
  MessageCircle,
  Send
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import type { WikiArticleWithDetails, WikiCommentWithUser } from '@zv/contracts';

interface WikiArticleViewProps {
  article: WikiArticleWithDetails;
  onBack: () => void;
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

// Функция для преобразования MinIO URL в API URL
function convertMinioUrlToApiUrl(url: string): string {
  // Если это уже API URL, возвращаем как есть
  if (url.startsWith('/api/files/')) {
    return url;
  }
  
  // Если это полный URL (http/https), извлекаем путь
  if (url.startsWith('http://') || url.startsWith('https://')) {
    try {
      const urlObj = new URL(url);
      const path = urlObj.pathname;
      // Преобразуем путь в API URL
      return `/api/files${path}`;
    } catch (e) {
      // Если не удалось распарсить URL, возвращаем как есть
      return url;
    }
  }
  
  // Если это относительный путь
  if (url.startsWith('/')) {
    return `/api/files${url}`;
  }
  
  // Если путь не начинается с /, добавляем полный путь
  return `/api/files/uploads/wiki/${url}`;
}

export function WikiArticleView({ article, onBack }: WikiArticleViewProps) {
  const [comments, setComments] = useState<WikiCommentWithUser[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [commentsLoading, setCommentsLoading] = useState(true);

  // Загрузка комментариев
  const loadComments = async () => {
    try {
      const response = await fetch(`/api/wiki/articles/${article.id}/comments`);
      if (!response.ok) throw new Error('Failed to load comments');
      
      const data = await response.json();
      setComments(data.comments || []);
    } catch (error) {
      console.error('Error loading comments:', error);
    } finally {
      setCommentsLoading(false);
    }
  };

  // Отправка комментария
  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || loading) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/wiki/articles/${article.id}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          body: newComment.trim(),
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to post comment');
      }

      const data = await response.json();
      setComments(prev => [...prev, data.comment]);
      setNewComment('');
    } catch (error) {
      console.error('Error posting comment:', error);
      alert(error instanceof Error ? error.message : 'Ошибка при отправке комментария');
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

  const formatDateShort = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  useEffect(() => {
    loadComments();
  }, [article.id]);

  return (
    <div className="min-h-screen bg-background">
      {/* Шапка статьи */}
      <div className="border-b bg-card">
        <div className="max-w-4xl mx-auto p-4 md:p-6">
          <Button
            variant="ghost"
            onClick={onBack}
            className="mb-4 -ml-2"
            size="sm"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Назад
          </Button>

          <div className="space-y-3 md:space-y-4">
            <h1 className="text-2xl md:text-3xl font-bold">{article.title}</h1>
            
            <div className="flex flex-wrap items-center gap-3 md:gap-4 text-xs md:text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Shield className="h-3 md:h-4 w-3 md:w-4" />
                <Badge 
                  variant="secondary" 
                  className={`text-xs ${ROLE_COLORS[article.minRole]}`}
                >
                  {ROLE_LABELS[article.minRole]}
                </Badge>
              </div>

              <div className="flex items-center gap-1">
                <Calendar className="h-3 md:h-4 w-3 md:w-4" />
                <span>Обновлено {formatDate(article.lastUpdatedAt)}</span>
              </div>

              {article.author && (
                <div className="flex items-center gap-1">
                  <User className="h-3 md:h-4 w-3 md:w-4" />
                  <span>Автор: {article.author.name || article.author.email}</span>
                </div>
              )}

              {article.section && (
                <div>
                  Раздел: {article.section.title}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Содержимое статьи */}
      <div className="max-w-4xl mx-auto p-4 md:p-6">
        <div className="prose prose-sm md:prose-lg max-w-none dark:prose-invert mb-8 md:mb-12">
          <ReactMarkdown
            components={{
              img: ({ src, alt, ...props }) => (
                <img
                  src={src ? convertMinioUrlToApiUrl(src) : ''}
                  alt={alt}
                  className="max-w-full h-auto rounded-lg shadow-sm"
                  loading="lazy"
                  onError={(e) => {
                    console.error('Failed to load image:', src);
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                  {...props}
                />
              ),
            }}
          >
            {article.contentMd}
          </ReactMarkdown>
        </div>

        {/* Комментарии */}
        <div className="border-t pt-6 md:pt-8">
          <div className="flex items-center gap-2 mb-4 md:mb-6">
            <MessageCircle className="h-4 md:h-5 w-4 md:w-5" />
            <h2 className="text-lg md:text-xl font-semibold">
              Комментарии ({comments.length})
            </h2>
          </div>

          {/* Форма добавления комментария */}
          <form onSubmit={handleSubmitComment} className="mb-6 md:mb-8">
            <div className="space-y-3">
              <Textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Оставьте комментарий..."
                className="min-h-[80px] md:min-h-[100px] text-sm md:text-base"
                disabled={loading}
              />
              <div className="flex justify-end">
                <Button
                  type="submit"
                  disabled={!newComment.trim() || loading}
                  size="sm"
                >
                  <Send className="h-4 w-4 mr-2" />
                  {loading ? 'Отправка...' : 'Отправить'}
                </Button>
              </div>
            </div>
          </form>

          {/* Список комментариев */}
          {commentsLoading ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              Загрузка комментариев...
            </div>
          ) : comments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <MessageCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm md:text-base">Пока нет комментариев</p>
              <p className="text-xs md:text-sm">Будьте первым, кто оставит комментарий!</p>
            </div>
          ) : (
            <div className="space-y-4 md:space-y-6">
              {comments.map((comment) => (
                <div key={comment.id} className="border rounded-lg p-3 md:p-4">
                  <div className="flex items-center gap-2 md:gap-3 mb-2 md:mb-3">
                    {comment.user.avatarUrl ? (
                      <img
                        src={comment.user.avatarUrl}
                        alt={comment.user.name || comment.user.email}
                        className="h-7 w-7 md:h-8 md:w-8 rounded-full"
                      />
                    ) : (
                      <div className="h-7 w-7 md:h-8 md:w-8 rounded-full bg-muted flex items-center justify-center">
                        <User className="h-3 md:h-4 w-3 md:w-4" />
                      </div>
                    )}
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-xs md:text-sm truncate">
                          {comment.user.name || comment.user.email}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {formatDateShort(comment.createdAt)}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-xs md:text-sm whitespace-pre-wrap">
                    {comment.body}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
