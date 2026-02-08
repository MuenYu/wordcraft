import { NextResponse } from 'next/server';
import { getUser } from '@/lib/db/queries';
import { getImportForUser, parseImportId, serializeImportStatus } from '@/lib/imports/service';

type RouteContext = {
  params: Promise<{ importId: string }>;
};

export async function GET(_: Request, context: RouteContext) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const params = await context.params;
  const importId = parseImportId(params.importId);
  if (!importId) {
    return NextResponse.json({ error: 'Invalid importId' }, { status: 400 });
  }

  const importRecord = await getImportForUser(importId, user.id);
  if (!importRecord) {
    return NextResponse.json({ error: 'Import not found' }, { status: 404 });
  }

  return NextResponse.json(serializeImportStatus(importRecord));
}
