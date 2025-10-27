import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { activeRole } = body;

    if (!activeRole) {
      return NextResponse.json({ error: 'Role is required' }, { status: 400 });
    }

    const userRoles = (session.user as any).roles || [];
    
    // Проверяем, что роль действительно есть у пользователя
    if (!userRoles.includes(activeRole)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 403 });
    }

    // Обновляем сессию через update
    // Это вызовет callback jwt с trigger='update'
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error setting active role:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

