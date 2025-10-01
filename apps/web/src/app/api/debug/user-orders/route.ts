import { NextRequest, NextResponse } from 'next/server';
import { db, orders, orderItems, eq, desc } from '@zv/db';

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const userId = searchParams.get('userId');
  
  if (!userId) {
    return NextResponse.json({ error: 'userId parameter is required' }, { status: 400 });
  }

  try {
    // Поиск последних заказов пользователя
    const userOrders = await db.select()
      .from(orders)
      .where(eq(orders.userId, userId))
      .orderBy(desc(orders.createdAt))
      .limit(10);
    
    // Получаем детали для каждого заказа
    const ordersWithDetails = await Promise.all(
      userOrders.map(async (order) => {
        const items = await db.select()
          .from(orderItems)
          .where(eq(orderItems.orderId, order.id));
        
        return {
          ...order,
          items
        };
      })
    );

    return NextResponse.json({
      userId,
      orders: ordersWithDetails,
      count: userOrders.length
    });

  } catch (error: any) {
    console.error('❌ User orders error:', error);
    return NextResponse.json({ error: 'Internal server error', message: error.message }, { status: 500 });
  }
}
