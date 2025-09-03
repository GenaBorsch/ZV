CREATE TYPE "public"."rpg_experience" AS ENUM('NOVICE', 'INTERMEDIATE', 'VETERAN');--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "rpg_experience" "rpg_experience";--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "contacts" varchar(255);