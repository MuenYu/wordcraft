import { and, asc, eq } from 'drizzle-orm';
import { db } from '@/lib/db/drizzle';
import { vocabImports, vocabItems, vocabLists } from '@/lib/db/schema';
import { MAX_ERROR_SAMPLE_SIZE } from './constants';
import { ImportRowError, parseCsvForImport } from './parser';

export function formatImportId(importId: number): string {
  return `imp_${importId}`;
}

export function parseImportId(value: string): number | null {
  if (/^\d+$/.test(value)) {
    return Number.parseInt(value, 10);
  }

  const prefixedMatch = /^imp_(\d+)$/.exec(value);
  if (!prefixedMatch) {
    return null;
  }

  return Number.parseInt(prefixedMatch[1], 10);
}

type CreateImportJobInput = {
  userId: number;
  originalFilename: string;
  csvContent: string;
  listId?: number;
  listName?: string;
  idempotencyKey?: string;
};

export class ImportInputError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ImportInputError';
  }
}

export async function createImportJob(input: CreateImportJobInput) {
  if (input.listId) {
    const existingList = await db
      .select({ id: vocabLists.id })
      .from(vocabLists)
      .where(and(eq(vocabLists.id, input.listId), eq(vocabLists.userId, input.userId)))
      .limit(1);

    if (existingList.length === 0) {
      throw new ImportInputError('Target list does not exist or is not owned by user');
    }
  }

  if (input.idempotencyKey) {
    const existing = await db
      .select()
      .from(vocabImports)
      .where(
        and(
          eq(vocabImports.userId, input.userId),
          eq(vocabImports.idempotencyKey, input.idempotencyKey),
        ),
      )
      .limit(1);

    if (existing.length > 0) {
      return existing[0];
    }
  }

  try {
    const created = await db
      .insert(vocabImports)
      .values({
        userId: input.userId,
        listId: input.listId,
        status: 'queued',
        source: 'csv',
        originalFilename: input.originalFilename,
        idempotencyKey: input.idempotencyKey,
        payload: {
          csvContent: input.csvContent,
          listId: input.listId,
          listName: input.listName,
        },
      })
      .returning();

    return created[0];
  } catch (error) {
    if (input.idempotencyKey && isUniqueViolation(error, 'vocab_imports_user_idempotency_idx')) {
      const existing = await db
        .select()
        .from(vocabImports)
        .where(
          and(
            eq(vocabImports.userId, input.userId),
            eq(vocabImports.idempotencyKey, input.idempotencyKey),
          ),
        )
        .limit(1);

      if (existing.length > 0) {
        return existing[0];
      }
    }

    throw error;
  }
}

export async function getImportForUser(importId: number, userId: number) {
  const rows = await db
    .select()
    .from(vocabImports)
    .where(and(eq(vocabImports.id, importId), eq(vocabImports.userId, userId)))
    .limit(1);

  return rows[0] ?? null;
}

export function serializeImportStatus(importRecord: typeof vocabImports.$inferSelect) {
  return {
    importId: formatImportId(importRecord.id),
    listId: importRecord.listId,
    status: importRecord.status,
    totalCount: importRecord.totalCount,
    insertedCount: importRecord.insertedCount,
    duplicateCount: importRecord.duplicateCount,
    invalidCount: importRecord.invalidCount,
    errorSummary: importRecord.errorSummary,
    createdAt: importRecord.createdAt,
    updatedAt: importRecord.updatedAt,
    startedAt: importRecord.startedAt,
    finishedAt: importRecord.finishedAt,
  };
}

export async function processImportJob(importId: number): Promise<void> {
  const claim = await db
    .update(vocabImports)
    .set({
      status: 'parsing',
      startedAt: new Date(),
      updatedAt: new Date(),
      lastError: null,
      finishedAt: null,
    })
    .where(and(eq(vocabImports.id, importId), eq(vocabImports.status, 'queued')))
    .returning();

  if (claim.length > 0) {
    await runImport(claim[0]);
    return;
  }

  const inProgress = await db
    .select()
    .from(vocabImports)
    .where(and(eq(vocabImports.id, importId), eq(vocabImports.status, 'parsing')))
    .limit(1);

  if (inProgress.length > 0) {
    await runImport(inProgress[0]);
  }
}

export async function claimNextQueuedImport() {
  const nextQueued = await db
    .select({ id: vocabImports.id })
    .from(vocabImports)
    .where(eq(vocabImports.status, 'queued'))
    .orderBy(asc(vocabImports.createdAt))
    .limit(1);

  if (nextQueued.length === 0) {
    return null;
  }

  const claim = await db
    .update(vocabImports)
    .set({
      status: 'parsing',
      startedAt: new Date(),
      updatedAt: new Date(),
      lastError: null,
      finishedAt: null,
    })
    .where(and(eq(vocabImports.id, nextQueued[0].id), eq(vocabImports.status, 'queued')))
    .returning();

  return claim[0] ?? null;
}

