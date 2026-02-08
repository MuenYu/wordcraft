ALTER TABLE "vocab_items" ADD COLUMN "normalized_term" varchar(255);
--> statement-breakpoint

UPDATE "vocab_items"
SET "normalized_term" = lower(trim("term"::text))
WHERE "normalized_term" IS NULL;
--> statement-breakpoint

ALTER TABLE "vocab_items" ALTER COLUMN "normalized_term" SET NOT NULL;
--> statement-breakpoint

ALTER TABLE "vocab_items" DROP CONSTRAINT IF EXISTS "vocab_items_list_term_idx";
--> statement-breakpoint

CREATE UNIQUE INDEX IF NOT EXISTS "vocab_items_list_normalized_term_idx" ON "vocab_items" ("list_id", "normalized_term");
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "vocab_imports" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"list_id" integer,
	"status" varchar(20) DEFAULT 'queued' NOT NULL,
	"source" varchar(20) DEFAULT 'csv' NOT NULL,
	"original_filename" varchar(255) NOT NULL,
	"idempotency_key" varchar(120),
	"payload" jsonb,
	"total_count" integer DEFAULT 0 NOT NULL,
	"inserted_count" integer DEFAULT 0 NOT NULL,
	"duplicate_count" integer DEFAULT 0 NOT NULL,
	"invalid_count" integer DEFAULT 0 NOT NULL,
	"error_summary" jsonb,
	"last_error" text,
	"started_at" timestamp,
	"finished_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "vocab_imports_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action,
	CONSTRAINT "vocab_imports_list_id_vocab_lists_id_fk" FOREIGN KEY ("list_id") REFERENCES "public"."vocab_lists"("id") ON DELETE set null ON UPDATE no action
);
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "vocab_imports_user_created_idx" ON "vocab_imports" ("user_id", "created_at");
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "vocab_imports_status_created_idx" ON "vocab_imports" ("status", "created_at");
--> statement-breakpoint

CREATE UNIQUE INDEX IF NOT EXISTS "vocab_imports_user_idempotency_idx"
ON "vocab_imports" ("user_id", "idempotency_key")
WHERE "idempotency_key" IS NOT NULL;
