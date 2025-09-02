import { z } from 'zod';

// Auth DTOs
export const LoginDto = z.object({
  email: z.string().email('Некорректный email'),
});

export const RegisterDto = z.object({
  email: z.string().email('Некорректный email'),
  name: z.string().min(2, 'Имя должно содержать минимум 2 символа'),
  tel: z.string().optional(),
  tgId: z.string().optional(),
});

// Profile DTOs
export const UpdateProfileDto = z.object({
  name: z.string().min(2, 'Имя должно содержать минимум 2 символа').optional(),
  avatarUrl: z.string().url('Некорректная ссылка на аватар').optional(),
});

export const CreatePlayerProfileDto = z.object({
  nickname: z.string().min(2, 'Никнейм должен содержать минимум 2 символа').optional(),
  notes: z.string().optional(),
});

export const UpdatePlayerProfileDto = CreatePlayerProfileDto.partial();

export const CreateMasterProfileDto = z.object({
  bio: z.string().optional(),
  format: z.enum(['ONLINE', 'OFFLINE', 'MIXED']),
  location: z.string().optional(),
  clubId: z.string().optional(),
});

export const UpdateMasterProfileDto = CreateMasterProfileDto.partial();

// Character DTOs
export const CreateCharacterDto = z.object({
  name: z.string().min(2, 'Имя персонажа должно содержать минимум 2 символа'),
  archetype: z.string().optional(),
  sheetUrl: z.string().url('Некорректная ссылка на лист персонажа').optional(),
  notes: z.string().optional(),
});

export const UpdateCharacterDto = CreateCharacterDto.partial();

// Group DTOs
export const CreateGroupDto = z.object({
  name: z.string().min(3, 'Название группы должно содержать минимум 3 символа'),
  seasonId: z.string().cuid('Некорректный ID сезона'),
  clubId: z.string().cuid('Некорректный ID клуба').optional(),
});

export const UpdateGroupDto = CreateGroupDto.partial();

// Session DTOs
export const CreateSessionDto = z.object({
  groupId: z.string().cuid('Некорректный ID группы'),
  startsAt: z.string().datetime('Некорректная дата и время'),
  durationMin: z.number().min(30, 'Минимальная длительность 30 минут').max(480, 'Максимальная длительность 8 часов'),
  place: z.string().optional(),
  format: z.enum(['ONLINE', 'OFFLINE', 'MIXED']),
  isOpen: z.boolean().default(false),
  slotsTotal: z.number().min(1, 'Минимум 1 слот').max(20, 'Максимум 20 слотов'),
});

export const UpdateSessionDto = CreateSessionDto.partial();

// Enrollment DTOs
export const CreateEnrollmentDto = z.object({
  sessionId: z.string().cuid('Некорректный ID сессии'),
  characterId: z.string().cuid('Некорректный ID персонажа').optional(),
});

export const UpdateEnrollmentDto = z.object({
  status: z.enum(['PENDING', 'CONFIRMED', 'CANCELLED', 'WAITLIST']),
});

// Report DTOs
export const CreateReportDto = z.object({
  sessionId: z.string().cuid('Некорректный ID сессии'),
  summary: z.string().min(10, 'Краткое описание должно содержать минимум 10 символов'),
  highlights: z.string().optional(),
});

export const UpdateReportDto = CreateReportDto.partial();

// Rule DTOs
export const CreateRuleDto = z.object({
  title: z.string().min(3, 'Заголовок должен содержать минимум 3 символа'),
  slug: z.string().min(3, 'Slug должен содержать минимум 3 символа').regex(/^[a-z0-9-]+$/, 'Slug может содержать только латинские буквы, цифры и дефисы'),
  content: z.string().min(10, 'Содержание должно содержать минимум 10 символов'),
  version: z.string().optional(),
  published: z.boolean().default(false),
});

export const UpdateRuleDto = CreateRuleDto.partial();

// Product DTOs
export const CreateProductDto = z.object({
  sku: z.string().min(3, 'SKU должен содержать минимум 3 символа'),
  title: z.string().min(3, 'Название должно содержать минимум 3 символа'),
  type: z.enum(['BATTLEPASS', 'MERCH', 'ADDON']),
  priceRub: z.number().min(0, 'Цена не может быть отрицательной'),
  meta: z.record(z.any()).optional(),
  active: z.boolean().default(true),
});

