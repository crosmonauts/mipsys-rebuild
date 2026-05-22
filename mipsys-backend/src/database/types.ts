import { MySql2Database } from 'drizzle-orm/mysql2';
import * as schema from './schema';

export type DrizzleTx = Parameters<
  Parameters<MySql2Database<typeof schema>['transaction']>[0]
>[0];
