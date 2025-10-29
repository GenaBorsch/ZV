import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { wikiRepo } from '@zv/db';
import { UpdateArticleDto } from '@zv/contracts';

// PATCH /api/wiki/articles/[id] - обновить статью (только админы)
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Проверяем права доступа
    const userRoles = (session.user as any)?.roles as string[] || [];
    const isAdmin = userRoles.includes('SUPERADMIN') || userRoles.includes('MODERATOR');
    
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Недостаточно прав для редактирования статей' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const validatedData = UpdateArticleDto.parse({ ...body, id });

    // Проверяем существование статьи
    const existingArticle = await wikiRepo.articles.getArticleById(id);
    if (!existingArticle) {
      return NextResponse.json(
        { error: 'Статья не найдена' },
        { status: 404 }
      );
    }

    // Если изменяется slug или sectionId, проверяем уникальность
    const newSectionId = validatedData.sectionId ?? existingArticle.sectionId;
    const newSlug = validatedData.slug ?? existingArticle.slug;

    if (
      (validatedData.slug && validatedData.slug !== existingArticle.slug) ||
      (validatedData.sectionId && validatedData.sectionId !== existingArticle.sectionId)
    ) {
      const duplicateArticle = await wikiRepo.articles.getArticleBySlug(
        newSectionId,
        newSlug,
        ['SUPERADMIN'] // Админский доступ для проверки
      );

      if (duplicateArticle && duplicateArticle.id !== id) {
        return NextResponse.json(
          { error: 'Статья с таким slug уже существует в данном разделе' },
          { status: 400 }
        );
      }
    }

    // Если изменяется раздел, проверяем его существование
    if (validatedData.sectionId && validatedData.sectionId !== existingArticle.sectionId) {
      const section = await wikiRepo.sections.getSectionById(validatedData.sectionId);
      if (!section) {
        return NextResponse.json(
          { error: 'Новый раздел не найден' },
          { status: 404 }
        );
      }
    }

    const updatedArticle = await wikiRepo.articles.updateArticle(id, validatedData, session.user.id);

    if (!updatedArticle) {
      return NextResponse.json(
        { error: 'Не удалось обновить статью' },
        { status: 500 }
      );
    }

    return NextResponse.json({ article: updatedArticle });
  } catch (error) {
    console.error('Error updating wiki article:', error);
    
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

// DELETE /api/wiki/articles/[id] - удалить статью (только админы)
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Проверяем права доступа
    const userRoles = (session.user as any)?.roles as string[] || [];
    const isAdmin = userRoles.includes('SUPERADMIN') || userRoles.includes('MODERATOR');
    
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Недостаточно прав для удаления статей' },
        { status: 403 }
      );
    }

    // Проверяем существование статьи
    const existingArticle = await wikiRepo.articles.getArticleById(id);
    if (!existingArticle) {
      return NextResponse.json(
        { error: 'Статья не найдена' },
        { status: 404 }
      );
    }

    const deleted = await wikiRepo.articles.deleteArticle(id);

    if (!deleted) {
      return NextResponse.json(
        { error: 'Не удалось удалить статью' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting wiki article:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
