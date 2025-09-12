import { NextResponse } from 'next/server';
import { db, orders, battlepasses, eq } from '@zv/db';

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

    console.log('🎣 Webhook received:', { event, paymentId: paymentObject.id });

    if (event === 'payment.succeeded') {
      const providerPaymentId = paymentObject.id as string | undefined;
      const metadata = paymentObject.metadata || {};
      const orderId: string | undefined = metadata.orderId;

      if (!providerPaymentId) {
        return NextResponse.json({ ok: false, reason: 'no payment id' }, { status: 400 });
      }

      console.log('💰 Processing successful payment:', { orderId, providerPaymentId });

      // Обработка успешного платежа
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
        
        if (order && order.forUserId) {
          // Выдаем баттлпасс пользователю
          await db.insert(battlepasses).values({
            userId: order.forUserId,
            orderId: order.id,
            usesLeft: 1, // Базовое значение, можно улучшить
            totalUses: 1,
            isActive: true,
          });
          
          console.log('🎮 Battlepass issued to user:', order.forUserId);
        }
      }
    }

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error('❌ Webhook processing error:', e);
    return NextResponse.json({ ok: false, error: e?.message || String(e) }, { status: 500 });
  }
}


