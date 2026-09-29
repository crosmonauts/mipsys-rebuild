import { Injectable, Inject, Logger } from '@nestjs/common';
import { and, eq, inArray } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../database/schema';
import {
  spareParts,
  partModelCompatibilities,
  categoryModels,
} from '../database/schema';
import { DrizzleTx } from '../database/types';

export function normalizeModelName(value: string | null | undefined): string {
  return (value ?? '')
    .toLowerCase()
    .replace(/epson/g, '')
    .replace(/[^a-z0-9]/g, '');
}

export interface CompatibilityCheck {
  ok: boolean;
  reason: 'UNIVERSAL' | 'MATCH' | 'UNRESOLVED_MODEL' | 'MISMATCH';
  compatibleModels: string[];
}

@Injectable()
export class PartCompatibilityService {
  private readonly logger = new Logger(PartCompatibilityService.name);

  constructor(
    @Inject('DB_CONNECTION') private db: NodePgDatabase<typeof schema>
  ) {}

  async resolveCategoryId(
    srModelName: string | null | undefined,
    db?: DrizzleTx | NodePgDatabase<typeof schema>
  ): Promise<number | null> {
    const targetDb = db || this.db;
    if (!srModelName?.trim()) return null;

    const models = await targetDb.query.categoryModels.findMany({
      columns: { id: true, name: true },
    });
    if (models.length === 0) return null;

    const needle = normalizeModelName(srModelName);
    if (!needle) return null;

    const exact = models.find((m) => normalizeModelName(m.name) === needle);
    if (exact) return exact.id;

    const partial = models.filter(
      (m) =>
        normalizeModelName(m.name).includes(needle) ||
        needle.includes(normalizeModelName(m.name))
    );
    if (partial.length === 1) return partial[0].id;

    return null;
  }

  async getCompatibilityList(
    sparePartId: number,
    db?: DrizzleTx | NodePgDatabase<typeof schema>
  ): Promise<{ id: number; name: string }[]> {
    const targetDb = db || this.db;
    return targetDb
      .select({ id: categoryModels.id, name: categoryModels.name })
      .from(partModelCompatibilities)
      .innerJoin(
        categoryModels,
        eq(partModelCompatibilities.categoryModelId, categoryModels.id)
      )
      .where(eq(partModelCompatibilities.sparePartId, sparePartId));
  }

  async getCompatibleModelNames(
    sparePartId: number,
    db?: DrizzleTx | NodePgDatabase<typeof schema>
  ): Promise<string[]> {
    const targetDb = db || this.db;
    const rows = await targetDb
      .select({ name: categoryModels.name })
      .from(partModelCompatibilities)
      .innerJoin(
        categoryModels,
        eq(partModelCompatibilities.categoryModelId, categoryModels.id)
      )
      .where(eq(partModelCompatibilities.sparePartId, sparePartId));
    return rows.map((r) => r.name);
  }

  async check(
    sparePartId: number,
    srModelName: string | null | undefined,
    db?: DrizzleTx | NodePgDatabase<typeof schema>
  ): Promise<CompatibilityCheck> {
    const targetDb = db || this.db;
    const part = await targetDb.query.spareParts.findFirst({
      where: eq(spareParts.id, sparePartId),
      columns: { id: true, partName: true, isUniversal: true },
    });
    if (!part) {
      return { ok: false, reason: 'MISMATCH', compatibleModels: [] };
    }
    if (part.isUniversal) {
      return { ok: true, reason: 'UNIVERSAL', compatibleModels: [] };
    }

    const categoryId = await this.resolveCategoryId(srModelName, targetDb);
    if (categoryId === null) {
      this.logger.warn(
        `[COMPAT] Model SR "${srModelName}" tak terpetakan ke master. Lolos lunak untuk part #${sparePartId}.`
      );
      return { ok: true, reason: 'UNRESOLVED_MODEL', compatibleModels: [] };
    }

    const hit = await targetDb.query.partModelCompatibilities.findFirst({
      where: and(
        eq(partModelCompatibilities.sparePartId, sparePartId),
        eq(partModelCompatibilities.categoryModelId, categoryId)
      ),
    });
    if (hit) {
      return { ok: true, reason: 'MATCH', compatibleModels: [] };
    }

    const compatibleModels = await this.getCompatibleModelNames(
      sparePartId,
      targetDb
    );
    return { ok: false, reason: 'MISMATCH', compatibleModels };
  }

  async ensureCompatibility(
    sparePartId: number,
    categoryModelId: number,
    performedBy?: number | null,
    db?: DrizzleTx | NodePgDatabase<typeof schema>
  ): Promise<void> {
    const targetDb = (db || this.db) as DrizzleTx;
    await targetDb
      .insert(partModelCompatibilities)
      .values({ sparePartId, categoryModelId, createdBy: performedBy ?? null })
      .onConflictDoNothing();
  }

  async setCompatibilities(
    sparePartId: number,
    categoryModelIds: number[],
    performedBy?: number | null,
    db?: DrizzleTx | NodePgDatabase<typeof schema>
  ): Promise<void> {
    const targetDb = (db || this.db) as DrizzleTx;
    const uniqueIds = [...new Set(categoryModelIds)];
    if (uniqueIds.length > 0) {
      const models = await targetDb.query.categoryModels.findMany({
        where: inArray(categoryModels.id, uniqueIds),
        columns: { id: true },
      });
      const valid = new Set(models.map((m) => m.id));
      const invalid = uniqueIds.filter((id) => !valid.has(id));
      if (invalid.length > 0) {
        throw new Error(
          `Model ID tidak dikenal: ${invalid.join(', ')}.`
        );
      }
    }
    await targetDb
      .delete(partModelCompatibilities)
      .where(eq(partModelCompatibilities.sparePartId, sparePartId));
    if (uniqueIds.length > 0) {
      await targetDb.insert(partModelCompatibilities).values(
        uniqueIds.map((categoryModelId) => ({
          sparePartId,
          categoryModelId,
          createdBy: performedBy ?? null,
        }))
      );
    }
  }
}
