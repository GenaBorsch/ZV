import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db, masterProfiles, users, eq } from '@zv/db';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 });
    }

    const { id: masterId } = await params; // Await params

    // Получить информацию о мастере по masterId (это ID из master_profiles)
    const masterData = await db
      .select({
        userId: users.id,
        email: users.email,
        nickname: masterProfiles.nickname,
      })
      .from(masterProfiles)
      .innerJoin(users, eq(masterProfiles.userId, users.id))
      .where(eq(masterProfiles.id, masterId))
      .limit(1);

    if (!masterData[0]) {
      return NextResponse.json({ error: 'Пользователь не найден' }, { status: 404 });
    }

    return NextResponse.json({
      nickname: masterData[0].nickname,
      email: masterData[0].email,
    });
  } catch (error: any) {
    console.error('Error fetching user:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch user' }, { status: 500 });
  }
}
