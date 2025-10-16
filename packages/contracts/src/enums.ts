// Роли пользователей
export enum UserRole {
  PLAYER = 'PLAYER',
  MASTER = 'MASTER',
  MODERATOR = 'MODERATOR',
  SUPERADMIN = 'SUPERADMIN'
}

// Форматы игр
export enum GameFormat {
  ONLINE = 'ONLINE',
  OFFLINE = 'OFFLINE',
  MIXED = 'MIXED'
}

// Статусы участников группы
export enum MemberStatus {
  ACTIVE = 'ACTIVE',
  PAUSED = 'PAUSED',
  LEFT = 'LEFT'
}

// Статусы записи на игру
export enum EnrollmentStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  CANCELLED = 'CANCELLED',
  WAITLIST = 'WAITLIST'
}

// Типы товаров
export enum ProductType {
  BATTLEPASS = 'BATTLEPASS',
  MERCH = 'MERCH',
  ADDON = 'ADDON'
}

// Статусы заказов
export enum OrderStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
  CANCELLED = 'CANCELLED',
  REFUNDED = 'REFUNDED'
}

// Платёжные провайдеры
export enum PaymentProvider {
  YOOKASSA = 'YOOKASSA'
}

// Типы баттлпассов
export enum BattlepassKind {
  SEASON = 'SEASON',
  FOUR = 'FOUR',
  SINGLE = 'SINGLE'
}

// Статусы баттлпассов
export enum BattlepassStatus {
  ACTIVE = 'ACTIVE',
  EXPIRED = 'EXPIRED',
  USED_UP = 'USED_UP'
}

// Приоритеты уведомлений
export enum NotificationPriority {
  LOW = 'LOW',
  NORMAL = 'NORMAL',
  HIGH = 'HIGH',
  URGENT = 'URGENT'
}

// Типы уведомлений
export enum NotificationType {
  EMAIL = 'EMAIL',
  TELEGRAM = 'TELEGRAM',
  PUSH = 'PUSH',
  SMS = 'SMS'
}

// Статусы отчётов мастеров
export enum ReportStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  CANCELLED = 'CANCELLED'
}

// Типы уведомлений
export enum NotificationTypeEnum {
  INFO = 'INFO',
  SUCCESS = 'SUCCESS',
  WARNING = 'WARNING',
  ERROR = 'ERROR'
}

// Типы связанных объектов в уведомлениях
export enum NotificationRelatedType {
  REPORT = 'REPORT',
  BATTLEPASS = 'BATTLEPASS',
  GROUP = 'GROUP',
  SESSION = 'SESSION'
}

// HTTP статус коды для API
export enum ApiStatusCode {
  OK = 200,
  CREATED = 201,
  NO_CONTENT = 204,
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
  CONFLICT = 409,
  UNPROCESSABLE_ENTITY = 422,
  INTERNAL_SERVER_ERROR = 500,
  SERVICE_UNAVAILABLE = 503
}

// Статусы элементов (монстры, тексты)
export enum ElementStatus {
  AVAILABLE = 'AVAILABLE',
  LOCKED = 'LOCKED'
}

// Типы текстовых элементов
export enum StoryTextType {
  LOCATION = 'LOCATION',
  MAIN_EVENT = 'MAIN_EVENT',
  SIDE_EVENT = 'SIDE_EVENT'
}

