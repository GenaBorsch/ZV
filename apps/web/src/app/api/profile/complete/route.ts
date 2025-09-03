import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { ProfilesRepo } from '@zv/db';
import { authOptions } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const profilesRepo = new ProfilesRepo();
    const isComplete = await profilesRepo.isProfileComplete(session.user.id);
    
    return NextResponse.json({ isComplete });
  } catch (error) {
    console.error('Error in GET /api/profile/complete:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
