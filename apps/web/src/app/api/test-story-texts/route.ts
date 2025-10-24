import { NextResponse } from 'next/server';
import { db, storyTexts } from '@zv/db';

export async function GET() {
  try {
    // Простая проверка подключения к базе данных и таблице story_texts
    const count = await db.select().from(storyTexts).limit(1);
    
    return NextResponse.json({ 
      success: true,
      message: 'Database connection OK',
      hasData: count.length > 0,
      count: count.length
    });
  } catch (error) {
    console.error('Database test error:', error);
    return NextResponse.json({ 
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}