export const UpdateProductDto = CreateProductDto.partial();

// Order DTOs
export const CreateOrderDto = z.object({
  items: z.array(z.object({
    productId: z.string().cuid('Некорректный ID товара'),
    qty: z.number().min(1, 'Количество должно быть больше 0'),
  })).min(1, 'Заказ должен содержать минимум 1 товар'),
  provider: z.enum(['YOOKASSA']),
});

// Battlepass DTOs
export const CreateBattlepassDto = z.object({
  userId: z.string().cuid('Некорректный ID пользователя'),
  kind: z.enum(['SEASON', 'FOUR', 'SINGLE']),
  seasonId: z.string().cuid('Некорректный ID сезона'),
  usesTotal: z.number().min(1, 'Общее количество использований должно быть больше 0'),
  usesLeft: z.number().min(0, 'Оставшееся количество использований не может быть отрицательным'),
});

// Club DTOs
export const CreateClubDto = z.object({
  name: z.string().min(3, 'Название клуба должно содержать минимум 3 символа'),
  address: z.string().optional(),
  contacts: z.string().optional(),
});

export const UpdateClubDto = CreateClubDto.partial();

// Export types
export type LoginDtoType = z.infer<typeof LoginDto>;
export type RegisterDtoType = z.infer<typeof RegisterDto>;
export type UpdateProfileDtoType = z.infer<typeof UpdateProfileDto>;
export type CreatePlayerProfileDtoType = z.infer<typeof CreatePlayerProfileDto>;
export type UpdatePlayerProfileDtoType = z.infer<typeof UpdatePlayerProfileDto>;
export type CreateMasterProfileDtoType = z.infer<typeof CreateMasterProfileDto>;
export type UpdateMasterProfileDtoType = z.infer<typeof UpdateMasterProfileDto>;
export type CreateCharacterDtoType = z.infer<typeof CreateCharacterDto>;
export type UpdateCharacterDtoType = z.infer<typeof UpdateCharacterDto>;
export type CreateGroupDtoType = z.infer<typeof CreateGroupDto>;
export type UpdateGroupDtoType = z.infer<typeof UpdateGroupDto>;
export type CreateSessionDtoType = z.infer<typeof CreateSessionDto>;
export type UpdateSessionDtoType = z.infer<typeof UpdateSessionDto>;
export type CreateEnrollmentDtoType = z.infer<typeof CreateEnrollmentDto>;
export type UpdateEnrollmentDtoType = z.infer<typeof UpdateEnrollmentDto>;
export type CreateReportDtoType = z.infer<typeof CreateReportDto>;
export type UpdateReportDtoType = z.infer<typeof UpdateReportDto>;
export type CreateRuleDtoType = z.infer<typeof CreateRuleDto>;
export type UpdateRuleDtoType = z.infer<typeof UpdateRuleDto>;
export type CreateProductDtoType = z.infer<typeof CreateProductDto>;
export type UpdateProductDtoType = z.infer<typeof UpdateProductDto>;
export type CreateOrderDtoType = z.infer<typeof CreateOrderDto>;
export type CreateBattlepassDtoType = z.infer<typeof CreateBattlepassDto>;
export type CreateClubDtoType = z.infer<typeof CreateClubDto>;
export type UpdateClubDtoType = z.infer<typeof UpdateClubDto>;

// Export schemas
export {
  LoginDto,
  RegisterDto,
  UpdateProfileDto,
  CreatePlayerProfileDto,
  UpdatePlayerProfileDto,
  CreateMasterProfileDto,
  UpdateMasterProfileDto,
  CreateCharacterDto,
  UpdateCharacterDto,
  CreateGroupDto,
  UpdateGroupDto,
  CreateSessionDto,
  UpdateSessionDto,
  CreateEnrollmentDto,
  UpdateEnrollmentDto,
  CreateReportDto,
  UpdateReportDto,
  CreateRuleDto,
  UpdateRuleDto,
  CreateProductDto,
  UpdateProductDto,
  CreateOrderDto,
  CreateBattlepassDto,
  CreateClubDto,
  UpdateClubDto,
};

