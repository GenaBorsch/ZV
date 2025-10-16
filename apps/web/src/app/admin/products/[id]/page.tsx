"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { FileUpload } from '@/components/FileUpload';
import { AdminHeader } from '@/components/AdminHeader';

export default function AdminEditProductPage() {
  const params = useParams() as { id: string };
  const router = useRouter();
  const [form, setForm] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      const res = await fetch(`/api/admin/products/${params.id}`);
      const data = await res.json();
      setForm(data.item);
    })();
  }, [params.id]);

  const update = (k: string, v: any) => setForm((s: any) => ({ ...s, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const payload = {
      sku: String(form.sku || ''),
      title: String(form.title || ''),
      description: form.description ?? '',
      imageUrl: form.imageUrl ?? '',
      priceRub: Number(form.priceRub ?? 0),
      bpUsesTotal: Number(form.bpUsesTotal ?? 1),
      sortIndex: Number(form.sortIndex ?? 0),
      active: Boolean(form.active),
      visible: Boolean(form.visible),
      seasonRequired: Boolean(form.seasonRequired),
    };
    const res = await fetch(`/api/admin/products/${params.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data?.error || 'Ошибка сохранения');
      setLoading(false);
      return;
    }
    router.push('/admin/products');
  };

  if (!form) return (
    <div className="min-h-screen bg-background">
      <AdminHeader 
        title="Редактировать оффер"
        backLink={{
          href: "/admin/products",
          label: "Офферы баттлпассов"
        }}
      />
      <main className="max-w-3xl mx-auto py-8 px-4">Загрузка...</main>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <AdminHeader 
        title="Редактировать оффер"
        backLink={{
          href: "/admin/products",
          label: "Офферы баттлпассов"
        }}
      />
      
      <main className="max-w-3xl mx-auto py-8 px-4">
      <form className="space-y-4" onSubmit={submit}>
        <div>
          <label className="block text-sm mb-1">SKU</label>
          <input className="input w-full" value={form.sku || ''} onChange={(e) => update('sku', e.target.value)} required />
        </div>
        <div>
          <label className="block text-sm mb-1">Название</label>
          <input className="input w-full" value={form.title || ''} onChange={(e) => update('title', e.target.value)} required />
        </div>
        <div>
          <label className="block text-sm mb-1">Описание</label>
          <textarea className="input w-full" value={form.description || ''} onChange={(e) => update('description', e.target.value)} />
        </div>
        <div>
          <label className="block text-sm mb-1">Изображение товара</label>
          <FileUpload
            type="product-image"
            value={form.imageUrl || undefined}
            onChange={(url) => update('imageUrl', url || '')}
            accept="image/*"
            maxSizeMB={10}
            disabled={loading}
            className="mt-2"
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm mb-1">Цена (₽)</label>
            <input type="number" className="input w-full" value={form.priceRub || 0} onChange={(e) => update('priceRub', Number(e.target.value))} min={0} required />
          </div>
          <div>
            <label className="block text-sm mb-1">Игры (bpUsesTotal)</label>
            <input type="number" className="input w-full" value={form.bpUsesTotal || 1} onChange={(e) => update('bpUsesTotal', Number(e.target.value))} min={1} required />
          </div>
          <div>
            <label className="block text-sm mb-1">Порядок (sortIndex)</label>
            <input type="number" className="input w-full" value={form.sortIndex || 0} onChange={(e) => update('sortIndex', Number(e.target.value))} />
          </div>
        </div>
        <div className="flex gap-4">
          <label className="flex items-center gap-2"><input type="checkbox" checked={!!form.active} onChange={(e) => update('active', e.target.checked)} /> Активен</label>
          <label className="flex items-center gap-2"><input type="checkbox" checked={!!form.visible} onChange={(e) => update('visible', e.target.checked)} /> Показывать</label>
          <label className="flex items-center gap-2"><input type="checkbox" checked={!!form.seasonRequired} onChange={(e) => update('seasonRequired', e.target.checked)} /> Требует сезона</label>
        </div>
        {error && <div className="text-sm text-red-600">{error}</div>}
        <div className="flex gap-2">
          <button type="submit" className="btn-primary" disabled={loading}>{loading ? 'Сохранение...' : 'Сохранить'}</button>
          <button type="button" className="btn-outline" onClick={() => history.back()}>Отмена</button>
        </div>
        <p className="text-xs text-muted-foreground mt-2">Изменение цены/количества игр влияет только на будущие покупки. Прошлые заказы используют снимок параметров на момент покупки.</p>
      </form>
      </main>
    </div>
  );
}
