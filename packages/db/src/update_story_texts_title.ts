/**
 * Скрипт для обновления существующих записей story_texts с добавлением поля title
 * Запуск: DATABASE_URL="..." pnpm tsx packages/db/src/update_story_texts_title.ts
 */

import { db } from './index';
import { storyTexts } from './schema';
import { eq } from 'drizzle-orm';

async function updateStoryTextsTitle() {
  console.log('🔄 Обновление существующих записей story_texts с добавлением поля title...');

  // Функция для создания заголовка из текста
  const createTitle = (text: string): string => {
    // Берем первые 50 символов и обрезаем по последнему слову
    const truncated = text.substring(0, 50);
    const lastSpace = truncated.lastIndexOf(' ');
    return lastSpace > 20 ? truncated.substring(0, lastSpace) : truncated;
  };

  try {
    // Получаем все записи без title (если поле пустое)
    const records = await db
      .select()
      .from(storyTexts)
      .where(eq(storyTexts.title, ''));

    console.log(`📝 Найдено ${records.length} записей для обновления`);

    // Обновляем каждую запись
    for (const record of records) {
      const title = createTitle(record.text);
      
      await db
        .update(storyTexts)
        .set({ 
          title,
          updatedAt: new Date()
        })
        .where(eq(storyTexts.id, record.id));
      
      console.log(`✅ Обновлена запись ${record.id}: "${title}"`);
    }

    console.log('🎉 Все записи успешно обновлены!');
  } catch (error) {
    console.error('❌ Ошибка при обновлении записей:', error);
    throw error;
  }
}

updateStoryTextsTitle()
  .catch((error) => {
    console.error('❌ Критическая ошибка:', error);
    process.exit(1);
  });

