import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import type { StringValue } from 'ms';
import { DatabaseModule } from '../database/database.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './jwt.strategy';

function requiredJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error(
      'JWT_SECRET wajib diisi (min 32 karakter). Set di .env, jangan pakai default.',
    );
  }
  if (
    process.env.NODE_ENV === 'production' &&
    secret === 'mipsys-dev-secret'
  ) {
    throw new Error('JWT_SECRET dev tidak boleh dipakai di production.');
  }
  return secret;
}

@Module({
  imports: [
    DatabaseModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({
      secret: requiredJwtSecret(),
      signOptions: {
        expiresIn: (process.env.JWT_EXPIRES_IN || '1d') as StringValue,
      },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService, JwtModule],
})
export class AuthModule {}
