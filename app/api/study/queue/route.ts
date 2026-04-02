import { getUser } from '@/lib/db/queries';
import { getStudyQueueForUser } from '@/lib/study/service';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { limit, excludeFlashcardIds } = await request.json();

    const cards = await getStudyQueueForUser(user.id, {
      limit: typeof limit === 'number' ? limit : 20,
      excludeFlashcardIds: Array.isArray(excludeFlashcardIds) ? excludeFlashcardIds : [],
    });

    return NextResponse.json({ cards });
  } catch (error) {
    console.error('Error fetching study queue:', error);
    return NextResponse.json({ error: 'Failed to fetch study queue' }, { status: 500 });
  }
}
