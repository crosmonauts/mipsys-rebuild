import { Injectable } from '@nestjs/common';
import { db } from '../db/db';
import { partRequests } from '../db/schema';
import { eq } from 'drizzle-orm';

@Injectable()
export class PartRequestsRepository {
  // Simpan permintaan part baru
  async create(data: any) {
    return await db.insert(partRequests).values(data);
  }

  // Cari semua permintaan part berdasarkan ID Service Request
  async findBySRId(srId: string) {
    return await db.select().from(partRequests).where(eq(partRequests.sr_id, srId));
  }

  // Tampilkan semua daftar belanja part yang masih WAITING
  async findPendingRequests() {
    return await db.select().from(partRequests).where(eq(partRequests.request_status, 'WAITING'));
  }
}