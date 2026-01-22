import { sql, eq, and, desc, gte, lte, inArray } from 'drizzle-orm';
import { db } from './drizzle';
import {
  flashcards,
  vocabItems,
  vocabLists,
  reviews,
  flashcardStates,
  type FlashcardState,
} from './schema';

// Color mapping for donut chart states
const STATE_COLORS: Record<string, string> = {
  deep_matured: '#22c55e', // green
  matured: '#3b82f6', // blue
  memorizing: '#f59e0b', // amber
  pending: '#94a3b8', // gray
  suspended: '#64748b', // slate
};

// Label mapping for donut chart states
const STATE_LABELS: Record<string, string> = {
  deep_matured: 'Deep Matured',
  matured: 'Matured',
  memorizing: 'Memorizing',
  pending: 'Pending',
  suspended: 'Suspended',
};

// State bonus for mastery calculation
const STATE_BONUS: Record<string, number> = {
  pending: 0,
  memorizing: 5,
  matured: 15,
  deep_matured: 25,
  suspended: 0,
};

/**
 * Compute mastery level from flashcard data.
 * Based on intervalDays with a logarithmic scale, plus state bonus.
 */
function computeMasteryLevel(intervalDays: number, state: string): number {
  // Logarithmic scale: log1p(x) / log1p(60) gives 0-100 range for x from 0 to ~60 days
  const intervalScore = Math.min(
    Math.round((Math.log1p(intervalDays) / Math.log1p(60)) * 100),
    100,
  );
  const bonus = STATE_BONUS[state] ?? 0;
  return Math.min(intervalScore + bonus, 100);
}

/**
 * Get word mastery status breakdown for user's flashcards.
 */
async function getWordStatus(userId: number) {
  const result = await db
    .select({
      state: flashcards.state,
      count: sql<number>`count(*)::int`,
    })
    .from(flashcards)
    .innerJoin(vocabItems, eq(flashcards.vocabItemId, vocabItems.id))
    .innerJoin(vocabLists, eq(vocabItems.listId, vocabLists.id))
    .where(eq(vocabLists.userId, userId))
    .groupBy(flashcards.state);

  const total = result.reduce((acc, row) => acc + row.count, 0);

  // Map to UI format, include all known states even if count is 0
  const formatted = flashcardStates.map((state) => {
    const found = result.find((r) => r.state === state);
    return {
      label: STATE_LABELS[state] ?? state,
      value: found?.count ?? 0,
      color: STATE_COLORS[state] ?? '#94a3b8',
    };
  });

  return { data: formatted, total };
}

/**
 * Get daily study activity for the last 30 days.
 * Counts review events per day.
 */
async function getDailyStudyActivity(userId: number) {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  // Get review counts grouped by day
  const rawData = await db
    .select({
      day: sql<string>`date_trunc('day', ${reviews.reviewedAt})::date`,
      count: sql<number>`count(*)::int`,
    })
    .from(reviews)
    .innerJoin(flashcards, eq(reviews.flashcardId, flashcards.id))
    .innerJoin(vocabItems, eq(flashcards.vocabItemId, vocabItems.id))
    .innerJoin(vocabLists, eq(vocabItems.listId, vocabLists.id))
    .where(
      and(
        eq(vocabLists.userId, userId),
        gte(reviews.reviewedAt, thirtyDaysAgo),
        lte(reviews.reviewedAt, now),
      ),
    )
    .groupBy(sql`date_trunc('day', ${reviews.reviewedAt})`)
    .orderBy(sql`date_trunc('day', ${reviews.reviewedAt})`);

  // Build a map for quick lookup
  const countByDate = new Map<string, number>();
  for (const row of rawData) {
    countByDate.set(row.day, row.count);
  }

  // Generate 30 days of data, filling missing days with 0
  const result: { label: string; count: number }[] = [];
  for (let i = 29; i >= 0; i--) {
    const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const dateStr = date.toISOString().split('T')[0];
    const count = countByDate.get(dateStr) ?? 0;

    // Label format matches original mock: "-N" for days ago, "Today" for the last one
    if (i === 0) {
      result.push({ label: 'Today', count });
    } else {
      result.push({ label: `-${i}`, count });
    }
  }

  return result;
}

/**
 * Get stubborn words: high reviewCount but low mastery.
 */
async function getStubbornWords(userId: number) {
  // First get flashcards with required fields
  const flashcardsWithData = await db
    .select({
      id: flashcards.id,
      term: vocabItems.term,
      partOfSpeech: vocabItems.partOfSpeech,
      reviewCount: flashcards.reviewCount,
      intervalDays: flashcards.intervalDays,
      state: flashcards.state,
    })
    .from(flashcards)
    .innerJoin(vocabItems, eq(flashcards.vocabItemId, vocabItems.id))
    .innerJoin(vocabLists, eq(vocabItems.listId, vocabLists.id))
    .where(eq(vocabLists.userId, userId))
    .orderBy(desc(flashcards.reviewCount));

  // Compute mastery and filter for stubborn words
  const thresholdReviewCount = 10;
  const thresholdMastery = 40;
  const validStates = ['pending', 'memorizing'] as const;

  const stubborn = flashcardsWithData
    .filter((fc) => {
      const mastery = computeMasteryLevel(fc.intervalDays, fc.state);
      return (
        fc.reviewCount >= thresholdReviewCount &&
        mastery <= thresholdMastery &&
        validStates.includes(fc.state as (typeof validStates)[number])
      );
    })
    .slice(0, 15) // Limit to 15 for UI
    .map((fc) => ({
      word: fc.term,
      partOfSpeech: fc.partOfSpeech,
      studyCount: fc.reviewCount,
      masteryLevel: computeMasteryLevel(fc.intervalDays, fc.state),
    }));

  return stubborn;
}

/**
 * Get complete library overview data for a user.
 */
export async function getLibraryOverview(userId: number) {
  const [wordStatus, dailyStudy, stubbornWords] = await Promise.all([
    getWordStatus(userId),
    getDailyStudyActivity(userId),
    getStubbornWords(userId),
  ]);

  return {
    wordStatus: wordStatus.data,
    totalWords: wordStatus.total,
    dailyStudy: dailyStudy,
    stubbornWords,
  };
}
