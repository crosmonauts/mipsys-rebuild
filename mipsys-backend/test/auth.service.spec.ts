import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { createHash } from 'crypto';
import * as bcrypt from 'bcrypt';
import { AuthService } from '../src/auth/auth.service';

const JWT_SECRET = 'test-secret-key-with-at-least-32-characters';
const ISSUER = 'mipsys-erp';
const AUDIENCE = 'mipsys-api';

const sha256 = (value: string) =>
  createHash('sha256').update(value).digest('hex');

function createDbMock() {
  const where = jest.fn().mockResolvedValue(undefined);
  const set = jest.fn(() => ({ where }));
  const update = jest.fn(() => ({ set }));
  const findFirst = jest.fn();

  return {
    db: {
      query: { users: { findFirst } },
      update,
    },
    findFirst,
    update,
    set,
    where,
  };
}

const baseUser = (overrides: Record<string, unknown> = {}) => ({
  id: 1,
  staffId: 10,
  username: 'admin',
  password: bcrypt.hashSync('secret123', 4),
  role: 'ADMIN',
  refreshToken: null,
  deletedAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  lastLoginAt: null,
  ...overrides,
});

describe('AuthService', () => {
  let service: AuthService;
  let dbMock: ReturnType<typeof createDbMock>;
  let jwt: JwtService;

  const signRefresh = (
    payload: Record<string, unknown> = {},
    expiresIn = '7d'
  ) =>
    jwt.sign(
      {
        sub: 1,
        username: 'admin',
        role: 'ADMIN',
        staffId: 10,
        typ: 'refresh',
        ...payload,
      },
      { expiresIn, issuer: ISSUER, audience: AUDIENCE }
    );

  const signAccess = () =>
    jwt.sign(
      {
        sub: 1,
        username: 'admin',
        role: 'ADMIN',
        staffId: 10,
        typ: 'access',
      },
      { expiresIn: '15m', issuer: ISSUER, audience: AUDIENCE }
    );

  beforeEach(() => {
    dbMock = createDbMock();
    jwt = new JwtService({ secret: JWT_SECRET });
    service = new AuthService(dbMock.db as never, jwt);
  });

  describe('login', () => {
    it('menyimpan hash SHA-256 refresh token, bukan token mentah', async () => {
      dbMock.findFirst.mockResolvedValue(baseUser());

      const result = await service.login({
        username: 'admin',
        password: 'secret123',
      });

      const stored = dbMock.set.mock.calls[0][0].refreshToken;

      expect(stored).toMatch(/^[a-f0-9]{64}$/);
      expect(stored).not.toBe(result.refreshToken);
      expect(stored).toBe(sha256(result.refreshToken));
    });

    it('mengembalikan access token, refresh token, dan data user', async () => {
      dbMock.findFirst.mockResolvedValue(baseUser());

      const result = await service.login({
        username: 'admin',
        password: 'secret123',
      });

      expect(result.accessToken).toBeTruthy();
      expect(result.refreshToken).toBeTruthy();
      expect(result.user).toEqual({
        id: 1,
        username: 'admin',
        role: 'ADMIN',
        staffId: 10,
      });
    });

    it('menolak password yang salah dengan 401', async () => {
      dbMock.findFirst.mockResolvedValue(baseUser());

      await expect(
        service.login({ username: 'admin', password: 'salah' })
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('refresh', () => {
    it('menerbitkan token baru dan menyimpan hash baru (rotasi)', async () => {
      const token = signRefresh();
      dbMock.findFirst.mockResolvedValue(
        baseUser({ refreshToken: sha256(token) })
      );

      const result = await service.refresh({ refreshToken: token });

      expect(result.accessToken).toBeTruthy();
      expect(result.refreshToken).not.toBe(token);
      expect(dbMock.set.mock.calls[0][0].refreshToken).toBe(
        sha256(result.refreshToken)
      );
    });

    it('menolak refresh token lama setelah rotasi', async () => {
      const oldToken = signRefresh({ iat: 1 });
      const newToken = signRefresh();
      dbMock.findFirst.mockResolvedValue(
        baseUser({ refreshToken: sha256(newToken) })
      );

      await expect(service.refresh({ refreshToken: oldToken })).rejects.toThrow(
        UnauthorizedException
      );
    });

    it('menolak refresh token yang kedaluwarsa', async () => {
      const expired = signRefresh({}, '-1s');
      dbMock.findFirst.mockResolvedValue(
        baseUser({ refreshToken: sha256(expired) })
      );

      await expect(service.refresh({ refreshToken: expired })).rejects.toThrow(
        UnauthorizedException
      );
    });

    it('menolak refresh token dengan signature rusak', async () => {
      const valid = signRefresh();
      const tampered = `${valid.slice(0, -4)}abcd`;
      dbMock.findFirst.mockResolvedValue(
        baseUser({ refreshToken: sha256(valid) })
      );

      await expect(service.refresh({ refreshToken: tampered })).rejects.toThrow(
        UnauthorizedException
      );
    });

    it('menolak access token yang dipakai sebagai refresh token', async () => {
      const accessToken = signAccess();
      dbMock.findFirst.mockResolvedValue(
        baseUser({ refreshToken: sha256(accessToken) })
      );

      await expect(
        service.refresh({ refreshToken: accessToken })
      ).rejects.toThrow(UnauthorizedException);
    });

    it('menolak refresh token milik user yang sudah dihapus', async () => {
      const token = signRefresh();
      dbMock.findFirst.mockResolvedValue(
        baseUser({ refreshToken: sha256(token), deletedAt: new Date() })
      );

      await expect(service.refresh({ refreshToken: token })).rejects.toThrow(
        UnauthorizedException
      );
    });

    it('menolak refresh token setelah logout', async () => {
      const token = signRefresh();
      dbMock.findFirst.mockResolvedValue(baseUser({ refreshToken: null }));

      await expect(service.refresh({ refreshToken: token })).rejects.toThrow(
        UnauthorizedException
      );
    });
  });

  describe('logout', () => {
    it('mengosongkan refresh token pada tabel users', async () => {
      const result = await service.logout(1);

      expect(dbMock.update).toHaveBeenCalled();
      expect(dbMock.set).toHaveBeenCalledWith({ refreshToken: null });
      expect(dbMock.where).toHaveBeenCalled();
      expect(result).toEqual({ message: 'Logout berhasil.' });
    });
  });
});
