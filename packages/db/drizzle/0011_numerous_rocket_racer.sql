CREATE TYPE "public"."element_status" AS ENUM('AVAILABLE', 'LOCKED');--> statement-breakpoint
CREATE TYPE "public"."story_text_type" AS ENUM('LOCATION', 'MAIN_EVENT', 'SIDE_EVENT');--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "monsters" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" varchar(200) NOT NULL,
	"image_url" varchar(512),
	"description" text NOT NULL,
	"last_known_location" varchar(200),
	"bounty_alive" integer,
	"bounty_dead" integer,
	"status" "element_status" DEFAULT 'AVAILABLE' NOT NULL,
	"locked_by_report_id" uuid,
	"locked_by_group_id" uuid,
	"locked_at" timestamp,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "monsters_title_unique" UNIQUE("title")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "report_next_plans" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"report_id" uuid NOT NULL,
	"continued_from_report_id" uuid,
	"next_plan_text" text NOT NULL,
	"monster_id" uuid NOT NULL,
	"location_text_id" uuid NOT NULL,
	"main_event_text_id" uuid NOT NULL,
	"side_event_text_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "report_next_plans_report_id_unique" UNIQUE("report_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "story_texts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"type" "story_text_type" NOT NULL,
	"text" text NOT NULL,
	"status" "element_status" DEFAULT 'AVAILABLE' NOT NULL,
	"locked_by_report_id" uuid,
	"locked_by_group_id" uuid,
	"locked_at" timestamp,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "story_texts_type_text_unique" UNIQUE("type","text")
);
--> statement-breakpoint
ALTER TABLE "reports" ADD COLUMN "group_id" uuid;--> statement-breakpoint
UPDATE "reports" SET "group_id" = (SELECT "id" FROM "groups" LIMIT 1) WHERE "group_id" IS NULL;--> statement-breakpoint
ALTER TABLE "reports" ALTER COLUMN "group_id" SET NOT NULL;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "monsters" ADD CONSTRAINT "monsters_locked_by_report_id_reports_id_fk" FOREIGN KEY ("locked_by_report_id") REFERENCES "public"."reports"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "monsters" ADD CONSTRAINT "monsters_locked_by_group_id_groups_id_fk" FOREIGN KEY ("locked_by_group_id") REFERENCES "public"."groups"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "report_next_plans" ADD CONSTRAINT "report_next_plans_report_id_reports_id_fk" FOREIGN KEY ("report_id") REFERENCES "public"."reports"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "report_next_plans" ADD CONSTRAINT "report_next_plans_continued_from_report_id_reports_id_fk" FOREIGN KEY ("continued_from_report_id") REFERENCES "public"."reports"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "report_next_plans" ADD CONSTRAINT "report_next_plans_monster_id_monsters_id_fk" FOREIGN KEY ("monster_id") REFERENCES "public"."monsters"("id") ON DELETE restrict ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "report_next_plans" ADD CONSTRAINT "report_next_plans_location_text_id_story_texts_id_fk" FOREIGN KEY ("location_text_id") REFERENCES "public"."story_texts"("id") ON DELETE restrict ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "report_next_plans" ADD CONSTRAINT "report_next_plans_main_event_text_id_story_texts_id_fk" FOREIGN KEY ("main_event_text_id") REFERENCES "public"."story_texts"("id") ON DELETE restrict ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "report_next_plans" ADD CONSTRAINT "report_next_plans_side_event_text_id_story_texts_id_fk" FOREIGN KEY ("side_event_text_id") REFERENCES "public"."story_texts"("id") ON DELETE restrict ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "story_texts" ADD CONSTRAINT "story_texts_locked_by_report_id_reports_id_fk" FOREIGN KEY ("locked_by_report_id") REFERENCES "public"."reports"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "story_texts" ADD CONSTRAINT "story_texts_locked_by_group_id_groups_id_fk" FOREIGN KEY ("locked_by_group_id") REFERENCES "public"."groups"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "reports" ADD CONSTRAINT "reports_group_id_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."groups"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
