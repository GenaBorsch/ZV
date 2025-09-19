import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db, battlepasses, eq } from '@zv/db';

export async function GET() {
  try {
    const session = await getServerSession(authOptions as any);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Получаем все баттлпассы пользователя
    const userBattlepasses = await db.select()
      .from(battlepasses)
      .where(eq(battlepasses.userId, session.user.id));

    return NextResponse.json({
      battlepasses: userBattlepasses,
      count: userBattlepasses.length
    });

  } catch (error: any) {
    console.error('❌ Get battlepasses error:', error);
    return NextResponse.json({ error: 'Internal server error', message: error.message }, { status: 500 });
  }
}


