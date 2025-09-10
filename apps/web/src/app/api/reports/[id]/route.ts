import { NextRequest, NextResponse } from 'next/server';
import { db } from '@zv/db';
import { reports, reportPlayers, users, userRoles, notifications } from '@zv/db';
import { UpdateReportDto, ModerateReportDto } from '@zv/contracts';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { checkReportModerationLimit } from '@/lib/reportRateLimit';
import { eq, and } from 'drizzle-orm';

interface RouteParams {
  params: {
    id: string;
  };
}

// GET /api/reports/[id] - получить конкретный отчёт
export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Получаем отчёт
    const [report] = await db
      .select({
        id: reports.id,
        sessionId: reports.sessionId,
        masterId: reports.masterId,
        masterName: users.name,
        masterEmail: users.email,
        description: reports.description,
        highlights: reports.highlights,
        status: reports.status,
        rejectionReason: reports.rejectionReason,
        createdAt: reports.createdAt,
        updatedAt: reports.updatedAt,
      })
      .from(reports)
      .leftJoin(users, eq(reports.masterId, users.id))
      .where(eq(reports.id, params.id));

    if (!report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    // Проверяем права доступа
    const userRolesData = await db
      .select()
      .from(userRoles)
      .where(eq(userRoles.userId, session.user.id));
    
    const roles = userRolesData.map(r => r.role);
    const isAdmin = roles.includes('SUPERADMIN') || roles.includes('MODERATOR');
    const isMaster = roles.includes('MASTER') && report.masterId === session.user.id;
    
    // Проверяем, участвует ли игрок в отчёте
    const [playerParticipation] = await db
      .select()
      .from(reportPlayers)
      .where(and(
        eq(reportPlayers.reportId, params.id),
        eq(reportPlayers.playerId, session.user.id)
      ));

    const isParticipant = !!playerParticipation;

    if (!isAdmin && !isMaster && !isParticipant) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Получаем игроков отчёта
    const playersData = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
      })
      .from(reportPlayers)
      .leftJoin(users, eq(reportPlayers.playerId, users.id))
      .where(eq(reportPlayers.reportId, params.id));

    const result = {
      ...report,
      players: playersData,
    };

    return NextResponse.json({ report: result });
  } catch (error) {
    console.error('Error fetching report:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH /api/reports/[id] - обновить отчёт
export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const url = new URL(req.url);
    const action = url.searchParams.get('action');

    // Получаем отчёт
    const [report] = await db
      .select()
      .from(reports)
      .where(eq(reports.id, params.id));

    if (!report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    // Проверяем права доступа
    const userRolesData = await db
      .select()
      .from(userRoles)
      .where(eq(userRoles.userId, session.user.id));
    
    const roles = userRolesData.map(r => r.role);
    const isAdmin = roles.includes('SUPERADMIN') || roles.includes('MODERATOR');
    const isMaster = roles.includes('MASTER') && report.masterId === session.user.id;

    if (action === 'moderate') {
      // Модерация отчёта (только админы)
      if (!isAdmin) {
        return NextResponse.json({ error: 'Only admins can moderate reports' }, { status: 403 });
      }

      // Проверяем rate limit для модерации
      const canModerate = await checkReportModerationLimit(session.user.id);
      if (!canModerate) {
        return NextResponse.json({ error: 'Rate limit exceeded. You can moderate maximum 100 reports per hour.' }, { status: 429 });
      }

      const validatedData = ModerateReportDto.parse(body);

      if (report.status !== 'PENDING') {
        return NextResponse.json({ error: 'Can only moderate pending reports' }, { status: 400 });
      }

      const newStatus = validatedData.action === 'approve' ? 'APPROVED' : 'REJECTED';

      // Обновляем отчёт
      await db
        .update(reports)
        .set({
          status: newStatus,
          rejectionReason: validatedData.rejectionReason || null,
          updatedAt: new Date(),
        })
        .where(eq(reports.id, params.id));

      // Если отчёт одобрен, списываем игры с баттлпассов
      if (validatedData.action === 'approve') {
        const playersData = await db
          .select({ playerId: reportPlayers.playerId })
          .from(reportPlayers)
          .where(eq(reportPlayers.reportId, params.id));

        // Вызываем API списания для каждого игрока
        const redeemResults = [];
        for (const player of playersData) {
          try {
            const redeemResponse = await fetch(`${req.nextUrl.origin}/api/battlepasses/redeem`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                userId: player.playerId,
                sessionId: report.sessionId,
                reportId: params.id,
              }),
            });
            
            const redeemResult = await redeemResponse.json();
            redeemResults.push({ playerId: player.playerId, result: redeemResult });
          } catch (error) {
            console.error(`Error redeeming battlepass for player ${player.playerId}:`, error);
            redeemResults.push({ playerId: player.playerId, error: error.message });
          }
        }

        // Создаём уведомления
        await createNotificationsForReport(params.id, 'approved', redeemResults);
      } else {
        // Создаём уведомления об отклонении
        await createNotificationsForReport(params.id, 'rejected');
      }

      return NextResponse.json({ success: true, status: newStatus });

    } else if (action === 'cancel' && isAdmin && roles.includes('SUPERADMIN')) {
      // Отмена одобренного отчёта (только SUPERADMIN)
      if (report.status !== 'APPROVED') {
        return NextResponse.json({ error: 'Can only cancel approved reports' }, { status: 400 });
      }

      // TODO: Реализовать возврат игр в баттлпассы
      // Это сложная операция, требующая реверса writeoff записей

      await db
        .update(reports)
        .set({
          status: 'CANCELLED',
          updatedAt: new Date(),
        })
        .where(eq(reports.id, params.id));

      await createNotificationsForReport(params.id, 'cancelled');

      return NextResponse.json({ success: true, status: 'CANCELLED' });

    } else {
      // Обновление отчёта мастером
      if (!isMaster) {
        return NextResponse.json({ error: 'Only report owner can update it' }, { status: 403 });
      }

      if (report.status !== 'PENDING' && report.status !== 'REJECTED') {
        return NextResponse.json({ error: 'Can only edit pending or rejected reports' }, { status: 400 });
      }

      const validatedData = UpdateReportDto.parse(body);

      // Обновляем основные поля отчёта
      const updateData: any = {
        updatedAt: new Date(),
      };

      if (validatedData.description !== undefined) {
        updateData.description = validatedData.description;
        updateData.summary = validatedData.description; // для совместимости
      }
      if (validatedData.highlights !== undefined) {
        updateData.highlights = validatedData.highlights;
      }
      if (validatedData.sessionId !== undefined) {
        updateData.sessionId = validatedData.sessionId;
      }

      // Если статус был REJECTED, возвращаем в PENDING
      if (report.status === 'REJECTED') {
        updateData.status = 'PENDING';
        updateData.rejectionReason = null;
      }

      await db
        .update(reports)
        .set(updateData)
        .where(eq(reports.id, params.id));

      // Обновляем список игроков, если передан
      if (validatedData.playerIds) {
        // Удаляем старые связи
        await db
          .delete(reportPlayers)
          .where(eq(reportPlayers.reportId, params.id));

        // Добавляем новые связи
        await db.insert(reportPlayers).values(
          validatedData.playerIds.map(playerId => ({
            reportId: params.id,
            playerId,
          }))
        );
      }

      return NextResponse.json({ success: true });
    }
  } catch (error) {
    if (error instanceof Error && 'issues' in error) {
      // Zod validation error
      return NextResponse.json({ error: 'Validation error', details: error }, { status: 400 });
    }
    
    console.error('Error updating report:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Функция для создания уведомлений
async function createNotificationsForReport(reportId: string, action: 'approved' | 'rejected' | 'cancelled', redeemResults?: any[]) {
  try {
    // Получаем данные отчёта
    const [report] = await db
      .select({
        masterId: reports.masterId,
        masterName: users.name,
        description: reports.description,
      })
      .from(reports)
      .leftJoin(users, eq(reports.masterId, users.id))
      .where(eq(reports.id, reportId));

    if (!report) return;

    // Получаем игроков
    const playersData = await db
      .select({
        playerId: reportPlayers.playerId,
        playerName: users.name,
      })
      .from(reportPlayers)
      .leftJoin(users, eq(reportPlayers.playerId, users.id))
      .where(eq(reportPlayers.reportId, reportId));

    const notificationsToCreate = [];

    // Уведомление мастеру
    let masterTitle = '';
    let masterMessage = '';

    if (action === 'approved') {
      masterTitle = 'Отчёт одобрен';
      masterMessage = `Ваш отчёт "${report.description.substring(0, 50)}..." был одобрен администратором.`;
    } else if (action === 'rejected') {
      masterTitle = 'Отчёт отклонён';
      masterMessage = `Ваш отчёт "${report.description.substring(0, 50)}..." был отклонён администратором.`;
    } else if (action === 'cancelled') {
      masterTitle = 'Отчёт отменён';
      masterMessage = `Ваш отчёт "${report.description.substring(0, 50)}..." был отменён администратором.`;
    }

    notificationsToCreate.push({
      userId: report.masterId,
      title: masterTitle,
      message: masterMessage,
      type: action === 'approved' ? 'SUCCESS' : action === 'rejected' ? 'WARNING' : 'INFO',
      relatedType: 'REPORT',
      relatedId: reportId,
    });

    // Уведомления игрокам
    for (const player of playersData) {
      let playerTitle = '';
      let playerMessage = '';

      if (action === 'approved') {
        const redeemResult = redeemResults?.find(r => r.playerId === player.playerId);
        const wasRedeemed = redeemResult?.result?.ok && !redeemResult?.result?.alreadyRedeemed;
        
        playerTitle = 'Игра засчитана';
        if (wasRedeemed) {
          playerMessage = `Игра от мастера ${report.masterName} одобрена. Списана 1 игра из вашего баттлпасса.`;
        } else {
          playerMessage = `Игра от мастера ${report.masterName} одобрена, но у вас нет доступных игр в баттлпассе.`;
        }
      } else if (action === 'rejected') {
        playerTitle = 'Отчёт отклонён';
        playerMessage = `Отчёт о игре от мастера ${report.masterName} был отклонён администратором.`;
      } else if (action === 'cancelled') {
        playerTitle = 'Отчёт отменён';
        playerMessage = `Отчёт о игре от мастера ${report.masterName} был отменён. Игра возвращена в ваш баттлпасс.`;
      }

      notificationsToCreate.push({
        userId: player.playerId,
        title: playerTitle,
        message: playerMessage,
        type: action === 'approved' ? 'SUCCESS' : 'INFO',
        relatedType: 'REPORT',
        relatedId: reportId,
      });
    }

    // Создаём уведомления
    if (notificationsToCreate.length > 0) {
      await db.insert(notifications).values(notificationsToCreate);
    }
  } catch (error) {
    console.error('Error creating notifications:', error);
  }
}
