import { Injectable, Inject, NotFoundException, Logger } from '@nestjs/common';
import { eq, like, ilike, or, desc, and, sql, lt, gt, SQL, inArray } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../database/schema';
import { spareParts, categoryModels } from '../database/schema';
import { likePattern } from '../common/utils/escape-like';
import { normalizeModelName } from './part-compatibility.service';

@Injectable()
export class InventoryReadService {
  private readonly logger = new Logger(InventoryReadService.name);

  constructor(
    @Inject('DB_CONNECTION') private db: NodePgDatabase<typeof schema>
  ) {}

  async getModels(): Promise<string[]> {
    const rows = await this.db
      .select({ name: categoryModels.name })
      .from(categoryModels)
      .orderBy(categoryModels.name);
    return rows.map((r) => r.name);
  }

  async searchParts(query: string) {
    const pattern = likePattern(query);
    const parts = await this.db.query.spareParts.findMany({
      where: or(
        ilike(spareParts.partName, pattern),
        ilike(spareParts.partCode, pattern)
      ),
      orderBy: [desc(spareParts.stock)],
      limit: 50,
    });
    if (parts.length === 0) return [];

    const ids = parts.map((p) => p.id);
    const compatRows = await this.db
      .select({
        sparePartId: schema.partModelCompatibilities.sparePartId,
        modelName: categoryModels.name,
      })
      .from(schema.partModelCompatibilities)
      .innerJoin(
        categoryModels,
        eq(schema.partModelCompatibilities.categoryModelId, categoryModels.id)
      )
      .where(inArray(schema.partModelCompatibilities.sparePartId, ids));

    const byPart = new Map<number, string[]>();
    for (const row of compatRows) {
      const list = byPart.get(row.sparePartId) ?? [];
      list.push(row.modelName);
      byPart.set(row.sparePartId, list);
    }
    return parts.map((p) => ({
      ...p,
      compatibleModels: byPart.get(p.id) ?? [],
    }));
  }

  async getAll(params?: { search?: string; page?: number; limit?: number }) {
    const search = params?.search;
    const page = Math.max(params?.page ?? 1, 1);
    const limit = Math.min(Math.max(params?.limit ?? 10, 1), 100);
    const conditions: SQL[] = [];

    if (search) {
      const pattern = likePattern(search);
      const searchCondition = or(
        like(spareParts.partName, pattern),
        like(spareParts.partCode, pattern)
      );
      if (searchCondition) conditions.push(searchCondition);
    }

    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const [data, [{ count }]] = await Promise.all([
      this.db.query.spareParts.findMany({
        where,
        orderBy: [desc(spareParts.createdAt)],
        limit,
        offset: (page - 1) * limit,
      }),
      this.db
        .select({ count: sql<number>`count(*)` })
        .from(spareParts)
        .where(where ?? undefined),
    ]);

    const total = Number(count);
    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: total > 0 ? Math.ceil(total / limit) : 0,
      },
    };
  }

  async getParts(filters?: {
    status?: 'ok' | 'low' | 'empty';
    search?: string;
  }) {
    const conditions: SQL[] = [];

    if (filters?.search) {
      const pattern = `%${filters.search}%`;
      const searchCondition = or(
        like(spareParts.partName, pattern),
        like(spareParts.partCode, pattern)
      );
      if (searchCondition) conditions.push(searchCondition);
    }

    if (filters?.status === 'ok') {
      conditions.push(sql`${spareParts.stock} >= ${spareParts.minStock}`);
    } else if (filters?.status === 'low') {
      const lowCondition = and(
        gt(spareParts.stock, 0),
        sql`${spareParts.stock} < ${spareParts.minStock}`
      );
      if (lowCondition) conditions.push(lowCondition);
    } else if (filters?.status === 'empty') {
      conditions.push(eq(spareParts.stock, 0));
    }

    return this.db.query.spareParts.findMany({
      where: conditions.length > 0 ? and(...conditions) : undefined,
      orderBy: [desc(spareParts.partCode)],
    });
  }

  async getPartById(id: number) {
    const part = await this.db.query.spareParts.findFirst({
      where: eq(spareParts.id, id),
    });
    if (!part) throw new NotFoundException(`Part ID ${id} tidak ditemukan.`);
    return part;
  }

  async searchPartsForModel(query: string, srModelName?: string) {
    const parts = await this.searchParts(query);
    const needle = normalizeModelName(srModelName);
    if (!needle) {
      return parts.map((p) => ({ ...p, compatible: null as boolean | null }));
    }
    return parts.map((p) => {
      const compat = p as typeof p & {
        compatibleModels: string[];
        isUniversal?: boolean | null;
      };
      if (compat.isUniversal) {
        return { ...p, compatible: true as boolean | null };
      }
      const ok = (compat.compatibleModels ?? []).some(
        (m) =>
          normalizeModelName(m) === needle ||
          normalizeModelName(m).includes(needle) ||
          needle.includes(normalizeModelName(m))
      );
      return { ...p, compatible: ok as boolean | null };
    });
  }

  async getCompatibility(partId: number) {
    await this.getPartById(partId);
    const rows = await this.db
      .select({ id: categoryModels.id, name: categoryModels.name })
      .from(schema.partModelCompatibilities)
      .innerJoin(
        categoryModels,
        eq(schema.partModelCompatibilities.categoryModelId, categoryModels.id)
      )
      .where(eq(schema.partModelCompatibilities.sparePartId, partId));
    return rows;
  }

  async getLowStockAlert() {
    return this.db.query.spareParts.findMany({
      where: lt(spareParts.stock, spareParts.minStock),
      orderBy: [desc(spareParts.stock)],
    });
  }

  async findByPartNameAndModel(partName: string, modelName?: string) {
    const conditions: ReturnType<typeof sql>[] = [
      eq(spareParts.partName, partName.trim()),
    ];
    if (modelName) {
      conditions.push(eq(spareParts.modelName, modelName.trim()));
    }
    return this.db.query.spareParts.findFirst({
      where: and(...conditions),
    });
  }
}
