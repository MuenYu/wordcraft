import { drizzle } from 'drizzle-orm/bun-sql';
import * as schema from './schema';
import dotenv from 'dotenv';

dotenv.config();

if (!process.env.POSTGRES_URL) {
  throw new Error('POSTGRES_URL environment variable is not set');
}

export const db = drizzle(process.env.POSTGRES_URL, { schema });
