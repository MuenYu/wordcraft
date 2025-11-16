import { config } from 'dotenv';
import { defineConfig } from 'drizzle-kit';

// Load environment variables from .dev.vars for drizzle studio
config({ path: '.dev.vars' });

export default defineConfig({
	schema: './src/db/schema.ts',
	out: './src/drizzle',
	dialect: 'sqlite',
	driver: 'd1-http',
	dbCredentials: {
		accountId: process.env.CLOUDFLARE_ACCOUNT_ID!,
		databaseId: '76a4940e-2b14-4328-acf2-a2f62934cae3',

		token: process.env.CLOUDFLARE_API_TOKEN!,
	},
});
