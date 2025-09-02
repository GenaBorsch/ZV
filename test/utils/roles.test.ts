import { describe, it, expect } from 'vitest';
import { 
  hasRole, 
  hasAnyRole, 
  isPlayer, 
  isMaster, 
  isModerator, 
  isSuperAdmin, 
  isAdmin 
} from '@zv/utils';

describe('roles utilities', () => {
  describe('hasRole', () => {
    it('должен возвращать true если роль присутствует', () => {
      const userRoles = ['PLAYER', 'MASTER'];
      expect(hasRole(userRoles, 'PLAYER')).toBe(true);
      expect(hasRole(userRoles, 'MASTER')).toBe(true);
    });

    it('должен возвращать false если роль отсутствует', () => {
      const userRoles = ['PLAYER', 'MASTER'];
      expect(hasRole(userRoles, 'MODERATOR')).toBe(false);
      expect(hasRole(userRoles, 'SUPERADMIN')).toBe(false);
    });

    it('должен работать с пустым массивом ролей', () => {
      expect(hasRole([], 'PLAYER')).toBe(false);
    });
  });

  describe('hasAnyRole', () => {
    it('должен возвращать true если есть любая из ролей', () => {
      const userRoles = ['PLAYER', 'MASTER'];
      expect(hasAnyRole(userRoles, ['MODERATOR', 'PLAYER'])).toBe(true);
      expect(hasAnyRole(userRoles, ['MASTER', 'SUPERADMIN'])).toBe(true);
    });

    it('должен возвращать false если нет ни одной из ролей', () => {
      const userRoles = ['PLAYER', 'MASTER'];
      expect(hasAnyRole(userRoles, ['MODERATOR', 'SUPERADMIN'])).toBe(false);
    });

    it('должен работать с пустыми массивами', () => {
      expect(hasAnyRole([], ['PLAYER'])).toBe(false);
      expect(hasAnyRole(['PLAYER'], [])).toBe(false);
      expect(hasAnyRole([], [])).toBe(false);
    });
  });

  describe('isPlayer', () => {
    it('должен возвращать true для игрока', () => {
      expect(isPlayer(['PLAYER'])).toBe(true);
      expect(isPlayer(['PLAYER', 'MASTER'])).toBe(true);
    });

    it('должен возвращать false для не-игрока', () => {
      expect(isPlayer(['MASTER'])).toBe(false);
      expect(isPlayer(['MODERATOR', 'SUPERADMIN'])).toBe(false);
      expect(isPlayer([])).toBe(false);
    });
  });

  describe('isMaster', () => {
    it('должен возвращать true для мастера', () => {
      expect(isMaster(['MASTER'])).toBe(true);
      expect(isMaster(['PLAYER', 'MASTER'])).toBe(true);
    });

    it('должен возвращать false для не-мастера', () => {
      expect(isMaster(['PLAYER'])).toBe(false);
      expect(isMaster(['MODERATOR', 'SUPERADMIN'])).toBe(false);
      expect(isMaster([])).toBe(false);
    });
  });

  describe('isModerator', () => {
    it('должен возвращать true для модератора', () => {
      expect(isModerator(['MODERATOR'])).toBe(true);
      expect(isModerator(['PLAYER', 'MODERATOR'])).toBe(true);
    });

    it('должен возвращать false для не-модератора', () => {
      expect(isModerator(['PLAYER'])).toBe(false);
      expect(isModerator(['MASTER', 'SUPERADMIN'])).toBe(false);
      expect(isModerator([])).toBe(false);
    });
  });

  describe('isSuperAdmin', () => {
    it('должен возвращать true для суперадмина', () => {
      expect(isSuperAdmin(['SUPERADMIN'])).toBe(true);
      expect(isSuperAdmin(['PLAYER', 'SUPERADMIN'])).toBe(true);
    });

    it('должен возвращать false для не-суперадмина', () => {
      expect(isSuperAdmin(['PLAYER'])).toBe(false);
      expect(isSuperAdmin(['MASTER', 'MODERATOR'])).toBe(false);
      expect(isSuperAdmin([])).toBe(false);
    });
  });

  describe('isAdmin', () => {
    it('должен возвращать true для администраторов', () => {
      expect(isAdmin(['MODERATOR'])).toBe(true);
      expect(isAdmin(['SUPERADMIN'])).toBe(true);
      expect(isAdmin(['MODERATOR', 'SUPERADMIN'])).toBe(true);
      expect(isAdmin(['PLAYER', 'MODERATOR'])).toBe(true);
    });

    it('должен возвращать false для не-администраторов', () => {
      expect(isAdmin(['PLAYER'])).toBe(false);
      expect(isAdmin(['MASTER'])).toBe(false);
      expect(isAdmin(['PLAYER', 'MASTER'])).toBe(false);
      expect(isAdmin([])).toBe(false);
    });
  });
});
