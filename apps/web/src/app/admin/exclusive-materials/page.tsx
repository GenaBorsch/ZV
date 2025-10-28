'use client';

import { useState, useEffect } from 'react';
import { AdminHeader } from '@/components/AdminHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Edit, Trash2, Eye, EyeOff, Upload } from 'lucide-react';

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

export default function AdminExclusiveMaterialsPage() {
  const [materials, setMaterials] = useState<ExclusiveMaterial[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingMaterial, setEditingMaterial] = useState<ExclusiveMaterial | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    fileUrl: '',
    fileName: '',
    fileSize: 0,
    sortOrder: 0,
  });
  const [uploading, setUploading] = useState(false);

  // Загрузка материалов
  useEffect(() => {
    fetchMaterials();
  }, []);

  const fetchMaterials = async () => {
    try {
      const response = await fetch('/api/admin/exclusive-materials');
      if (response.ok) {
        const data = await response.json();
        setMaterials(data.materials || []);
      }
    } catch (error) {
      console.error('Error fetching materials:', error);
    } finally {
      setLoading(false);
    }
  };

  // Обработка загрузки файла
  const handleFileUpload = async (file: File) => {
    try {
      setUploading(true);
      
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', 'exclusive-material');

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        setFormData(prev => ({
          ...prev,
          fileUrl: data.data.url,
          fileName: file.name,
          fileSize: file.size,
        }));
      } else {
        const error = await response.json();
        alert(error.error || 'Ошибка загрузки файла');
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('Ошибка загрузки файла');
    } finally {
      setUploading(false);
    }
  };

  // Сохранение материала
  const handleSave = async () => {
    if (!formData.title || !formData.fileUrl) {
      alert('Заполните все обязательные поля');
      return;
    }

    try {
      let response;
      if (editingMaterial) {
        // Обновление
        response = await fetch(`/api/admin/exclusive-materials/${editingMaterial.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
      } else {
        // Создание
        response = await fetch('/api/admin/exclusive-materials', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
      }

      if (response.ok) {
        await fetchMaterials();
        setIsModalOpen(false);
        setEditingMaterial(null);
        setFormData({
          title: '',
          fileUrl: '',
          fileName: '',
          fileSize: 0,
          sortOrder: 0,
        });
      } else {
        const error = await response.json();
        alert(error.error || 'Ошибка сохранения');
      }
    } catch (error) {
      console.error('Error saving material:', error);
      alert('Ошибка сохранения');
    }
  };

  // Удаление материала
  const handleDelete = async (id: string) => {
    if (!confirm('Вы уверены, что хотите удалить этот материал?')) return;

    try {
      const response = await fetch(`/api/admin/exclusive-materials/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await fetchMaterials();
      } else {
        alert('Ошибка удаления');
      }
    } catch (error) {
      console.error('Error deleting material:', error);
      alert('Ошибка удаления');
    }
  };

  // Переключение видимости
  const handleToggleVisibility = async (material: ExclusiveMaterial) => {
    try {
      const response = await fetch(`/api/admin/exclusive-materials/${material.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...material,
          isVisible: !material.isVisible,
        }),
      });

      if (response.ok) {
        await fetchMaterials();
      }
    } catch (error) {
      console.error('Error toggling visibility:', error);
    }
  };

  // Редактирование
  const handleEdit = (material: ExclusiveMaterial) => {
    setEditingMaterial(material);
    setFormData({
      title: material.title,
      fileUrl: material.fileUrl,
      fileName: material.fileName,
      fileSize: material.fileSize || 0,
      sortOrder: material.sortOrder,
    });
    setIsModalOpen(true);
  };

  // Форматирование размера файла
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
      <AdminHeader
        title="Эксклюзивные материалы"
        subtitle="Управление PDF материалами для игроков с баттлпассами"
        backLink={{
          href: '/admin',
          label: 'Админ-панель'
        }}
        actions={
          <Button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Добавить материал
          </Button>
        }
      />

      <main className="container mx-auto py-6 px-4">
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="text-muted-foreground">Загрузка...</div>
          </div>
        ) : materials.length === 0 ? (
          <div className="card p-8 text-center">
            <p className="text-muted-foreground mb-4">Материалов пока нет</p>
            <Button onClick={() => setIsModalOpen(true)}>
              Создать первый материал
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {materials.map((material) => (
              <div key={material.id} className="card p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold text-foreground">{material.title}</h3>
                      {material.isVisible ? (
                        <Eye className="h-4 w-4 text-green-600" />
                      ) : (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      {material.fileName} • {formatFileSize(material.fileSize)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Создан: {new Date(material.createdAt).toLocaleDateString('ru-RU')}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleToggleVisibility(material)}
                      title={material.isVisible ? 'Скрыть' : 'Показать'}
                    >
                      {material.isVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(material)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(material.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Модальное окно */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-background rounded-lg max-w-2xl w-full p-6">
            <h2 className="text-xl font-semibold mb-4">
              {editingMaterial ? 'Редактировать материал' : 'Создать материал'}
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Название
                </label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Название материала"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Порядок сортировки
                </label>
                <Input
                  type="number"
                  value={formData.sortOrder}
                  onChange={(e) => setFormData(prev => ({ ...prev, sortOrder: parseInt(e.target.value) || 0 }))}
                  placeholder="0"
                />
              </div>

              {!formData.fileUrl && (
                <div>
                  <label className="block text-sm font-medium mb-2">
                    PDF файл
                  </label>
                  <div
                    className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors hover:border-gray-400"
                    onClick={() => {
                      const input = document.createElement('input');
                      input.type = 'file';
                      input.accept = 'application/pdf';
                      input.onchange = (e: any) => {
                        if (e.target.files && e.target.files[0]) {
                          handleFileUpload(e.target.files[0]);
                        }
                      };
                      input.click();
                    }}
                  >
                    <div className="flex flex-col items-center space-y-2">
                      <Upload className="h-8 w-8 text-gray-400" />
                      <div className="text-sm text-gray-600">
                        <p>Перетащите файл сюда или <span className="text-primary">выберите файл</span></p>
                        <p className="text-xs text-gray-500 mt-1">
                          Разрешен формат: PDF
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {formData.fileUrl && (
                <div className="p-4 bg-accent rounded-lg">
                  <p className="text-sm font-medium text-foreground mb-1">
                    Файл: {formData.fileName}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Размер: {formatFileSize(formData.fileSize)}
                  </p>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <Button variant="outline" onClick={() => {
                setIsModalOpen(false);
                setEditingMaterial(null);
                setFormData({
                  title: '',
                  fileUrl: '',
                  fileName: '',
                  fileSize: 0,
                  sortOrder: 0,
                });
              }}>
                Отмена
              </Button>
              <Button onClick={handleSave} disabled={uploading}>
                {uploading ? 'Загрузка...' : 'Сохранить'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

