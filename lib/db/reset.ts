import { db } from './drizzle';
import { sql } from 'drizzle-orm';

async function main() {
  const pgUrl = Bun.env.POSTGRES_URL;
  if (!pgUrl) {
    console.error('POSTGRES_URL is not set. Aborting.');
    process.exit(1);
  }

  const dbUrlPreview = String(pgUrl).split('@').pop() || String(pgUrl);
  console.log(`Dropping all tables in schemas "public" and "drizzle" on ${dbUrlPreview}`);

  try {
    // Drop all tables in public and drizzle schemas
    await db.execute(
      sql`DO
    $$
    DECLARE
      r record;
    BEGIN
      FOR r IN SELECT schemaname, tablename FROM pg_tables WHERE schemaname IN ('public','drizzle') LOOP
        EXECUTE format('DROP TABLE IF EXISTS %I.%I CASCADE', r.schemaname, r.tablename);
      END LOOP;
    END
    $$;`,
    );

    // Drop the drizzle schema itself if present
    await db.execute(sql`DROP SCHEMA IF EXISTS drizzle CASCADE;`);

    console.log('Reset completed successfully.');
    process.exit(0);
  } catch (err) {
    console.error('Reset failed:', err);
    process.exit(1);
  }
}

main();
