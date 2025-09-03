ALTER TABLE "groups" ADD COLUMN "description" text;--> statement-breakpoint
ALTER TABLE "groups" ADD COLUMN "max_members" integer DEFAULT 4 NOT NULL;--> statement-breakpoint
ALTER TABLE "groups" ADD COLUMN "is_recruiting" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "groups" ADD COLUMN "referral_code" varchar(36);--> statement-breakpoint
ALTER TABLE "groups" ADD COLUMN "format" "game_format" DEFAULT 'ONLINE' NOT NULL;--> statement-breakpoint
ALTER TABLE "groups" ADD COLUMN "place" varchar(200);--> statement-breakpoint
ALTER TABLE "groups" ADD COLUMN "created_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "groups" ADD COLUMN "updated_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "groups" ADD CONSTRAINT "groups_referral_code_unique" UNIQUE("referral_code");