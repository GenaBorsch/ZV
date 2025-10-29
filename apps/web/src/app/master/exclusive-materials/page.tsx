'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Download, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ExclusiveMaterial {
  id: string;
  title: string;
  fileUrl: string;
  fileName: string;
  fileSize: number | null;
  isVisible: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export default function MasterExclusiveMaterialsPage() {
  const [materials, setMaterials] = useState<ExclusiveMaterial[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMaterials();
  }, []);

  const fetchMaterials = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/master/exclusive-materials');
      if (response.ok) {
        const data = await response.json();
        setMaterials(data.materials || []);
      } else {
        console.error('Failed to fetch materials:', response.statusText);
      }
    } catch (error) {
      console.error('Ошибка загрузки материалов:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (fileUrl: string, fileName: string) => {
    try {
      const response = await fetch(`/api/download?url=${encodeURIComponent(fileUrl)}`);
      if (response.ok) {
        const data = await response.json();
        if (data.downloadUrl) {
          const link = document.createElement('a');
          link.href = data.downloadUrl;
          link.download = fileName;
          link.target = '_blank';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        }
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'Ошибка при скачивании файла');
      }
    } catch (error) {
      console.error('Ошибка при скачивании файла:', error);
      alert('Ошибка при скачивании файла');
    }
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return '0 Б';
    const mb = bytes / (1024 * 1024);
    if (mb >= 1) return `${mb.toFixed(2)} МБ`;
    const kb = bytes / 1024;
    if (kb >= 1) return `${kb.toFixed(2)} КБ`;
    return `${bytes} Б`;
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card shadow-sm border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Link 
                href="/master"
                className="text-muted-foreground hover:text-foreground flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                <span className="hidden md:inline">Вернуться</span>
              </Link>
              <div>
                <h1 className="text-base md:text-xl font-semibold text-foreground">
                  🎁 Дополнительные материалы
                </h1>
                <p className="text-xs md:text-sm text-muted-foreground">
                  Эксклюзивные PDF материалы для мастеров
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Загрузка...</p>
            </div>
          </div>
        ) : materials.length === 0 ? (
          <div className="card p-8 text-center">
            <div className="mb-4 text-6xl">📄</div>
            <h2 className="text-xl font-semibold text-foreground mb-4">
              Материалы пока не добавлены
            </h2>
            <p className="text-muted-foreground">
              Эксклюзивные материалы появятся здесь в ближайшее время.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-foreground">
                  Доступные материалы
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Всего материалов: {materials.length}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {materials.map((material) => (
                <div key={material.id} className="card p-6 hover:shadow-lg transition-shadow">
                  <div className="flex items-start mb-4">
                    <div className="flex-shrink-0 mr-3">
                      <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center">
                        <FileText className="h-6 w-6 text-red-600 dark:text-red-400" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-foreground mb-1 line-clamp-2">
                        {material.title}
                      </h3>
                      <p className="text-xs text-muted-foreground truncate">
                        {material.fileName}
                      </p>
                    </div>
                  </div>

                  <div className="mb-4">
                    <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
                      <span>Размер:</span>
                      <span className="font-medium">{formatFileSize(material.fileSize)}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span>Добавлено:</span>
                      <span>{new Date(material.createdAt).toLocaleDateString('ru-RU')}</span>
                    </div>
                  </div>

                  <Button
                    onClick={() => handleDownload(material.fileUrl, material.fileName)}
                    className="w-full flex items-center justify-center gap-2"
                  >
                    <Download className="h-4 w-4" />
                    Скачать
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

