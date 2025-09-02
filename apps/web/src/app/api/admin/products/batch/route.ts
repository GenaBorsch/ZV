import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db, products, inArray } from '@zv/db';

function isAdmin(roles: string[] | undefined): boolean {
  const r = roles || [];
  return r.includes('MODERATOR') || r.includes('SUPERADMIN');
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions as any);
    const roles = (session?.user as any)?.roles as string[] | undefined;
    if (!isAdmin(roles)) return NextResponse.json({ error: 'forbidden' }, { status: 403 });

    const { ids, action } = await req.json();
    if (!Array.isArray(ids) || !action) return NextResponse.json({ error: 'invalid' }, { status: 400 });

    const set: any = {};
    if (action === 'activate') set.active = true;
    else if (action === 'deactivate') set.active = false;
    else if (action === 'show') set.visible = true;
    else if (action === 'hide') set.visible = false;
    else if (action === 'archive') set.archivedAt = new Date();
    else return NextResponse.json({ error: 'unknown_action' }, { status: 400 });

    await db.update(products).set(set).where(inArray(products.id, ids));
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || String(e) }, { status: 500 });
  }
}



