import { NextRequest, NextResponse } from 'next/server';
import { db, orders, battlepasses, orderItems, eq } from '@zv/db';

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const orderId = searchParams.get('orderId');
  
  if (!orderId) {
    return NextResponse.json({ error: 'orderId parameter is required' }, { status: 400 });
  }

  try {
    // Поиск заказа
    const [order] = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);
    
    // Поиск элементов заказа
    const orderItemsList = await db.select().from(orderItems).where(eq(orderItems.orderId, orderId));
    
    // Поиск баттлпассов для пользователя заказа
    let battlepassList = [];
    if (order && order.forUserId) {
      battlepassList = await db.select().from(battlepasses).where(eq(battlepasses.userId, order.forUserId));
    }

    // Поиск заказов по providerId (если есть)
    let ordersByProviderId = [];
    if (orderId.includes('-')) {
      ordersByProviderId = await db.select().from(orders).where(eq(orders.providerId, orderId));
    }

    return NextResponse.json({
      searchOrderId: orderId,
      order: order || null,
      orderItems: orderItemsList,
      battlepasses: battlepassList,
      ordersByProviderId,
      found: {
        order: !!order,
        orderItems: orderItemsList.length > 0,
        battlepasses: battlepassList.length > 0
      }
    });

  } catch (error: any) {
    console.error('❌ Find order error:', error);
    return NextResponse.json({ error: 'Internal server error', message: error.message }, { status: 500 });
  }
}


