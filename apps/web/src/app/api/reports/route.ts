import { NextRequest, NextResponse } from 'next/server';
import { db } from '@zv/db';
import { reports, reportPlayers, users, userRoles, battlepasses, eq, and, or, desc } from '@zv/db';
import { CreateReportDto } from '@zv/contracts';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { checkReportCreationLimit } from '@/lib/reportRateLimit';

// GET /api/reports - получить список отчётов
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(req.url);
    const status = url.searchParams.get('status');
    const masterId = url.searchParams.get('masterId');
    const playerId = url.searchParams.get('playerId');
    
    // Проверяем роли пользователя
    const userRolesData = await db
      .select()
      .from(userRoles)
      .where(eq(userRoles.userId, session.user.id));
    
    const roles = userRolesData.map(r => r.role);
    const isAdmin = roles.includes('SUPERADMIN') || roles.includes('MODERATOR');
    const isMaster = roles.includes('MASTER');

    // Строим запрос с учётом прав доступа
    let query = db
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
      .leftJoin(users, eq(reports.masterId, users.id));

    // Фильтрация по правам доступа
    if (!isAdmin) {
      if (isMaster) {
        // Мастер видит только свои отчёты
        query = query.where(eq(reports.masterId, session.user.id));
      } else {
        // Игрок видит только отчёты, где он участвует
        const playerReportsQuery = db
          .select({ reportId: reportPlayers.reportId })
          .from(reportPlayers)
          .where(eq(reportPlayers.playerId, session.user.id));
        
        const playerReportIds = await playerReportsQuery;
        const reportIds = playerReportIds.map(r => r.reportId);
        
        if (reportIds.length === 0) {
          return NextResponse.json({ reports: [] });
        }
        
        query = query.where(or(...reportIds.map(id => eq(reports.id, id))));
      }
    }

    // Дополнительные фильтры
    const conditions = [];
    if (status) {
      conditions.push(eq(reports.status, status as any));
    }
    if (masterId && isAdmin) {
      conditions.push(eq(reports.masterId, masterId));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    const reportsData = await query.orderBy(desc(reports.createdAt));

    // Получаем игроков для каждого отчёта
    const reportsWithPlayers = await Promise.all(
      reportsData.map(async (report) => {
        const playersData = await db
          .select({
            id: users.id,
            name: users.name,
            email: users.email,
          })
          .from(reportPlayers)
          .leftJoin(users, eq(reportPlayers.playerId, users.id))
          .where(eq(reportPlayers.reportId, report.id));

        return {
          ...report,
          players: playersData,
        };
      })
    );

    return NextResponse.json({ reports: reportsWithPlayers });
  } catch (error) {
    console.error('Error fetching reports:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/reports - создать новый отчёт
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Проверяем, что пользователь - мастер
    const userRolesData = await db
      .select()
      .from(userRoles)
      .where(eq(userRoles.userId, session.user.id));
    
    const roles = userRolesData.map(r => r.role);
    if (!roles.includes('MASTER')) {
      return NextResponse.json({ error: 'Only masters can create reports' }, { status: 403 });
    }

    const body = await req.json();
    const validatedData = CreateReportDto.parse(body);

    // Проверяем rate limit
    const canCreate = await checkReportCreationLimit(session.user.id);
    if (!canCreate) {
      return NextResponse.json({ error: 'Rate limit exceeded. You can create maximum 10 reports per hour.' }, { status: 429 });
    }

    // Проверяем, что все указанные игроки существуют и имеют роль PLAYER
    const playersData = await db
      .select({ userId: users.id, role: userRoles.role })
      .from(users)
      .leftJoin(userRoles, eq(users.id, userRoles.userId))
      .where(or(...validatedData.playerIds.map(id => eq(users.id, id))));

    const validPlayers = playersData.filter(p => p.role === 'PLAYER');
    if (validPlayers.length !== validatedData.playerIds.length) {
      return NextResponse.json({ error: 'Some players not found or not valid' }, { status: 400 });
    }

    // Проверяем, что у каждого игрока есть хотя бы 1 активная игра в баттлпассе
    const playersWithoutBattlepass = [];
    for (const playerId of validatedData.playerIds) {
      const activeBattlepasses = await db
        .select()
        .from(battlepasses)
        .where(and(
          eq(battlepasses.userId, playerId),
          eq(battlepasses.status, 'ACTIVE')
        ));
      
      const hasAvailableGames = activeBattlepasses.some(bp => bp.usesLeft > 0);
      if (!hasAvailableGames) {
        const [player] = await db.select({ name: users.name, email: users.email }).from(users).where(eq(users.id, playerId));
        playersWithoutBattlepass.push(player.name || player.email);
      }
    }

    // Если есть игроки без доступных игр, возвращаем предупреждение
    if (playersWithoutBattlepass.length > 0) {
      return NextResponse.json({ 
        error: 'Some players do not have available games in battlepass', 
        details: `Плаяеры без доступных игр: ${playersWithoutBattlepass.join(', ')}`,
        playersWithoutBattlepass 
      }, { status: 400 });
    }

    // Создаём отчёт в транзакции
    const [newReport] = await db
      .insert(reports)
      .values({
        sessionId: validatedData.sessionId || null,
        masterId: session.user.id,
        summary: validatedData.description, // для совместимости со старой схемой
        description: validatedData.description,
        highlights: validatedData.highlights || null,
        status: 'PENDING',
      })
      .returning();

    // Добавляем связи с игроками
    await db.insert(reportPlayers).values(
      validatedData.playerIds.map(playerId => ({
        reportId: newReport.id,
        playerId,
      }))
    );

    // Получаем полные данные созданного отчёта
    const [reportWithData] = await db
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
      .where(eq(reports.id, newReport.id));

    const reportPlayersData = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
      })
      .from(reportPlayers)
      .leftJoin(users, eq(reportPlayers.playerId, users.id))
      .where(eq(reportPlayers.reportId, newReport.id));

    const result = {
      ...reportWithData,
      players: reportPlayersData,
    };

    return NextResponse.json({ report: result }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && 'issues' in error) {
      // Zod validation error
      return NextResponse.json({ error: 'Validation error', details: error }, { status: 400 });
    }
    
    console.error('Error creating report:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
