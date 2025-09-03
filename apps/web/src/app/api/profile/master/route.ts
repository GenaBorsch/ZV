import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { ProfilesRepo } from '@zv/db';
import { UpdateMasterProfileDto } from '@zv/contracts';
import { authOptions } from '@/lib/auth';

export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Проверяем, что у пользователя есть роль MASTER, MODERATOR или SUPERADMIN
    const userRoles = (session.user as any).roles || [];
    const hasMasterAccess = userRoles.some((role: string) => 
      ['MASTER', 'MODERATOR', 'SUPERADMIN'].includes(role)
    );
    
    if (!hasMasterAccess) {
      return NextResponse.json({ error: 'Forbidden: Master role required' }, { status: 403 });
    }

    const body = await request.json();
    const parsed = UpdateMasterProfileDto.safeParse(body);
    
    if (!parsed.success) {
      return NextResponse.json({ 
        error: 'Validation error', 
        details: parsed.error.errors 
      }, { status: 400 });
    }

    const profilesRepo = new ProfilesRepo();
    const profile = await profilesRepo.updateMasterProfile(session.user.id, parsed.data);
    
    return NextResponse.json({ profile });
  } catch (error) {
    console.error('Error in PATCH /api/profile/master:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export const POST = PATCH;
