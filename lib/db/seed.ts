import * as readline from 'readline';
import { stripe } from '../payments/stripe';
import { db } from './drizzle';
import { users, vocabLists, vocabItems, flashcards, reviews, activityLogs } from './schema';
import { sql } from 'drizzle-orm';

async function confirm(question: string): Promise<boolean> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(`${question} (y/N): `, (answer) => {
      rl.close();
      resolve(answer.toLowerCase() === 'y');
    });
  });
}

async function createStripeProducts() {
  console.warn('Creating Stripe products and prices...');

  const plusProduct = await stripe.products.create({
    name: 'Plus',
    description: 'Plus subscription plan',
  });

  await stripe.prices.create({
    product: plusProduct.id,
    unit_amount: 1200,
    currency: 'usd',
    recurring: {
      interval: 'month',
      trial_period_days: 7,
    },
  });

  console.warn('Stripe products and prices created successfully.');
}

/**
 * Truncate all tables and reset serial sequences.
 * Ensures seed is idempotent and always starts from a clean state.
 */
async function truncateAll() {
  console.warn('Truncating all tables...');
  await db.execute(
    sql`TRUNCATE TABLE "activity_logs", "reviews", "flashcards", "vocab_items", "vocab_lists", "users" RESTART IDENTITY CASCADE`,
  );
}

