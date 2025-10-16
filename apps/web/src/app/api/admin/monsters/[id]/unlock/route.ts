/**
 * API для разблокировки монстра (админ-панель)
 * POST /api/admin/monsters/[id]/unlock - разблокировать монстра
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { monstersRepo } from '@zv/db';

/**
 * POST /api/admin/monsters/[id]/unlock
 * Разблокировать монстра (ручной unlock админом)
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
    const monster = await monstersRepo.unlock(params.id);

    return NextResponse.json({
      success: true,
      monster,
      message: 'Monster unlocked successfully',
    });
  } catch (error: any) {
    console.error('Error unlocking monster:', error);

    if (error.message === 'Monster not found') {
      return NextResponse.json({ error: 'Monster not found' }, { status: 404 });
    }

    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    );
  }
}

