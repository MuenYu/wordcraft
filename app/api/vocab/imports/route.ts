import { NextResponse } from 'next/server';
import { getUser } from '@/lib/db/queries';
import {
  createImportJob,
  formatImportId,
  ImportInputError,
  processImportJob,
} from '@/lib/imports/service';
import { validateCreateImportRequest } from '@/lib/imports/validation';

export async function POST(request: Request) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const validation = validateCreateImportRequest(formData);
    if (!validation.ok) {
      return NextResponse.json(
        { error: validation.error.message, code: validation.error.code },
        { status: 400 },
      );
    }

    const csvContent = await validation.value.file.text();

    const importRecord = await createImportJob({
      userId: user.id,
      originalFilename: validation.value.file.name,
      csvContent,
      listId: validation.value.listId,
      listName: validation.value.listName,
      idempotencyKey: validation.value.idempotencyKey,
    });

    queueMicrotask(() => {
      void processImportJob(importRecord.id);
    });

    return NextResponse.json(
      {
        importId: formatImportId(importRecord.id),
        status: importRecord.status,
      },
      { status: 202 },
    );
  } catch (error) {
    if (error instanceof ImportInputError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    console.error('Failed to create vocab import job:', error);
    return NextResponse.json({ error: 'Failed to create import job' }, { status: 500 });
  }
}
