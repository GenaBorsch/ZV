import { NextRequest, NextResponse } from 'next/server';
import { db } from '@zv/db';
import { notifications } from '@zv/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { eq, and } from 'drizzle-orm';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

// PATCH /api/notifications/[id] - пометить уведомление как прочитанное
export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { isRead } = body;

    if (typeof isRead !== 'boolean') {
      return NextResponse.json({ error: 'isRead must be a boolean' }, { status: 400 });
    }

    // Получаем id из params
    const { id } = await params;

    // Обновляем только уведомления пользователя
    const [updatedNotification] = await db
      .update(notifications)
      .set({ isRead })
      .where(and(
        eq(notifications.id, id),
        eq(notifications.userId, session.user.id)
      ))
      .returning();

    if (!updatedNotification) {
      return NextResponse.json({ error: 'Notification not found' }, { status: 404 });
    }

    return NextResponse.json({ notification: updatedNotification });
  } catch (error) {
    console.error('Error updating notification:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
