import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { wikiRepo } from '@zv/db';
import { CreateSectionDto } from '@zv/contracts';

// GET /api/wiki/sections - получить дерево разделов
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const sections = await wikiRepo.sections.getSectionsTree();
    
    // Функция для добавления количества статей к разделу и его детям рекурсивно
    const addArticlesCount = async (section: any): Promise<any> => {
      const articlesCount = await wikiRepo.sections.getArticlesCount(section.id);
      const result = {
        ...section,
        articlesCount,
        createdAt: section.createdAt?.toISOString() || section.createdAt,
        updatedAt: section.updatedAt?.toISOString() || section.updatedAt,
      };
      
      if (section.children && section.children.length > 0) {
        result.children = await Promise.all(
          section.children.map((child: any) => addArticlesCount(child))
        );
      }
      
      return result;
    };

    // Добавляем количество статей для каждого корневого раздела
    const sectionsWithCounts = await Promise.all(
      sections.map((section) => addArticlesCount(section))
    );

    return NextResponse.json({ sections: sectionsWithCounts });
  } catch (error) {
    console.error('Error fetching wiki sections:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/wiki/sections - создать раздел (только админы)
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
        { error: 'Недостаточно прав для создания разделов' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const validatedData = CreateSectionDto.parse(body);

    // Проверяем уникальность slug в рамках родительского раздела
    const existingSection = await wikiRepo.sections.getSectionBySlug(
      validatedData.slug,
      validatedData.parentId
    );

    if (existingSection) {
      return NextResponse.json(
        { error: 'Раздел с таким slug уже существует в данном родительском разделе' },
        { status: 400 }
      );
    }

    const section = await wikiRepo.sections.createSection(validatedData);

    return NextResponse.json({ section }, { status: 201 });
  } catch (error) {
    console.error('Error creating wiki section:', error);
    
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
