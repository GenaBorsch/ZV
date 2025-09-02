import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db, products, eq } from '@zv/db';

function isAdmin(roles: string[] | undefined): boolean {
  const r = roles || [];
  return r.includes('MODERATOR') || r.includes('SUPERADMIN');
}

export async function PATCH(_req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions as any);
    const roles = (session?.user as any)?.roles as string[] | undefined;
    if (!isAdmin(roles)) return NextResponse.json({ error: 'forbidden' }, { status: 403 });

    const id = params.id;
    const body = await _req.json();
    const update: any = {};
    const fields = ['sku','title','description','priceRub','bpUsesTotal','active','visible','sortIndex','seasonRequired','archivedAt'];
    for (const f of fields) {
      if (f in body) {
        const v = body[f];
        if (f === 'priceRub' || f === 'bpUsesTotal' || f === 'sortIndex') update[f] = Number(v);
        else if (f === 'active' || f === 'visible' || f === 'seasonRequired') update[f] = v === true || v === 'true';
        else update[f] = v;
      }
    }
    if ('priceRub' in update && update.priceRub < 0) return NextResponse.json({ error: 'invalid_values' }, { status: 400 });
    if ('bpUsesTotal' in update && update.bpUsesTotal < 1) return NextResponse.json({ error: 'invalid_values' }, { status: 400 });

    // sku unique check if changed
    if (update.sku) {
      const existing = await db.select().from(products).where(eq(products.sku, update.sku)).limit(1);
      if (existing[0] && existing[0].id !== id) {
        return NextResponse.json({ error: 'sku_conflict' }, { status: 409 });
      }
    }

    update.updatedAt = new Date();
    const [saved] = await db.update(products).set(update).where(eq(products.id, id)).returning();
    if (!saved) return NextResponse.json({ error: 'not_found' }, { status: 404 });
    return NextResponse.json({ item: saved });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || String(e) }, { status: 500 });
  }
}

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions as any);
  const roles = (session?.user as any)?.roles as string[] | undefined;
  if (!isAdmin(roles)) return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  const id = params.id;
  const [item] = await db.select().from(products).where(eq(products.id, id)).limit(1);
  if (!item) return NextResponse.json({ error: 'not_found' }, { status: 404 });
  return NextResponse.json({ item });
}


