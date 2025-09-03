import Link from 'next/link';
import { db, products, and, eq, ilike, or } from '@zv/db';
import { ProductImage } from '@/components/ProductImage';

async function getData(searchParams: Record<string, string | string[] | undefined>) {
  const q = (searchParams.q as string) || '';
  const active = searchParams.active as string | undefined;
  const visible = searchParams.visible as string | undefined;
  const where = [eq(products.type, 'BATTLEPASS' as any)];
  if (q) where.push(or(ilike(products.sku, `%${q}%`), ilike(products.title, `%${q}%`)));
  if (active === 'true' || active === 'false') where.push(eq(products.active, active === 'true'));
  if (visible === 'true' || visible === 'false') where.push(eq(products.visible, visible === 'true'));
  const condition = where.length > 1 ? and(...where as any) : where[0];
  const list = await db.select().from(products).where(condition as any);
  return (list as any[]).sort((a, b) => (a.sortIndex - b.sortIndex) || String(a.title || '').localeCompare(String(b.title || ''), 'ru'));
}

export default async function AdminProductsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const items = await getData(sp);
  return (
    <div className="max-w-6xl mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold text-foreground">Офферы баттлпассов</h1>
        <Link href="/admin/products/new" className="btn-primary">Создать оффер</Link>
      </div>
      <div className="mb-4 flex gap-2">
        <form className="flex gap-2">
          <input name="q" placeholder="Поиск SKU/Название" defaultValue={(sp.q as string) || ''} className="input" />
          <select name="active" defaultValue={(sp.active as string) || ''} className="input">
            <option value="">Активность</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
          <select name="visible" defaultValue={(sp.visible as string) || ''} className="input">
            <option value="">Видимость</option>
            <option value="true">Visible</option>
            <option value="false">Hidden</option>
          </select>
          <button className="btn-outline">Фильтр</button>
        </form>
      </div>
      <div className="border border-border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-accent/30">
            <tr>
              <th className="p-2 text-left">Изображение</th>
              <th className="p-2 text-left">SKU</th>
              <th className="p-2 text-left">Название</th>
              <th className="p-2 text-left">Цена</th>
              <th className="p-2 text-left">Игры</th>
              <th className="p-2 text-left">Активность</th>
              <th className="p-2 text-left">Видимость</th>
              <th className="p-2 text-left">Действия</th>
            </tr>
          </thead>
          <tbody>
            {items.map((p) => (
              <tr key={p.id} className="border-t border-border">
                <td className="p-2">
                  {p.imageUrl ? (
                    <ProductImage 
                      src={p.imageUrl} 
                      alt={p.title}
                      className="w-12 h-12 object-cover rounded"
                    />
                  ) : (
                    <div className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center text-xs text-gray-500">
                      Нет
                    </div>
                  )}
                </td>
                <td className="p-2">{p.sku}</td>
                <td className="p-2">{p.title}</td>
                <td className="p-2">{p.priceRub} ₽</td>
                <td className="p-2">{p.bpUsesTotal}</td>
                <td className="p-2">{p.active ? 'Active' : 'Inactive'}</td>
                <td className="p-2">{p.visible ? 'Visible' : 'Hidden'}</td>
                <td className="p-2">
                  <Link className="text-primary" href={`/admin/products/${p.id}`}>Изменить</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
