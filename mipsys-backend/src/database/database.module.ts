import { Module, Global } from '@nestjs/common';
import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { databaseConfig } from '../config';
import * as schema from './schema';

const pool = new Pool({
  host: databaseConfig.host,
  user: databaseConfig.user,
  password: databaseConfig.password,
  database: databaseConfig.database,
  port: databaseConfig.port,
  max: databaseConfig.connectionLimit,
});

export const db = drizzle(pool, { schema });

@Global()
@Module({
  providers: [
    {
      provide: 'DB_CONNECTION',
      useValue: db,
    },
  ],
  exports: ['DB_CONNECTION'],
})
export class DatabaseModule {}
