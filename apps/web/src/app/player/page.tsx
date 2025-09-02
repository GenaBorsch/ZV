import Link from 'next/link';
import { LogoutButton } from '@/components/LogoutButton';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db, users, playerProfiles, characters, enrollments, sessions, groups, masterProfiles, battlepasses, seasons, and, desc, eq } from '@zv/db';

export default async function PlayerDashboard() {
  const session = await getServerSession(authOptions as any);
  const userId = (session?.user as any)?.id as string | undefined;

  let userName: string | null = null;
  let playerProfile: any | null = null;
  let playerCharacters: Array<any> = [];
  let upcomingEnrollments: Array<any> = [];
  let activeBattlepass: any | null = null;

  if (userId) {
    const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    userName = user?.name ?? user?.email ?? null;

    const [pp] = await db.select().from(playerProfiles).where(eq(playerProfiles.userId, userId)).limit(1);
    playerProfile = pp ?? null;

    if (pp) {
      playerCharacters = await db.select().from(characters).where(eq(characters.playerId, pp.id));
    }

    upcomingEnrollments = [];

    const [season] = await db.select().from(seasons).where(eq(seasons.isActive, true)).limit(1);
    if (season) {
      const [bp] = await db
        .select()
        .from(battlepasses)
        .where(and(eq(battlepasses.userId, userId), eq(battlepasses.seasonId, season.id)))
        .limit(1);
      activeBattlepass = bp ?? null;
    }
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="bg-card shadow-sm border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <h1 className="text-xl font-semibold text-foreground">
                Личный кабинет игрока
              </h1>
              <span className="px-2 py-1 text-xs font-medium bg-accent/30 text-foreground rounded-full">
                Игрок
              </span>
            </div>
            <nav className="flex space-x-4">
              <Link href="/" className="text-muted-foreground hover:text-foreground">
                На главную
              </Link>
              <LogoutButton className="text-muted-foreground hover:text-foreground" />
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <h2 className="text-2xl font-bold text-foreground mb-6">
            {userName ? `Добро пожаловать, ${userName}!` : 'Личный кабинет игрока'}
          </h2>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-3 mb-8">
            <div className="card p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-accent/30 rounded-md flex items-center justify-center" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-muted-foreground truncate">Мои персонажи</dt>
                    <dd className="text-lg font-medium text-foreground">{playerCharacters.length}</dd>
                  </dl>
                </div>
              </div>
            </div>

            <div className="card p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-accent/30 rounded-md flex items-center justify-center" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-muted-foreground truncate">Ближайшие игры</dt>
                    <dd className="text-lg font-medium text-foreground">{upcomingEnrollments.length}</dd>
                  </dl>
                </div>
              </div>
            </div>

            <div className="card p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-accent/30 rounded-md flex items-center justify-center" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-muted-foreground truncate">Баттлпасс</dt>
                    <dd className="text-lg font-medium text-foreground">
                      {activeBattlepass ? `${activeBattlepass.usesTotal - activeBattlepass.usesLeft}/${activeBattlepass.usesTotal} игры` : 'Нет активного'}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          {/* Main Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Characters */}
            <div className="lg:col-span-2 space-y-6">
              <div className="card p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium text-foreground">Мои персонажи</h3>
                  <button className="btn-primary">Добавить персонажа</button>
                </div>
                <div className="space-y-4">
                  {playerCharacters.length === 0 && (
                    <div className="border border-dashed border-border rounded-lg p-6 text-center text-muted-foreground">
                      У вас пока нет персонажей. Создайте первого, чтобы начать играть.
                    </div>
                  )}
                </div>
              </div>

              <div className="card p-6">
                <h3 className="text-lg font-medium text-foreground mb-4">Ближайшие игры</h3>
                <div className="space-y-4">
                  {upcomingEnrollments.length === 0 && (
                    <div className="border border-dashed border-border rounded-lg p-6 text-center text-muted-foreground">
                      У вас пока нет ближайших игр.
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              <div className="card p-6">
                <h3 className="text-lg font-medium text-foreground mb-4">Мой баттлпасс</h3>
                <div className="space-y-4">
                  {!activeBattlepass && (
                    <div className="border border-dashed border-border rounded-lg p-6 text-center text-muted-foreground">
                      <div className="mb-4">Нет активного баттлпасса.</div>
                      <Link href="/player/battlepass" className="btn-outline inline-block">
                        Купить баттлпасс
                      </Link>
                    </div>
                  )}
                </div>
              </div>

              <div className="card p-6">
                <h3 className="text-lg font-medium text-foreground mb-4">Быстрые действия</h3>
                <div className="space-y-3">
                  <button className="btn-outline w-full text-left">📅 Посмотреть расписание</button>
                  <button className="btn-outline w-full text-left">👥 Найти группу</button>
                </div>
              </div>

              <div className="card p-6">
                <h3 className="text-lg font-medium text-foreground mb-4">Недавняя активность</h3>
                <div className="space-y-3 text-sm text-muted-foreground">
                  История активности появится здесь позже.
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

