import { describe, it, expect, beforeEach, vi } from 'vitest';
import { UsersRepo } from '@zv/db';

// Мок базы данных
vi.mock('@zv/db', async () => {
  const actual = await vi.importActual('@zv/db');
  return {
    ...actual,
    db: {
      select: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      transaction: vi.fn(),
    },
    users: {
      id: 'users.id',
      name: 'users.name',
      email: 'users.email',
      tel: 'users.tel',
      tgId: 'users.tgId',
      avatarUrl: 'users.avatarUrl',
      createdAt: 'users.createdAt',
      updatedAt: 'users.updatedAt',
    },
    userRoles: {
      userId: 'userRoles.userId',
      role: 'userRoles.role',
    },
    eq: vi.fn(),
    and: vi.fn(),
    or: vi.fn(),
    ilike: vi.fn(),
    asc: vi.fn(),
    desc: vi.fn(),
    sql: vi.fn(),
    inArray: vi.fn(),
  };
});

describe('UsersRepo', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('list', () => {
    it('должен возвращать список пользователей с правильной структурой', async () => {
      // Подготовка моков
      const mockUsers = [
        {
          id: '1',
          name: 'Test User',
          email: 'test@example.com',
          tel: null,
          tgId: null,
          avatarUrl: null,
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-01'),
        },
      ];

      const mockRoles = [
        { userId: '1', role: 'PLAYER' },
      ];

      // Настройка моков для подсчета
      const mockCountQuery = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue([{ count: 1 }]),
      };

      // Настройка моков для пользователей
      const mockUsersQuery = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        offset: vi.fn().mockResolvedValue(mockUsers),
      };

      // Настройка моков для ролей
      const mockRolesQuery = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue(mockRoles),
      };

      const { db } = await import('@zv/db');
      (db.select as any)
        .mockReturnValueOnce(mockCountQuery)
        .mockReturnValueOnce(mockUsersQuery)
        .mockReturnValueOnce(mockRolesQuery);

      // Выполнение теста
      const result = await UsersRepo.list({
        page: 1,
        pageSize: 20,
        sortBy: 'createdAt',
        sortDir: 'desc',
      });

      // Проверки
      expect(result).toHaveProperty('items');
      expect(result).toHaveProperty('total');
      expect(result.items).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.items[0]).toMatchObject({
        id: '1',
        name: 'Test User',
        email: 'test@example.com',
        roles: ['PLAYER'],
      });
    });

    it('должен правильно обрабатывать поиск', async () => {
      const params = {
        page: 1,
        pageSize: 20,
        search: 'test@example.com',
        sortBy: 'email' as const,
        sortDir: 'asc' as const,
      };

      // Подготовка моков
      const mockCountQuery = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue([{ count: 0 }]),
      };

      const mockUsersQuery = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        offset: vi.fn().mockResolvedValue([]),
      };

      const { db } = await import('@zv/db');
      (db.select as any)
        .mockReturnValueOnce(mockCountQuery)
        .mockReturnValueOnce(mockUsersQuery);

      const result = await UsersRepo.list(params);

      expect(result.items).toHaveLength(0);
      expect(result.total).toBe(0);
    });
  });

  describe('getById', () => {
    it('должен возвращать пользователя по ID', async () => {
      const mockUser = {
        id: '1',
        name: 'Test User',
        email: 'test@example.com',
        tel: null,
        tgId: null,
        avatarUrl: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockQuery = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([mockUser]),
      };

      const { db } = await import('@zv/db');
      (db.select as any).mockReturnValue(mockQuery);

      const result = await UsersRepo.getById('1');

      expect(result).toEqual(mockUser);
    });

    it('должен возвращать null если пользователь не найден', async () => {
      const mockQuery = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([]),
      };

      const { db } = await import('@zv/db');
      (db.select as any).mockReturnValue(mockQuery);

      const result = await UsersRepo.getById('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('update', () => {
    it('должен обновлять пользователя', async () => {
      const mockUpdatedUser = {
        id: '1',
        name: 'Updated User',
        email: 'updated@example.com',
        tel: null,
        tgId: null,
        avatarUrl: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockQuery = {
        set: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue([mockUpdatedUser]),
      };

      const { db } = await import('@zv/db');
      (db.update as any).mockReturnValue(mockQuery);

      const result = await UsersRepo.update('1', {
        name: 'Updated User',
        email: 'updated@example.com',
      });

      expect(result).toEqual(mockUpdatedUser);
    });
  });

  describe('delete', () => {
    it('должен удалять пользователя', async () => {
      const mockDeletedUser = {
        id: '1',
        name: 'Deleted User',
        email: 'deleted@example.com',
      };

      const mockQuery = {
        where: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue([mockDeletedUser]),
      };

      const { db } = await import('@zv/db');
      (db.delete as any).mockReturnValue(mockQuery);

      const result = await UsersRepo.delete('1');

      expect(result).toEqual(mockDeletedUser);
    });

    it('должен бросать ошибку при FK-конфликте', async () => {
      const mockQuery = {
        where: vi.fn().mockReturnThis(),
        returning: vi.fn().mockRejectedValue({ code: '23503' }),
      };

      const { db } = await import('@zv/db');
      (db.delete as any).mockReturnValue(mockQuery);

      await expect(UsersRepo.delete('1')).rejects.toThrow(
        'Невозможно удалить пользователя: существуют связанные записи'
      );
    });
  });

  describe('exists', () => {
    it('должен возвращать true если пользователь существует', async () => {
      const mockQuery = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([{ id: '1' }]),
      };

      const { db } = await import('@zv/db');
      (db.select as any).mockReturnValue(mockQuery);

      const result = await UsersRepo.exists('1');

      expect(result).toBe(true);
    });

    it('должен возвращать false если пользователь не существует', async () => {
      const mockQuery = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([]),
      };

      const { db } = await import('@zv/db');
      (db.select as any).mockReturnValue(mockQuery);

      const result = await UsersRepo.exists('nonexistent');

      expect(result).toBe(false);
    });
  });

  describe('findByEmail', () => {
    it('должен находить пользователя по email', async () => {
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        name: 'Test User',
      };

      const mockQuery = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([mockUser]),
      };

      const { db } = await import('@zv/db');
      (db.select as any).mockReturnValue(mockQuery);

      const result = await UsersRepo.findByEmail('test@example.com');

      expect(result).toEqual(mockUser);
    });
  });
});
