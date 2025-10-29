"use client";

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { 
  Bold, 
  Italic, 
  List, 
  ListOrdered, 
  Link, 
  Image, 
  Heading2,
  Heading3,
  Eye,
  EyeOff
} from 'lucide-react';
import { FileUpload } from '@/components/FileUpload';
import ReactMarkdown from 'react-markdown';

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export function MarkdownEditor({ value, onChange, disabled = false }: MarkdownEditorProps) {
  const [showPreview, setShowPreview] = useState(false);
  const [showImageUpload, setShowImageUpload] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Вставка текста в позицию курсора
  const insertText = (before: string, after: string = '', placeholder: string = '') => {
    if (!textareaRef.current) return;

    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);
    const textToInsert = selectedText || placeholder;
    
    const newValue = 
      value.substring(0, start) + 
      before + textToInsert + after + 
      value.substring(end);
    
    onChange(newValue);

    // Восстанавливаем фокус и позицию курсора
    setTimeout(() => {
      textarea.focus();
      const newCursorPos = start + before.length + textToInsert.length;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  // Обработчики для кнопок форматирования
  const handleBold = () => insertText('**', '**', 'жирный текст');
  const handleItalic = () => insertText('*', '*', 'курсив');
  const handleH2 = () => insertText('## ', '', 'Заголовок 2');
  const handleH3 = () => insertText('### ', '', 'Заголовок 3');
  const handleList = () => insertText('- ', '', 'элемент списка');
  const handleOrderedList = () => insertText('1. ', '', 'элемент списка');
  const handleLink = () => insertText('[', '](https://example.com)', 'текст ссылки');

  // Функция для преобразования MinIO URL в API URL
  const convertMinioUrlToApiUrl = (url: string): string => {
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
  };

  // Обработчик загрузки изображения
  const handleImageUpload = (imageUrl: string | null) => {
    if (imageUrl) {
      insertText(`![Описание изображения](${imageUrl})`);
    }
    setShowImageUpload(false);
  };

  return (
    <div className="border rounded-lg overflow-hidden">
      {/* Панель инструментов */}
      <div className="flex items-center gap-1 p-2 border-b bg-muted/30">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleBold}
          disabled={disabled}
          title="Жирный (Ctrl+B)"
        >
          <Bold className="h-4 w-4" />
        </Button>
        
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleItalic}
          disabled={disabled}
          title="Курсив (Ctrl+I)"
        >
          <Italic className="h-4 w-4" />
        </Button>

        <div className="w-px h-6 bg-border mx-1" />

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleH2}
          disabled={disabled}
          title="Заголовок 2"
        >
          <Heading2 className="h-4 w-4" />
        </Button>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleH3}
          disabled={disabled}
          title="Заголовок 3"
        >
          <Heading3 className="h-4 w-4" />
        </Button>

        <div className="w-px h-6 bg-border mx-1" />

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleList}
          disabled={disabled}
          title="Маркированный список"
        >
          <List className="h-4 w-4" />
        </Button>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleOrderedList}
          disabled={disabled}
          title="Нумерованный список"
        >
          <ListOrdered className="h-4 w-4" />
        </Button>

        <div className="w-px h-6 bg-border mx-1" />

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleLink}
          disabled={disabled}
          title="Ссылка"
        >
          <Link className="h-4 w-4" />
        </Button>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setShowImageUpload(true)}
          disabled={disabled}
          title="Изображение"
        >
          <Image className="h-4 w-4" />
        </Button>

        <div className="flex-1" />

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setShowPreview(!showPreview)}
          disabled={disabled}
          title={showPreview ? "Скрыть предпросмотр" : "Показать предпросмотр"}
        >
          {showPreview ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </Button>
      </div>

      {/* Область редактирования */}
      <div className={`grid ${showPreview ? 'grid-cols-2' : 'grid-cols-1'} min-h-[400px]`}>
        {/* Редактор */}
        <div className={showPreview ? 'border-r' : ''}>
          <Textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Введите текст статьи в формате Markdown..."
            className="min-h-[400px] border-0 rounded-none resize-none focus-visible:ring-0"
            disabled={disabled}
          />
        </div>

        {/* Предпросмотр */}
        {showPreview && (
          <div className="p-4 overflow-y-auto bg-background">
            <div className="prose prose-sm max-w-none dark:prose-invert">
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
                {value || '*Предпросмотр появится здесь...*'}
              </ReactMarkdown>
            </div>
          </div>
        )}
      </div>

      {/* Модальное окно загрузки изображения */}
      {showImageUpload && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background border rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Загрузить изображение</h3>
            
            <FileUpload
              type="wiki-image"
              value={null}
              onChange={handleImageUpload}
              accept="image/*"
              maxSizeMB={10}
            />

            <div className="flex justify-end gap-2 mt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowImageUpload(false)}
              >
                Отмена
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
