"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminNewProductPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    sku: '',
    title: '',
    description: '',
    priceRub: 0,
    bpUsesTotal: 1,
    active: true,
    visible: true,
    sortIndex: 0,
    seasonRequired: false,
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await fetch('/api/admin/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'BATTLEPASS', ...form }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data?.error || 'Ошибка сохранения');
      setLoading(false);
      return;
    }
    router.push('/admin/products');
  };

  const update = (k: string, v: any) => setForm((s) => ({ ...s, [k]: v }));

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      <h1 className="text-2xl font-semibold text-foreground mb-4">Создать оффер (BATTLEPASS)</h1>
      <form className="space-y-4" onSubmit={submit}>
        <div>
          <label className="block text-sm mb-1">SKU</label>
          <input className="input w-full" value={form.sku} onChange={(e) => update('sku', e.target.value)} required />
        </div>
        <div>
          <label className="block text-sm mb-1">Название</label>
          <input className="input w-full" value={form.title} onChange={(e) => update('title', e.target.value)} required />
        </div>
        <div>
          <label className="block text-sm mb-1">Описание</label>
          <textarea className="input w-full" value={form.description} onChange={(e) => update('description', e.target.value)} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm mb-1">Цена (₽)</label>
            <input type="number" className="input w-full" value={form.priceRub} onChange={(e) => update('priceRub', Number(e.target.value))} min={0} required />
          </div>
          <div>
            <label className="block text-sm mb-1">Игры (bpUsesTotal)</label>
            <input type="number" className="input w-full" value={form.bpUsesTotal} onChange={(e) => update('bpUsesTotal', Number(e.target.value))} min={1} required />
          </div>
          <div>
            <label className="block text-sm mb-1">Порядок (sortIndex)</label>
            <input type="number" className="input w-full" value={form.sortIndex} onChange={(e) => update('sortIndex', Number(e.target.value))} />
          </div>
        </div>
        <div className="flex gap-4">
          <label className="flex items-center gap-2"><input type="checkbox" checked={form.active} onChange={(e) => update('active', e.target.checked)} /> Активен</label>
          <label className="flex items-center gap-2"><input type="checkbox" checked={form.visible} onChange={(e) => update('visible', e.target.checked)} /> Показывать</label>
          <label className="flex items-center gap-2"><input type="checkbox" checked={form.seasonRequired} onChange={(e) => update('seasonRequired', e.target.checked)} /> Требует сезона</label>
        </div>
        {error && <div className="text-sm text-red-600">{error}</div>}
        <div className="flex gap-2">
          <button type="submit" className="btn-primary" disabled={loading}>{loading ? 'Сохранение...' : 'Сохранить'}</button>
          <button type="button" className="btn-outline" onClick={() => history.back()}>Отмена</button>
        </div>
      </form>
    </div>
  );
}

