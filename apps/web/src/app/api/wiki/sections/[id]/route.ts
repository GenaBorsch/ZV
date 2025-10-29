import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { wikiRepo } from '@zv/db';
import { UpdateSectionDto } from '@zv/contracts';

// PATCH /api/wiki/sections/[id] - обновить раздел (только админы)
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
        { error: 'Недостаточно прав для редактирования разделов' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const validatedData = UpdateSectionDto.parse({ ...body, id });

    // Проверяем существование раздела
    const existingSection = await wikiRepo.sections.getSectionById(id);
    if (!existingSection) {
      return NextResponse.json(
        { error: 'Раздел не найден' },
        { status: 404 }
      );
    }

    // Если изменяется slug, проверяем уникальность
    if (validatedData.slug && validatedData.slug !== existingSection.slug) {
      const duplicateSection = await wikiRepo.sections.getSectionBySlug(
        validatedData.slug,
        validatedData.parentId ?? existingSection.parentId
      );

      if (duplicateSection && duplicateSection.id !== id) {
        return NextResponse.json(
          { error: 'Раздел с таким slug уже существует в данном родительском разделе' },
          { status: 400 }
        );
      }
    }

    const updatedSection = await wikiRepo.sections.updateSection(id, validatedData);

    if (!updatedSection) {
      return NextResponse.json(
        { error: 'Не удалось обновить раздел' },
        { status: 500 }
      );
    }

    return NextResponse.json({ section: updatedSection });
  } catch (error) {
    console.error('Error updating wiki section:', error);
    
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

// DELETE /api/wiki/sections/[id] - удалить раздел (только админы)
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
        { error: 'Недостаточно прав для удаления разделов' },
        { status: 403 }
      );
    }

    // Проверяем существование раздела
    const existingSection = await wikiRepo.sections.getSectionById(id);
    if (!existingSection) {
      return NextResponse.json(
        { error: 'Раздел не найден' },
        { status: 404 }
      );
    }

    const deleted = await wikiRepo.sections.deleteSection(id);

    if (!deleted) {
      return NextResponse.json(
        { error: 'Не удалось удалить раздел' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting wiki section:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
