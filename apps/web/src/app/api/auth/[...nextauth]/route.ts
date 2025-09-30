import NextAuth from 'next-auth';
import { authOptions } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';
import { isRateLimited, getClientIpFromHeaders, RATE_LIMITS } from '@/lib/rateLimiter';

const nextAuthHandler = NextAuth(authOptions);

// Wrapper для GET запросов (без rate limiting)
export async function GET(req: NextRequest, context: any) {
  return nextAuthHandler(req, context);
}

// Wrapper для POST запросов (с rate limiting для защиты логина)
export async function POST(req: NextRequest, context: any) {
  // НОВОЕ: Защита от brute-force атак на логин
  const ip = getClientIpFromHeaders(req.headers);
  
  // Проверяем rate limit только для страницы логина (не для callbacks)
  const url = new URL(req.url);
  const isSignIn = url.searchParams.get('nextauth')?.includes('signin') || 
                   url.searchParams.get('nextauth')?.includes('callback');
  
  if (isSignIn && isRateLimited([ip, 'login'], RATE_LIMITS.AUTH)) {
    return NextResponse.json(
      { error: 'Слишком много попыток входа. Попробуйте через 15 минут' },
      { status: 429 }
    );
  }
  
  return nextAuthHandler(req, context);
}


