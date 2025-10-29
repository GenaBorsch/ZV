"use client";

import { useState, useEffect } from 'react';
import { AdminHeader } from '@/components/AdminHeader';
import { WikiSectionsTree } from '@/components/wiki/WikiSectionsTree';
import { WikiArticlesList } from '@/components/wiki/WikiArticlesList';
import { WikiSectionForm } from '@/components/wiki/WikiSectionForm';
import { WikiArticleForm } from '@/components/wiki/WikiArticleForm';
import { Button } from '@/components/ui/button';
import { Plus, FolderPlus, FileText } from 'lucide-react';
import type { WikiSectionWithChildren, WikiArticleWithDetails } from '@zv/contracts';

export default function AdminWikiPage() {
  const [sections, setSections] = useState<WikiSectionWithChildren[]>([]);
  const [selectedSection, setSelectedSection] = useState<WikiSectionWithChildren | null>(null);
  const [articles, setArticles] = useState<WikiArticleWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Модальные окна
  const [showSectionForm, setShowSectionForm] = useState(false);
  const [showArticleForm, setShowArticleForm] = useState(false);
  const [editingSection, setEditingSection] = useState<WikiSectionWithChildren | null>(null);
  const [parentSection, setParentSection] = useState<WikiSectionWithChildren | null>(null);
  const [editingArticle, setEditingArticle] = useState<WikiArticleWithDetails | null>(null);

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
    try {
      const response = await fetch(`/api/wiki/articles?sectionId=${sectionId}`);
      if (!response.ok) throw new Error('Failed to load articles');
      
      const data = await response.json();
      setArticles(data.articles || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load articles');
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

  // Загрузка статей при выборе раздела
  useEffect(() => {
    if (selectedSection) {
      loadArticles(selectedSection.id);
    } else {
      setArticles([]);
    }
  }, [selectedSection]);

  // Обработчики
  const handleSectionSelect = (section: WikiSectionWithChildren) => {
    setSelectedSection(section);
  };

  const handleCreateSection = (parentSection?: WikiSectionWithChildren) => {
    setEditingSection(null); // Для создания всегда null
    setParentSection(parentSection || null); // Отдельно храним родительский раздел
    setShowSectionForm(true);
  };

  const handleEditSection = (section: WikiSectionWithChildren) => {
    setEditingSection(section);
    setParentSection(null); // При редактировании родителя нет
    setShowSectionForm(true);
  };

  const handleCreateArticle = () => {
    if (!selectedSection) return;
    setEditingArticle(null);
    setShowArticleForm(true);
  };

  const handleEditArticle = (article: WikiArticleWithDetails) => {
    setEditingArticle(article);
    setShowArticleForm(true);
  };

  const handleSectionSaved = () => {
    setShowSectionForm(false);
    setEditingSection(null);
    setParentSection(null);
    loadSections();
  };

  const handleArticleSaved = () => {
    setShowArticleForm(false);
    setEditingArticle(null);
    if (selectedSection) {
      loadArticles(selectedSection.id);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <AdminHeader 
          title="База знаний"
          backLink={{
            href: "/admin",
            label: "Админ-панель"
          }}
        />
        <main className="max-w-7xl mx-auto py-8 px-4">
          <div className="flex items-center justify-center h-64">
            <div className="text-muted-foreground">Загрузка...</div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <AdminHeader 
        title="База знаний"
        backLink={{
          href: "/admin",
          label: "Админ-панель"
        }}
        actions={
          <div className="flex gap-2">
            <Button
              onClick={() => handleCreateSection()}
              variant="outline"
              size="sm"
            >
              <FolderPlus className="h-4 w-4 mr-2" />
              Создать раздел
            </Button>
            {selectedSection && (
              <Button
                onClick={handleCreateArticle}
                size="sm"
              >
                <FileText className="h-4 w-4 mr-2" />
                Создать статью
              </Button>
            )}
          </div>
        }
      />
      
      <main className="max-w-7xl mx-auto py-8 px-4">
        {error && (
          <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
            <p className="text-destructive">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Дерево разделов */}
          <div className="lg:col-span-1">
            <div className="bg-card border rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Разделы</h2>
                <Button
                  onClick={() => handleCreateSection()}
                  variant="ghost"
                  size="sm"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              
              <WikiSectionsTree
                sections={sections}
                selectedSection={selectedSection}
                onSectionSelect={handleSectionSelect}
                onSectionEdit={handleEditSection}
                onSectionCreate={handleCreateSection}
              />
            </div>
          </div>

          {/* Список статей */}
          <div className="lg:col-span-2">
            <div className="bg-card border rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">
                  {selectedSection ? `Статьи в разделе "${selectedSection.title}"` : 'Выберите раздел'}
                </h2>
                {selectedSection && (
                  <Button
                    onClick={handleCreateArticle}
                    variant="ghost"
                    size="sm"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                )}
              </div>

              {selectedSection ? (
                <WikiArticlesList
                  articles={articles}
                  onArticleEdit={handleEditArticle}
                />
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Выберите раздел для просмотра статей</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Модальные окна */}
      {showSectionForm && (
        <WikiSectionForm
          section={editingSection}
          parentSection={parentSection}
          onSave={handleSectionSaved}
          onCancel={() => {
            setShowSectionForm(false);
            setEditingSection(null);
            setParentSection(null);
          }}
        />
      )}

      {showArticleForm && selectedSection && (
        <WikiArticleForm
          article={editingArticle}
          section={selectedSection}
          onSave={handleArticleSaved}
          onCancel={() => {
            setShowArticleForm(false);
            setEditingArticle(null);
          }}
        />
      )}
    </div>
  );
}
