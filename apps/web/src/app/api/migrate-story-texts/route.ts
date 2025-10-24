import { NextRequest, NextResponse } from 'next/server';
import { db } from '@zv/db';

export async function POST(request: NextRequest) {
  try {
    console.log('Starting story_texts migration...');

    // Проверяем, существует ли колонка title
    const checkColumnQuery = `
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'story_texts' 
      AND column_name = 'title'
    `;
    
    const columnExists = await db.execute(checkColumnQuery);
    
    if (columnExists.length > 0) {
      console.log('Column title already exists');
      return NextResponse.json({ 
        success: true, 
        message: 'Column title already exists' 
      });
    }

    console.log('Column title does not exist, adding it...');

    // Добавляем колонку title как nullable
    await db.execute(`
      ALTER TABLE "story_texts" ADD COLUMN "title" varchar(50)
    `);

    console.log('Column title added successfully');

    // Заполняем title на основе text
    await db.execute(`
      UPDATE "story_texts" SET "title" = CASE 
        WHEN LENGTH("text") <= 50 THEN "text"
        ELSE LEFT("text", 50)
      END
    `);

    console.log('Title values populated successfully');

    // Делаем колонку NOT NULL
    await db.execute(`
      ALTER TABLE "story_texts" ALTER COLUMN "title" SET NOT NULL
    `);

    console.log('Column title set to NOT NULL');

    // Удаляем старый уникальный индекс если существует
    try {
      await db.execute(`
        ALTER TABLE "story_texts" DROP CONSTRAINT IF EXISTS "story_texts_type_text_unique"
      `);
      console.log('Old unique constraint dropped');
    } catch (error) {
      console.log('Old constraint did not exist or could not be dropped:', error);
    }

    // Добавляем новый уникальный индекс
    await db.execute(`
      ALTER TABLE "story_texts" ADD CONSTRAINT "story_texts_type_title_unique" UNIQUE("type","title")
    `);

    console.log('New unique constraint added');

    // Проверяем результат
    const verifyQuery = `
      SELECT COUNT(*) as count 
      FROM "story_texts" 
      WHERE "title" IS NOT NULL
    `;
    
    const result = await db.execute(verifyQuery);
    const count = result[0]?.count || 0;

    console.log(`Migration completed successfully. ${count} records updated.`);

    return NextResponse.json({ 
      success: true, 
      message: `Migration completed successfully. ${count} records updated.`,
      recordsUpdated: count
    });

  } catch (error) {
    console.error('Migration failed:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error',
      details: error
    }, { status: 500 });
  }
}
