import { Injectable, Inject, Logger } from '@nestjs/common';
import { sql } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../../database/schema';
import { serviceRequests } from '../../database/schema';

@Injectable()
export class ServiceRequestStatsService {
  private readonly logger = new Logger(ServiceRequestStatsService.name);

  constructor(
    @Inject('DB_CONNECTION') private db: NodePgDatabase<typeof schema>
  ) {}

  async getDashboardStats() {
    try {
      const rows = await this.db
        .select({
          statusService: serviceRequests.statusService,
          statusSystem: serviceRequests.statusSystem,
          count: sql<number>`count(*)::int`,
        })
        .from(serviceRequests)
        .groupBy(serviceRequests.statusService, serviceRequests.statusSystem);

      const byStatus = new Map<string, number>();
      let total = 0;
      let closed = 0;
      for (const r of rows) {
        const c = Number(r.count) || 0;
        total += c;
        if (r.statusService) byStatus.set(r.statusService, (byStatus.get(r.statusService) ?? 0) + c);
        if (r.statusSystem === 'CLOSED') closed += c;
      }

      const pending =
        (byStatus.get('WAITING_CHECK') ?? 0) + (byStatus.get('WAITING_APPROVE') ?? 0);
      const inService = byStatus.get('SERVICE') ?? 0;
      const awaitingParts = byStatus.get('AWAITING_PARTS') ?? 0;
      const ready = byStatus.get('DONE') ?? 0;
      const cancelled = byStatus.get('CANCEL') ?? 0;

      return {
        total,
        pending,
        inService,
        awaitingParts,
        ready,
        closed,
        cancelled,
      };
    } catch (error) {
      this.logger.error('[GET_STATS_ERROR]', error);
      return {
        total: 0,
        pending: 0,
        inService: 0,
        awaitingParts: 0,
        ready: 0,
        closed: 0,
        cancelled: 0,
      };
    }
  }
}
