'use client';

import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X, File, Image, AlertCircle, CheckCircle, FileText, FileSpreadsheet, Presentation } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';

export interface FileUploadProps {
  type: 'avatar' | 'character-avatar' | 'character-sheet' | 'product-image' | 'report-attachment';
  value?: string;
  onChange: (url: string | null) => void;
  className?: string;
  disabled?: boolean;
  accept?: string;
  maxSizeMB?: number;
  multiple?: boolean;
}

interface UploadedFile {
  url: string;
  key: string;
  bucket: string;
  originalName: string;
  size: number;
  type: string;
}

export function FileUpload({
  type,
  value,
  onChange,
  className,
  disabled = false,
  accept,
  maxSizeMB = 10,
  multiple = false,
}: FileUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  const uploadFile = async (file: File): Promise<UploadedFile> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);

    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Ошибка загрузки файла');
    }

    const result = await response.json();
    return result.data;
  };

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (disabled || acceptedFiles.length === 0) return;

    setError(null);
    setSuccess(null);
    setIsUploading(true);
    setUploadProgress(0);

    try {
      const file = acceptedFiles[0]; // Берем первый файл
      
      // Симуляция прогресса загрузки
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      const result = await uploadFile(file);
      
      clearInterval(progressInterval);
      setUploadProgress(100);
      
      // Обновляем значение
      onChange(result.url);
      setFileName(result.originalName);
      setSuccess(`Файл "${result.originalName}" успешно загружен`);
      
      // Очищаем сообщения через 3 секунды
      setTimeout(() => {
        setSuccess(null);
        setUploadProgress(0);
      }, 3000);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка загрузки файла');
      setUploadProgress(0);
    } finally {
      setIsUploading(false);
    }
  }, [disabled, onChange, type]);

  const removeFile = async () => {
    if (!value || disabled) return;

    try {
      // Если есть информация о файле, удаляем его из MinIO
      // Пока просто очищаем значение
      onChange(null);
      setFileName(null);
      setSuccess('Файл удален');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка удаления файла');
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    disabled: disabled || isUploading,
    accept: accept ? { [accept]: [] } : undefined,
    maxSize: maxSizeMB * 1024 * 1024,
    multiple: false, // Пока поддерживаем только одиночную загрузку
    onDropRejected: (rejectedFiles) => {
      const file = rejectedFiles[0];
      if (file.errors[0]?.code === 'file-too-large') {
        setError(`Файл слишком большой. Максимальный размер: ${maxSizeMB}МБ`);
      } else if (file.errors[0]?.code === 'file-invalid-type') {
        setError('Неподдерживаемый тип файла');
      } else {
        setError('Ошибка при выборе файла');
      }
    }
  });

  const isImage = (url: string) => {
    return /\.(jpg|jpeg|png|gif|webp)$/i.test(url);
  };

  const getFileIcon = (url: string) => {
    const extension = url.split('.').pop()?.toLowerCase();
    
    switch (extension) {
      case 'pdf':
        return <FileText className="h-6 w-6 text-red-500" />;
      case 'doc':
      case 'docx':
        return <FileText className="h-6 w-6 text-blue-500" />;
      case 'xls':
      case 'xlsx':
      case 'csv':
        return <FileSpreadsheet className="h-6 w-6 text-green-500" />;
      case 'ppt':
      case 'pptx':
        return <Presentation className="h-6 w-6 text-orange-500" />;
      case 'odt':
      case 'ods':
      case 'odp':
        return <FileText className="h-6 w-6 text-purple-500" />;
      case 'rtf':
      case 'txt':
        return <FileText className="h-6 w-6 text-gray-500" />;
      default:
        return <File className="h-6 w-6 text-gray-500" />;
    }
  };

  const handleFileClick = async () => {
    if (value) {
      try {
        // Для изображений просто открываем в новой вкладке
        if (isImage(value)) {
          window.open(value, '_blank');
          return;
        }
        
        // Для других файлов используем наш API для получения безопасной ссылки
        const response = await fetch(`/api/download?url=${encodeURIComponent(value)}`);
        
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.downloadUrl) {
            // Используем presigned URL для скачивания
            const link = document.createElement('a');
            link.href = data.downloadUrl;
            link.download = fileName || data.fileName || 'download';
            link.target = '_blank';
            
            // Добавляем ссылку в DOM, кликаем и удаляем
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
          } else {
            throw new Error(data.error || 'Не удалось получить ссылку для скачивания');
          }
        } else {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Ошибка при получении файла');
        }
      } catch (error) {
        console.error('Ошибка при скачивании файла:', error);
        alert(`Ошибка при скачивании файла: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`);
      }
    }
  };

  return (
    <div className={cn('space-y-4', className)}>
      {/* Область загрузки */}
      {!value && (
        <div
          {...getRootProps()}
          className={cn(
            'border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors',
            isDragActive ? 'border-primary bg-primary/5' : 'border-gray-300 hover:border-gray-400',
            disabled && 'opacity-50 cursor-not-allowed',
            isUploading && 'pointer-events-none'
          )}
        >
          <input {...getInputProps()} />
          
          <div className="flex flex-col items-center space-y-2">
            <Upload className="h-8 w-8 text-gray-400" />
            <div className="text-sm text-gray-600">
              {isDragActive ? (
                <p>Отпустите файл для загрузки...</p>
              ) : (
                <div>
                  <p>Перетащите файл сюда или <span className="text-primary">выберите файл</span></p>
                  <p className="text-xs text-gray-500 mt-1">
                    Максимальный размер: {maxSizeMB}МБ
                  </p>
                  {type === 'character-sheet' && (
                    <p className="text-xs text-gray-500 mt-1">
                      Поддерживаемые форматы: PDF, Word, Excel, PowerPoint, OpenDocument, RTF, CSV, TXT, изображения
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Прогресс загрузки */}
      {isUploading && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span>Загрузка файла...</span>
            <span>{uploadProgress}%</span>
          </div>
          <Progress value={uploadProgress} className="w-full" />
        </div>
      )}

      {/* Загруженный файл */}
      {value && !isUploading && (
        <div className="border rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div 
              className="flex items-center space-x-3 flex-1 cursor-pointer hover:bg-gray-50 rounded p-2 -m-2 transition-colors"
              onClick={handleFileClick}
            >
              {isImage(value) ? (
                <div className="relative">
                  <img
                    src={value}
                    alt="Uploaded file"
                    className="h-12 w-12 object-cover rounded"
                  />
                </div>
              ) : (
                <div className="h-12 w-12 bg-gray-100 rounded flex items-center justify-center">
                  {getFileIcon(value)}
                </div>
              )}
              
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {fileName || 'Файл загружен'}
                </p>
                <p className="text-xs text-gray-500">
                  Нажмите для скачивания
                </p>
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={removeFile}
              disabled={disabled}
              className="ml-2"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Сообщения об ошибках и успехе */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}
    </div>
  );
}
