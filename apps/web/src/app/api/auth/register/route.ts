import { NextResponse } from 'next/server';
import { db, users, userRoles, eq } from '@zv/db';
import bcrypt from 'bcryptjs';

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();
    if (!email || !password) {
      return NextResponse.json({ error: 'email и password обязательны' }, { status: 400 });
    }

    const existing = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (existing.length > 0) {
      return NextResponse.json({ error: 'Пользователь уже существует' }, { status: 409 });
    }

    const passwordHash = bcrypt.hashSync(password, 12);
    const [user] = await db.insert(users).values({ email, passwordHash }).returning();

    await db.insert(userRoles).values({ userId: user.id, role: 'PLAYER' });

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}


