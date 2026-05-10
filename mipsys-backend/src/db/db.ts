import { Module, Global } from '@nestjs/common';
import { drizzle } from 'drizzle-orm/mysql2';
import * as mysql from 'mysql2/promise';
import * as schema from './schema';
import 'dotenv/config';

const pool = mysql.createPool({
  host: process.env.DB_HOST || '127.0.0.1',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASS || '',
  database: process.env.DB_NAME || 'db_mipsys',
  connectionLimit: 10,
});

export const db = drizzle(pool, { schema, mode: 'default' });

/**
 * DatabaseModule bersifat @Global() sehingga DB_CONNECTION tersedia
 * di seluruh aplikasi tanpa perlu diimpor ulang di setiap modul.
 */
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
