import { NextRequest, NextResponse } from 'next/server';
import { db } from '@zv/db';
import { notifications, eq, desc, count, and } from '@zv/db';
import { CreateNotificationDto } from '@zv/contracts';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// GET /api/notifications - получить уведомления пользователя
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(req.url);
    const limit = parseInt(url.searchParams.get('limit') || '20');
    const offset = parseInt(url.searchParams.get('offset') || '0');
    const unreadOnly = url.searchParams.get('unreadOnly') === 'true';

    let query = db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, session.user.id));

    if (unreadOnly) {
      query = query.where(eq(notifications.isRead, false));
    }

    const userNotifications = await query
      .orderBy(desc(notifications.createdAt))
      .limit(limit)
      .offset(offset);

    // Получаем количество непрочитанных уведомлений
    const [{ count: unreadCount }] = await db
      .select({ count: count() })
      .from(notifications)
      .where(and(
        eq(notifications.userId, session.user.id),
        eq(notifications.isRead, false)
      ));

    return NextResponse.json({
      notifications: userNotifications,
      unreadCount: Number(unreadCount),
      hasMore: userNotifications.length === limit,
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/notifications - создать уведомление (для внутреннего использования)
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Проверяем, что запрос идёт от сервера или админа
    const origin = req.headers.get('origin');
    const referer = req.headers.get('referer');
    const isInternalRequest = !origin || origin === req.nextUrl.origin;
    
    if (!isInternalRequest) {
      return NextResponse.json({ error: 'External requests not allowed' }, { status: 403 });
    }

    const body = await req.json();
    const validatedData = CreateNotificationDto.parse(body);

    const [notification] = await db
      .insert(notifications)
      .values({
        userId: validatedData.userId,
        title: validatedData.title,
        message: validatedData.message,
        type: validatedData.type,
        relatedType: validatedData.relatedType || null,
        relatedId: validatedData.relatedId || null,
      })
      .returning();

    return NextResponse.json({ notification }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && 'issues' in error) {
      return NextResponse.json({ error: 'Validation error', details: error }, { status: 400 });
    }
    
    console.error('Error creating notification:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
