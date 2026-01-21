import {
  pgTable,
  serial,
  varchar,
  text,
  timestamp,
  integer,
  numeric,
  customType,
  index,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { relations, sql } from 'drizzle-orm';

/**
 * Custom type for PostgreSQL citext extension.
 * citext provides case-insensitive text columns.
 */
const citext = customType<{
  data: string;
  driverData: string;
}>({
  dataType() {
    return 'citext';
  },
  fromDriver(value: string): string {
    return value;
  },
});

/**
 * Flashcard state enum for spaced repetition.
 */
export const flashcardStates = [
  'pending',
  'memorizing',
  'matured',
  'deep_matured',
  'suspended',
] as const;

export type FlashcardState = (typeof flashcardStates)[number];

/**
 * Vocab list source enum.
 */
export const vocabListSources = ['manual', 'csv'] as const;

export type VocabListSource = (typeof vocabListSources)[number];

/**
 * Review result enum.
 */
export const reviewResults = ['pass', 'fail'] as const;

export type ReviewResult = (typeof reviewResults)[number];

/**
 * Users table (existing).
 */
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  createdAt: timestamp('created_at', { mode: 'date' })
    .notNull()
    .default(sql`now()`),
  updatedAt: timestamp('updated_at', { mode: 'date' })
    .notNull()
    .$onUpdate(() => new Date()),
  deletedAt: timestamp('deleted_at'),
  stripeCustomerId: text('stripe_customer_id').unique(),
  stripeSubscriptionId: text('stripe_subscription_id').unique(),
  stripeProductId: text('stripe_product_id'),
  planName: varchar('plan_name', { length: 50 }),
  subscriptionStatus: varchar('subscription_status', { length: 20 }),
});

/**
 * Vocab lists table.
 * Each import creates one list/deck.
 */
