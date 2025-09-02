ALTER TYPE "public"."payment_provider" ADD VALUE 'MANUAL';--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "writeoffs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"session_id" uuid NOT NULL,
	"report_id" uuid,
	"battlepass_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "writeoffs_user_id_session_id_unique" UNIQUE("user_id","session_id")
);
--> statement-breakpoint
ALTER TABLE "battlepasses" ADD COLUMN "created_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "order_items" ADD COLUMN "price_rub_at_purchase" integer;--> statement-breakpoint
ALTER TABLE "order_items" ADD COLUMN "bp_uses_total_at_purchase" integer;--> statement-breakpoint
ALTER TABLE "order_items" ADD COLUMN "product_sku_snapshot" varchar(255);--> statement-breakpoint
ALTER TABLE "order_items" ADD COLUMN "product_title_snapshot" varchar(255);--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "for_user_id" uuid;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "fulfilled_at" timestamp;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "description" text;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "bp_uses_total" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "visible" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "sort_index" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "season_required" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "archived_at" timestamp;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "created_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "updated_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "writeoffs" ADD CONSTRAINT "writeoffs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "writeoffs" ADD CONSTRAINT "writeoffs_session_id_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."sessions"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "writeoffs" ADD CONSTRAINT "writeoffs_report_id_reports_id_fk" FOREIGN KEY ("report_id") REFERENCES "public"."reports"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "writeoffs" ADD CONSTRAINT "writeoffs_battlepass_id_battlepasses_id_fk" FOREIGN KEY ("battlepass_id") REFERENCES "public"."battlepasses"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "orders" ADD CONSTRAINT "orders_for_user_id_users_id_fk" FOREIGN KEY ("for_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_provider_id_unique" UNIQUE("provider_id");