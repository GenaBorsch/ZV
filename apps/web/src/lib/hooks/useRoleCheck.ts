import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

type Role = 'PLAYER' | 'MASTER' | 'MODERATOR' | 'SUPERADMIN';

export function useRoleCheck(requiredRoles: Role[], redirectTo: string = '/') {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'loading') return; // Еще загружается

    if (status === 'unauthenticated') {
      router.push('/auth/login');
      return;
    }

    if (session?.user) {
      const userRoles = (session.user as any).roles || [];
      const activeRole = (session.user as any).activeRole;
      
      // Проверяем активную роль или все роли пользователя
      let hasRequiredRole: boolean;
      
      if (activeRole) {
        // Если есть активная роль, проверяем её
        hasRequiredRole = requiredRoles.includes(activeRole as Role);
      } else {
        // Если нет активной роли, проверяем все роли
        hasRequiredRole = requiredRoles.some(role => userRoles.includes(role));
      }
      
      if (!hasRequiredRole) {
        router.push(redirectTo);
        return;
      }
    }
  }, [session, status, requiredRoles, redirectTo, router]);

  const userRoles = session?.user ? (session.user as any).roles || [] : [];
  const activeRole = session?.user ? (session.user as any).activeRole : null;
  
  // Проверяем активную роль или все роли
  const hasRequiredRole = activeRole 
    ? requiredRoles.includes(activeRole as Role)
    : requiredRoles.some(role => userRoles.includes(role));
  
  return {
    isLoading: status === 'loading',
    isAuthenticated: status === 'authenticated',
    hasRequiredRole,
    userRoles,
    activeRole,
  };
}

export function usePlayerCheck() {
  return useRoleCheck(['PLAYER']);
}

export function useMasterCheck() {
  return useRoleCheck(['MASTER', 'MODERATOR', 'SUPERADMIN']);
}

export function useAdminCheck() {
  return useRoleCheck(['MODERATOR', 'SUPERADMIN']);
}
