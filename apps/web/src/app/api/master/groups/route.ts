import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { GroupsRepo } from '@zv/db';

// GET /api/master/groups - получить группы мастера для создания отчетов
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userRoles = (session.user as any).roles || [];
    if (!userRoles.includes('MASTER')) {
      return NextResponse.json({ error: 'Only masters can access this endpoint' }, { status: 403 });
    }

    // Получаем группы мастера
    const groups = await GroupsRepo.getByMasterId(session.user.id);
    
    // Для каждой группы получаем участников
    const groupsWithMembers = await Promise.all(
      groups.map(async (group) => {
        const members = await GroupsRepo.getGroupMembers(group.id);
        return {
          id: group.id,
          name: group.name,
          description: group.description,
          currentMembers: group.currentMembers,
          maxMembers: group.maxMembers,
          members: members.map(member => ({
            id: member.userId,
            name: member.name || member.email,
            email: member.email,
            status: member.status
          }))
        };
      })
    );

    return NextResponse.json({ groups: groupsWithMembers });
  } catch (error) {
    console.error('Error fetching master groups:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
