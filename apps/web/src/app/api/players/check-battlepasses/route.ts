import { NextRequest, NextResponse } from 'next/server';
import { db } from '@zv/db';
import { users, userRoles, battlepasses } from '@zv/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
// Imported from @zv/db instead of drizzle-orm directly;

// POST /api/players/check-battlepasses - проверить доступные игры у игроков
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Проверяем, что пользователь - мастер
    const userRolesData = await db
      .select()
      .from(userRoles)
      .where(eq(userRoles.userId, session.user.id));
    
    const roles = userRolesData.map(r => r.role);
    if (!roles.includes('MASTER')) {
      return NextResponse.json({ error: 'Only masters can check player battlepasses' }, { status: 403 });
    }

    const body = await req.json();
    const { playerIds } = body;

    if (!Array.isArray(playerIds) || playerIds.length === 0) {
      return NextResponse.json({ error: 'playerIds array is required' }, { status: 400 });
    }

    // Проверяем каждого игрока
    const results = [];
    
    for (const playerId of playerIds) {
      // Получаем информацию об игроке
      const [player] = await db
        .select({
          id: users.id,
          name: users.name,
          email: users.email,
        })
        .from(users)
        .where(eq(users.id, playerId));

      if (!player) {
        results.push({
          playerId,
          playerName: 'Unknown',
          hasAvailableGames: false,
          error: 'Player not found',
        });
        continue;
      }

      // Проверяем активные баттлпассы с доступными играми
      const activeBattlepasses = await db
        .select()
        .from(battlepasses)
        .where(and(
          eq(battlepasses.userId, playerId),
          eq(battlepasses.status, 'ACTIVE')
        ));

      const totalAvailableGames = activeBattlepasses.reduce((sum, bp) => sum + bp.usesLeft, 0);
      const hasAvailableGames = totalAvailableGames > 0;

      results.push({
        playerId,
        playerName: player.name || player.email,
        hasAvailableGames,
        availableGames: totalAvailableGames,
        activeBattlepasses: activeBattlepasses.length,
      });
    }

    // Фильтруем игроков без доступных игр
    const playersWithoutGames = results.filter(r => !r.hasAvailableGames);

    return NextResponse.json({
      results,
      playersWithoutGames: playersWithoutGames.map(p => ({
        id: p.playerId,
        name: p.playerName,
      })),
      hasWarnings: playersWithoutGames.length > 0,
    });
  } catch (error) {
    console.error('Error checking player battlepasses:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
