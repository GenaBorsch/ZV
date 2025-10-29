import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db, sql } from '@zv/db';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Проверяем права доступа - только админы могут выполнять миграции
    const userRoles = (session.user as any)?.roles as string[] || [];
    const isAdmin = userRoles.includes('SUPERADMIN') || userRoles.includes('MODERATOR');
    
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Недостаточно прав для выполнения миграций' },
        { status: 403 }
      );
    }

    // Применяем миграцию 0014: Создание таблиц вики
    await db.execute(sql`
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
    `);

    await db.execute(sql`
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
    `);

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "wiki_comments" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "article_id" uuid NOT NULL,
        "user_id" uuid NOT NULL,
        "body" varchar(2000) NOT NULL,
        "created_at" timestamp DEFAULT now() NOT NULL
      );
    `);

    // Добавление внешних ключей
    await db.execute(sql`
      DO $$ BEGIN
        ALTER TABLE "wiki_sections" ADD CONSTRAINT "wiki_sections_parent_id_wiki_sections_id_fk" 
        FOREIGN KEY ("parent_id") REFERENCES "public"."wiki_sections"("id") ON DELETE cascade ON UPDATE no action;
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await db.execute(sql`
      DO $$ BEGIN
        ALTER TABLE "wiki_articles" ADD CONSTRAINT "wiki_articles_section_id_wiki_sections_id_fk" 
        FOREIGN KEY ("section_id") REFERENCES "public"."wiki_sections"("id") ON DELETE cascade ON UPDATE no action;
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await db.execute(sql`
      DO $$ BEGIN
        ALTER TABLE "wiki_articles" ADD CONSTRAINT "wiki_articles_author_user_id_users_id_fk" 
        FOREIGN KEY ("author_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await db.execute(sql`
      DO $$ BEGIN
        ALTER TABLE "wiki_articles" ADD CONSTRAINT "wiki_articles_updated_by_user_id_users_id_fk" 
        FOREIGN KEY ("updated_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await db.execute(sql`
      DO $$ BEGIN
        ALTER TABLE "wiki_comments" ADD CONSTRAINT "wiki_comments_article_id_wiki_articles_id_fk" 
        FOREIGN KEY ("article_id") REFERENCES "public"."wiki_articles"("id") ON DELETE cascade ON UPDATE no action;
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await db.execute(sql`
      DO $$ BEGIN
        ALTER TABLE "wiki_comments" ADD CONSTRAINT "wiki_comments_user_id_users_id_fk" 
        FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // Миграция 0015: Добавление полнотекстового поиска
    await db.execute(sql`
      DO $$ 
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'wiki_articles' AND column_name = 'search_vector'
        ) THEN
          ALTER TABLE wiki_articles ADD COLUMN search_vector tsvector;
        END IF;
      END $$;
    `);

    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS wiki_articles_search_idx ON wiki_articles USING GIN(search_vector);
    `);

    await db.execute(sql`
      CREATE OR REPLACE FUNCTION update_wiki_article_search_vector()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.search_vector := to_tsvector('russian', 
          COALESCE(NEW.title, '') || ' ' || 
          COALESCE(regexp_replace(NEW.content_md, '\[([^\]]*)\]\([^)]*\)', '\1', 'g'), '')
        );
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);

    await db.execute(sql`
      DROP TRIGGER IF EXISTS wiki_articles_search_vector_update ON wiki_articles;
      CREATE TRIGGER wiki_articles_search_vector_update
        BEFORE INSERT OR UPDATE ON wiki_articles
        FOR EACH ROW EXECUTE FUNCTION update_wiki_article_search_vector();
    `);

    await db.execute(sql`
      UPDATE wiki_articles SET search_vector = to_tsvector('russian', 
        COALESCE(title, '') || ' ' || 
        COALESCE(regexp_replace(content_md, '\[([^\]]*)\]\([^)]*\)', '\1', 'g'), '')
      ) WHERE search_vector IS NULL;
    `);

    return NextResponse.json({ 
      success: true, 
      message: 'Миграции вики успешно применены' 
    });
  } catch (error) {
    console.error('Error applying wiki migrations:', error);
    return NextResponse.json(
      { 
        error: 'Ошибка при применении миграций',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

