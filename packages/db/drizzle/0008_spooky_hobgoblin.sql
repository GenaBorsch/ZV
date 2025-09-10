CREATE TYPE "public"."report_status" AS ENUM('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED');--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"title" varchar(255) NOT NULL,
	"message" text NOT NULL,
	"type" varchar(50) DEFAULT 'INFO' NOT NULL,
	"related_type" varchar(50),
	"related_id" uuid,
	"is_read" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "report_players" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"report_id" uuid NOT NULL,
	"player_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "report_players_report_id_player_id_unique" UNIQUE("report_id","player_id")
);
--> statement-breakpoint
ALTER TABLE "reports" DROP CONSTRAINT "reports_session_id_unique";--> statement-breakpoint
ALTER TABLE "writeoffs" DROP CONSTRAINT "writeoffs_user_id_session_id_unique";--> statement-breakpoint
ALTER TABLE "reports" DROP CONSTRAINT "reports_master_id_master_profiles_id_fk";
--> statement-breakpoint
ALTER TABLE "reports" ALTER COLUMN "session_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "writeoffs" ALTER COLUMN "session_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "reports" ADD COLUMN "description" text NOT NULL;--> statement-breakpoint
ALTER TABLE "reports" ADD COLUMN "status" "report_status" DEFAULT 'PENDING' NOT NULL;--> statement-breakpoint
ALTER TABLE "reports" ADD COLUMN "rejection_reason" text;--> statement-breakpoint
ALTER TABLE "reports" ADD COLUMN "attachments" json;--> statement-breakpoint
ALTER TABLE "reports" ADD COLUMN "updated_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "report_players" ADD CONSTRAINT "report_players_report_id_reports_id_fk" FOREIGN KEY ("report_id") REFERENCES "public"."reports"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "report_players" ADD CONSTRAINT "report_players_player_id_users_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "reports" ADD CONSTRAINT "reports_master_id_users_id_fk" FOREIGN KEY ("master_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
ALTER TABLE "writeoffs" ADD CONSTRAINT "writeoffs_user_id_report_id_unique" UNIQUE("user_id","report_id");