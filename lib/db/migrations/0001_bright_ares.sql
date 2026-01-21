CREATE EXTENSION IF NOT EXISTS citext;
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "vocab_lists" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"name" varchar(120) NOT NULL,
	"source" varchar(20) NOT NULL,
	"original_filename" varchar(255),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "vocab_lists_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action
);
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "vocab_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"list_id" integer NOT NULL,
	"term" citext NOT NULL,
	"part_of_speech" varchar(32) NOT NULL,
	"definition" text NOT NULL,
	"example_sentence" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "vocab_items_list_id_vocab_lists_id_fk" FOREIGN KEY ("list_id") REFERENCES "public"."vocab_lists"("id") ON DELETE cascade ON UPDATE no action,
	CONSTRAINT "vocab_items_list_term_idx" UNIQUE("list_id","term")
);
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "flashcards" (
	"id" serial PRIMARY KEY NOT NULL,
	"vocab_item_id" integer NOT NULL,
	"state" varchar(20) DEFAULT 'pending' NOT NULL,
	"due_at" timestamp DEFAULT now() NOT NULL,
	"last_reviewed_at" timestamp,
	"interval_days" integer DEFAULT 0 NOT NULL,
	"ease_factor" numeric(4, 2) DEFAULT 2.50 NOT NULL,
	"review_count" integer DEFAULT 0 NOT NULL,
	"lapse_count" integer DEFAULT 0 NOT NULL,
	"correct_streak" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "flashcards_vocab_item_id_vocab_items_id_fk" FOREIGN KEY ("vocab_item_id") REFERENCES "public"."vocab_items"("id") ON DELETE cascade ON UPDATE no action,
	CONSTRAINT "flashcards_vocab_item_id_unique" UNIQUE("vocab_item_id")
);
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "reviews" (
	"id" serial PRIMARY KEY NOT NULL,
	"flashcard_id" integer NOT NULL,
	"result" varchar(10) NOT NULL,
	"score" integer,
	"user_input" text,
	"feedback_text" text,
	"reviewed_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "reviews_flashcard_id_flashcards_id_fk" FOREIGN KEY ("flashcard_id") REFERENCES "public"."flashcards"("id") ON DELETE cascade ON UPDATE no action
);
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "vocab_lists_user_created_idx" ON "vocab_lists" ("user_id", "created_at");
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "vocab_items_list_idx" ON "vocab_items" ("list_id");
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "flashcards_due_idx" ON "flashcards" ("due_at");
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "flashcards_state_idx" ON "flashcards" ("state");
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "reviews_flashcard_reviewed_idx" ON "reviews" ("flashcard_id", "reviewed_at");
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "reviews_reviewed_idx" ON "reviews" ("reviewed_at");
