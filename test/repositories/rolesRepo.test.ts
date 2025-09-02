import { describe, it, expect, beforeEach, vi } from 'vitest';
import { RolesRepo } from '@zv/db';

// Мок базы данных
vi.mock('@zv/db', async () => {
  const actual = await vi.importActual('@zv/db');
  return {
    ...actual,
    db: {
      select: vi.fn(),
      insert: vi.fn(),
      delete: vi.fn(),
      transaction: vi.fn(),
    },
    userRoles: {
      userId: 'userRoles.userId',
      role: 'userRoles.role',
    },
    eq: vi.fn(),
    and: vi.fn(),
    inArray: vi.fn(),
    sql: vi.fn(),
  };
});

describe('RolesRepo', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('listByUser', () => {
    it('должен возвращать роли пользователя', async () => {
      const mockRoles = [
        { role: 'PLAYER' },
        { role: 'MASTER' },
      ];

      const mockQuery = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue(mockRoles),
      };

      const { db } = await import('@zv/db');
      (db.select as any).mockReturnValue(mockQuery);

      const result = await RolesRepo.listByUser('user-1');

      expect(result).toEqual(['PLAYER', 'MASTER']);
    });

    it('должен возвращать пустой массив если у пользователя нет ролей', async () => {
      const mockQuery = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue([]),
      };

      const { db } = await import('@zv/db');
      (db.select as any).mockReturnValue(mockQuery);

      const result = await RolesRepo.listByUser('user-without-roles');

      expect(result).toEqual([]);
    });
  });

  describe('add', () => {
    it('должен добавлять роль пользователю', async () => {
      const mockQuery = {
        values: vi.fn().mockReturnThis(),
        onConflictDoNothing: vi.fn().mockResolvedValue(undefined),
      };

      const { db } = await import('@zv/db');
      (db.insert as any).mockReturnValue(mockQuery);

      await expect(RolesRepo.add('user-1', 'PLAYER')).resolves.not.toThrow();
    });

    it('должен игнорировать дублирующиеся роли', async () => {
      const mockQuery = {
        values: vi.fn().mockReturnThis(),
        onConflictDoNothing: vi.fn().mockRejectedValue({ code: '23505' }),
      };

      const { db } = await import('@zv/db');
      (db.insert as any).mockReturnValue(mockQuery);

      await expect(RolesRepo.add('user-1', 'PLAYER')).resolves.not.toThrow();
    });
  });

  describe('remove', () => {
    it('должен удалять роль у пользователя', async () => {
      const mockQuery = {
        where: vi.fn().mockResolvedValue(undefined),
      };

      const { db } = await import('@zv/db');
      (db.delete as any).mockReturnValue(mockQuery);

      await expect(RolesRepo.remove('user-1', 'PLAYER')).resolves.not.toThrow();
    });
  });

  describe('addMultiple', () => {
    it('должен добавлять несколько ролей', async () => {
      const mockQuery = {
        values: vi.fn().mockReturnThis(),
        onConflictDoNothing: vi.fn().mockResolvedValue(undefined),
      };

      const { db } = await import('@zv/db');
      (db.insert as any).mockReturnValue(mockQuery);

      await expect(RolesRepo.addMultiple('user-1', ['PLAYER', 'MASTER'])).resolves.not.toThrow();
    });

    it('должен ничего не делать при пустом массиве ролей', async () => {
      const { db } = await import('@zv/db');

      await RolesRepo.addMultiple('user-1', []);

      expect(db.insert).not.toHaveBeenCalled();
    });
  });

  describe('removeMultiple', () => {
    it('должен удалять несколько ролей', async () => {
      const mockQuery = {
        where: vi.fn().mockResolvedValue(undefined),
      };

      const { db } = await import('@zv/db');
      (db.delete as any).mockReturnValue(mockQuery);

      await expect(RolesRepo.removeMultiple('user-1', ['PLAYER', 'MASTER'])).resolves.not.toThrow();
    });

    it('должен ничего не делать при пустом массиве ролей', async () => {
      const { db } = await import('@zv/db');

      await RolesRepo.removeMultiple('user-1', []);

      expect(db.delete).not.toHaveBeenCalled();
    });
  });

  describe('manageUserRoles', () => {
    it('должен управлять ролями в транзакции', async () => {
      const mockTransaction = vi.fn().mockImplementation(async (callback) => {
        const mockTx = {
          delete: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue(undefined),
          }),
          insert: vi.fn().mockReturnValue({
            values: vi.fn().mockReturnThis(),
            onConflictDoNothing: vi.fn().mockResolvedValue(undefined),
          }),
          select: vi.fn().mockReturnValue({
            from: vi.fn().mockReturnThis(),
            where: vi.fn().mockResolvedValue([
              { role: 'MASTER' },
              { role: 'MODERATOR' },
            ]),
          }),
        };
        return await callback(mockTx);
      });

      const { db } = await import('@zv/db');
      (db.transaction as any).mockImplementation(mockTransaction);

      const result = await RolesRepo.manageUserRoles('user-1', {
        add: ['MODERATOR'],
        remove: ['PLAYER'],
      });

      expect(result).toEqual(['MASTER', 'MODERATOR']);
      expect(mockTransaction).toHaveBeenCalledTimes(1);
    });
  });

  describe('hasRole', () => {
    it('должен возвращать true если у пользователя есть роль', async () => {
      const mockQuery = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([{ role: 'PLAYER' }]),
      };

      const { db } = await import('@zv/db');
      (db.select as any).mockReturnValue(mockQuery);

      const result = await RolesRepo.hasRole('user-1', 'PLAYER');

      expect(result).toBe(true);
    });

    it('должен возвращать false если у пользователя нет роли', async () => {
      const mockQuery = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([]),
      };

      const { db } = await import('@zv/db');
      (db.select as any).mockReturnValue(mockQuery);

      const result = await RolesRepo.hasRole('user-1', 'SUPERADMIN');

      expect(result).toBe(false);
    });
  });

  describe('hasAnyRole', () => {
    it('должен возвращать true если у пользователя есть любая из ролей', async () => {
      const mockQuery = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([{ role: 'MASTER' }]),
      };

      const { db } = await import('@zv/db');
      (db.select as any).mockReturnValue(mockQuery);

      const result = await RolesRepo.hasAnyRole('user-1', ['PLAYER', 'MASTER']);

      expect(result).toBe(true);
    });

    it('должен возвращать false для пустого массива ролей', async () => {
      const result = await RolesRepo.hasAnyRole('user-1', []);

      expect(result).toBe(false);
    });
  });

  describe('getSuperAdminCount', () => {
    it('должен возвращать количество суперадминов', async () => {
      const mockQuery = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue([{ count: 2 }]),
      };

      const { db } = await import('@zv/db');
      (db.select as any).mockReturnValue(mockQuery);

      const result = await RolesRepo.getSuperAdminCount();

      expect(result).toBe(2);
    });

    it('должен возвращать 0 если нет суперадминов', async () => {
      const mockQuery = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue([{ count: 0 }]),
      };

      const { db } = await import('@zv/db');
      (db.select as any).mockReturnValue(mockQuery);

      const result = await RolesRepo.getSuperAdminCount();

      expect(result).toBe(0);
    });
  });

  describe('isOnlySuperAdmin', () => {
    it('должен возвращать true если пользователь единственный суперадмин', async () => {
      // Мок для getSuperAdminCount
      const countQuery = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue([{ count: 1 }]),
      };

      // Мок для hasRole
      const roleQuery = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([{ role: 'SUPERADMIN' }]),
      };

      const { db } = await import('@zv/db');
      (db.select as any)
        .mockReturnValueOnce(countQuery)
        .mockReturnValueOnce(roleQuery);

      const result = await RolesRepo.isOnlySuperAdmin('user-1');

      expect(result).toBe(true);
    });

    it('должен возвращать false если есть несколько суперадминов', async () => {
      const countQuery = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue([{ count: 2 }]),
      };

      const { db } = await import('@zv/db');
      (db.select as any).mockReturnValue(countQuery);

      const result = await RolesRepo.isOnlySuperAdmin('user-1');

      expect(result).toBe(false);
    });
  });
});
