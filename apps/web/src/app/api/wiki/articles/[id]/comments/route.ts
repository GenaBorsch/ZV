import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { wikiRepo } from '@zv/db';
import { CreateCommentDto } from '@zv/contracts';

// GET /api/wiki/articles/[id]/comments - получить комментарии к статье
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Проверяем существование статьи и права доступа к ней
    const userRoles = (session.user as any)?.roles as string[] || [];
    const article = await wikiRepo.articles.getArticleById(id);
    
    if (!article) {
      return NextResponse.json(
        { error: 'Статья не найдена' },
        { status: 404 }
      );
    }

    // Проверяем права доступа к статье
    const roleHierarchy = ['PLAYER', 'MASTER', 'MODERATOR', 'SUPERADMIN'];
    const maxUserRole = userRoles.reduce((max, role) => {
      const roleIndex = roleHierarchy.indexOf(role);
      const maxIndex = roleHierarchy.indexOf(max);
      return roleIndex > maxIndex ? role : max;
    }, 'PLAYER');

    const userRoleIndex = roleHierarchy.indexOf(maxUserRole);
    const articleRoleIndex = roleHierarchy.indexOf(article.minRole);

    if (userRoleIndex < articleRoleIndex) {
      return NextResponse.json(
        { error: 'У вас нет прав для просмотра этой статьи' },
        { status: 403 }
      );
    }

    const comments = await wikiRepo.comments.getCommentsByArticle(id);

    return NextResponse.json({ comments });
  } catch (error) {
    console.error('Error fetching wiki comments:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/wiki/articles/[id]/comments - создать комментарий
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const validatedData = CreateCommentDto.parse({ ...body, articleId: id });

    // Проверяем существование статьи и права доступа к ней
    const userRoles = (session.user as any)?.roles as string[] || [];
    const article = await wikiRepo.articles.getArticleById(id);
    
    if (!article) {
      return NextResponse.json(
        { error: 'Статья не найдена' },
        { status: 404 }
      );
    }

    // Проверяем права доступа к статье
    const roleHierarchy = ['PLAYER', 'MASTER', 'MODERATOR', 'SUPERADMIN'];
    const maxUserRole = userRoles.reduce((max, role) => {
      const roleIndex = roleHierarchy.indexOf(role);
      const maxIndex = roleHierarchy.indexOf(max);
      return roleIndex > maxIndex ? role : max;
    }, 'PLAYER');

    const userRoleIndex = roleHierarchy.indexOf(maxUserRole);
    const articleRoleIndex = roleHierarchy.indexOf(article.minRole);

    if (userRoleIndex < articleRoleIndex) {
      return NextResponse.json(
        { error: 'У вас нет прав для комментирования этой статьи' },
        { status: 403 }
      );
    }

    const comment = await wikiRepo.comments.createComment({
      articleId: id,
      userId: session.user.id,
      body: validatedData.body,
    });

    // Получаем комментарий с данными пользователя
    const comments = await wikiRepo.comments.getCommentsByArticle(id);
    const newComment = comments.find(c => c.id === comment.id);

    return NextResponse.json({ comment: newComment }, { status: 201 });
  } catch (error) {
    console.error('Error creating wiki comment:', error);
    
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
