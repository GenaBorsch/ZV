import { db } from '../index';
import { users, userRoles, playerProfiles, masterProfiles } from '../schema';
import { UpdateProfileDtoType, UpdatePlayerProfileDtoType, UpdateMasterProfileDtoType } from '@zv/contracts';
import { eq } from 'drizzle-orm';

export class ProfilesRepo {
  async getProfile(userId: string) {
    // Получаем основную информацию о пользователе
    const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    
    if (!user) {
      throw new Error('User not found');
    }

    // Получаем роли пользователя
    const roles = await db.select().from(userRoles).where(eq(userRoles.userId, userId));
    
    // Получаем профиль игрока (если есть)
    const [playerProfile] = await db.select()
      .from(playerProfiles)
      .where(eq(playerProfiles.userId, userId))
      .limit(1);

    // Получаем профиль мастера (если есть)
    const [masterProfile] = await db.select()
      .from(masterProfiles)
      .where(eq(masterProfiles.userId, userId))
      .limit(1);

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      avatarUrl: user.avatarUrl,
      rpgExperience: user.rpgExperience,
      contacts: user.contacts,
      playerProfile: playerProfile ? {
        nickname: playerProfile.nickname,
        notes: playerProfile.notes,
      } : null,
      masterProfile: masterProfile ? {
        bio: masterProfile.bio,
        format: masterProfile.format,
        location: masterProfile.location,
        clubId: masterProfile.clubId,
      } : null,
      roles: roles.map((r) => r.role),
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    };
  }

  async updateProfile(userId: string, data: UpdateProfileDtoType) {
    await db.transaction(async (tx) => {
      // Обновляем основные поля пользователя
      const updateData: any = {};
      if (data.name !== undefined) updateData.name = data.name;
      if (data.avatarUrl !== undefined) updateData.avatarUrl = data.avatarUrl || null;
      if (data.rpgExperience !== undefined) updateData.rpgExperience = data.rpgExperience;
      if (data.contacts !== undefined) updateData.contacts = data.contacts;
      
      if (Object.keys(updateData).length > 0) {
        updateData.updatedAt = new Date();
        await tx.update(users)
          .set(updateData)
          .where(eq(users.id, userId));
      }
    });

    // Получаем обновленный профиль после транзакции
    return this.getProfile(userId);
  }

  async updatePlayerProfile(userId: string, data: UpdatePlayerProfileDtoType) {
    return db.transaction(async (tx) => {
      // Проверяем, существует ли профиль игрока
      const [existing] = await tx.select()
        .from(playerProfiles)
        .where(eq(playerProfiles.userId, userId))
        .limit(1);

      if (existing) {
        // Обновляем существующий профиль
        const updateData: any = {};
        if (data.nickname !== undefined) updateData.nickname = data.nickname;
        if (data.notes !== undefined) updateData.notes = data.notes;

        if (Object.keys(updateData).length > 0) {
          await tx.update(playerProfiles)
            .set(updateData)
            .where(eq(playerProfiles.userId, userId));
        }
      } else {
        // Создаем новый профиль игрока
        await tx.insert(playerProfiles).values({
          userId,
          nickname: data.nickname || null,
          notes: data.notes || null,
        });
      }

      return this.getProfile(userId);
    });
  }

  async updateMasterProfile(userId: string, data: UpdateMasterProfileDtoType) {
    return db.transaction(async (tx) => {
      // Проверяем, существует ли профиль мастера
      const [existing] = await tx.select()
        .from(masterProfiles)
        .where(eq(masterProfiles.userId, userId))
        .limit(1);

      if (existing) {
        // Обновляем существующий профиль
        const updateData: any = {};
        if (data.bio !== undefined) updateData.bio = data.bio;
        if (data.format !== undefined) updateData.format = data.format;
        if (data.location !== undefined) updateData.location = data.location;
        if (data.clubId !== undefined) updateData.clubId = data.clubId;

        if (Object.keys(updateData).length > 0) {
          await tx.update(masterProfiles)
            .set(updateData)
            .where(eq(masterProfiles.userId, userId));
        }
      } else if (data.format) {
        // Создаем новый профиль мастера (format обязательное поле)
        await tx.insert(masterProfiles).values({
          userId,
          bio: data.bio || null,
          format: data.format,
          location: data.location || null,
          clubId: data.clubId || null,
        });
      }

      return this.getProfile(userId);
    });
  }

  async isProfileComplete(userId: string): Promise<boolean> {
    const profile = await this.getProfile(userId);
    
    // Профиль считается заполненным, если есть имя
    // Остальные поля опциональны
    return !!profile.name;
  }
}
