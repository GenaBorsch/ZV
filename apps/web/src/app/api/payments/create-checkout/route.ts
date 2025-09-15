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

    // Создаем платеж через ЮKassa API
    const shopId = env('YKS_SHOP_ID');
    const secretKey = env('YKS_SECRET');
    const baseUrl = process.env.YOOKASSA_RETURN_URL || `${env('PUBLIC_BASE_URL')}/player/battlepass/success`;

    const idempotenceKey = crypto.randomUUID();
    const auth = Buffer.from(`${shopId}:${secretKey}`).toString('base64');
    const description = `Баттлпасс ${product.sku} заказ ${newOrder.id}`;
    
    const paymentBody = {
      amount: { value: (product.priceRub).toFixed(2), currency: 'RUB' },
      capture: true,
      description,
      confirmation: { 
        type: 'redirect', 
        return_url: `${baseUrl}?orderId=${newOrder.id}` 
      },
      metadata: { 
        orderId: newOrder.id, 
        forUserId: targetUserId, 
        productSku: product.sku 
      },
    };

    console.log('🎯 Creating ЮKassa payment:', {
      shopId,
      secretKey: secretKey.substring(0, 10) + '...',
      amount: paymentBody.amount,
      returnUrl: paymentBody.confirmation.return_url
    });

    const resp = await fetch('https://api.yookassa.ru/v3/payments', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Idempotence-Key': idempotenceKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(paymentBody),
    });

    console.log('📤 YooKassa request details:', {
      url: 'https://api.yookassa.ru/v3/payments',
      idempotenceKey,
      paymentBody: JSON.stringify(paymentBody, null, 2)
    });

    if (!resp.ok) {
      const errText = await resp.text();
      console.error('ЮKassa API error:', errText);
      return NextResponse.json({ 
        error: 'Failed to create payment', 
        details: errText 
      }, { status: 502 });
    }

    const payment = await resp.json();
    console.log('✅ ЮKassa payment created:', payment.id);
    console.log('📥 YooKassa response:', JSON.stringify(payment, null, 2));

    // Обновляем заказ с ID платежа
    await db.update(orders).set({ providerId: payment.id }).where(eq(orders.id, newOrder.id));

    const paymentUrl = payment.confirmation?.confirmation_url;
    
    console.log('🔍 Payment URL from YooKassa:', paymentUrl);
    console.log('🔍 Payment ID from YooKassa:', payment.id);
    
    if (paymentUrl) {
      console.log('🔄 Returning payment URL to frontend:', paymentUrl);
      return NextResponse.json({ 
        success: true,
        paymentId: payment.id, 
        confirmationUrl: paymentUrl,
        orderId: newOrder.id
      });
    } else {
      console.log('❌ No confirmation_url in YooKassa response!');
      return NextResponse.json({ 
        success: false,
        error: 'No confirmation URL received from YooKassa'
      }, { status: 500 });
    }

  } catch (e: any) {
    console.error('Payment creation error:', e);
    return NextResponse.json({ 
      error: 'Unexpected error', 
      message: e?.message || String(e) 
    }, { status: 500 });
  }
}


