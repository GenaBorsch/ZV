import { NextRequest, NextResponse } from 'next/server';
import { db, orders, battlepasses, orderItems, seasons, eq } from '@zv/db';

export async function POST(req: NextRequest) {
  try {
    const { orderId } = await req.json();
    
    if (!orderId) {
      return NextResponse.json({ error: 'orderId is required' }, { status: 400 });
    }

    // Находим заказ
    const [order] = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);
    
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    if (order.status !== 'PAID') {
      return NextResponse.json({ error: 'Order is not paid' }, { status: 400 });
    }

    // Определяем пользователя для выдачи баттлпасса
    const targetUserId = order.forUserId || order.userId;
    
    if (!targetUserId) {
      return NextResponse.json({ error: 'No target user found' }, { status: 400 });
    }

    // Проверяем, не выдан ли уже баттлпасс для этого пользователя
    const existingBattlepasses = await db.select()
      .from(battlepasses)
      .where(eq(battlepasses.userId, targetUserId));

    // Получаем информацию о товаре из order_items
    const [orderItem] = await db.select()
      .from(orderItems)
      .where(eq(orderItems.orderId, orderId))
      .limit(1);

    const totalUses = orderItem?.bpUsesTotalAtPurchase || 1;

    // Получаем активный сезон
    const [activeSeason] = await db.select()
      .from(seasons)
      .where(eq(seasons.isActive, true))
      .limit(1);

    if (!activeSeason) {
      return NextResponse.json({ error: 'No active season found' }, { status: 400 });
    }

    // Выдаем баттлпасс
    const [newBattlepass] = await db.insert(battlepasses).values({
      userId: targetUserId,
      kind: 'SINGLE',
      seasonId: activeSeason.id,
      usesTotal: totalUses,
      usesLeft: totalUses,
      status: 'ACTIVE',
    }).returning();

    console.log('🎮 Battlepass manually issued to user:', targetUserId, 'with', totalUses, 'uses');

    return NextResponse.json({
      success: true,
      orderId,
      targetUserId,
      battlepass: newBattlepass,
      existingBattlepasses: existingBattlepasses.length,
      orderItem: orderItem
    });

  } catch (error: any) {
    console.error('❌ Issue battlepass error:', error);
    return NextResponse.json({ error: 'Internal server error', message: error.message }, { status: 500 });
  }
}
