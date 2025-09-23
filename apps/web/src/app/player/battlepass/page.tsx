import Link from 'next/link';
import { db, products } from '@zv/db';
import { BattlepassPurchase } from '@/components/BattlepassPurchase';

// Принудительно делаем страницу динамической
export const dynamic = 'force-dynamic';

export default async function PlayerBattlepassPage() {
  const all = await db.select().from(products);
  const items = (all as any[])
    .filter((p) => p.type === 'BATTLEPASS' && p.active === true && p.visible === true)
    .sort((a, b) => (a.sortIndex - b.sortIndex) || String(a.title || '').localeCompare(String(b.title || ''), 'ru'));

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      <h1 className="text-2xl font-semibold text-foreground mb-4">Покупка путёвок</h1>
      {items.length === 0 ? (
        <div className="border border-dashed border-border rounded-lg p-6 text-center text-muted-foreground">
          Нет доступных офферов для покупки.
        </div>
      ) : (
        <>
          <p className="text-muted-foreground mb-6">Выберите нужный пакет и перейдите к оплате.</p>
          <BattlepassPurchase products={items} />
        </>
      )}
      <div className="mt-6">
        <Link href="/player" className="btn-outline inline-block">← Вернуться в кабинет</Link>
      </div>
    </div>
  );
}

