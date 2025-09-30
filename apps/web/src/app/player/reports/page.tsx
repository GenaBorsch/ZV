import { Metadata } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { db } from '@zv/db';
import { userRoles, eq } from '@zv/db';
import { PlayerReportsContent } from '@/components/PlayerReportsContent';

export const metadata: Metadata = {
  title: 'История игр | Звёздное Веретено',
  description: 'История участия в игровых сессиях и отчёты мастеров',
};

export default async function PlayerReportsPage() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    redirect('/auth/login');
  }

  // Проверяем роли пользователя
  const userRolesData = await db
    .select()
    .from(userRoles)
    .where(eq(userRoles.userId, session.user.id));
  
  const roles = userRolesData.map(r => r.role);
  
  if (!roles.includes('PLAYER') && !roles.includes('MASTER') && !roles.includes('MODERATOR') && !roles.includes('SUPERADMIN')) {
    redirect('/');
  }

  return <PlayerReportsContent />;
}
