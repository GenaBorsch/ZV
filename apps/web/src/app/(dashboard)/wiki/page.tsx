"use client";

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { WikiSidebar } from '@/components/wiki/WikiSidebar';
import { WikiSearch } from '@/components/wiki/WikiSearch';
import { WikiArticleView } from '@/components/wiki/WikiArticleView';
import { WikiArticlesListUser } from '@/components/wiki/WikiArticlesListUser';
import { Button } from '@/components/ui/button';
import { LogoutButton } from '@/components/LogoutButton';
import { NotificationBell } from '@/components/NotificationBell';
import { RoleSwitcher } from '@/components/RoleSwitcher';
import { MobileMenu } from '@/components/MobileMenu';
import { BookOpen, Menu, X, ArrowLeft } from 'lucide-react';
import type { 
  WikiSectionWithChildren, 
  WikiArticleWithDetails,
  SearchResponse 
} from '@zv/contracts';

function WikiPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { data: session } = useSession();
  const [sections, setSections] = useState<WikiSectionWithChildren[]>([]);
  const [selectedSection, setSelectedSection] = useState<WikiSectionWithChildren | null>(null);
  const [selectedArticle, setSelectedArticle] = useState<WikiArticleWithDetails | null>(null);
  const [articles, setArticles] = useState<WikiArticleWithDetails[]>([]);
  const [searchResults, setSearchResults] = useState<SearchResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [articlesLoading, setArticlesLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSearch, setShowSearch] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Определяем навигационные элементы в зависимости от ролей
  const userRoles = (session?.user as any)?.roles || [];
  const isMaster = userRoles.includes('MASTER') || userRoles.includes('MODERATOR') || userRoles.includes('SUPERADMIN');
  const isAdmin = userRoles.includes('MODERATOR') || userRoles.includes('SUPERADMIN');

  const navItems = isMaster 
    ? [
        { label: 'Кабинет мастера', href: '/master' },
        ...(isAdmin ? [{ label: 'Админ-панель', href: '/admin' }] : []),
        { label: 'Профиль', href: '/profile' },
      ]
    : [
        { label: 'Профиль', href: '/profile' },
      ];

  // Определяем URL для возврата назад и название роли
  const backUrl = isMaster ? '/master' : '/player';
  const roleLabel = isAdmin ? 'Модератор' : isMaster ? 'Мастер' : 'Игрок';

  // Функция для поиска раздела в дереве (рекурсивно)
  const findSectionInTree = (
    sections: WikiSectionWithChildren[],
    sectionId: string
  ): WikiSectionWithChildren | null => {
    for (const section of sections) {
      if (section.id === sectionId) {
        return section;
      }
      if (section.children && section.children.length > 0) {
        const found = findSectionInTree(section.children, sectionId);
        if (found) return found;
      }
    }
    return null;
  };

  // Загрузка разделов
  const loadSections = async () => {
    try {
      const response = await fetch('/api/wiki/sections');
      if (!response.ok) throw new Error('Failed to load sections');
      
      const data = await response.json();
      setSections(data.sections || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load sections');
    }
  };

  // Загрузка статей раздела
  const loadArticles = async (sectionId: string) => {
    setArticlesLoading(true);
    try {
      const response = await fetch(`/api/wiki/articles?sectionId=${sectionId}`);
      if (!response.ok) throw new Error('Failed to load articles');
      
      const data = await response.json();
      setArticles(data.articles || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load articles');
    } finally {
      setArticlesLoading(false);
    }
  };

  // Загрузка конкретной статьи
  const loadArticle = async (sectionId: string, slug: string) => {
    try {
      const response = await fetch(`/api/wiki/articles?sectionId=${sectionId}&slug=${slug}`);
      if (!response.ok) throw new Error('Failed to load article');
      
      const data = await response.json();
      setSelectedArticle(data.article);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load article');
    }
  };

  // Инициализация
  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await loadSections();
      setLoading(false);
    };
    init();
  }, []);

  // Обработка URL параметров
  useEffect(() => {
    const sectionId = searchParams.get('section');
    const articleSlug = searchParams.get('article');

    if (sectionId && articleSlug) {
      // Загружаем конкретную статью
      loadArticle(sectionId, articleSlug);
      // Устанавливаем раздел только если sections уже загружены
      if (sections.length > 0) {
        setSelectedSection(findSectionInTree(sections, sectionId));
      }
    } else if (sectionId) {
      // Загружаем список статей раздела
      loadArticles(sectionId);
      // Устанавливаем раздел только если sections уже загружены
      if (sections.length > 0) {
        setSelectedSection(findSectionInTree(sections, sectionId));
      }
      setSelectedArticle(null);
    } else {
      // Сбрасываем выбор
      setSelectedSection(null);
      setSelectedArticle(null);
      setArticles([]);
    }
  }, [searchParams]); // Убираем sections из зависимостей

  // Отдельный эффект для установки selectedSection когда sections загружены
  useEffect(() => {
    if (sections.length > 0) {
      const sectionId = searchParams.get('section');
      if (sectionId) {
        setSelectedSection(findSectionInTree(sections, sectionId));
      }
    }
  }, [sections, searchParams]);

  // Обработчики
  const handleSectionSelect = (section: WikiSectionWithChildren) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('section', section.id);
    params.delete('article');
    router.push(`/wiki?${params.toString()}`);
  };

  const handleArticleSelect = (article: WikiArticleWithDetails) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('section', article.sectionId);
    params.set('article', article.slug);
    router.push(`/wiki?${params.toString()}`);
  };

  const handleSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchResults(null);
      return;
    }

    try {
      const response = await fetch(`/api/wiki/search?q=${encodeURIComponent(query)}`);
      if (!response.ok) throw new Error('Search failed');
      
      const data = await response.json();
      setSearchResults(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed');
      // В случае ошибки показываем пустые результаты
      setSearchResults({ results: [], total: 0, page: 1, limit: 20, hasMore: false });
    }
  }, []);

  const handleBackToSections = () => {
    const url = new URL(window.location.href);
    url.searchParams.delete('section');
    url.searchParams.delete('article');
    window.history.pushState({}, '', url.toString());
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">Загрузка...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card shadow-sm border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2 md:space-x-4">
              <Link href={backUrl} className="text-muted-foreground hover:text-foreground">
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <div className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-foreground" />
                <h1 className="text-base md:text-xl font-semibold text-foreground">
                  База знаний
                </h1>
              </div>
              <span className="hidden md:block px-2 py-1 text-xs font-medium bg-accent/30 text-foreground rounded-full">
                {roleLabel}
              </span>
            </div>
            <nav className="flex items-center space-x-2 md:space-x-4">
              {/* Desktop navigation */}
              <NotificationBell className="hidden md:block text-muted-foreground hover:text-foreground" />
              <div className="hidden md:flex items-center space-x-4">
                <RoleSwitcher />
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    {item.label}
                  </Link>
                ))}
                <LogoutButton className="text-muted-foreground hover:text-foreground" />
              </div>
              {/* Mobile menu button (единственная кнопка на мобильных) */}
              <Button
                variant="ghost"
                size="sm"
                className="md:hidden"
                onClick={() => setSidebarOpen(!sidebarOpen)}
              >
                {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
            </nav>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Боковая панель */}
        <div className={`
          ${sidebarOpen ? 'block' : 'hidden'} md:block
          w-full md:w-80 border-r bg-card
          ${sidebarOpen ? 'fixed inset-0 z-50 md:relative' : ''}
        `}>
          {/* Шапка боковой панели для мобильных */}
          {sidebarOpen && (
            <div className="md:hidden border-b bg-card p-4 flex items-center justify-between">
              <div>
                <div className="font-semibold">{session?.user?.name || 'Пользователь'}</div>
                <div className="text-sm text-muted-foreground">{roleLabel}</div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSidebarOpen(false)}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
          )}
          
          <WikiSidebar
            sections={sections}
            selectedSection={selectedSection}
            onSectionSelect={(section) => {
              handleSectionSelect(section);
              // Закрываем sidebar на мобильных после выбора
              if (window.innerWidth < 768) {
                setSidebarOpen(false);
              }
            }}
            onSearch={handleSearch}
            searchResults={searchResults}
            onSearchResultSelect={(article) => {
              handleArticleSelect(article);
              // Закрываем sidebar на мобильных после выбора
              if (window.innerWidth < 768) {
                setSidebarOpen(false);
              }
            }}
            showSearch={showSearch}
            onSearchToggle={() => setShowSearch(!showSearch)}
          />
          
          {/* Навигационные ссылки для мобильных */}
          {sidebarOpen && (
            <div className="md:hidden border-t bg-card">
              <div className="p-4 space-y-2">
                <div className="pb-2 mb-2 border-b">
                  <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Навигация
                  </div>
                </div>
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="block px-3 py-2 rounded-md text-sm hover:bg-accent transition-colors"
                    onClick={() => setSidebarOpen(false)}
                  >
                    {item.label}
                  </Link>
                ))}
                <LogoutButton className="block px-3 py-2 rounded-md text-sm hover:bg-accent transition-colors text-left" />
              </div>
            </div>
          )}
        </div>

        {/* Основной контент */}
        <div className="flex-1 min-w-0">
          {error && (
            <div className="p-4 bg-destructive/10 border-b border-destructive/20">
              <p className="text-destructive text-sm">{error}</p>
            </div>
          )}

          {selectedArticle ? (
            // Просмотр статьи
            <WikiArticleView
              article={selectedArticle}
              onBack={() => {
                const url = new URL(window.location.href);
                url.searchParams.delete('article');
                window.history.pushState({}, '', url.toString());
              }}
            />
          ) : selectedSection ? (
            // Список статей раздела
            <div className="p-4 md:p-6">
              <div className="max-w-4xl mx-auto">
                <div className="mb-6">
                  <Button
                    variant="ghost"
                    onClick={handleBackToSections}
                    className="mb-4 -ml-2"
                  >
                    ← Назад к разделам
                  </Button>
                  <h1 className="text-xl md:text-2xl font-bold mb-2">{selectedSection.title}</h1>
                  <p className="text-sm text-muted-foreground">
                    {articles.length} {articles.length === 1 ? 'статья' : 'статей'}
                  </p>
                </div>

                <WikiArticlesListUser
                  articles={articles}
                  onArticleSelect={handleArticleSelect}
                  loading={articlesLoading}
                />
              </div>
            </div>
          ) : (
            // Главная страница вики
            <div className="p-4 md:p-6">
              <div className="max-w-4xl mx-auto text-center">
                <BookOpen className="h-12 md:h-16 w-12 md:w-16 mx-auto mb-4 md:mb-6 text-muted-foreground" />
                <h1 className="text-2xl md:text-3xl font-bold mb-3 md:mb-4">База знаний</h1>
                <p className="text-base md:text-lg text-muted-foreground mb-6 md:mb-8 px-4">
                  Выберите раздел в{' '}
                  <button
                    onClick={() => setSidebarOpen(true)}
                    className="md:hidden text-primary underline"
                  >
                    меню
                  </button>
                  <span className="hidden md:inline">боковой панели</span>
                  {' '}или воспользуйтесь поиском
                </p>

                {/* Поиск на главной странице */}
                <div className="max-w-md mx-auto px-4">
                  <WikiSearch
                    onSearch={handleSearch}
                    searchResults={searchResults}
                    onResultSelect={handleArticleSelect}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Оверлей для мобильной боковой панели */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}

export default function WikiPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground">Загрузка...</div>
      </div>
    }>
      <WikiPageContent />
    </Suspense>
  );
}
