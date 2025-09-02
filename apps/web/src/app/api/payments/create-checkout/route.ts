import { NextResponse } from 'next/server';
import { db, products, orders, orderItems, eq, and } from '@zv/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

function env(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

function isFeatureEnabled(): boolean {
  return String(process.env.FEATURE_PAYMENTS || '').toLowerCase() === 'true';
}

async function parseBody(req: Request): Promise<{ productSku: string; forUserId?: string; }> {
  const contentType = req.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    return await req.json();
  }
  if (contentType.includes('application/x-www-form-urlencoded') || contentType.includes('multipart/form-data')) {
    const form = await req.formData();
    return {
      productSku: String(form.get('productSku') || ''),
      forUserId: form.get('forUserId') ? String(form.get('forUserId')) : undefined,
    };
  }
  try {
    return await req.json();
  } catch {
    return { productSku: '' } as any;
  }
}

export async function POST(req: Request) {
  try {
    if (!isFeatureEnabled()) {
      return NextResponse.json({ error: 'Payments disabled' }, { status: 404 });
    }

    const session = await getServerSession(authOptions as any);
    const sessionUser = (session?.user as any) || null;
    if (!sessionUser?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { productSku, forUserId } = await parseBody(req);
    if (!productSku) {
      return NextResponse.json({ error: 'productSku is required' }, { status: 400 });
    }

    const [product] = await db
      .select()
      .from(products)
      .where(and(
        eq(products.sku, productSku),
        eq(products.type, 'BATTLEPASS'),
        eq(products.active, true),
        eq(products.visible, true)
      ))
      .limit(1);
    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    if (product.seasonRequired) {
      const { seasons, eq: eqOp } = await import('@zv/db');
      const [season] = await db.select().from(seasons).where(eqOp(seasons.isActive, true)).limit(1);
      if (!season) {
        return NextResponse.json({ error: 'No active season for purchase' }, { status: 409 });
      }
    }

    const buyerUserId: string = sessionUser.id;
    const targetUserId: string = forUserId || buyerUserId;

    if (forUserId && forUserId !== buyerUserId) {
      const roles: string[] = sessionUser.roles || [];
      const allowed = roles.includes('MASTER') || roles.includes('MODERATOR') || roles.includes('SUPERADMIN');
      if (!allowed) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    const [newOrder] = await db
      .insert(orders)
      .values({
        userId: buyerUserId,
        forUserId: targetUserId === buyerUserId ? null as any : (targetUserId as any),
        status: 'PENDING',
        totalRub: product.priceRub,
        provider: 'YOOKASSA',
      })
      .returning();

    await db.insert(orderItems).values({
      orderId: newOrder.id,
      productId: product.id,
      qty: 1,
      priceRub: product.priceRub,
      priceRubAtPurchase: product.priceRub,
      bpUsesTotalAtPurchase: product.bpUsesTotal,
      productSkuSnapshot: product.sku,
      productTitleSnapshot: product.title,
    });

    const shopId = env('YKS_SHOP_ID');
    const secretKey = env('YKS_SECRET');
    const baseUrl = env('PUBLIC_BASE_URL');

    const idempotenceKey = crypto.randomUUID();
    const auth = Buffer.from(`${shopId}:${secretKey}`).toString('base64');
    const description = `Battlepass ${product.sku} order ${newOrder.id}`;
    const body = {
      amount: { value: (product.priceRub / 1).toFixed(2), currency: 'RUB' },
      capture: true,
      description,
      confirmation: { type: 'redirect', return_url: `${baseUrl}/player/battlepass/success?orderId=${newOrder.id}` },
      metadata: { orderId: newOrder.id, forUserId: targetUserId, productSku: product.sku },
    } as any;

    const resp = await fetch('https://api.yookassa.ru/v3/payments', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Idempotence-Key': idempotenceKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!resp.ok) {
      const errText = await resp.text();
      return NextResponse.json({ error: 'Failed to create payment', details: errText }, { status: 502 });
    }

    const payment = await resp.json();
    const paymentId: string = payment.id;
    const paymentUrl: string | undefined = payment.confirmation?.confirmation_url;

    await db.update(orders).set({ providerId: paymentId }).where(eq(orders.id, newOrder.id));

    if (paymentUrl) {
      return NextResponse.redirect(paymentUrl);
    }

    return NextResponse.json({ paymentId, paymentUrl: null, orderId: newOrder.id });
  } catch (e: any) {
    return NextResponse.json({ error: 'Unexpected error', message: e?.message || String(e) }, { status: 500 });
  }
}


