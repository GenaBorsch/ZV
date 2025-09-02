import Link from 'next/link';
import { db, products } from '@zv/db';

export default async function PlayerBattlepassPage() {
  const all = await db.select().from(products);
  const items = (all as any[])
    .filter((p) => p.type === 'BATTLEPASS' && p.active === true && p.visible === true)
    .sort((a, b) => (a.sortIndex - b.sortIndex) || String(a.title || '').localeCompare(String(b.title || ''), 'ru'));

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      <h1 className="text-2xl font-semibold text-foreground mb-4">Покупка баттлпасса</h1>
      {items.length === 0 ? (
        <div className="border border-dashed border-border rounded-lg p-6 text-center text-muted-foreground">
          Нет доступных офферов для покупки.
        </div>
      ) : (
        <>
          <p className="text-muted-foreground mb-6">Выберите нужный пакет и перейдите к оплате.</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {items.map((p: any) => (
              <div key={p.id} className="card p-4 flex flex-col">
                <div className="text-sm text-muted-foreground mb-1">{p.sku}</div>
                <div className="text-lg font-medium text-foreground">{p.title}</div>
                {p.description && <div className="mt-1 text-sm text-muted-foreground">{p.description}</div>}
                <div className="mt-2 text-foreground">{p.priceRub} ₽</div>
                <div className="mt-1 text-sm text-muted-foreground">Игры: {p.bpUsesTotal}</div>
                <form action="/api/payments/create-checkout" method="post" className="mt-auto">
                  <input type="hidden" name="productSku" value={p.sku} />
                  <button className="btn-primary w-full mt-3" type="submit" disabled={!p.active}>Купить</button>
                </form>
              </div>
            ))}
          </div>
        </>
      )}
      <div className="mt-6">
        <Link href="/player" className="btn-outline inline-block">← Вернуться в кабинет</Link>
      </div>
    </div>
  );
}