async function runImport(importRecord: typeof vocabImports.$inferSelect) {
  try {
    const payload = importRecord.payload;
    if (!payload || typeof payload.csvContent !== 'string') {
      await markImportFailed(importRecord.id, 'Import payload is missing CSV content');
      return;
    }

    const parseResult = parseCsvForImport(payload.csvContent);
    if (!parseResult.ok) {
      await db
        .update(vocabImports)
        .set({
          status: 'failed',
          invalidCount: 1,
          totalCount: 0,
          errorSummary: {
            sample: [parseResult.error],
            totalErrors: 1,
          },
          lastError: parseResult.error.message,
          finishedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(vocabImports.id, importRecord.id));
      return;
    }

    const targetListId = await resolveOrCreateTargetList(
      importRecord,
      payload.listId,
      payload.listName,
    );
    if (!targetListId) {
      return;
    }

    const errors: ImportRowError[] = [...parseResult.value.errors];
    let insertedCount = 0;
    let duplicateCount = 0;

    await db
      .update(vocabImports)
      .set({
        listId: targetListId,
        status: 'importing',
        totalCount: parseResult.value.totalCount,
        invalidCount: parseResult.value.errors.length,
        updatedAt: new Date(),
      })
      .where(eq(vocabImports.id, importRecord.id));

    for (const row of parseResult.value.validRows) {
      try {
        await db.insert(vocabItems).values({
          listId: targetListId,
          term: row.term,
          normalizedTerm: row.normalizedTerm,
          partOfSpeech: row.partOfSpeech,
          definition: row.definition,
          exampleSentence: row.exampleSentence,
        });

        insertedCount += 1;
      } catch (error) {
        if (isUniqueViolation(error, 'vocab_items_list_normalized_term_idx')) {
          duplicateCount += 1;
          continue;
        }

        errors.push({
          row: row.row,
          code: 'ROW_INSERT_FAILED',
          message: 'Failed to insert row',
        });
      }
    }

    const invalidCount = errors.length;
    const status = resolveTerminalStatus(insertedCount, duplicateCount, invalidCount);

    await db
      .update(vocabImports)
      .set({
        status,
        insertedCount,
        duplicateCount,
        invalidCount,
        errorSummary:
          invalidCount > 0
            ? {
                sample: errors.slice(0, MAX_ERROR_SAMPLE_SIZE),
                totalErrors: invalidCount,
              }
            : null,
        payload: null,
        finishedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(vocabImports.id, importRecord.id));
  } catch (error) {
    await markImportFailed(importRecord.id, getErrorMessage(error));
  }
}

async function resolveOrCreateTargetList(
  importRecord: typeof vocabImports.$inferSelect,
  listId?: number,
  listName?: string,
): Promise<number | null> {
  if (listId) {
    const existingList = await db
      .select({ id: vocabLists.id })
      .from(vocabLists)
      .where(and(eq(vocabLists.id, listId), eq(vocabLists.userId, importRecord.userId)))
      .limit(1);

    if (existingList.length === 0) {
      await markImportFailed(importRecord.id, 'Target list does not exist or is not owned by user');
      return null;
    }

    return existingList[0].id;
  }

  if (!listName) {
    await markImportFailed(importRecord.id, 'Target list name is required');
    return null;
  }

  const insertedList = await db
    .insert(vocabLists)
    .values({
      userId: importRecord.userId,
      name: listName,
      source: 'csv',
      originalFilename: importRecord.originalFilename,
    })
    .returning({ id: vocabLists.id });

  return insertedList[0]?.id ?? null;
}

async function markImportFailed(importId: number, message: string) {
  await db
    .update(vocabImports)
    .set({
      status: 'failed',
      lastError: message,
      finishedAt: new Date(),
      updatedAt: new Date(),
      payload: null,
    })
    .where(eq(vocabImports.id, importId));
}

function resolveTerminalStatus(
  insertedCount: number,
  duplicateCount: number,
  invalidCount: number,
) {
  if (invalidCount > 0 && insertedCount === 0 && duplicateCount === 0) {
    return 'failed';
  }

  if (invalidCount > 0) {
    return 'partial_success';
  }

  return 'completed';
}

function isUniqueViolation(error: unknown, constraintName: string): boolean {
  if (!error || typeof error !== 'object') {
    return false;
  }

  const withMessage = error as { message?: string; cause?: unknown; code?: string };
  const directCode = withMessage.code;
  if (directCode === '23505') {
    return true;
  }

  const cause = withMessage.cause as { code?: string; message?: string } | undefined;
  if (cause?.code === '23505') {
    return true;
  }

  const text = `${withMessage.message ?? ''} ${cause?.message ?? ''}`;
  return text.includes(constraintName);
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return 'Unknown import processing error';
}
