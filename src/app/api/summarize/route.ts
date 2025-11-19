import { getCloudflareContext } from '@opennextjs/cloudflare';
import { headers } from 'next/headers';
import handleApiError from '@/lib/api-error';
import { getAuthInstance } from '@/lib/auth/auth-utils';
import { SummarizerService, summarizeRequestSchema } from '@/services/summarizer.service';

export async function POST(request: Request) {
	try {
		// Check authentication
		const auth = await getAuthInstance();
		const session = await auth.api.getSession({
			headers: await headers(),
		});

		if (!session?.user) {
			return new Response(
				JSON.stringify({
					success: false,
					error: 'Authentication required',
					data: null,
				}),
				{
					status: 401,
					headers: {
						'Content-Type': 'application/json',
					},
				},
			);
		}

		const { env } = getCloudflareContext();

		// TODO: Uncomment when AI binding is enabled in wrangler.jsonc
		/*
		if (!env.AI) {
			return new Response(
				JSON.stringify({
					success: false,
					error: 'AI service is not available',
					data: null,
				}),
				{
					status: 500,
					headers: {
						'Content-Type': 'application/json',
					},
				},
			);
		}

		// parse request body
		const body = await request.json();
		const validated = summarizeRequestSchema.parse(body);

		const summarizerService = new SummarizerService(env.AI);
		const result = await summarizerService.summarize(validated.text, validated.config);

		return new Response(
			JSON.stringify({
				success: true,
				data: result,
				error: null,
			}),
			{
				status: 200,
				headers: {
					'Content-Type': 'application/json',
				},
			},
		);
		*/

		// Temporary response until AI is enabled
		return new Response(
			JSON.stringify({
				success: false,
				error: 'AI service is not available yet - feature coming soon',
				data: null,
			}),
			{
				status: 503,
				headers: {
					'Content-Type': 'application/json',
				},
			},
		);
	} catch (error) {
		return handleApiError(error);
	}
}
