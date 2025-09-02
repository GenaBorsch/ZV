-- Extend products for battlepass offers
ALTER TABLE "products"
  ADD COLUMN IF NOT EXISTS "description" text,
  ADD COLUMN IF NOT EXISTS "bp_uses_total" integer DEFAULT 1 NOT NULL,
  ADD COLUMN IF NOT EXISTS "visible" boolean DEFAULT true NOT NULL,
  ADD COLUMN IF NOT EXISTS "sort_index" integer DEFAULT 0 NOT NULL,
  ADD COLUMN IF NOT EXISTS "season_required" boolean DEFAULT false NOT NULL,
  ADD COLUMN IF NOT EXISTS "archived_at" timestamp,
  ADD COLUMN IF NOT EXISTS "created_at" timestamp DEFAULT now() NOT NULL,
  ADD COLUMN IF NOT EXISTS "updated_at" timestamp DEFAULT now() NOT NULL;

-- Extend order_items with snapshot columns
ALTER TABLE "order_items"
  ADD COLUMN IF NOT EXISTS "price_rub_at_purchase" integer,
  ADD COLUMN IF NOT EXISTS "bp_uses_total_at_purchase" integer,
  ADD COLUMN IF NOT EXISTS "product_sku_snapshot" varchar(255),
  ADD COLUMN IF NOT EXISTS "product_title_snapshot" varchar(255);



