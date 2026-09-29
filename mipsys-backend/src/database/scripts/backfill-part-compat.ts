import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { eq } from 'drizzle-orm';
import * as schema from '../schema';
import 'dotenv/config';

function normalizeModelName(value: string | null | undefined): string {
  return (value ?? '')
    .toLowerCase()
    .replace(/epson/g, '')
    .replace(/[^a-z0-9]/g, '');
}

async function backfill() {
  const pool = new Pool({
    host: process.env.DB_HOST || '127.0.0.1',
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME || 'db_mipsys',
    port: Number(process.env.DB_PORT) || 5433,
  });
  const db = drizzle(pool, { schema });

  const models = await db.query.categoryModels.findMany({
    columns: { id: true, name: true },
  });
  const byNorm = new Map(models.map((m) => [normalizeModelName(m.name), m]));

  const parts = await db.query.spareParts.findMany({
    columns: { id: true, partCode: true, partName: true, modelName: true },
  });

  let universal = 0;
  let matched = 0;
  const unmatched: string[] = [];

  for (const part of parts) {
    const norm = normalizeModelName(part.modelName);
    if (!norm || norm === 'all') {
      await db
        .update(schema.spareParts)
        .set({ isUniversal: true })
        .where(eq(schema.spareParts.id, part.id));
      universal++;
      continue;
    }
    const model = byNorm.get(norm);
    if (!model) {
      unmatched.push(`${part.partCode} (${part.modelName})`);
      continue;
    }
    await db
      .insert(schema.partModelCompatibilities)
      .values({ sparePartId: part.id, categoryModelId: model.id })
      .onConflictDoNothing();
    matched++;
  }

  console.log(`Universal: ${universal}, Tercocokkan: ${matched}`);
  if (unmatched.length > 0) {
    console.log('Tak cocok (tetapkan manual via UI):');
    unmatched.forEach((u) => console.log(` - ${u}`));
  }

  await pool.end();
}

backfill().catch((e) => {
  console.error(e);
  process.exit(1);
});
