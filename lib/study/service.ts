'use server';

import { db } from '@/lib/db/drizzle';
import { flashcards, vocabItems, vocabLists, reviews, type FlashcardState } from '@/lib/db/schema';
import { and, desc, eq, gte, notInArray, or, sql } from 'drizzle-orm';

export interface StudyCard {
  flashcardId: number;
  vocabItemId: number;
  word: string;
  partOfSpeech: string;
  definition: string;
  example: string | null;
  state: FlashcardState;
  dueAt: Date;
}

export interface ReviewSubmission {
  flashcardId: number;
  result: 'pass' | 'fail';
  score: number;
  userInput: string;
  feedbackText: string;
}

export interface ReviewResult {
  success: boolean;
  nextDueAt: Date;
  newState: FlashcardState;
  intervalDays: number;
  easeFactor: number;
}

export async function getStudyQueueForUser(
  userId: number,
  options: { limit?: number; excludeFlashcardIds?: number[] } = {},
): Promise<StudyCard[]> {
  const { limit = 20, excludeFlashcardIds = [] } = options;
  const now = new Date();

  const whereConditions = [
    eq(vocabLists.userId, userId),
    sql`${flashcards.state} != 'suspended'`,
    or(eq(flashcards.state, 'pending' as FlashcardState), gte(flashcards.dueAt, now)),
  ];

  if (excludeFlashcardIds.length > 0) {
    whereConditions.push(notInArray(flashcards.id, excludeFlashcardIds));
  }

  const cards = await db
    .select({
      flashcardId: flashcards.id,
      vocabItemId: flashcards.vocabItemId,
      state: flashcards.state,
      dueAt: flashcards.dueAt,
      word: vocabItems.term,
      partOfSpeech: vocabItems.partOfSpeech,
      definition: vocabItems.definition,
      example: vocabItems.exampleSentence,
    })
    .from(flashcards)
    .innerJoin(vocabItems, eq(flashcards.vocabItemId, vocabItems.id))
    .innerJoin(vocabLists, eq(vocabItems.listId, vocabLists.id))
    .where(and(...whereConditions))
    .orderBy(
      sql`CASE WHEN ${flashcards.state} = 'pending' THEN 0 ELSE 1 END`,
      desc(flashcards.dueAt),
    )
    .limit(limit);

  return cards.map((card) => ({
    flashcardId: card.flashcardId,
    vocabItemId: card.vocabItemId,
    word: card.word,
    partOfSpeech: card.partOfSpeech,
    definition: card.definition,
    example: card.example,
    state: card.state as FlashcardState,
    dueAt: card.dueAt,
  }));
}

export async function submitReviewForUser(
  userId: number,
  submission: ReviewSubmission,
): Promise<ReviewResult> {
  const [flashcard] = await db
    .select({
      id: flashcards.id,
      state: flashcards.state,
      intervalDays: flashcards.intervalDays,
      easeFactor: flashcards.easeFactor,
      correctStreak: flashcards.correctStreak,
      lapseCount: flashcards.lapseCount,
    })
    .from(flashcards)
    .innerJoin(vocabItems, eq(flashcards.vocabItemId, vocabItems.id))
    .innerJoin(vocabLists, eq(vocabItems.listId, vocabLists.id))
    .where(and(eq(flashcards.id, submission.flashcardId), eq(vocabLists.userId, userId)))
    .limit(1);

  if (!flashcard) {
    throw new Error('Flashcard not found or does not belong to user');
  }

  const now = new Date();
  const currentEaseFactor = Number(flashcard.easeFactor);

  let newState: FlashcardState;
  let newIntervalDays: number;
  let newEaseFactor: number;
  let newCorrectStreak: number;
  let newLapseCount: number;
  let newDueAt: Date;

  if (submission.result === 'pass') {
    newCorrectStreak = (flashcard.correctStreak || 0) + 1;
    newLapseCount = flashcard.lapseCount || 0;
    newEaseFactor = Math.min(3.0, Math.max(1.3, currentEaseFactor + 0.1));

    if (flashcard.intervalDays === 0) {
      newIntervalDays = 1;
    } else {
      newIntervalDays = Math.max(1, Math.round(flashcard.intervalDays * newEaseFactor));
    }

    const currentState = flashcard.state as FlashcardState;
    if (currentState === 'pending') {
      newState = 'memorizing';
    } else {
      newState = currentState;
    }

    if (
      newIntervalDays >= 21 &&
      (flashcard.state === 'memorizing' || flashcard.state === 'pending')
    ) {
      newState = 'memorizing';
    }

    newDueAt = new Date(now.getTime() + newIntervalDays * 24 * 60 * 60 * 1000);
  } else {
    newCorrectStreak = 0;
    newLapseCount = (flashcard.lapseCount || 0) + 1;
    newEaseFactor = Math.min(3.0, Math.max(1.3, currentEaseFactor - 0.2));
    newIntervalDays = 0;
    newDueAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    const currentState = flashcard.state as FlashcardState;
    if (currentState === 'pending') {
      newState = 'pending';
    } else {
      newState = 'memorizing';
    }
  }

  await db.transaction(async (tx) => {
    await tx.insert(reviews).values({
      flashcardId: submission.flashcardId,
      result: submission.result,
      score: submission.score,
      userInput: submission.userInput,
      feedbackText: submission.feedbackText,
      reviewedAt: now,
    });

    await tx
      .update(flashcards)
      .set({
        state: newState,
        dueAt: newDueAt,
        intervalDays: newIntervalDays,
        easeFactor: String(newEaseFactor),
        correctStreak: newCorrectStreak,
        lapseCount: newLapseCount,
        reviewCount: sql`${flashcards.reviewCount} + 1`,
        lastReviewedAt: now,
        updatedAt: now,
      })
      .where(eq(flashcards.id, submission.flashcardId));
  });

  return {
    success: true,
    nextDueAt: newDueAt,
    newState: newState,
    intervalDays: newIntervalDays,
    easeFactor: newEaseFactor,
  };
}

export async function getStudyStatsForUser(userId: number) {
  const now = new Date();

  const [dueCount] = await db
    .select({ count: sql<number>`count(*)` })
    .from(flashcards)
    .innerJoin(vocabItems, eq(flashcards.vocabItemId, vocabItems.id))
    .innerJoin(vocabLists, eq(vocabItems.listId, vocabLists.id))
    .where(
      and(
        eq(vocabLists.userId, userId),
        sql`${flashcards.state} != 'suspended'`,
        or(eq(flashcards.state, 'pending'), sql`${flashcards.dueAt} <= ${now}`),
      ),
    );

  const startOfDay = new Date(now);
  startOfDay.setHours(0, 0, 0, 0);

  const [todayReviews] = await db
    .select({ count: sql<number>`count(*)` })
    .from(reviews)
    .innerJoin(flashcards, eq(reviews.flashcardId, flashcards.id))
    .innerJoin(vocabItems, eq(flashcards.vocabItemId, vocabItems.id))
    .innerJoin(vocabLists, eq(vocabItems.listId, vocabLists.id))
    .where(and(eq(vocabLists.userId, userId), sql`${reviews.reviewedAt} >= ${startOfDay}`));

  return {
    dueCount: dueCount?.count || 0,
    todayReviews: todayReviews?.count || 0,
  };
}
