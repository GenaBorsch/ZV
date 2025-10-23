import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db, groups, groupMembers, masterProfiles, playerProfiles, users, seasons, battlepasses, eq, inArray } from '@zv/db';
import { isSuperAdmin } from '@zv/utils';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Доступ запрещен' }, { status: 401 });
    }

    const userRoles = (session.user as any).roles;
    if (!isSuperAdmin(userRoles)) {
      return NextResponse.json({ error: 'Доступ запрещен. Требуются права суперадмина' }, { status: 403 });
    }

    // Получаем все группы с информацией о мастере и сезоне
    const groupsWithDetails = await db
      .select({
        // Данные группы
        groupId: groups.id,
        groupName: groups.name,
        groupDescription: groups.description,
        groupMaxMembers: groups.maxMembers,
        groupIsRecruiting: groups.isRecruiting,
        groupReferralCode: groups.referralCode,
        groupFormat: groups.format,
        groupPlace: groups.place,
        groupCreatedAt: groups.createdAt,
        groupUpdatedAt: groups.updatedAt,
        groupSeasonId: groups.seasonId,
        groupMasterId: groups.masterId,
        groupClubId: groups.clubId,
        
        // Данные мастера
        masterProfileId: masterProfiles.id,
        masterBio: masterProfiles.bio,
        masterFormat: masterProfiles.format,
        masterLocation: masterProfiles.location,
        
        // Данные пользователя мастера
        masterUserId: users.id,
        masterName: users.name,
        masterEmail: users.email,
        masterRpgExperience: users.rpgExperience,
        masterContacts: users.contacts,
        
        // Данные сезона
        seasonId: seasons.id,
        seasonTitle: seasons.title,
        seasonCode: seasons.code,
        seasonIsActive: seasons.isActive,
      })
      .from(groups)
      .innerJoin(masterProfiles, eq(groups.masterId, masterProfiles.id))
      .innerJoin(users, eq(masterProfiles.userId, users.id))
      .innerJoin(seasons, eq(groups.seasonId, seasons.id))
      .orderBy(groups.createdAt);

    // Для каждой группы получаем участников и статистику по баттлпассам
    const result = [];
    
    for (const group of groupsWithDetails) {
      // Получаем участников группы
      const members = await db
        .select({
          memberId: groupMembers.id,
          memberStatus: groupMembers.status,
          memberJoinedAt: groupMembers.createdAt,
          playerId: playerProfiles.id,
          playerNickname: playerProfiles.nickname,
          playerNotes: playerProfiles.notes,
          userId: users.id,
          userName: users.name,
          userEmail: users.email,
          userRpgExperience: users.rpgExperience,
          userContacts: users.contacts,
        })
        .from(groupMembers)
        .innerJoin(playerProfiles, eq(groupMembers.playerId, playerProfiles.id))
        .innerJoin(users, eq(playerProfiles.userId, users.id))
        .where(eq(groupMembers.groupId, group.groupId))
        .orderBy(groupMembers.createdAt);

      // Получаем статистику по баттлпассам для участников группы
      const memberIds = members.map(m => m.userId);
      let battlepassStats = { totalPurchased: 0, totalSpent: 0, totalRemaining: 0 };
      
      // Получаем индивидуальную статистику для каждого участника
      const membersWithStats = await Promise.all(members.map(async (member) => {
        const memberBattlepassData = await db
          .select({
            userId: battlepasses.userId,
            usesTotal: battlepasses.usesTotal,
            usesLeft: battlepasses.usesLeft,
            status: battlepasses.status,
          })
          .from(battlepasses)
          .where(eq(battlepasses.userId, member.userId));

        const memberStats = memberBattlepassData.reduce((stats, bp) => {
          if (bp.status === 'ACTIVE') {
            stats.purchased += bp.usesTotal;
            stats.spent += (bp.usesTotal - bp.usesLeft);
            stats.remaining += bp.usesLeft;
          }
          return stats;
        }, { purchased: 0, spent: 0, remaining: 0 });

        return {
          ...member,
          battlepassStats: memberStats,
        };
      }));

      // Обновляем общую статистику группы
      if (memberIds.length > 0) {
        const battlepassData = await db
          .select({
            userId: battlepasses.userId,
            usesTotal: battlepasses.usesTotal,
            usesLeft: battlepasses.usesLeft,
            status: battlepasses.status,
          })
          .from(battlepasses)
          .where(inArray(battlepasses.userId, memberIds));

        battlepassStats = battlepassData.reduce((stats, bp) => {
          if (bp.status === 'ACTIVE') {
            stats.totalPurchased += bp.usesTotal;
            stats.totalSpent += (bp.usesTotal - bp.usesLeft);
            stats.totalRemaining += bp.usesLeft;
          }
          return stats;
        }, { totalPurchased: 0, totalSpent: 0, totalRemaining: 0 });
      }

      result.push({
        id: group.groupId,
        name: group.groupName,
        description: group.groupDescription,
        maxMembers: group.groupMaxMembers,
        isRecruiting: group.groupIsRecruiting,
        referralCode: group.groupReferralCode,
        format: group.groupFormat,
        place: group.groupPlace,
        createdAt: group.groupCreatedAt,
        updatedAt: group.groupUpdatedAt,
        seasonId: group.groupSeasonId,
        masterId: group.groupMasterId,
        clubId: group.groupClubId,
        currentMembers: membersWithStats.length,
        master: {
          id: group.masterProfileId,
          userId: group.masterUserId,
          name: group.masterName,
          email: group.masterEmail,
          bio: group.masterBio,
          format: group.masterFormat,
          location: group.masterLocation,
          rpgExperience: group.masterRpgExperience,
          contacts: group.masterContacts,
        },
        season: {
          id: group.seasonId,
          title: group.seasonTitle,
          code: group.seasonCode,
          isActive: group.seasonIsActive,
        },
        members: membersWithStats.map(member => ({
          id: member.memberId,
          playerId: member.playerId,
          userId: member.userId,
          nickname: member.playerNickname,
          name: member.userName,
          email: member.userEmail,
          status: member.memberStatus,
          joinedAt: member.memberJoinedAt,
          rpgExperience: member.userRpgExperience,
          contacts: member.userContacts,
          notes: member.playerNotes,
          battlepassStats: member.battlepassStats,
        })),
        battlepassStats,
      });
    }

    return NextResponse.json({ groups: result });
  } catch (error) {
    console.error('Error in GET /api/admin/groups:', error);
    return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 });
  }
}
