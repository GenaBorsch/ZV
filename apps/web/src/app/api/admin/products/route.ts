import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db, products, and, eq, ilike, or } from '@zv/db';

function isAdmin(roles: string[] | undefined): boolean {
  const r = roles || [];
  return r.includes('MODERATOR') || r.includes('SUPERADMIN');
}

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  const roles = (session?.user as any)?.roles as string[] | undefined;
  if (!isAdmin(roles)) return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  const url = new URL(req.url);
  const type = url.searchParams.get('type') || 'BATTLEPASS';
  const q = url.searchParams.get('q') || '';
  const active = url.searchParams.get('active');
  const visible = url.searchParams.get('visible');

  const listAll = await db.select().from(products);
  const list = (listAll as any[])
    .filter((p) => p.type === type)
    .filter((p) => (active === 'true' ? p.active === true : active === 'false' ? p.active === false : true))
    .filter((p) => (visible === 'true' ? p.visible === true : visible === 'false' ? p.visible === false : true))
    .filter((p) => (q ? (String(p.sku || '').toLowerCase().includes(q.toLowerCase()) || String(p.title || '').toLowerCase().includes(q.toLowerCase())) : true));
  const sorted = list.sort((a, b) => (a.sortIndex - b.sortIndex) || String(a.title || '').localeCompare(String(b.title || ''), 'ru'));
  return NextResponse.json({ items: sorted });
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const roles = (session?.user as any)?.roles as string[] | undefined;
    if (!isAdmin(roles)) return NextResponse.json({ error: 'forbidden' }, { status: 403 });

    const body = await req.json();
    const {
      type = 'BATTLEPASS', sku, title, description, imageUrl,
      priceRub, bpUsesTotal, active = true, visible = true,
      sortIndex = 0, seasonRequired = false,
    } = body || {};

    const toNumber = (v: any, def: number) => (typeof v === 'number' ? v : v != null ? Number(v) : def);
    const toBool = (v: any, def: boolean) => (typeof v === 'boolean' ? v : v != null ? String(v) === 'true' : def);

    const priceRubNum = toNumber(priceRub, 0);
    const bpUsesTotalNum = toNumber(bpUsesTotal, 1);
    const sortIndexNum = toNumber(sortIndex, 0);
    const activeBool = toBool(active, true);
    const visibleBool = toBool(visible, true);
    const seasonRequiredBool = toBool(seasonRequired, false);

    if (!sku || !title || Number.isNaN(priceRubNum) || Number.isNaN(bpUsesTotalNum)) {
      return NextResponse.json({ error: 'invalid_fields' }, { status: 400 });
    }
    if (priceRubNum < 0 || bpUsesTotalNum < 1) {
      return NextResponse.json({ error: 'invalid_values' }, { status: 400 });
    }

    // unique SKU
    const existing = await db.select().from(products).where(eq(products.sku, sku)).limit(1);
    if (existing[0]) {
      return NextResponse.json({ error: 'sku_conflict' }, { status: 409 });
    }

    const [created] = await db.insert(products).values({
      type,
      sku,
      title,
      description: description ?? null,
      imageUrl: imageUrl ?? null,
      priceRub: priceRubNum,
      bpUsesTotal: bpUsesTotalNum,
      active: activeBool,
      visible: visibleBool,
      sortIndex: sortIndexNum,
      seasonRequired: seasonRequiredBool,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any).returning();

    return NextResponse.json({ item: created }, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || String(e) }, { status: 500 });
  }
}


