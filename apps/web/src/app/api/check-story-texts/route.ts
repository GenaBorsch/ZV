import { NextRequest, NextResponse } from 'next/server';
import { db } from '@zv/db';

export async function GET(request: NextRequest) {
  try {
    console.log('Checking story_texts table status...');

    // Проверяем, существует ли колонка title
    const checkColumnQuery = `
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'story_texts' 
      AND column_name = 'title'
    `;
    
    const columnResult = await db.execute(checkColumnQuery);
    const hasTitleColumn = columnResult.length > 0;

    // Получаем количество записей
    const countQuery = `SELECT COUNT(*) as count FROM "story_texts"`;
    const countResult = await db.execute(countQuery);
    const recordCount = countResult[0]?.count || 0;

    // Получаем примеры данных
    let sampleData = null;
    if (hasTitleColumn) {
      const sampleQuery = `SELECT "id", "type", "title", "text" FROM "story_texts" LIMIT 3`;
      const sampleResult = await db.execute(sampleQuery);
      sampleData = sampleResult;
    } else {
      const sampleQuery = `SELECT "id", "type", "text" FROM "story_texts" LIMIT 3`;
      const sampleResult = await db.execute(sampleQuery);
      sampleData = sampleResult;
    }

    console.log(`Table status: hasTitleColumn=${hasTitleColumn}, recordCount=${recordCount}`);

    return NextResponse.json({ 
      success: true,
      hasTitleColumn,
      recordCount: Number(recordCount),
      sampleData,
      message: hasTitleColumn 
        ? 'Колонка title существует' 
        : 'Колонка title отсутствует - требуется миграция'
    });

  } catch (error) {
    console.error('Status check failed:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error',
      details: error
    }, { status: 500 });
  }
}
