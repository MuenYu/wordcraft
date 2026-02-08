import { NextResponse } from 'next/server';
import { processQueuedImports } from '@/lib/imports/worker';

const DEFAULT_BATCH_SIZE = 10;

export async function POST(request: Request) {
  const configuredSecret = process.env.VOCAB_IMPORT_WORKER_SECRET;
  if (!configuredSecret) {
    return NextResponse.json({ error: 'Worker secret is not configured' }, { status: 500 });
  }

  const providedSecret = request.headers.get('x-worker-secret');
  if (providedSecret !== configuredSecret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const url = new URL(request.url);
  const batchSizeParam = url.searchParams.get('limit');
  const batchSize = batchSizeParam ? Number.parseInt(batchSizeParam, 10) : DEFAULT_BATCH_SIZE;

  const processed = await processQueuedImports(
    Number.isInteger(batchSize) ? batchSize : DEFAULT_BATCH_SIZE,
  );

  return NextResponse.json({ processed });
}
