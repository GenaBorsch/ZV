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
      const hasRequiredRole = requiredRoles.some(role => userRoles.includes(role));
      
      if (!hasRequiredRole) {
        router.push(redirectTo);
        return;
      }
    }
  }, [session, status, requiredRoles, redirectTo, router]);

  const userRoles = session?.user ? (session.user as any).roles || [] : [];
  const hasRequiredRole = requiredRoles.some(role => userRoles.includes(role));
  
  return {
    isLoading: status === 'loading',
    isAuthenticated: status === 'authenticated',
    hasRequiredRole,
    userRoles,
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
