import { NextResponse } from 'next/server';
import { db, seasons } from '@zv/db';

export async function GET() {
  try {
    const allSeasons = await db.select().from(seasons).limit(10);
    
    return NextResponse.json({
      seasons: allSeasons,
      count: allSeasons.length
    });

  } catch (error: any) {
    console.error('❌ Get seasons error:', error);
    return NextResponse.json({ error: 'Internal server error', message: error.message }, { status: 500 });
  }
}


