import { Injectable, UnauthorizedException, Inject } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { eq } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../database/schema';
import { users } from '../database/schema';

export interface JwtPayload {
  sub: number;
  username: string;
  role: string;
  staffId: number | null;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    @Inject('DB_CONNECTION') private db: NodePgDatabase<typeof schema>
  ) {
    const secret = process.env.JWT_SECRET;
    if (!secret || secret.length < 32) {
      throw new Error(
        'JWT_SECRET wajib diisi (min 32 karakter). Set di .env, jangan pakai default.',
      );
    }
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
      algorithms: ['HS256'],
      issuer: 'mipsys-erp',
      audience: 'mipsys-api',
    });
  }

  async validate(payload: JwtPayload) {
    const user = await this.db.query.users.findFirst({
      where: eq(users.id, payload.sub),
    });

    if (!user) {
      throw new UnauthorizedException('User tidak ditemukan.');
    }

    return {
      id: user.id,
      username: user.username,
      role: user.role,
      staffId: user.staffId,
    };
  }
}
