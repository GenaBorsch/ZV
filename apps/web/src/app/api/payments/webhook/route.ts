import { NextResponse } from 'next/server';
import { db, orders, orderItems, products, battlepasses, seasons, and, eq } from '@zv/db';

function env(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

function isFeatureEnabled(): boolean {
  return String(process.env.FEATURE_PAYMENTS || '').toLowerCase() === 'true';
}

async function markPaidAndIssue(orderId: string) {
  // idempotent: re-read order and check status
  const [ord] = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);
  if (!ord) return;
  if (ord.status === 'PAID' && ord.fulfilledAt) return; // already paid and issued

  // Mark paid
  if (ord.status !== 'PAID') {
    await db.update(orders).set({ status: 'PAID' }).where(eq(orders.id, ord.id));
  }

  // Find active season
  const [season] = await db.select().from(seasons).where(eq(seasons.isActive, true)).limit(1);

  // Fetch items
  const items = await db.select().from(orderItems).where(eq(orderItems.orderId, ord.id));
  const targetUserId = (ord as any).forUserId || ord.userId;

  for (const item of items) {
    const [product] = await db.select().from(products).where(eq(products.id, item.productId)).limit(1);
    if (!product || product.type !== 'BATTLEPASS') continue;

    // use snapshot from order item, fallback to product fields
    const usesTotal = item.bpUsesTotalAtPurchase ?? product.bpUsesTotal ?? 1;
    // derive kind for UI consistency
    const kind = product.sku === 'BP-FOUR' ? 'FOUR' : product.sku === 'BP-SEASON' ? 'SEASON' : 'SINGLE';

    const qty = item.qty || 1;
    for (let i = 0; i < qty; i++) {
      await db.insert(battlepasses).values({
        userId: targetUserId,
        kind,
        seasonId: season ? season.id : (null as any),
        usesTotal,
        usesLeft: usesTotal,
        status: 'ACTIVE',
      });
    }
  }

  await db.update(orders).set({ fulfilledAt: new Date() }).where(eq(orders.id, ord.id));
}

export async function POST(req: Request) {
  try {
    if (!isFeatureEnabled()) {
      return NextResponse.json({ ok: true });
    }

    // YooKassa webhook payload
    const body = await req.json();
    // optional: verify signature (skipped for brevity in MVP)
    const event = body?.event as string | undefined;
    const paymentObject = body?.object;
    if (!event || !paymentObject) {
      return NextResponse.json({ ok: false, reason: 'bad payload' }, { status: 400 });
    }

    if (event === 'payment.succeeded') {
      const providerPaymentId = paymentObject.id as string | undefined;
      const metadata = paymentObject.metadata || {};
      const orderId: string | undefined = metadata.orderId;

      if (!providerPaymentId) {
        return NextResponse.json({ ok: false, reason: 'no payment id' }, { status: 400 });
      }

      // idempotent linking by unique providerId
      if (orderId) {
        await db.update(orders).set({ providerId: providerPaymentId }).where(eq(orders.id, orderId));
        await markPaidAndIssue(orderId);
      } else {
        // Try find order by providerId
        const existing = await db.select().from(orders).where(eq(orders.providerId, providerPaymentId)).limit(1);
        if (existing[0]) {
          await markPaidAndIssue(existing[0].id);
        }
      }
    }

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || String(e) }, { status: 500 });
  }
}


