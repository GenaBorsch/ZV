import { NextResponse } from 'next/server';
import { db, orders, battlepasses, orderItems, eq } from '@zv/db';

function env(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Environment variable ${key} is not set`);
  }
  return value;
}

export async function POST(req: Request) {
  try {
    // Проверяем включены ли платежи
    const paymentsEnabled = process.env.FEATURE_PAYMENTS === 'true';
    if (!paymentsEnabled) {
      return NextResponse.json({ ok: true });
    }

    // YooKassa webhook payload
    const body = await req.json();
    const event = body?.event as string | undefined;
    const paymentObject = body?.object;
    
    if (!event || !paymentObject) {
      return NextResponse.json({ ok: false, reason: 'bad payload' }, { status: 400 });
    }

    const providerPaymentId = paymentObject.id as string | undefined;
    const metadata = paymentObject.metadata || {};
    const orderId: string | undefined = metadata.orderId;

    console.log('🎣 Webhook received:', { event, paymentId: providerPaymentId, orderId });

    if (!providerPaymentId) {
      return NextResponse.json({ ok: false, reason: 'no payment id' }, { status: 400 });
    }

    // Обработка успешного платежа
    if (event === 'payment.succeeded') {
      console.log('💰 Processing successful payment:', { orderId, providerPaymentId });

      if (orderId) {
        // Обновляем заказ как оплаченный
        await db.update(orders)
          .set({ 
            status: 'PAID',
            paidAt: new Date(),
            providerId: providerPaymentId
          })
          .where(eq(orders.id, orderId));

        // Находим заказ для выдачи баттлпасса
        const [order] = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);
        
        if (order) {
          // Определяем целевого пользователя: forUserId или userId (если покупает для себя)
          const targetUserId = order.forUserId || order.userId;
          
          // Получаем информацию о товаре из order_items
          const [orderItem] = await db.select()
            .from(orderItems)
            .where(eq(orderItems.orderId, orderId))
            .limit(1);

          const totalUses = orderItem?.bpUsesTotalAtPurchase || 1;
          const productTitle = orderItem?.productTitleSnapshot || 'Путёвка';
          
          await db.insert(battlepasses).values({
            userId: targetUserId,
            kind: 'SINGLE',
            title: productTitle,
            usesTotal: totalUses,
            usesLeft: totalUses,
            status: 'ACTIVE',
          });
          
          console.log('🎮 Battlepass issued to user:', targetUserId, 'with', totalUses, 'uses, title:', productTitle);
        }
      }
    }

    // Обработка отмененного/неуспешного платежа
    else if (event === 'payment.canceled') {
      console.log('❌ Processing canceled payment:', { orderId, providerPaymentId });

      if (orderId) {
        // Обновляем заказ как отмененный
        await db.update(orders)
          .set({ 
            status: 'CANCELLED',
            providerId: providerPaymentId
          })
          .where(eq(orders.id, orderId));

        console.log('🚫 Order marked as cancelled:', orderId);
      }
    }

    // Обработка других событий (waiting_for_capture, pending, etc.)
    else if (event === 'payment.waiting_for_capture') {
      console.log('⏳ Payment waiting for capture:', { orderId, providerPaymentId });
      
      if (orderId) {
        await db.update(orders)
          .set({ 
            status: 'PENDING',
            providerId: providerPaymentId
          })
          .where(eq(orders.id, orderId));
      }
    }
    
    else {
      console.log('ℹ️ Unhandled webhook event:', event);
    }

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error('❌ Webhook processing error:', e);
    return NextResponse.json({ ok: false, error: e?.message || String(e) }, { status: 500 });
  }
}


