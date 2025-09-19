import { NextRequest, NextResponse } from 'next/server';
import { db, orders, battlepasses, orderItems, eq } from '@zv/db';

function env(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Environment variable ${key} is not set`);
  }
  return value;
}

export async function POST(req: NextRequest) {
  try {
    const { paymentId } = await req.json();
    
    if (!paymentId) {
      return NextResponse.json({ error: 'Payment ID is required' }, { status: 400 });
    }

    // Получаем информацию о платеже от YooKassa
    const shopId = env('YKS_SHOP_ID');
    const secretKey = env('YKS_SECRET');
    const auth = Buffer.from(`${shopId}:${secretKey}`).toString('base64');

    const response = await fetch(`https://api.yookassa.ru/v3/payments/${paymentId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json({ error: 'Failed to check payment status', details: errorText }, { status: 500 });
    }

    const payment = await response.json();
    const metadata = payment.metadata || {};
    const orderId = metadata.orderId;

    console.log('💳 Payment status check:', { paymentId, status: payment.status, orderId });

    let processResult = { found: false, processed: false, alreadyProcessed: false };

    // Если платеж успешен и есть orderId, пытаемся обработать
    if (payment.status === 'succeeded' && orderId) {
      const [order] = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);
      
      if (order) {
        processResult.found = true;
        
        if (order.status === 'PENDING') {
          console.log('🔄 Processing successful payment manually:', orderId);
          
          // Обновляем заказ как оплаченный
          await db.update(orders)
            .set({ 
              status: 'PAID',
              fulfilledAt: new Date(),
              providerId: paymentId
            })
            .where(eq(orders.id, orderId));

          // Выдаем баттлпасс пользователю (либо forUserId, либо userId если заказ для себя)
          const targetUserId = order.forUserId || order.userId;
          if (targetUserId) {
            // Получаем информацию о товаре из order_items
            const [orderItem] = await db.select()
              .from(orderItems)
              .where(eq(orderItems.orderId, orderId))
              .limit(1);

            const totalUses = orderItem?.bpUsesTotalAtPurchase || 1;
            
            await db.insert(battlepasses).values({
              userId: targetUserId,
              kind: 'SINGLE', // Базовое значение
              usesTotal: totalUses,
              usesLeft: totalUses,
              status: 'ACTIVE',
            });
            
            console.log('🎮 Battlepass issued to user:', targetUserId, 'with', totalUses, 'uses');
          }
          
          processResult.processed = true;
        } else {
          console.log('⚠️ Order already processed:', orderId, 'status:', order.status);
          processResult.alreadyProcessed = true;
        }
      } else {
        console.log('❌ Order not found in database:', orderId);
      }
    }

    return NextResponse.json({
      paymentId,
      status: payment.status,
      orderId,
      amount: payment.amount,
      orderFound: processResult.found,
      processed: processResult.processed,
      alreadyProcessed: processResult.alreadyProcessed
    });

  } catch (error: any) {
    console.error('❌ Payment status check error:', error);
    return NextResponse.json({ error: 'Internal server error', message: error.message }, { status: 500 });
  }
}