async function seed() {
  // Reset DB first
  await truncateAll();

  const now = new Date();
  const minutesAgo = (m: number) => new Date(now.getTime() - m * 60 * 1000);
  const hoursAgo = (h: number) => new Date(now.getTime() - h * 60 * 60 * 1000);
  const daysAgo = (d: number) => new Date(now.getTime() - d * 24 * 60 * 60 * 1000);
  const daysFromNow = (d: number) => new Date(now.getTime() + d * 24 * 60 * 60 * 1000);

  // Seed user (deterministic bcrypt hash for "admin123")
  const [user] = await db
    .insert(users)
    .values({
      email: 'test@test.com',
      passwordHash: '$2b$10$e1eT5WSbyMPL26YKMtOYeuRZZmLMPtGgRvbscsTyZIOcj0B5CryCS',
      name: 'Test User',
      createdAt: hoursAgo(2),
      updatedAt: hoursAgo(1),
    })
    .returning();

  // Seed vocab list
  const [list] = await db
    .insert(vocabLists)
    .values({
      userId: user.id,
      name: 'Starter Deck',
      source: 'manual',
      createdAt: hoursAgo(2),
      updatedAt: hoursAgo(1),
    })
    .returning();

  // Seed vocab items
  const vocabItemsData = [
    // Original 16 items
    {
      term: 'serendipity',
      partOfSpeech: 'noun',
      definition: 'The occurrence of events by chance in a happy or beneficial way',
      exampleSentence: 'Finding that rare book at the garage sale was pure serendipity.',
    },
    {
      term: 'meticulous',
      partOfSpeech: 'adjective',
      definition: 'Showing great attention to detail; very careful and precise',
      exampleSentence: 'The artist was meticulous in her brushwork.',
    },
    {
      term: 'ubiquitous',
      partOfSpeech: 'adjective',
      definition: 'Present, appearing, or found everywhere',
      exampleSentence: 'Smartphones have become ubiquitous in modern society.',
    },
    {
      term: 'ascertain',
      partOfSpeech: 'verb',
      definition: 'Find out for certain; determine definitely',
      exampleSentence: 'We need to ascertain the facts before making a decision.',
    },
    {
      term: 'alleviate',
      partOfSpeech: 'verb',
      definition: 'Make (suffering, pain, or problem) less severe',
      exampleSentence: 'The medication helped alleviate her chronic pain.',
    },
    {
      term: 'contemplate',
      partOfSpeech: 'verb',
      definition: 'Look thoughtfully for a long time at',
      exampleSentence: 'She stood contemplating the painting for several minutes.',
    },
    {
      term: 'resilient',
      partOfSpeech: 'adjective',
      definition: 'Able to withstand or recover quickly from difficult conditions',
      exampleSentence: 'Children are often more resilient than adults give them credit for.',
    },
    {
      term: 'ambiguous',
      partOfSpeech: 'adjective',
      definition: 'Open to more than one interpretation; having a double meaning',
      exampleSentence: 'The instructions were ambiguous and led to confusion.',
    },
    {
      term: 'gratify',
      partOfSpeech: 'verb',
      definition: 'Give pleasure or satisfaction to',
      exampleSentence: 'It gratified her to know that her work was appreciated.',
    },
    {
      term: 'diligent',
      partOfSpeech: 'adjective',
      definition: "Having or showing care in one's work or duties",
      exampleSentence: 'The diligent researcher double-checked all her sources.',
    },
    {
      term: 'ephemeral',
      partOfSpeech: 'adjective',
      definition: 'Lasting for a very short time',
      exampleSentence: 'Fashions are ephemeral, changing with every season.',
    },
    {
      term: 'pragmatic',
      partOfSpeech: 'adjective',
      definition: 'Dealing with things sensibly and realistically',
      exampleSentence: 'We need a pragmatic solution to this problem.',
    },
    {
      term: 'eloquent',
      partOfSpeech: 'adjective',
      definition: 'Fluent or persuasive in speaking or writing',
      exampleSentence: 'The lawyer delivered an eloquent closing argument.',
    },
    {
      term: 'concise',
      partOfSpeech: 'adjective',
      definition: 'Giving a lot of information clearly in a few words',
      exampleSentence: 'Her concise report summarized the key points perfectly.',
    },
    {
      term: 'jubilant',
      partOfSpeech: 'adjective',
      definition: 'Feeling or expressing great happiness and triumph',
      exampleSentence: "The fans were jubilant after their team's victory.",
    },
    {
      term: 'suspended',
      partOfSpeech: 'verb',
      definition: 'Hanging from something; temporarily prevented from continuing',
      exampleSentence: 'The particles were suspended in the liquid.',
    },
    // Stubborn words (high review count but low mastery - will show in "Stubborn Words" section)
    {
      term: 'ineffable',
      partOfSpeech: 'adjective',
      definition: 'Too great or extreme to be expressed in words',
      exampleSentence: 'The view from the mountain was ineffable.',
    },
    {
      term: 'pernicious',
      partOfSpeech: 'adjective',
      definition: 'Having a harmful effect, especially in a gradual or subtle way',
      exampleSentence: 'The pernicious effects of misinformation are hard to reverse.',
    },
    {
      term: 'cacophony',
      partOfSpeech: 'noun',
      definition: 'A harsh, discordant mixture of sounds',
      exampleSentence: 'The cacophony of car horns made it impossible to concentrate.',
    },
  ];

  const insertedVocabItems = await db
    .insert(vocabItems)
    .values(
      vocabItemsData.map((item) => ({
        listId: list.id,
        term: item.term,
        normalizedTerm: item.term.trim().toLowerCase().replace(/\s+/g, ' '),
        partOfSpeech: item.partOfSpeech,
        definition: item.definition,
        exampleSentence: item.exampleSentence,
        createdAt: minutesAgo(Math.floor(Math.random() * 60)),
        updatedAt: minutesAgo(Math.floor(Math.random() * 30)),
      })),
    )
    .returning();

  // Seed flashcards with realistic state distribution
  // 16 items: 7 pending, 5 memorizing, 3 matured, 1 suspended
  const flashcardsData = [
    // 7 pending
    {
      vocabItemId: insertedVocabItems[0].id,
      state: 'pending' as const,
      dueAt: daysFromNow(1),
      intervalDays: 0,
      easeFactor: '2.50',
      reviewCount: 0,
      lapseCount: 0,
      correctStreak: 0,
      lastReviewedAt: null,
    },
    {
      vocabItemId: insertedVocabItems[1].id,
      state: 'pending' as const,
      dueAt: daysFromNow(1),
      intervalDays: 0,
      easeFactor: '2.50',
      reviewCount: 0,
      lapseCount: 0,
      correctStreak: 0,
      lastReviewedAt: null,
    },
    {
      vocabItemId: insertedVocabItems[2].id,
      state: 'pending' as const,
      dueAt: hoursAgo(1), // due now (edge case)
      intervalDays: 0,
      easeFactor: '2.50',
      reviewCount: 0,
      lapseCount: 0,
      correctStreak: 0,
      lastReviewedAt: null,
    },
    {
      vocabItemId: insertedVocabItems[3].id,
      state: 'pending' as const,
      dueAt: daysFromNow(1),
      intervalDays: 0,
      easeFactor: '2.50',
      reviewCount: 0,
      lapseCount: 0,
      correctStreak: 0,
      lastReviewedAt: null,
    },
    {
      vocabItemId: insertedVocabItems[4].id,
      state: 'pending' as const,
      dueAt: daysFromNow(2),
      intervalDays: 0,
      easeFactor: '2.50',
      reviewCount: 0,
      lapseCount: 0,
      correctStreak: 0,
      lastReviewedAt: null,
    },
    {
      vocabItemId: insertedVocabItems[5].id,
      state: 'pending' as const,
      dueAt: daysFromNow(1),
      intervalDays: 0,
      easeFactor: '2.50',
      reviewCount: 0,
      lapseCount: 0,
      correctStreak: 0,
      lastReviewedAt: null,
    },
    {
      vocabItemId: insertedVocabItems[6].id,
      state: 'pending' as const,
      dueAt: hoursAgo(2), // due now (edge case)
      intervalDays: 0,
      easeFactor: '2.50',
      reviewCount: 0,
      lapseCount: 0,
      correctStreak: 0,
      lastReviewedAt: null,
    },
    // 5 memorizing
    {
      vocabItemId: insertedVocabItems[7].id,
      state: 'memorizing' as const,
      dueAt: daysFromNow(2),
      intervalDays: 3,
      easeFactor: '2.50',
      reviewCount: 3,
      lapseCount: 0,
      correctStreak: 2,
      lastReviewedAt: daysAgo(1),
    },
    {
      vocabItemId: insertedVocabItems[8].id,
      state: 'memorizing' as const,
      dueAt: hoursAgo(4), // overdue
      intervalDays: 2,
      easeFactor: '2.30',
      reviewCount: 2,
      lapseCount: 1,
      correctStreak: 0,
      lastReviewedAt: hoursAgo(8),
    },
    {
      vocabItemId: insertedVocabItems[9].id,
      state: 'memorizing' as const,
      dueAt: daysFromNow(1),
      intervalDays: 4,
      easeFactor: '2.60',
      reviewCount: 5,
      lapseCount: 0,
      correctStreak: 4,
      lastReviewedAt: hoursAgo(6),
    },
    {
      vocabItemId: insertedVocabItems[10].id,
      state: 'memorizing' as const,
      dueAt: daysFromNow(3),
      intervalDays: 5,
      easeFactor: '2.40',
      reviewCount: 4,
      lapseCount: 1,
      correctStreak: 1,
      lastReviewedAt: daysAgo(2),
    },
    {
      vocabItemId: insertedVocabItems[11].id,
      state: 'memorizing' as const,
      dueAt: hoursAgo(1), // overdue
      intervalDays: 1,
      easeFactor: '2.20',
      reviewCount: 2,
      lapseCount: 2,
      correctStreak: 0,
      lastReviewedAt: hoursAgo(12),
    },
    // 3 matured (2 overdue as per requirement)
    {
      vocabItemId: insertedVocabItems[12].id,
      state: 'matured' as const,
      dueAt: daysAgo(2), // overdue
      intervalDays: 21,
      easeFactor: '2.60',
      reviewCount: 15,
      lapseCount: 1,
      correctStreak: 8,
      lastReviewedAt: daysAgo(14),
    },
    {
      vocabItemId: insertedVocabItems[13].id,
      state: 'matured' as const,
      dueAt: hoursAgo(6), // overdue
      intervalDays: 30,
      easeFactor: '2.80',
      reviewCount: 22,
      lapseCount: 0,
      correctStreak: 12,
      lastReviewedAt: daysAgo(7),
    },
    {
      vocabItemId: insertedVocabItems[14].id,
      state: 'matured' as const,
      dueAt: daysFromNow(7), // upcoming
      intervalDays: 45,
      easeFactor: '2.70',
      reviewCount: 18,
      lapseCount: 2,
      correctStreak: 6,
      lastReviewedAt: daysAgo(3),
    },
    // 1 suspended
    {
      vocabItemId: insertedVocabItems[15].id,
      state: 'suspended' as const,
      dueAt: daysFromNow(365),
      intervalDays: 0,
      easeFactor: '2.50',
      reviewCount: 3,
      lapseCount: 2,
      correctStreak: 0,
      lastReviewedAt: daysAgo(10),
    },
    // Stubborn words (high review count but low mastery - reviewCount >= 10, mastery <= 40%)
    // intervalDays <= 3 keeps mastery at ~34% or lower, state is pending/memorizing
    {
      vocabItemId: insertedVocabItems[16].id,
      state: 'pending' as const,
      dueAt: daysFromNow(1),
      intervalDays: 3,
      easeFactor: '2.30',
      reviewCount: 12,
      lapseCount: 4,
      correctStreak: 0,
      lastReviewedAt: daysAgo(1),
    },
    {
      vocabItemId: insertedVocabItems[17].id,
      state: 'memorizing' as const,
      dueAt: hoursAgo(2),
      intervalDays: 2,
      easeFactor: '2.20',
      reviewCount: 15,
      lapseCount: 6,
      correctStreak: 1,
      lastReviewedAt: hoursAgo(6),
    },
    {
      vocabItemId: insertedVocabItems[18].id,
      state: 'pending' as const,
      dueAt: daysAgo(1),
      intervalDays: 0,
      easeFactor: '2.10',
      reviewCount: 10,
      lapseCount: 5,
      correctStreak: 0,
      lastReviewedAt: daysAgo(2),
    },
  ];

  const insertedFlashcards = await db
    .insert(flashcards)
    .values(
      flashcardsData.map((fc) => ({
        ...fc,
        createdAt: minutesAgo(Math.floor(Math.random() * 30)),
        updatedAt: minutesAgo(Math.floor(Math.random() * 10)),
      })),
    )
    .returning();

  // Seed reviews (for non-pending flashcards)
  const reviewsData = [
    // vocabItem 8 (memorizing, 3 reviews)
    { flashcardId: insertedFlashcards[7].id, result: 'pass' as const, reviewedAt: daysAgo(3) },
    { flashcardId: insertedFlashcards[7].id, result: 'pass' as const, reviewedAt: daysAgo(2) },
    { flashcardId: insertedFlashcards[7].id, result: 'pass' as const, reviewedAt: daysAgo(1) },
    // vocabItem 9 (memorizing, 2 reviews, 1 fail)
    { flashcardId: insertedFlashcards[8].id, result: 'pass' as const, reviewedAt: daysAgo(4) },
    { flashcardId: insertedFlashcards[8].id, result: 'fail' as const, reviewedAt: daysAgo(2) },
    // vocabItem 10 (memorizing, 4 reviews)
    { flashcardId: insertedFlashcards[9].id, result: 'pass' as const, reviewedAt: daysAgo(5) },
    { flashcardId: insertedFlashcards[9].id, result: 'pass' as const, reviewedAt: daysAgo(3) },
    { flashcardId: insertedFlashcards[9].id, result: 'pass' as const, reviewedAt: daysAgo(1) },
    { flashcardId: insertedFlashcards[9].id, result: 'pass' as const, reviewedAt: hoursAgo(6) },
    // vocabItem 11 (memorizing, 3 reviews, 1 fail)
    { flashcardId: insertedFlashcards[10].id, result: 'pass' as const, reviewedAt: daysAgo(6) },
    { flashcardId: insertedFlashcards[10].id, result: 'fail' as const, reviewedAt: daysAgo(4) },
    { flashcardId: insertedFlashcards[10].id, result: 'pass' as const, reviewedAt: daysAgo(2) },
    // vocabItem 12 (memorizing, 2 reviews)
    { flashcardId: insertedFlashcards[11].id, result: 'pass' as const, reviewedAt: daysAgo(7) },
    { flashcardId: insertedFlashcards[11].id, result: 'fail' as const, reviewedAt: daysAgo(3) },
    // vocabItem 13 (matured, 6 reviews)
    { flashcardId: insertedFlashcards[12].id, result: 'pass' as const, reviewedAt: daysAgo(45) },
    { flashcardId: insertedFlashcards[12].id, result: 'pass' as const, reviewedAt: daysAgo(30) },
    { flashcardId: insertedFlashcards[12].id, result: 'pass' as const, reviewedAt: daysAgo(21) },
    { flashcardId: insertedFlashcards[12].id, result: 'pass' as const, reviewedAt: daysAgo(14) },
    { flashcardId: insertedFlashcards[12].id, result: 'pass' as const, reviewedAt: daysAgo(7) },
    { flashcardId: insertedFlashcards[12].id, result: 'pass' as const, reviewedAt: daysAgo(3) },
    // vocabItem 14 (matured, 5 reviews)
    { flashcardId: insertedFlashcards[13].id, result: 'pass' as const, reviewedAt: daysAgo(60) },
    { flashcardId: insertedFlashcards[13].id, result: 'pass' as const, reviewedAt: daysAgo(45) },
    { flashcardId: insertedFlashcards[13].id, result: 'pass' as const, reviewedAt: daysAgo(30) },
    { flashcardId: insertedFlashcards[13].id, result: 'pass' as const, reviewedAt: daysAgo(14) },
    { flashcardId: insertedFlashcards[13].id, result: 'pass' as const, reviewedAt: daysAgo(7) },
    // vocabItem 15 (matured, 4 reviews)
    { flashcardId: insertedFlashcards[14].id, result: 'pass' as const, reviewedAt: daysAgo(50) },
    { flashcardId: insertedFlashcards[14].id, result: 'pass' as const, reviewedAt: daysAgo(35) },
    { flashcardId: insertedFlashcards[14].id, result: 'pass' as const, reviewedAt: daysAgo(20) },
    { flashcardId: insertedFlashcards[14].id, result: 'pass' as const, reviewedAt: daysAgo(5) },
    // Stubborn word reviews (spread across last 30 days for study activity chart)
    // vocabItem 16 - ineffable (pending, 12 reviews)
    { flashcardId: insertedFlashcards[16].id, result: 'fail' as const, reviewedAt: daysAgo(29) },
    { flashcardId: insertedFlashcards[16].id, result: 'fail' as const, reviewedAt: daysAgo(27) },
    { flashcardId: insertedFlashcards[16].id, result: 'pass' as const, reviewedAt: daysAgo(25) },
    { flashcardId: insertedFlashcards[16].id, result: 'fail' as const, reviewedAt: daysAgo(22) },
    { flashcardId: insertedFlashcards[16].id, result: 'pass' as const, reviewedAt: daysAgo(20) },
    { flashcardId: insertedFlashcards[16].id, result: 'fail' as const, reviewedAt: daysAgo(17) },
    { flashcardId: insertedFlashcards[16].id, result: 'pass' as const, reviewedAt: daysAgo(14) },
    { flashcardId: insertedFlashcards[16].id, result: 'fail' as const, reviewedAt: daysAgo(11) },
    { flashcardId: insertedFlashcards[16].id, result: 'pass' as const, reviewedAt: daysAgo(8) },
    { flashcardId: insertedFlashcards[16].id, result: 'fail' as const, reviewedAt: daysAgo(6) },
    { flashcardId: insertedFlashcards[16].id, result: 'pass' as const, reviewedAt: daysAgo(3) },
    { flashcardId: insertedFlashcards[16].id, result: 'pass' as const, reviewedAt: hoursAgo(12) },
    // vocabItem 17 - pernicious (memorizing, 15 reviews)
    { flashcardId: insertedFlashcards[17].id, result: 'fail' as const, reviewedAt: daysAgo(30) },
    { flashcardId: insertedFlashcards[17].id, result: 'fail' as const, reviewedAt: daysAgo(28) },
    { flashcardId: insertedFlashcards[17].id, result: 'fail' as const, reviewedAt: daysAgo(26) },
    { flashcardId: insertedFlashcards[17].id, result: 'pass' as const, reviewedAt: daysAgo(24) },
    { flashcardId: insertedFlashcards[17].id, result: 'fail' as const, reviewedAt: daysAgo(21) },
    { flashcardId: insertedFlashcards[17].id, result: 'pass' as const, reviewedAt: daysAgo(19) },
    { flashcardId: insertedFlashcards[17].id, result: 'fail' as const, reviewedAt: daysAgo(16) },
    { flashcardId: insertedFlashcards[17].id, result: 'fail' as const, reviewedAt: daysAgo(13) },
    { flashcardId: insertedFlashcards[17].id, result: 'pass' as const, reviewedAt: daysAgo(10) },
    { flashcardId: insertedFlashcards[17].id, result: 'fail' as const, reviewedAt: daysAgo(8) },
    { flashcardId: insertedFlashcards[17].id, result: 'pass' as const, reviewedAt: daysAgo(5) },
    { flashcardId: insertedFlashcards[17].id, result: 'fail' as const, reviewedAt: daysAgo(3) },
    { flashcardId: insertedFlashcards[17].id, result: 'pass' as const, reviewedAt: daysAgo(1) },
    { flashcardId: insertedFlashcards[17].id, result: 'fail' as const, reviewedAt: hoursAgo(18) },
    { flashcardId: insertedFlashcards[17].id, result: 'pass' as const, reviewedAt: hoursAgo(6) },
    // vocabItem 18 - cacophony (pending, 10 reviews)
    { flashcardId: insertedFlashcards[18].id, result: 'fail' as const, reviewedAt: daysAgo(28) },
    { flashcardId: insertedFlashcards[18].id, result: 'fail' as const, reviewedAt: daysAgo(25) },
    { flashcardId: insertedFlashcards[18].id, result: 'pass' as const, reviewedAt: daysAgo(22) },
    { flashcardId: insertedFlashcards[18].id, result: 'fail' as const, reviewedAt: daysAgo(19) },
    { flashcardId: insertedFlashcards[18].id, result: 'pass' as const, reviewedAt: daysAgo(15) },
    { flashcardId: insertedFlashcards[18].id, result: 'fail' as const, reviewedAt: daysAgo(12) },
    { flashcardId: insertedFlashcards[18].id, result: 'pass' as const, reviewedAt: daysAgo(9) },
    { flashcardId: insertedFlashcards[18].id, result: 'fail' as const, reviewedAt: daysAgo(6) },
    { flashcardId: insertedFlashcards[18].id, result: 'pass' as const, reviewedAt: daysAgo(3) },
    { flashcardId: insertedFlashcards[18].id, result: 'pass' as const, reviewedAt: hoursAgo(8) },
  ];

  if (reviewsData.length > 0) {
    await db.insert(reviews).values(
      reviewsData.map((r) => ({
        flashcardId: r.flashcardId,
        result: r.result,
        reviewedAt: r.reviewedAt,
      })),
    );
  }

  // Seed activity logs
  await db.insert(activityLogs).values([
    {
      userId: user.id,
      action: 'SIGN_UP',
      timestamp: hoursAgo(2),
    },
    {
      userId: user.id,
      action: 'SIGN_IN',
      timestamp: hoursAgo(1),
      ipAddress: '::1',
    },
    {
      userId: user.id,
      action: 'UPDATE_ACCOUNT',
      timestamp: minutesAgo(30),
      ipAddress: '::1',
    },
  ]);

  console.warn('Seed data inserted successfully.');
  console.warn(`- 1 user: ${user.email}`);
  console.warn(`- 1 vocab list: "${list.name}"`);
  console.warn(`- ${insertedVocabItems.length} vocab items`);
  console.warn(`- ${insertedFlashcards.length} flashcards`);
  console.warn(`- ${reviewsData.length} reviews (including stubborn words and 30-day activity)`);
  console.warn('- 3 activity logs');

  const shouldCreateStripeProducts = await confirm('Do you want to create Stripe products?');

  if (shouldCreateStripeProducts) {
    await createStripeProducts();
  } else {
    console.warn('Skipping Stripe product creation.');
  }
}

seed()
  .catch((error) => {
    console.error('Seed process failed:', error);
    process.exit(1);
  })
  .finally(() => {
    console.warn('Seed process finished. Exiting...');
    process.exit(0);
  });
