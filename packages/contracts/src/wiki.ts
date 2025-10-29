import { z } from 'zod';

// === РАЗДЕЛЫ ВИКИ ===

export const CreateSectionDto = z.object({
  parentId: z.string().uuid().nullable().optional(),
  title: z.string().min(2, 'Название должно содержать минимум 2 символа').max(200, 'Название не должно превышать 200 символов'),
  slug: z.string().min(2, 'Slug должен содержать минимум 2 символа').max(200, 'Slug не должен превышать 200 символов')
    .regex(/^[a-z0-9-]+$/, 'Slug может содержать только строчные буквы, цифры и дефисы'),
  orderIndex: z.number().int().min(0).default(0),
});

export const UpdateSectionDto = CreateSectionDto.partial().extend({
  id: z.string().uuid(),
});

// === СТАТЬИ ВИКИ ===

export const CreateArticleDto = z.object({
  sectionId: z.string().uuid(),
  title: z.string().min(2, 'Заголовок должен содержать минимум 2 символа').max(200, 'Заголовок не должен превышать 200 символов'),
  slug: z.string().min(2, 'Slug должен содержать минимум 2 символа').max(200, 'Slug не должен превышать 200 символов')
    .regex(/^[a-z0-9-]+$/, 'Slug может содержать только строчные буквы, цифры и дефисы'),
  contentMd: z.string().min(1, 'Содержимое статьи не может быть пустым'),
  minRole: z.enum(['PLAYER', 'MASTER', 'MODERATOR', 'SUPERADMIN']).default('MASTER'),
});

export const UpdateArticleDto = CreateArticleDto.partial().extend({
  id: z.string().uuid(),
});

// === ПОИСК ===

export const SearchQueryDto = z.object({
  q: z.string().min(1, 'Поисковый запрос не может быть пустым'),
  sectionId: z.string().uuid().optional(),
  limit: z.number().int().min(1).max(50).default(20),
  page: z.number().int().min(1).default(1),
});

// === КОММЕНТАРИИ ===

export const CreateCommentDto = z.object({
  articleId: z.string().uuid(),
  body: z.string().min(1, 'Комментарий не может быть пустым').max(2000, 'Комментарий не должен превышать 2000 символов'),
});

// === ТИПЫ ===

export type CreateSectionData = z.infer<typeof CreateSectionDto>;
export type UpdateSectionData = z.infer<typeof UpdateSectionDto>;
export type CreateArticleData = z.infer<typeof CreateArticleDto>;
export type UpdateArticleData = z.infer<typeof UpdateArticleDto>;
export type SearchQueryData = z.infer<typeof SearchQueryDto>;
export type CreateCommentData = z.infer<typeof CreateCommentDto>;

// === ОТВЕТЫ API ===

export interface WikiSectionWithChildren {
  id: string;
  parentId: string | null;
  title: string;
  slug: string;
  orderIndex: number;
  createdAt: string;
  updatedAt: string;
  children?: WikiSectionWithChildren[];
  articlesCount?: number;
}

export interface WikiArticleWithDetails {
  id: string;
  sectionId: string;
  title: string;
  slug: string;
  contentMd: string;
  minRole: 'PLAYER' | 'MASTER' | 'MODERATOR' | 'SUPERADMIN';
  authorUserId: string | null;
  updatedByUserId: string | null;
  lastUpdatedAt: string;
  createdAt: string;
  updatedAt: string;
  // Дополнительные поля для отображения
  section?: {
    id: string;
    title: string;
    slug: string;
  };
  author?: {
    id: string;
    name: string | null;
    email: string;
  };
  updatedBy?: {
    id: string;
    name: string | null;
    email: string;
  };
  commentsCount?: number;
}

export interface WikiCommentWithUser {
  id: string;
  articleId: string;
  userId: string;
  body: string;
  createdAt: string;
  user: {
    id: string;
    name: string | null;
    email: string;
    avatarUrl: string | null;
  };
}

export interface SearchResult {
  id: string;
  title: string;
  slug: string;
  sectionId: string;
  sectionTitle: string;
  snippet: string;
  lastUpdatedAt: string;
  minRole: 'PLAYER' | 'MASTER' | 'MODERATOR' | 'SUPERADMIN';
}

export interface SearchResponse {
  results: SearchResult[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}
