import { Module, Global } from '@nestjs/common';
import { drizzle } from 'drizzle-orm/mysql2';
import * as mysql from 'mysql2/promise';
import { databaseConfig } from '../config';
import * as schema from './schema';

const pool = mysql.createPool({
  host: databaseConfig.host,
  user: databaseConfig.user,
  password: databaseConfig.password,
  database: databaseConfig.database,
  port: databaseConfig.port,
  connectionLimit: databaseConfig.connectionLimit,
});

export const db = drizzle(pool, { schema, mode: 'default' });

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
