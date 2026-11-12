import {
  Injectable,
  Inject,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { createHash, randomUUID, timingSafeEqual } from 'crypto';
import type { StringValue } from 'ms';
import { eq } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../database/schema';
import { users } from '../database/schema';
import { LoginDto } from './dto/login.dto';
import { RefreshDto } from './dto/refresh.dto';

interface RefreshTokenPayload {
  sub: number;
  username: string;
  role: string;
  staffId: number | null;
  typ?: string;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @Inject('DB_CONNECTION') private db: NodePgDatabase<typeof schema>,
    private jwtService: JwtService
  ) {}

  async login(dto: LoginDto) {
    const user = await this.db.query.users.findFirst({
      where: eq(users.username, dto.username),
    });

    if (!user) {
      throw new UnauthorizedException('Username atau password salah.');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Username atau password salah.');
    }

    return this.generateTokens(user);
  }

  async refresh(dto: RefreshDto) {
    let payload: RefreshTokenPayload;

    try {
      payload = await this.jwtService.verifyAsync<RefreshTokenPayload>(
        dto.refreshToken,
        {
          issuer: 'mipsys-erp',
          audience: 'mipsys-api',
          algorithms: ['HS256'],
        }
      );
    } catch {
      throw new UnauthorizedException('Refresh token tidak valid.');
    }

    if (payload.typ !== 'refresh') {
      throw new UnauthorizedException('Refresh token tidak valid.');
    }

    const user = await this.db.query.users.findFirst({
      where: eq(users.id, payload.sub),
    });

    if (!user || user.deletedAt) {
      throw new UnauthorizedException('Refresh token tidak valid.');
    }

    if (!this.refreshTokenMatches(dto.refreshToken, user.refreshToken)) {
      throw new UnauthorizedException('Refresh token tidak valid.');
    }

    return this.generateTokens(user);
  }

  async logout(userId: number) {
    await this.db
      .update(users)
      .set({ refreshToken: null })
      .where(eq(users.id, userId));

    return { message: 'Logout berhasil.' };
  }

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  private refreshTokenMatches(
    incoming: string,
    stored: string | null
  ): boolean {
    if (!stored || !/^[a-f0-9]{64}$/i.test(stored)) return false;

    const incomingHash = Buffer.from(this.hashToken(incoming), 'hex');
    const storedHash = Buffer.from(stored, 'hex');

    return (
      incomingHash.length === storedHash.length &&
      timingSafeEqual(incomingHash, storedHash)
    );
  }

  private async generateTokens(user: typeof users.$inferSelect) {
    const payload = {
      sub: user.id,
      username: user.username,
      role: user.role,
      staffId: user.staffId,
    };

    const accessToken = this.jwtService.sign(
      { ...payload, typ: 'access' },
      {
        expiresIn: (process.env.JWT_EXPIRES_IN || '1d') as StringValue,
        issuer: 'mipsys-erp',
        audience: 'mipsys-api',
      }
    );

    const refreshToken = this.jwtService.sign(
      { ...payload, typ: 'refresh', jti: randomUUID() },
      {
        expiresIn: '7d',
        issuer: 'mipsys-erp',
        audience: 'mipsys-api',
      }
    );

    await this.db
      .update(users)
      .set({ refreshToken: this.hashToken(refreshToken) })
      .where(eq(users.id, user.id));

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        staffId: user.staffId,
      },
    };
  }
}
