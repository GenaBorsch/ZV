/**
 * API для разблокировки текстового элемента (админ-панель)
 * POST /api/admin/story-texts/[id]/unlock - разблокировать текст
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { storyTextsRepo } from '@zv/db';

/**
 * POST /api/admin/story-texts/[id]/unlock
 * Разблокировать текстовый элемент (ручной unlock админом)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Проверка авторизации
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Проверка роли (только MODERATOR или SUPERADMIN)
    const userRoles = (session.user as any).roles || [];
    if (!userRoles.includes('MODERATOR') && !userRoles.includes('SUPERADMIN')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Разблокировка
    const storyText = await storyTextsRepo.unlock(params.id);

    return NextResponse.json({
      success: true,
      storyText,
      message: 'Story text unlocked successfully',
    });
  } catch (error: any) {
    console.error('Error unlocking story text:', error);

    if (error.message === 'Story text not found') {
      return NextResponse.json({ error: 'Story text not found' }, { status: 404 });
    }

    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    );
  }
}

