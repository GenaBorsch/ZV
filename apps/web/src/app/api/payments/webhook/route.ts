import { NextResponse } from 'next/server';
import { isPaymentsEnabled } from '@zv/utils/yookassa';
import { PaymentsRepo } from '@zv/db/repositories/paymentsRepo';

export async function POST(req: Request) {
  try {
    if (!isPaymentsEnabled()) {
      return NextResponse.json({ ok: true });
    }

    // YooKassa webhook payload
    const body = await req.json();
    const event = body?.event as string | undefined;
    const paymentObject = body?.object;
    
    if (!event || !paymentObject) {
      return NextResponse.json({ ok: false, reason: 'bad payload' }, { status: 400 });
    }

    console.log('Webhook received:', { event, paymentId: paymentObject.id });

    if (event === 'payment.succeeded') {
      const providerPaymentId = paymentObject.id as string | undefined;
      const metadata = paymentObject.metadata || {};
      const orderId: string | undefined = metadata.orderId;

      if (!providerPaymentId) {
        return NextResponse.json({ ok: false, reason: 'no payment id' }, { status: 400 });
      }

      // Обработка успешного платежа через репозиторий
      if (orderId) {
        // Сначала обновляем providerId если нужно
        await PaymentsRepo.updateOrder(orderId, { providerId: providerPaymentId });
        // Затем отмечаем как оплаченный и выдаем баттлпассы
        await PaymentsRepo.markPaidAndIssueBattlepasses(orderId);
      } else {
        // Ищем заказ по providerId
        const order = await PaymentsRepo.getOrderByPaymentId(providerPaymentId);
        if (order) {
          await PaymentsRepo.markPaidAndIssueBattlepasses(order.id);
        }
      }
    }

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error('Webhook processing error:', e);
    return NextResponse.json({ ok: false, error: e?.message || String(e) }, { status: 500 });
  }
}


