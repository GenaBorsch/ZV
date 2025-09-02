import Link from 'next/link';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db, battlepasses, seasons, and, eq } from '@zv/db';

export default async function PlayerBattlepassesListPage() {
  const session = await getServerSession(authOptions as any);
  const userId = (session?.user as any)?.id as string | undefined;

  if (!userId) {
    return (
      <div className="max-w-4xl mx-auto py-8 px-4">
        <p>Не авторизован</p>
      </div>
    );
  }

  const items = await db.select().from(battlepasses);

  // Load seasons for names
  const [activeSeason] = await db.select().from(seasons).where(eq(seasons.isActive, true)).limit(1);

  const my = items.filter((bp: any) => bp.userId === userId);

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <h1 className="text-2xl font-semibold text-foreground mb-4">Мои баттлпассы</h1>
      <div className="flex justify-between items-center mb-4">
        <div />
        <Link href="/player/battlepass" className="btn-primary">Купить 1/4/12 игр</Link>
      </div>
      <div className="space-y-3">
        {my.length === 0 && (
          <div className="border border-dashed border-border rounded-lg p-6 text-center text-muted-foreground">
            Нет купленных баттлпассов.
          </div>
        )}
        {my.map((bp: any) => (
          <div key={bp.id} className="p-4 border border-border rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-muted-foreground">{bp.kind}</div>
                <div className="text-foreground">{activeSeason && bp.seasonId === activeSeason.id ? 'Текущий сезон' : 'Сезон'}</div>
              </div>
              <div className="text-sm">
                Осталось: {bp.usesLeft} / {bp.usesTotal}
              </div>
              <div>
                <span className="px-2 py-1 text-xs font-medium bg-accent/30 text-foreground rounded-full">{bp.status}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}


