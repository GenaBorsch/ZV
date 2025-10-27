import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

const PROTECTED_PREFIXES = ['/player', '/master', '/admin'];
const ADMIN_ONLY_PATHS = ['/admin/users'];
const PROFILE_REQUIRED_PATHS = ['/player', '/master'];

// Функция для проверки базовой HTTP аутентификации
function checkBasicAuth(req: NextRequest): boolean {
  // Проверяем флаг включения базовой аутентификации
  const basicAuthEnabled = process.env.NEXT_PUBLIC_BASIC_AUTH_ENABLED === 'true';
  
  if (!basicAuthEnabled) {
    return true; // Пропускаем, если базовая аутентификация отключена
  }
  
  // Если переменные не установлены, пропускаем базовую аутентификацию
  const basicUser = process.env.BASIC_AUTH_USER;
  const basicPass = process.env.BASIC_AUTH_PASSWORD;
  
  if (!basicUser || !basicPass) {
    return true; // Пропускаем, если аутентификация не настроена
  }

  const authHeader = req.headers.get('authorization');
  
  if (!authHeader || !authHeader.startsWith('Basic ')) {
    return false;
  }

  try {
    const base64Credentials = authHeader.slice(6);
    const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii');
    const [username, password] = credentials.split(':');
    
    return username === basicUser && password === basicPass;
  } catch {
    return false;
  }
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  
  // Проверяем базовую HTTP аутентификацию для всего сайта
  if (!checkBasicAuth(req)) {
    return new NextResponse('Authentication required', {
      status: 401,
      headers: {
        'WWW-Authenticate': 'Basic realm="Secure Area"',
      },
    });
  }
  
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
    const userName = token?.name as string | null;
    const activeRole = token?.activeRole as string | null;

    // Если у пользователя несколько ролей и нет активной роли, перенаправляем на выбор
    if (userRoles.length > 1 && !activeRole && pathname !== '/select-role' && pathname !== '/profile' && pathname !== '/auth/login') {
      const url = req.nextUrl.clone();
      url.pathname = '/select-role';
      url.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(url);
    }

    // Проверяем, нужно ли заполнить профиль
    const requiresProfile = PROFILE_REQUIRED_PATHS.some((path) => pathname.startsWith(path));
    if (requiresProfile && !userName && pathname !== '/profile') {
      const url = req.nextUrl.clone();
      url.pathname = '/profile';
      url.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(url);
    }

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
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};


