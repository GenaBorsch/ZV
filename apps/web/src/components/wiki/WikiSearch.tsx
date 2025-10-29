"use client";

import { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, X, FileText, Calendar } from 'lucide-react';
import type { SearchResponse, WikiArticleWithDetails } from '@zv/contracts';

interface WikiSearchProps {
  onSearch: (query: string) => void;
  searchResults: SearchResponse | null;
  onResultSelect: (article: WikiArticleWithDetails) => void;
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

export function WikiSearch({ onSearch, searchResults, onResultSelect }: WikiSearchProps) {
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Дебаунс для поиска
  useEffect(() => {
    if (!query.trim()) {
      setShowResults(false);
      return;
    }

    setIsSearching(true);
    const timeoutId = setTimeout(() => {
      onSearch(query);
      setIsSearching(false);
      setShowResults(true);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [query]); // Убираем onSearch из зависимостей

  // Закрытие результатов при клике вне компонента
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleClear = () => {
    setQuery('');
    setShowResults(false);
    inputRef.current?.focus();
  };

  const handleResultClick = (result: any) => {
    // Создаем объект статьи из результата поиска
    const article: WikiArticleWithDetails = {
      id: result.id,
      sectionId: result.sectionId,
      title: result.title,
      slug: result.slug,
      contentMd: '', // Будет загружено при открытии
      minRole: result.minRole,
      authorUserId: null,
      updatedByUserId: null,
      lastUpdatedAt: result.lastUpdatedAt,
      createdAt: result.lastUpdatedAt,
      updatedAt: result.lastUpdatedAt,
    };

    onResultSelect(article);
    setShowResults(false);
    setQuery('');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  return (
    <div ref={searchRef} className="relative">
      {/* Поле поиска */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          ref={inputRef}
          type="text"
          placeholder="Поиск по статьям..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-10 pr-10"
        />
        {query && (
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
            onClick={handleClear}
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>

      {/* Результаты поиска */}
      {showResults && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-popover border rounded-md shadow-lg z-50 max-h-96 overflow-y-auto">
          {isSearching ? (
            <div className="p-4 text-center text-muted-foreground">
              <Search className="h-6 w-6 mx-auto mb-2 animate-pulse" />
              <p>Поиск...</p>
            </div>
          ) : searchResults && searchResults.results.length > 0 ? (
            <div>
              {/* Заголовок результатов */}
              <div className="p-3 border-b bg-muted/30">
                <p className="text-sm text-muted-foreground">
                  Найдено {searchResults.total} {searchResults.total === 1 ? 'результат' : 'результатов'}
                </p>
              </div>

              {/* Список результатов */}
              <div className="max-h-80 overflow-y-auto">
                {searchResults.results.map((result) => (
                  <div
                    key={result.id}
                    className="p-3 hover:bg-accent cursor-pointer border-b last:border-b-0"
                    onClick={() => handleResultClick(result)}
                  >
                    <div className="flex items-start gap-3">
                      <FileText className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium text-sm truncate">{result.title}</h4>
                          <Badge 
                            variant="secondary" 
                            className={`text-xs ${ROLE_COLORS[result.minRole]}`}
                          >
                            {ROLE_LABELS[result.minRole]}
                          </Badge>
                        </div>
                        
                        <p className="text-xs text-muted-foreground mb-1">
                          {result.sectionTitle}
                        </p>
                        
                        {result.snippet && (
                          <p 
                            className="text-xs text-muted-foreground line-clamp-2"
                            dangerouslySetInnerHTML={{ __html: result.snippet }}
                          />
                        )}
                        
                        <div className="flex items-center gap-1 mt-2">
                          <Calendar className="h-3 w-3 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">
                            {formatDate(result.lastUpdatedAt)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Показать больше результатов */}
              {searchResults.hasMore && (
                <div className="p-3 border-t bg-muted/30 text-center">
                  <p className="text-xs text-muted-foreground">
                    Показано {searchResults.results.length} из {searchResults.total} результатов
                  </p>
                </div>
              )}
            </div>
          ) : searchResults && searchResults.results.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground">
              <Search className="h-6 w-6 mx-auto mb-2 opacity-50" />
              <p>Ничего не найдено</p>
              <p className="text-xs mt-1">Попробуйте изменить поисковый запрос</p>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
