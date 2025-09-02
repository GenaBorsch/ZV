-- Add MANUAL to payment_provider enum
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t
    JOIN pg_enum e ON t.oid = e.enumtypid
    WHERE t.typname = 'payment_provider' AND e.enumlabel = 'MANUAL'
  ) THEN
    ALTER TYPE "public"."payment_provider" ADD VALUE 'MANUAL';
  END IF;
END $$;

-- Add for_user_id, fulfilled_at to orders, and unique on provider_id
ALTER TABLE "orders"
  ADD COLUMN IF NOT EXISTS "for_user_id" uuid,
  ADD COLUMN IF NOT EXISTS "fulfilled_at" timestamp;

ALTER TABLE "orders"
  ADD CONSTRAINT IF NOT EXISTS "orders_for_user_id_users_id_fk"
  FOREIGN KEY ("for_user_id") REFERENCES "public"."users"("id") ON DELETE cascade;

DO $$ BEGIN
  ALTER TABLE "orders" ADD CONSTRAINT "orders_provider_id_unique" UNIQUE("provider_id");
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Add created_at to battlepasses
ALTER TABLE "battlepasses"
  ADD COLUMN IF NOT EXISTS "created_at" timestamp DEFAULT now() NOT NULL;

-- Create writeoffs table
CREATE TABLE IF NOT EXISTS "writeoffs" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL,
  "session_id" uuid NOT NULL,
  "report_id" uuid,
  "battlepass_id" uuid NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL
);

DO $$ BEGIN
  ALTER TABLE "writeoffs" ADD CONSTRAINT "writeoffs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "writeoffs" ADD CONSTRAINT "writeoffs_session_id_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."sessions"("id") ON DELETE cascade;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "writeoffs" ADD CONSTRAINT "writeoffs_report_id_reports_id_fk" FOREIGN KEY ("report_id") REFERENCES "public"."reports"("id") ON DELETE cascade;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "writeoffs" ADD CONSTRAINT "writeoffs_battlepass_id_battlepasses_id_fk" FOREIGN KEY ("battlepass_id") REFERENCES "public"."battlepasses"("id") ON DELETE cascade;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "writeoffs" ADD CONSTRAINT "writeoffs_user_session_unique" UNIQUE ("user_id", "session_id");
EXCEPTION WHEN duplicate_object THEN NULL; END $$;


