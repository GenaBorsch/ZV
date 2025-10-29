-- Добавляем полнотекстовый поиск для статей вики
ALTER TABLE wiki_articles ADD COLUMN search_vector tsvector;

-- Создаем индекс для полнотекстового поиска
CREATE INDEX wiki_articles_search_idx ON wiki_articles USING GIN(search_vector);

-- Функция для обновления search_vector
CREATE OR REPLACE FUNCTION update_wiki_article_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector := to_tsvector('russian', 
    COALESCE(NEW.title, '') || ' ' || 
    COALESCE(regexp_replace(NEW.content_md, '\[([^\]]*)\]\([^)]*\)', '\1', 'g'), '') -- убираем markdown ссылки
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Триггер для автоматического обновления search_vector
CREATE TRIGGER wiki_articles_search_vector_update
  BEFORE INSERT OR UPDATE ON wiki_articles
  FOR EACH ROW EXECUTE FUNCTION update_wiki_article_search_vector();

-- Обновляем существующие записи (если есть)
UPDATE wiki_articles SET search_vector = to_tsvector('russian', 
  COALESCE(title, '') || ' ' || 
  COALESCE(regexp_replace(content_md, '\[([^\]]*)\]\([^)]*\)', '\1', 'g'), '')
);
