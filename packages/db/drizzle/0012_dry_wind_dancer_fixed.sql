-- Добавляем колонку title как nullable
ALTER TABLE "story_texts" ADD COLUMN "title" varchar(50);

-- Заполняем title на основе text
UPDATE "story_texts" SET "title" = CASE 
  WHEN LENGTH("text") <= 50 THEN "text"
  ELSE LEFT("text", 50)
END;

-- Делаем колонку NOT NULL
ALTER TABLE "story_texts" ALTER COLUMN "title" SET NOT NULL;

-- Удаляем старый уникальный индекс
ALTER TABLE "story_texts" DROP CONSTRAINT IF EXISTS "story_texts_type_text_unique";

-- Добавляем новый уникальный индекс
ALTER TABLE "story_texts" ADD CONSTRAINT "story_texts_type_title_unique" UNIQUE("type","title");
