/**
 * API для режима "Продолжение" - получить последний план группы
 * GET /api/story-pool/continuation?groupId=xxx
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { reportNextPlansRepo } from '@zv/db';

/**
 * GET /api/story-pool/continuation?groupId=xxx
 * Получить последний APPROVED план для группы (для продолжения)
 */
export async function GET(request: NextRequest) {
  try {
    // Проверка авторизации
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Проверка роли (только MASTER)
    const userRoles = (session.user as any).roles || [];
    if (!userRoles.includes('MASTER')) {
      return NextResponse.json(
        { error: 'Forbidden', message: 'Only masters can access this endpoint' },
        { status: 403 }
      );
    }

    // Параметры
    const searchParams = request.nextUrl.searchParams;
    const groupId = searchParams.get('groupId');

    if (!groupId) {
      return NextResponse.json(
        { error: 'Missing groupId parameter' },
        { status: 400 }
      );
    }

    // Получить последний APPROVED план для группы
    const lastApproved = await reportNextPlansRepo.getLastApprovedForGroup(groupId);

    if (!lastApproved) {
      return NextResponse.json(
        {
          message: 'No previous approved reports found for this group',
          hasPreviousPlan: false,
        },
        { status: 200 }
      );
    }

    // Получить полные данные плана с элементами
    const planWithElements = await reportNextPlansRepo.getByReportIdWithElements(
      lastApproved.report.id
    );

    return NextResponse.json({
      hasPreviousPlan: true,
      report: lastApproved.report,
      plan: planWithElements,
    });
  } catch (error: any) {
    console.error('Error fetching continuation plan:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    );
  }
}

