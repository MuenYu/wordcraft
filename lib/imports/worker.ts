import { claimNextQueuedImport, processImportJob } from './service';

export async function processQueuedImports(limit = 10): Promise<number> {
  let processedCount = 0;

  while (processedCount < limit) {
    const claimed = await claimNextQueuedImport();
    if (!claimed) {
      break;
    }

    await processImportJob(claimed.id);
    processedCount += 1;
  }

  return processedCount;
}
