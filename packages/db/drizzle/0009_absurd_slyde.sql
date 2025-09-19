ALTER TABLE "battlepasses" DROP CONSTRAINT "battlepasses_season_id_seasons_id_fk";
--> statement-breakpoint
ALTER TABLE "battlepasses" DROP COLUMN IF EXISTS "season_id";