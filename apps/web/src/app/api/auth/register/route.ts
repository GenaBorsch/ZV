import { NextResponse } from 'next/server';
import { db, users, userRoles, eq } from '@zv/db';
import bcrypt from 'bcryptjs';
import { isRateLimited, getClientIpFromHeaders, RATE_LIMITS, resetRateLimit } from '@/lib/rateLimiter';

export async function POST(req: Request) {
  try {
    // НОВОЕ: Защита от спама регистраций
    const ip = getClientIpFromHeaders(req.headers);
    if (isRateLimited([ip, 'register'], RATE_LIMITS.AUTH)) {
      return NextResponse.json(
        { error: 'Слишком много попыток регистрации. Попробуйте через 15 минут' },
        { status: 429 } // 429 = Too Many Requests
      );
    }

    const { email, password, name, agreeToTerms } = await req.json();
    if (!email || !password) {
      return NextResponse.json({ error: 'email и password обязательны' }, { status: 400 });
    }

    // Проверяем согласие с условиями
    if (!agreeToTerms) {
      return NextResponse.json({ error: 'Необходимо согласиться с условиями использования и политикой конфиденциальности' }, { status: 400 });
    }

    const existing = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (existing.length > 0) {
      return NextResponse.json({ error: 'Пользователь уже существует' }, { status: 409 });
    }

    const passwordHash = bcrypt.hashSync(password, 12);
    const [user] = await db.insert(users).values({ 
      email, 
      passwordHash,
      name: name || null // Имя может быть пустым при регистрации
    }).returning();

    await db.insert(userRoles).values({ userId: user.id, role: 'PLAYER' });

    // НОВОЕ: Сбрасываем rate limit после успешной регистрации
    resetRateLimit([ip, 'register']);

    // Возвращаем информацию о том, что нужно заполнить профиль
    return NextResponse.json({ 
      ok: true, 
      needsProfile: !name, // Если имя не указано, нужно заполнить профиль
      userId: user.id 
    }, { status: 201 });
  } catch (err) {
    console.error('Registration error:', err);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}


