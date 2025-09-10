import { NextResponse } from 'next/server';
import { db, battlepasses, writeoffs, sessions, and, asc, eq, sql } from '@zv/db';

type RedeemBody = { userId: string; sessionId?: string; reportId?: string };

export async function POST(req: Request) {
  try {
    const { userId, sessionId, reportId } = (await req.json()) as RedeemBody;
    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    if (!sessionId && !reportId) {
      return NextResponse.json({ error: 'Either sessionId or reportId is required' }, { status: 400 });
    }

    // idempotency: check existing writeoff
    let existing;
    if (reportId) {
      // Для отчётов проверяем по reportId
      existing = await db.select().from(writeoffs).where(and(eq(writeoffs.userId, userId), eq(writeoffs.reportId, reportId))).limit(1);
    } else {
      // Для сессий проверяем по sessionId
      existing = await db.select().from(writeoffs).where(and(eq(writeoffs.userId, userId), eq(writeoffs.sessionId, sessionId!))).limit(1);
    }
    
    if (existing[0]) {
      return NextResponse.json({ ok: true, alreadyRedeemed: true });
    }

    // choose active battlepass by priority SINGLE -> FOUR -> SEASON
    const active = await db
      .select()
      .from(battlepasses)
      .where(and(eq(battlepasses.userId, userId), eq(battlepasses.status, 'ACTIVE')))
      .orderBy(asc(sql`CASE ${battlepasses.kind} WHEN 'SINGLE' THEN 1 WHEN 'FOUR' THEN 2 WHEN 'SEASON' THEN 3 ELSE 4 END`))
      .limit(5);

    const bp = active.find((b: any) => b.usesLeft > 0);
    if (!bp) {
      return NextResponse.json({ error: 'No active battlepass' }, { status: 409 });
    }

    // transaction: decrement usesLeft and insert writeoff
    // drizzle-orm/postgres-js lacks explicit tx in this wrapper; emulate sequentially
    await db.update(battlepasses).set({ usesLeft: bp.usesLeft - 1, status: bp.usesLeft - 1 === 0 ? 'USED_UP' : 'ACTIVE' }).where(eq(battlepasses.id, bp.id));
    await db.insert(writeoffs).values({ 
      userId, 
      sessionId: sessionId || null, 
      reportId: reportId || null, 
      battlepassId: bp.id 
    });

    return NextResponse.json({ ok: true, battlepassId: bp.id });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || String(e) }, { status: 500 });
  }
}


