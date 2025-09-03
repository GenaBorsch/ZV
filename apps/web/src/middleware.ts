import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

const PROTECTED_PREFIXES = ['/player', '/master', '/admin'];
const ADMIN_ONLY_PATHS = ['/admin/users'];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const isProtected = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p));
  if (!isProtected) return NextResponse.next();

  const hasSession =
    req.cookies.has('next-auth.session-token') ||
    req.cookies.has('__Secure-next-auth.session-token');
  if (!hasSession) {
    const url = req.nextUrl.clone();
    url.pathname = '/auth/login';
    url.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(url);
  }

  // Получаем токен для проверки ролей
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    const userRoles = (token?.roles as string[]) || [];

    // Проверка ролей для админских маршрутов
    const isAdminOnlyPath = ADMIN_ONLY_PATHS.some((path) => pathname.startsWith(path));
    if (isAdminOnlyPath || pathname.startsWith('/admin')) {
      const hasAdminRole = userRoles.includes('MODERATOR') || userRoles.includes('SUPERADMIN');
      
      if (!hasAdminRole) {
        const url = req.nextUrl.clone();
        url.pathname = '/';
        return NextResponse.redirect(url);
      }
    }

    // Проверка ролей для страниц игрока
    if (pathname.startsWith('/player')) {
      const hasPlayerRole = userRoles.includes('PLAYER');
      
      if (!hasPlayerRole) {
        const url = req.nextUrl.clone();
        url.pathname = '/';
        return NextResponse.redirect(url);
      }
    }

    // Проверка ролей для страниц мастера
    if (pathname.startsWith('/master')) {
      const hasMasterRole = userRoles.includes('MASTER') || 
                           userRoles.includes('MODERATOR') || 
                           userRoles.includes('SUPERADMIN');
      
      if (!hasMasterRole) {
        const url = req.nextUrl.clone();
        url.pathname = '/';
        return NextResponse.redirect(url);
      }
    }

  } catch (error) {
    // Если не можем получить токен, редиректим на авторизацию
    const url = req.nextUrl.clone();
    url.pathname = '/auth/login';
    url.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/player/:path*', '/master/:path*', '/admin/:path*'],
};


