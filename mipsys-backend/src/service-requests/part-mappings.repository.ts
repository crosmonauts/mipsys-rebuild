import { Injectable } from '@nestjs/common';
import { db } from '../db/db';
import { partMappings } from '../db/schema';
import { like, or, and, eq } from 'drizzle-orm';

@Injectable()
export class PartMappingsRepository {
  async findMatchingPart(problemDesc: string, machineType: string) {
    // Robot mencari di database: mana keyword yang ada di dalam problemDesc
    // dan cocok dengan tipe mesinnya
    return await db.select().from(partMappings).where(
      and(
        like(eq(partMappings.machine_type, machineType), 'ANY'), // Cocokkan mesin atau ANY
        // Logika pencarian keyword bisa lebih kompleks di sini
      )
    );
  }
  
  // Fungsi sederhana untuk ambil semua data mapping
  async getAll() {
    return await db.select().from(partMappings);
  }
}