import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { ProfilesRepo } from '@zv/db';
import { UpdateProfileDto } from '@zv/contracts';
import { authOptions } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const profilesRepo = new ProfilesRepo();
    const profile = await profilesRepo.getProfile(session.user.id);
    
    return NextResponse.json({ profile });
  } catch (error) {
    console.error('Error in GET /api/profile:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const parsed = UpdateProfileDto.safeParse(body);
    
    if (!parsed.success) {
      return NextResponse.json({ 
        error: 'Validation error', 
        details: parsed.error.errors 
      }, { status: 400 });
    }

    const profilesRepo = new ProfilesRepo();
    
    console.log('API Profile update:', {
      userId: session.user.id,
      inputData: parsed.data
    });
    
    const profile = await profilesRepo.updateProfile(session.user.id, parsed.data);
    
    console.log('API Profile updated:', {
      userId: session.user.id,
      updatedProfile: profile
    });
    
    return NextResponse.json({ profile });
  } catch (error) {
    console.error('Error in PATCH /api/profile:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Для удобства, чтобы можно было использовать POST вместо PATCH
export const POST = PATCH;
