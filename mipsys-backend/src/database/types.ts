import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from './schema';

export type DrizzleTx = Parameters<
  Parameters<NodePgDatabase<typeof schema>['transaction']>[0]
>[0];
