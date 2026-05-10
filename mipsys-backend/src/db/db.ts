import { Module, Global } from '@nestjs/common';
import { drizzle } from 'drizzle-orm/mysql2';
import * as mysql from 'mysql2/promise';
import * as schema from './schema';
import 'dotenv/config';

// 1. Inisialisasi koneksi (Tetap gunakan logika Anda)
const connection = mysql.createPool({
  host: process.env.DB_HOST || '127.0.0.1',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASS || '',
  database: process.env.DB_NAME || 'db_mipsys',
  connectionLimit: 10,
});

export const db = drizzle(connection, { schema, mode: 'default' });

@Global() // Membuat koneksi ini bisa diakses di semua folder tanpa impor manual
@Module({
  providers: [
    {
      provide: 'DB_CONNECTION',
      useValue: db, // Mendaftarkan instance 'db' ke dalam sistem NestJS
    },
  ],
  exports: ['DB_CONNECTION'], // Mengekspor agar bisa di-inject
})
export class DatabaseModule {}
