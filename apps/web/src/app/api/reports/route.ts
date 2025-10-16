import { NextRequest, NextResponse } from 'next/server';
import { db } from '@zv/db';
import { reports, reportPlayers, reportNextPlans, users, userRoles, battlepasses, monsters, storyTexts, eq, and, or, desc, sql } from '@zv/db';
import { monstersRepo, storyTextsRepo, reportNextPlansRepo } from '@zv/db';
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

    // Получаем игроков и планы следующей игры для каждого отчёта
    const reportsWithPlayers = await Promise.all(
      reportsData.map(async (report) => {
        const [playersData, nextPlan] = await Promise.all([
          db
            .select({
              id: users.id,
              name: users.name,
              email: users.email,
            })
            .from(reportPlayers)
            .leftJoin(users, eq(reportPlayers.playerId, users.id))
            .where(eq(reportPlayers.reportId, report.id)),
          
          // Получаем план следующей игры с полными данными элементов
          reportNextPlansRepo.getByReportIdWithElements(report.id)
        ]);

        return {
          ...report,
          players: playersData,
          nextPlan: nextPlan,
        };
      })
    );

    return NextResponse.json({ reports: reportsWithPlayers });
  } catch (error) {
    console.error('Error fetching reports:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/reports - создать новый отчёт (с опциональным планом следующей игры)
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

    // Если передан nextPlan - валидируем и проверяем доступность элементов
    if (validatedData.nextPlan) {
      const plan = validatedData.nextPlan;
      
      // Проверяем доступность всех элементов АТОМАРНО
      const [monster, location, mainEvent, sideEvent] = await Promise.all([
        db.select().from(monsters).where(and(
          eq(monsters.id, plan.monsterId),
          eq(monsters.status, 'AVAILABLE'),
          eq(monsters.isActive, true)
        )).limit(1),
        db.select().from(storyTexts).where(and(
          eq(storyTexts.id, plan.locationTextId),
          eq(storyTexts.type, 'LOCATION'),
          eq(storyTexts.status, 'AVAILABLE'),
          eq(storyTexts.isActive, true)
        )).limit(1),
        db.select().from(storyTexts).where(and(
          eq(storyTexts.id, plan.mainEventTextId),
          eq(storyTexts.type, 'MAIN_EVENT'),
          eq(storyTexts.status, 'AVAILABLE'),
          eq(storyTexts.isActive, true)
        )).limit(1),
        db.select().from(storyTexts).where(and(
          eq(storyTexts.id, plan.sideEventTextId),
          eq(storyTexts.type, 'SIDE_EVENT'),
          eq(storyTexts.status, 'AVAILABLE'),
          eq(storyTexts.isActive, true)
        )).limit(1),
      ]);

      const unavailable = [];
      if (!monster[0]) unavailable.push('monster');
      if (!location[0]) unavailable.push('location');
      if (!mainEvent[0]) unavailable.push('main event');
      if (!sideEvent[0]) unavailable.push('side event');

      if (unavailable.length > 0) {
        return NextResponse.json({ 
          error: 'Elements no longer available', 
          message: `Следующие элементы уже заняты или недоступны: ${unavailable.join(', ')}`,
          unavailable 
        }, { status: 409 });
      }
    }

    // Создаём отчёт и план в транзакции
    const result = await db.transaction(async (tx) => {
      // Создаём отчёт
      const [newReport] = await tx
        .insert(reports)
        .values({
          groupId: validatedData.groupId, // NEW
          sessionId: validatedData.sessionId || null,
          masterId: session.user.id,
          summary: validatedData.description,
          description: validatedData.description,
          highlights: validatedData.highlights || null,
          status: 'PENDING',
        })
        .returning();

      // Добавляем связи с игроками
      await tx.insert(reportPlayers).values(
        validatedData.playerIds.map(playerId => ({
          reportId: newReport.id,
          playerId,
        }))
      );

      // Если есть nextPlan - создаём план и блокируем элементы
      if (validatedData.nextPlan) {
        const plan = validatedData.nextPlan;
        
        // Блокируем все элементы
        await Promise.all([
          tx.update(monsters)
            .set({
              status: 'LOCKED',
              lockedByReportId: newReport.id,
              lockedByGroupId: validatedData.groupId,
              lockedAt: new Date(),
              updatedAt: new Date(),
            })
            .where(eq(monsters.id, plan.monsterId)),
          
          tx.update(storyTexts)
            .set({
              status: 'LOCKED',
              lockedByReportId: newReport.id,
              lockedByGroupId: validatedData.groupId,
              lockedAt: new Date(),
              updatedAt: new Date(),
            })
            .where(eq(storyTexts.id, plan.locationTextId)),
          
          tx.update(storyTexts)
            .set({
              status: 'LOCKED',
              lockedByReportId: newReport.id,
              lockedByGroupId: validatedData.groupId,
              lockedAt: new Date(),
              updatedAt: new Date(),
            })
            .where(eq(storyTexts.id, plan.mainEventTextId)),
          
          tx.update(storyTexts)
            .set({
              status: 'LOCKED',
              lockedByReportId: newReport.id,
              lockedByGroupId: validatedData.groupId,
              lockedAt: new Date(),
              updatedAt: new Date(),
            })
            .where(eq(storyTexts.id, plan.sideEventTextId)),
        ]);

        // Создаём запись плана
        await tx.insert(reportNextPlans).values({
          reportId: newReport.id,
          continuedFromReportId: plan.continuedFromReportId || null,
          nextPlanText: plan.nextPlanText,
          monsterId: plan.monsterId,
          locationTextId: plan.locationTextId,
          mainEventTextId: plan.mainEventTextId,
          sideEventTextId: plan.sideEventTextId,
        });
      }

      return newReport;
    });

    // Получаем полные данные созданного отчёта
    const [reportWithData] = await db
      .select({
        id: reports.id,
        groupId: reports.groupId,
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
      .where(eq(reports.id, result.id));

    const reportPlayersData = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
      })
      .from(reportPlayers)
      .leftJoin(users, eq(reportPlayers.playerId, users.id))
      .where(eq(reportPlayers.reportId, result.id));

    // Получаем план, если был создан
    let nextPlan = null;
    if (validatedData.nextPlan) {
      nextPlan = await reportNextPlansRepo.getByReportIdWithElements(result.id);
    }

    const response = {
      ...reportWithData,
      players: reportPlayersData,
      nextPlan,
    };

    return NextResponse.json({ report: response }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && 'issues' in error) {
      // Zod validation error
      return NextResponse.json({ error: 'Validation error', details: error }, { status: 400 });
    }
    
    console.error('Error creating report:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
