ALTER TABLE "characters" ALTER COLUMN "archetype" SET DATA TYPE varchar(100);--> statement-breakpoint
ALTER TABLE "characters" ADD COLUMN "level" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "characters" ADD COLUMN "avatar_url" varchar(512);--> statement-breakpoint
ALTER TABLE "characters" ADD COLUMN "backstory" text;--> statement-breakpoint
ALTER TABLE "characters" ADD COLUMN "journal" text;--> statement-breakpoint
ALTER TABLE "characters" ADD COLUMN "is_alive" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "characters" ADD COLUMN "death_date" varchar(10);--> statement-breakpoint
ALTER TABLE "characters" ADD COLUMN "updated_by" uuid;--> statement-breakpoint
ALTER TABLE "characters" ADD COLUMN "created_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "characters" ADD COLUMN "updated_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "characters" ADD CONSTRAINT "characters_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "group_members" ADD CONSTRAINT "group_members_character_id_characters_id_fk" FOREIGN KEY ("character_id") REFERENCES "public"."characters"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
