import { db } from '../index';
import { 
  wikiSections, 
  wikiArticles, 
  wikiComments, 
  users,
  eq, 
  and, 
  or, 
  desc, 
  asc, 
  sql, 
  count,
  isNull,
  like,
  ilike
} from '../index';
import type { 
  WikiSection, 
  NewWikiSection, 
  WikiArticle, 
  NewWikiArticle, 
  WikiComment, 
  NewWikiComment 
} from '../schema';

// === РАЗДЕЛЫ ВИКИ ===

export class WikiSectionsRepo {
  // Получить дерево разделов
  static async getSectionsTree(): Promise<WikiSection[]> {
    const sections = await db
      .select()
      .from(wikiSections)
      .orderBy(asc(wikiSections.orderIndex), asc(wikiSections.title));

    // Строим иерархию
    const sectionMap = new Map<string, WikiSection & { children: WikiSection[] }>();
    const rootSections: (WikiSection & { children: WikiSection[] })[] = [];

    // Инициализируем все разделы
    sections.forEach(section => {
      sectionMap.set(section.id, { ...section, children: [] });
    });

    // Строим дерево
    sections.forEach(section => {
      const sectionWithChildren = sectionMap.get(section.id)!;
      if (section.parentId) {
        const parent = sectionMap.get(section.parentId);
        if (parent) {
          parent.children.push(sectionWithChildren);
        }
      } else {
        rootSections.push(sectionWithChildren);
      }
    });

    return rootSections;
  }

  // Получить раздел по ID
  static async getSectionById(id: string): Promise<WikiSection | null> {
    const result = await db
      .select()
      .from(wikiSections)
      .where(eq(wikiSections.id, id))
      .limit(1);

    return result[0] || null;
  }

  // Получить раздел по slug и родительскому ID
  static async getSectionBySlug(slug: string, parentId?: string | null): Promise<WikiSection | null> {
    const result = await db
      .select()
      .from(wikiSections)
      .where(
        and(
          eq(wikiSections.slug, slug),
          parentId ? eq(wikiSections.parentId, parentId) : isNull(wikiSections.parentId)
        )
      )
      .limit(1);

    return result[0] || null;
  }

  // Создать раздел
  static async createSection(data: NewWikiSection): Promise<WikiSection> {
    const result = await db
      .insert(wikiSections)
      .values({
        ...data,
        updatedAt: new Date(),
      })
      .returning();

    return result[0];
  }

  // Обновить раздел
  static async updateSection(id: string, data: Partial<NewWikiSection>): Promise<WikiSection | null> {
    const result = await db
      .update(wikiSections)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(wikiSections.id, id))
      .returning();

    return result[0] || null;
  }

  // Удалить раздел
  static async deleteSection(id: string): Promise<boolean> {
    const result = await db
      .delete(wikiSections)
      .where(eq(wikiSections.id, id));

    return result.rowCount > 0;
  }

  // Получить количество статей в разделе
  static async getArticlesCount(sectionId: string): Promise<number> {
    const result = await db
      .select({ count: count() })
      .from(wikiArticles)
      .where(eq(wikiArticles.sectionId, sectionId));

    return result[0]?.count || 0;
  }
}

// === СТАТЬИ ВИКИ ===

export class WikiArticlesRepo {
  // Получить статью по ID с деталями
  static async getArticleById(id: string): Promise<WikiArticle | null> {
    const result = await db
      .select({
        article: wikiArticles,
        section: {
          id: wikiSections.id,
          title: wikiSections.title,
          slug: wikiSections.slug,
        },
        author: {
          id: users.id,
          name: users.name,
          email: users.email,
        },
      })
      .from(wikiArticles)
      .leftJoin(wikiSections, eq(wikiArticles.sectionId, wikiSections.id))
      .leftJoin(users, eq(wikiArticles.authorUserId, users.id))
      .where(eq(wikiArticles.id, id))
      .limit(1);

    if (!result[0]) return null;

    return {
      ...result[0].article,
      section: result[0].section,
      author: result[0].author,
    };
  }

  // Получить статью по slug и разделу
  static async getArticleBySlug(sectionId: string, slug: string, userRoles: string[] = []): Promise<WikiArticle | null> {
    // Определяем минимальный уровень доступа пользователя
    const roleHierarchy = ['PLAYER', 'MASTER', 'MODERATOR', 'SUPERADMIN'];
    const maxUserRole = userRoles.reduce((max, role) => {
      const roleIndex = roleHierarchy.indexOf(role);
      const maxIndex = roleHierarchy.indexOf(max);
      return roleIndex > maxIndex ? role : max;
    }, 'PLAYER');

    const maxRoleIndex = roleHierarchy.indexOf(maxUserRole);

    const result = await db
      .select({
        article: wikiArticles,
        section: {
          id: wikiSections.id,
          title: wikiSections.title,
          slug: wikiSections.slug,
        },
        author: {
          id: users.id,
          name: users.name,
          email: users.email,
        },
      })
      .from(wikiArticles)
      .leftJoin(wikiSections, eq(wikiArticles.sectionId, wikiSections.id))
      .leftJoin(users, eq(wikiArticles.authorUserId, users.id))
      .where(
        and(
          eq(wikiArticles.sectionId, sectionId),
          eq(wikiArticles.slug, slug)
        )
      )
      .limit(1);

    if (!result[0]) return null;

    return {
      ...result[0].article,
      section: result[0].section,
      author: result[0].author,
    };
  }

