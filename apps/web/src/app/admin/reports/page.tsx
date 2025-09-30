import { Metadata } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { db, userRoles, eq } from '@zv/db';
import { AdminReportsContent } from '@/components/AdminReportsContent';

export const metadata: Metadata = {
  title: 'Модерация отчётов | Админ-панель | Звёздное Веретено',
  description: 'Модерация отчётов мастеров о проведённых игровых сессиях',
};

export default async function AdminReportsPage() {
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
  
  if (!roles.includes('SUPERADMIN') && !roles.includes('MODERATOR')) {
    redirect('/');
  }

  return <AdminReportsContent />;
}
