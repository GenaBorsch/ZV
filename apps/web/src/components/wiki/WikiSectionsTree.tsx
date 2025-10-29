"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { 
  ChevronRight, 
  ChevronDown, 
  Folder, 
  FolderOpen, 
  Plus, 
  Edit, 
  Trash2,
  MoreHorizontal 
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { WikiSectionWithChildren } from '@zv/contracts';

interface WikiSectionsTreeProps {
  sections: WikiSectionWithChildren[];
  selectedSection: WikiSectionWithChildren | null;
  onSectionSelect: (section: WikiSectionWithChildren) => void;
  onSectionEdit: (section: WikiSectionWithChildren) => void;
  onSectionCreate: (parentSection?: WikiSectionWithChildren) => void;
}

interface SectionNodeProps {
  section: WikiSectionWithChildren;
  level: number;
  isSelected: boolean;
  onSelect: (section: WikiSectionWithChildren) => void;
  onEdit: (section: WikiSectionWithChildren) => void;
  onCreate: (parentSection: WikiSectionWithChildren) => void;
  onDelete: (section: WikiSectionWithChildren) => void;
}

function SectionNode({ 
  section, 
  level, 
  isSelected, 
  onSelect, 
  onEdit, 
  onCreate,
  onDelete 
}: SectionNodeProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const hasChildren = section.children && section.children.length > 0;

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsExpanded(!isExpanded);
  };

  const handleSelect = () => {
    onSelect(section);
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit(section);
  };

  const handleCreate = (e: React.MouseEvent) => {
    e.stopPropagation();
    onCreate(section);
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!confirm(`Вы уверены, что хотите удалить раздел "${section.title}"? Это также удалит все вложенные разделы и статьи.`)) {
      return;
    }

    onDelete(section);
  };

  return (
    <div>
      <div
        className={`
          flex items-center gap-1 p-2 rounded-md cursor-pointer hover:bg-accent/50 transition-colors
          ${isSelected ? 'bg-accent' : ''}
        `}
        style={{ paddingLeft: `${level * 16 + 8}px` }}
        onClick={handleSelect}
      >
        {/* Кнопка раскрытия */}
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0"
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


        {/* Меню действий */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100"
              onClick={(e) => e.stopPropagation()}
            >
              <MoreHorizontal className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={handleEdit}>
              <Edit className="h-4 w-4 mr-2" />
              Редактировать
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleCreate}>
              <Plus className="h-4 w-4 mr-2" />
              Создать подраздел
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={handleDelete}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Удалить
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Дочерние разделы */}
      {hasChildren && isExpanded && (
        <div>
          {section.children!.map((child) => (
            <SectionNode
              key={child.id}
              section={child}
              level={level + 1}
              isSelected={isSelected}
              onSelect={onSelect}
              onEdit={onEdit}
              onCreate={onCreate}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function WikiSectionsTree({
  sections,
  selectedSection,
  onSectionSelect,
  onSectionEdit,
  onSectionCreate,
}: WikiSectionsTreeProps) {
  const [loading, setLoading] = useState(false);

  const handleDelete = async (section: WikiSectionWithChildren) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/wiki/sections/${section.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete section');
      }

      // Обновляем дерево разделов
      window.location.reload(); // Простое решение для обновления
    } catch (error) {
      console.error('Error deleting section:', error);
      alert(error instanceof Error ? error.message : 'Ошибка при удалении раздела');
    } finally {
      setLoading(false);
    }
  };

  if (sections.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Folder className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">Нет разделов</p>
        <Button
          onClick={() => onSectionCreate()}
          variant="ghost"
          size="sm"
          className="mt-2"
        >
          <Plus className="h-4 w-4 mr-2" />
          Создать первый раздел
        </Button>
      </div>
    );
  }

  return (
    <div className={`space-y-1 ${loading ? 'opacity-50 pointer-events-none' : ''}`}>
      {sections.map((section) => (
        <div key={section.id} className="group">
          <SectionNode
            section={section}
            level={0}
            isSelected={selectedSection?.id === section.id}
            onSelect={onSectionSelect}
            onEdit={onSectionEdit}
            onCreate={onSectionCreate}
            onDelete={handleDelete}
          />
        </div>
      ))}
    </div>
  );
}