  // Получить список статей раздела
  static async getArticlesBySection(sectionId: string, userRoles: string[] = []): Promise<WikiArticle[]> {
    // Временно упрощаем - возвращаем все статьи раздела для отладки
    const result = await db
      .select({
        id: wikiArticles.id,
        sectionId: wikiArticles.sectionId,
        title: wikiArticles.title,
        slug: wikiArticles.slug,
        minRole: wikiArticles.minRole,
        lastUpdatedAt: wikiArticles.lastUpdatedAt,
        createdAt: wikiArticles.createdAt,
      })
      .from(wikiArticles)
      .where(eq(wikiArticles.sectionId, sectionId))
      .orderBy(asc(wikiArticles.title));

    return result;
  }

  // Создать статью
  static async createArticle(data: NewWikiArticle, userId: string): Promise<WikiArticle> {
    const result = await db
      .insert(wikiArticles)
      .values({
        ...data,
        authorUserId: userId,
        updatedByUserId: userId,
        lastUpdatedAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    return result[0];
  }

  // Обновить статью
  static async updateArticle(id: string, data: Partial<NewWikiArticle>, userId: string): Promise<WikiArticle | null> {
    const result = await db
      .update(wikiArticles)
      .set({
        ...data,
        updatedByUserId: userId,
        lastUpdatedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(wikiArticles.id, id))
      .returning();

    return result[0] || null;
  }

  // Удалить статью
  static async deleteArticle(id: string): Promise<boolean> {
    const result = await db
      .delete(wikiArticles)
      .where(eq(wikiArticles.id, id));

    return result.rowCount > 0;
  }

  // Поиск статей (упрощенная версия без полнотекстового поиска)
  static async searchArticles(
    query: string,
    userRoles: string[] = [],
    options: { page?: number; limit?: number; sectionId?: string } = {}
  ): Promise<{ articles: any[]; total: number }> {
    const { page = 1, limit = 20, sectionId } = options;
    const offset = (page - 1) * limit;

    // Упрощенный поиск по заголовку и содержимому
    const searchPattern = `%${query.toLowerCase()}%`;
    
    let whereConditions = [
      or(
        ilike(wikiArticles.title, searchPattern),
        ilike(wikiArticles.contentMd, searchPattern)
      )
    ];

    if (sectionId) {
      whereConditions.push(eq(wikiArticles.sectionId, sectionId));
    }

    // Получаем результаты
    const results = await db
      .select({
        id: wikiArticles.id,
        title: wikiArticles.title,
        slug: wikiArticles.slug,
        sectionId: wikiArticles.sectionId,
        sectionTitle: wikiSections.title,
        minRole: wikiArticles.minRole,
        lastUpdatedAt: wikiArticles.lastUpdatedAt,
        snippet: sql<string>`SUBSTRING(${wikiArticles.contentMd}, 1, 200)`, // Простой snippet
      })
      .from(wikiArticles)
      .leftJoin(wikiSections, eq(wikiArticles.sectionId, wikiSections.id))
      .where(and(...whereConditions))
      .orderBy(wikiArticles.title)
      .limit(limit)
      .offset(offset);

    // Получаем общее количество
    const totalResult = await db
      .select({ count: count() })
      .from(wikiArticles)
      .leftJoin(wikiSections, eq(wikiArticles.sectionId, wikiSections.id))
      .where(and(...whereConditions));

    return {
      articles: results,
      total: totalResult[0]?.count || 0,
    };
  }
}

// === КОММЕНТАРИИ ===

export class WikiCommentsRepo {
  // Получить комментарии к статье
  static async getCommentsByArticle(articleId: string): Promise<any[]> {
    const result = await db
      .select({
        id: wikiComments.id,
        articleId: wikiComments.articleId,
        userId: wikiComments.userId,
        body: wikiComments.body,
        createdAt: wikiComments.createdAt,
        user: {
          id: users.id,
          name: users.name,
          email: users.email,
          avatarUrl: users.avatarUrl,
        },
      })
      .from(wikiComments)
      .leftJoin(users, eq(wikiComments.userId, users.id))
      .where(eq(wikiComments.articleId, articleId))
      .orderBy(asc(wikiComments.createdAt));

    return result;
  }

  // Создать комментарий
  static async createComment(data: NewWikiComment): Promise<WikiComment> {
    const result = await db
      .insert(wikiComments)
      .values(data)
      .returning();

    return result[0];
  }

  // Удалить комментарий
  static async deleteComment(id: string): Promise<boolean> {
    const result = await db
      .delete(wikiComments)
      .where(eq(wikiComments.id, id));

    return result.rowCount > 0;
  }

  // Получить количество комментариев к статье
  static async getCommentsCount(articleId: string): Promise<number> {
    const result = await db
      .select({ count: count() })
      .from(wikiComments)
      .where(eq(wikiComments.articleId, articleId));

    return result[0]?.count || 0;
  }
}

// Экспорт всех репозиториев
export const wikiRepo = {
  sections: WikiSectionsRepo,
  articles: WikiArticlesRepo,
  comments: WikiCommentsRepo,
};
