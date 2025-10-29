import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { wikiRepo } from '@zv/db';
import { CreateArticleDto } from '@zv/contracts';

// GET /api/wiki/articles - получить статью или список статей
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const sectionId = searchParams.get('sectionId');
    const slug = searchParams.get('slug');

    const userRoles = (session.user as any)?.roles as string[] || [];

    // Если указаны sectionId и slug - получаем конкретную статью
    if (sectionId && slug) {
      const article = await wikiRepo.articles.getArticleBySlug(sectionId, slug, userRoles);
      
      if (!article) {
        return NextResponse.json(
          { error: 'Статья не найдена или у вас нет прав для её просмотра' },
          { status: 404 }
        );
      }

      // Получаем комментарии к статье
      const comments = await wikiRepo.comments.getCommentsByArticle(article.id);

      return NextResponse.json({ 
        article: {
          ...article,
          commentsCount: comments.length,
        },
        comments 
      });
    }

    // Если указан только sectionId - получаем список статей раздела
    if (sectionId) {
      const articles = await wikiRepo.articles.getArticlesBySection(sectionId, userRoles);
      return NextResponse.json({ articles });
    }

    return NextResponse.json(
      { error: 'Необходимо указать sectionId или sectionId + slug' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error fetching wiki articles:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/wiki/articles - создать статью (только админы)
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Проверяем права доступа
    const userRoles = (session.user as any)?.roles as string[] || [];
    const isAdmin = userRoles.includes('SUPERADMIN') || userRoles.includes('MODERATOR');
    
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Недостаточно прав для создания статей' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const validatedData = CreateArticleDto.parse(body);

    // Проверяем существование раздела
    const section = await wikiRepo.sections.getSectionById(validatedData.sectionId);
    if (!section) {
      return NextResponse.json(
        { error: 'Раздел не найден' },
        { status: 404 }
      );
    }

    // Проверяем уникальность slug в рамках раздела
    const existingArticle = await wikiRepo.articles.getArticleBySlug(
      validatedData.sectionId,
      validatedData.slug,
      ['SUPERADMIN'] // Админский доступ для проверки
    );

    if (existingArticle) {
      return NextResponse.json(
        { error: 'Статья с таким slug уже существует в данном разделе' },
        { status: 400 }
      );
    }

    const article = await wikiRepo.articles.createArticle(validatedData, session.user.id);

    return NextResponse.json({ article }, { status: 201 });
  } catch (error) {
    console.error('Error creating wiki article:', error);
    
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Некорректные данные', details: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
