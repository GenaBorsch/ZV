import { NextRequest, NextResponse } from 'next/server';
import { db } from '@zv/db';
import { users, userRoles } from '@zv/db/schema';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { eq, ilike, or } from 'drizzle-orm';

// GET /api/players - получить список игроков для формы отчёта
export async function GET(req: NextRequest) {
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
      return NextResponse.json({ error: 'Only masters can access players list' }, { status: 403 });
    }

    const url = new URL(req.url);
    const search = url.searchParams.get('search') || '';
    const limit = parseInt(url.searchParams.get('limit') || '50');

    // Получаем игроков с ролью PLAYER
    let query = db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
      })
      .from(users)
      .leftJoin(userRoles, eq(users.id, userRoles.userId))
      .where(eq(userRoles.role, 'PLAYER'));

    // Добавляем поиск по имени или email
    if (search) {
      query = query.where(
        or(
          ilike(users.name, `%${search}%`),
          ilike(users.email, `%${search}%`)
        )
      );
    }

    const players = await query.limit(limit);

    return NextResponse.json({ players });
  } catch (error) {
    console.error('Error fetching players:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
