import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { wikiRepo } from '@zv/db';
import { SearchQueryDto } from '@zv/contracts';

// GET /api/wiki/search - поиск по статьям
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const queryParams = {
      q: searchParams.get('q') || '',
      sectionId: searchParams.get('sectionId') || undefined,
      limit: parseInt(searchParams.get('limit') || '20'),
      page: parseInt(searchParams.get('page') || '1'),
    };

    // Валидация параметров
    const validatedQuery = SearchQueryDto.parse(queryParams);

    const userRoles = (session.user as any)?.roles as string[] || [];

    const { articles, total } = await wikiRepo.articles.searchArticles(
      validatedQuery.q,
      userRoles,
      {
        page: validatedQuery.page,
        limit: validatedQuery.limit,
        sectionId: validatedQuery.sectionId,
      }
    );

    const hasMore = validatedQuery.page * validatedQuery.limit < total;

    return NextResponse.json({
      results: articles.map(article => ({
        id: article.id,
        title: article.title,
        slug: article.slug,
        sectionId: article.sectionId,
        sectionTitle: article.sectionTitle || 'Без раздела',
        snippet: article.snippet || '',
        lastUpdatedAt: article.lastUpdatedAt,
        minRole: article.minRole,
      })),
      total,
      page: validatedQuery.page,
      limit: validatedQuery.limit,
      hasMore,
    });
  } catch (error) {
    console.error('Error searching wiki articles:', error);
    
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Некорректные параметры поиска', details: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
