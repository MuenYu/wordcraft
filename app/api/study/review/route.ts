import { getUser } from '@/lib/db/queries';
import { submitReviewForUser } from '@/lib/study/service';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { flashcardId, result, score, userInput, feedbackText } = await request.json();

    if (
      typeof flashcardId !== 'number' ||
      !['pass', 'fail'].includes(result) ||
      typeof score !== 'number' ||
      typeof userInput !== 'string' ||
      typeof feedbackText !== 'string'
    ) {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    const resultData = await submitReviewForUser(user.id, {
      flashcardId,
      result: result as 'pass' | 'fail',
      score,
      userInput,
      feedbackText,
    });

    return NextResponse.json(resultData);
  } catch (error) {
    console.error('Error submitting review:', error);
    return NextResponse.json({ error: 'Failed to submit review' }, { status: 500 });
  }
}
