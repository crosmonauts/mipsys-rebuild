import { Injectable } from '@nestjs/common';
import { db } from '../db/db';
import { serviceRequests } from '../db/schema';
import { eq, desc } from 'drizzle-orm';

@Injectable()
export class ServiceRequestsRepository {
  // Hanya ambil ID untuk cek eksistensi (Menghemat RAM)
  async findBySRNumber(srNumber: string) {
    const result = await db
      .select({ id: serviceRequests.id })
      .from(serviceRequests)
      .where(eq(serviceRequests.sr_number, srNumber))
      .limit(1);
    return result[0];
  }

  // Gunakan descending agar data terbaru muncul di paling atas dashboard Irgi
  async findAll() {
    return await db
      .select()
      .from(serviceRequests)
      .orderBy(desc(serviceRequests.created_at));
  }

  async create(data: any) {
    return await db.insert(serviceRequests).values(data);
  }
}