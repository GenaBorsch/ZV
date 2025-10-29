CREATE TABLE IF NOT EXISTS "wiki_articles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"section_id" uuid NOT NULL,
	"title" varchar(200) NOT NULL,
	"slug" varchar(200) NOT NULL,
	"content_md" text NOT NULL,
	"min_role" "role" DEFAULT 'MASTER' NOT NULL,
	"author_user_id" uuid,
	"updated_by_user_id" uuid,
	"last_updated_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "wiki_articles_section_id_slug_unique" UNIQUE("section_id","slug")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "wiki_comments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"article_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"body" varchar(2000) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "wiki_sections" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"parent_id" uuid,
	"title" varchar(200) NOT NULL,
	"slug" varchar(200) NOT NULL,
	"order_index" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "wiki_sections_parent_id_slug_unique" UNIQUE("parent_id","slug")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "wiki_articles" ADD CONSTRAINT "wiki_articles_section_id_wiki_sections_id_fk" FOREIGN KEY ("section_id") REFERENCES "public"."wiki_sections"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "wiki_articles" ADD CONSTRAINT "wiki_articles_author_user_id_users_id_fk" FOREIGN KEY ("author_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "wiki_articles" ADD CONSTRAINT "wiki_articles_updated_by_user_id_users_id_fk" FOREIGN KEY ("updated_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "wiki_comments" ADD CONSTRAINT "wiki_comments_article_id_wiki_articles_id_fk" FOREIGN KEY ("article_id") REFERENCES "public"."wiki_articles"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "wiki_comments" ADD CONSTRAINT "wiki_comments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "wiki_sections" ADD CONSTRAINT "wiki_sections_parent_id_wiki_sections_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."wiki_sections"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
