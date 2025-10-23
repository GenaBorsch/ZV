ALTER TABLE "story_texts" DROP CONSTRAINT "story_texts_type_text_unique";--> statement-breakpoint
ALTER TABLE "story_texts" ADD COLUMN "title" varchar(50) NOT NULL;--> statement-breakpoint
ALTER TABLE "story_texts" ADD CONSTRAINT "story_texts_type_title_unique" UNIQUE("type","title");