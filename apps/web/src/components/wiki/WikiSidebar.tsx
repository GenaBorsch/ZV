"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { WikiSearch } from '@/components/wiki/WikiSearch';
import { 
  ChevronRight, 
  ChevronDown, 
  Folder, 
  FolderOpen, 
  BookOpen,
  Search
} from 'lucide-react';
import type { 
  WikiSectionWithChildren, 
  WikiArticleWithDetails,
  SearchResponse 
} from '@zv/contracts';

interface WikiSidebarProps {
  sections: WikiSectionWithChildren[];
  selectedSection: WikiSectionWithChildren | null;
  onSectionSelect: (section: WikiSectionWithChildren) => void;
  onSearch: (query: string) => void;
  searchResults: SearchResponse | null;
  onSearchResultSelect: (article: WikiArticleWithDetails) => void;
  showSearch: boolean;
  onSearchToggle: () => void;
}

interface SectionNodeProps {
  section: WikiSectionWithChildren;
  level: number;
  isSelected: boolean;
  onSelect: (section: WikiSectionWithChildren) => void;
  selectedSection: WikiSectionWithChildren | null;
}

function SectionNode({ section, level, isSelected, onSelect, selectedSection }: SectionNodeProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const hasChildren = section.children && section.children.length > 0;

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsExpanded(!isExpanded);
  };

  const handleSelect = () => {
    onSelect(section);
  };

  return (
    <div>
      <div
        className={`
          flex items-center gap-2 p-2 rounded-md cursor-pointer hover:bg-accent/50 transition-colors
          ${isSelected ? 'bg-accent' : ''}
        `}
        style={{ paddingLeft: `${level * 16 + 8}px` }}
        onClick={handleSelect}
      >
        {/* Кнопка раскрытия */}
        <Button
          variant="ghost"
          size="sm"
          className="h-5 w-5 p-0 flex-shrink-0"
          onClick={handleToggle}
        >
          {hasChildren ? (
            isExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />
          ) : (
            <div className="h-3 w-3" />
          )}
        </Button>

        {/* Иконка папки */}
        <div className="flex-shrink-0">
          {hasChildren && isExpanded ? (
            <FolderOpen className="h-4 w-4 text-muted-foreground" />
          ) : (
            <Folder className="h-4 w-4 text-muted-foreground" />
          )}
        </div>

        {/* Название раздела */}
        <span className="flex-1 text-sm truncate">
          {section.title}
        </span>

      </div>

      {/* Дочерние разделы */}
      {hasChildren && isExpanded && (
        <div>
          {section.children!.map((child) => (
            <SectionNode
              key={child.id}
              section={child}
              level={level + 1}
              isSelected={selectedSection?.id === child.id}
              onSelect={onSelect}
              selectedSection={selectedSection}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function WikiSidebar({
  sections,
  selectedSection,
  onSectionSelect,
  onSearch,
  searchResults,
  onSearchResultSelect,
  showSearch,
  onSearchToggle,
}: WikiSidebarProps) {
  return (
    <div className="h-screen flex flex-col">
      {/* Заголовок */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            <h2 className="font-semibold">База знаний</h2>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onSearchToggle}
            className="lg:hidden"
          >
            <Search className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Поиск */}
      <div className={`${showSearch ? 'block' : 'hidden lg:block'} p-4 border-b`}>
        <WikiSearch
          onSearch={onSearch}
          searchResults={searchResults}
          onResultSelect={onSearchResultSelect}
        />
      </div>

      {/* Разделы */}
      <div className="flex-1 overflow-y-auto p-4">
        {sections.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Folder className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Нет доступных разделов</p>
          </div>
        ) : (
          <div className="space-y-1">
            {sections.map((section) => (
              <SectionNode
                key={section.id}
                section={section}
                level={0}
                isSelected={selectedSection?.id === section.id}
                onSelect={onSectionSelect}
                selectedSection={selectedSection}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