export const vocabLists = pgTable(
  'vocab_lists',
  {
    id: serial('id').primaryKey(),
    userId: integer('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    name: varchar('name', { length: 120 }).notNull(),
    source: varchar('source', { length: 20 }).notNull(),
    originalFilename: varchar('original_filename', { length: 255 }),
    createdAt: timestamp('created_at', { mode: 'date' })
      .notNull()
      .default(sql`now()`),
    updatedAt: timestamp('updated_at', { mode: 'date' })
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [index('vocab_lists_user_created_idx').on(table.userId, table.createdAt)],
);

/**
 * Vocab items table.
 * Each item belongs to a list and has a case-insensitive term (citext).
 */
export const vocabItems = pgTable(
  'vocab_items',
  {
    id: serial('id').primaryKey(),
    listId: integer('list_id')
      .notNull()
      .references(() => vocabLists.id, { onDelete: 'cascade' }),
    term: citext('term').notNull(),
    partOfSpeech: varchar('part_of_speech', { length: 32 }).notNull(),
    definition: text('definition').notNull(),
    exampleSentence: text('example_sentence'),
    createdAt: timestamp('created_at', { mode: 'date' })
      .notNull()
      .default(sql`now()`),
    updatedAt: timestamp('updated_at', { mode: 'date' })
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    uniqueIndex('vocab_items_list_term_idx').on(table.listId, table.term),
    index('vocab_items_list_idx').on(table.listId),
  ],
);

/**
 * Flashcards table.
 * 1:1 with vocab items, tracks spaced repetition scheduling.
 */
export const flashcards = pgTable(
  'flashcards',
  {
    id: serial('id').primaryKey(),
    vocabItemId: integer('vocab_item_id')
      .notNull()
      .unique()
      .references(() => vocabItems.id, { onDelete: 'cascade' }),
    state: varchar('state', { length: 20 }).notNull().default('pending'),
    dueAt: timestamp('due_at', { mode: 'date' })
      .notNull()
      .default(sql`now()`),
    lastReviewedAt: timestamp('last_reviewed_at', { mode: 'date' }),
    intervalDays: integer('interval_days').notNull().default(0),
    easeFactor: numeric('ease_factor', { precision: 4, scale: 2 })
      .notNull()
      .default(sql`2.50`),
    reviewCount: integer('review_count').notNull().default(0),
    lapseCount: integer('lapse_count').notNull().default(0),
    correctStreak: integer('correct_streak').notNull().default(0),
    createdAt: timestamp('created_at', { mode: 'date' })
      .notNull()
      .default(sql`now()`),
    updatedAt: timestamp('updated_at', { mode: 'date' })
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index('flashcards_due_idx').on(table.dueAt),
    index('flashcards_state_idx').on(table.state),
  ],
);

/**
 * Reviews table (append-only event log).
 */
export const reviews = pgTable(
  'reviews',
  {
    id: serial('id').primaryKey(),
    flashcardId: integer('flashcard_id')
      .notNull()
      .references(() => flashcards.id, { onDelete: 'cascade' }),
    result: varchar('result', { length: 10 }).notNull(),
    score: integer('score'),
    userInput: text('user_input'),
    feedbackText: text('feedback_text'),
    reviewedAt: timestamp('reviewed_at', { mode: 'date' })
      .notNull()
      .default(sql`now()`),
  },
  (table) => [
    index('reviews_flashcard_reviewed_idx').on(table.flashcardId, table.reviewedAt),
    index('reviews_reviewed_idx').on(table.reviewedAt),
  ],
);

/**
 * Relations.
 */
export const usersRelations = relations(users, ({ many }) => ({
  vocabLists: many(vocabLists),
}));

export const vocabListsRelations = relations(vocabLists, ({ one, many }) => ({
  user: one(users, {
    fields: [vocabLists.userId],
    references: [users.id],
  }),
  vocabItems: many(vocabItems),
}));

export const vocabItemsRelations = relations(vocabItems, ({ one, many }) => ({
  list: one(vocabLists, {
    fields: [vocabItems.listId],
    references: [vocabLists.id],
  }),
  flashcards: many(flashcards),
}));

export const flashcardsRelations = relations(flashcards, ({ one, many }) => ({
  vocabItem: one(vocabItems, {
    fields: [flashcards.vocabItemId],
    references: [vocabItems.id],
  }),
  reviews: many(reviews),
}));

export const reviewsRelations = relations(reviews, ({ one }) => ({
  flashcard: one(flashcards, {
    fields: [reviews.flashcardId],
    references: [flashcards.id],
  }),
}));

/**
 * Types for TypeScript inference.
 */
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type VocabList = typeof vocabLists.$inferSelect;
export type NewVocabList = typeof vocabLists.$inferInsert;
export type VocabItem = typeof vocabItems.$inferSelect;
export type NewVocabItem = typeof vocabItems.$inferInsert;
export type Flashcard = typeof flashcards.$inferSelect;
export type NewFlashcard = typeof flashcards.$inferInsert;
export type Review = typeof reviews.$inferSelect;
export type NewReview = typeof reviews.$inferInsert;

/**
 * Activity logs (existing).
 */
export const activityLogs = pgTable('activity_logs', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .notNull()
    .references(() => users.id),
  action: text('action').notNull(),
  timestamp: timestamp('timestamp').notNull().defaultNow(),
  ipAddress: varchar('ip_address', { length: 45 }),
});

export const activityLogsRelations = relations(activityLogs, ({ one }) => ({
  user: one(users, {
    fields: [activityLogs.userId],
    references: [users.id],
  }),
}));

export type ActivityLog = typeof activityLogs.$inferSelect;
export type NewActivityLog = typeof activityLogs.$inferInsert;

export enum ActivityType {
  SIGN_UP = 'SIGN_UP',
  SIGN_IN = 'SIGN_IN',
  SIGN_OUT = 'SIGN_OUT',
  UPDATE_PASSWORD = 'UPDATE_PASSWORD',
  DELETE_ACCOUNT = 'DELETE_ACCOUNT',
  UPDATE_ACCOUNT = 'UPDATE_ACCOUNT',
}
