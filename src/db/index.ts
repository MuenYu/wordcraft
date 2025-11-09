import { getCloudflareContext } from '@opennextjs/cloudflare';
import { drizzle } from 'drizzle-orm/d1';
import * as schema from './schema';

export async function getDb() {
	const { env } = await getCloudflareContext();
	// !starterconf - update this to match your D1 database binding name
	// change "wordcraft" to your D1 database binding name on `wrangler.jsonc`
	return drizzle(env.wordcraft, { schema });
}

export * from './schema';
