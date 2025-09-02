// События системы для событийной архитектуры

export interface BaseEvent {
  id: string;
  timestamp: string;
  type: string;
  source: string;
  version: string;
}

// События платежей
export interface PaymentPaidEvent extends BaseEvent {
  type: 'payment.paid';
  payload: {
    orderId: string;
    userId: string;
    items: Array<{
      sku: string;
      qty: number;
      priceRub: number;
    }>;
    provider: 'YOOKASSA';
    totalRub: number;
  };
}

export interface PaymentFailedEvent extends BaseEvent {
  type: 'payment.failed';
  payload: {
    orderId: string;
    userId: string;
    reason: string;
  };
}

// События записи на игры
export interface EnrollmentConfirmedEvent extends BaseEvent {
  type: 'enrollment.confirmed';
  payload: {
    enrollmentId: string;
    sessionId: string;
    playerId: string;
    masterid: string;
  };
}

export interface EnrollmentCancelledEvent extends BaseEvent {
  type: 'enrollment.cancelled';
  payload: {
    enrollmentId: string;
    sessionId: string;
    playerId: string;
    reason?: string;
  };
}

// События отчётов
export interface ReportSubmittedEvent extends BaseEvent {
  type: 'report.submitted';
  payload: {
    reportId: string;
    sessionId: string;
    masterId: string;
    groupId: string;
  };
}

// События пользователей
export interface UserRegisteredEvent extends BaseEvent {
  type: 'user.registered';
  payload: {
    userId: string;
    email: string;
    roles: string[];
  };
}

export interface UserRoleChangedEvent extends BaseEvent {
  type: 'user.role.changed';
  payload: {
    userId: string;
    oldRoles: string[];
    newRoles: string[];
  };
}

// События баттлпассов
export interface BattlepassActivatedEvent extends BaseEvent {
  type: 'battlepass.activated';
  payload: {
    battlepassId: string;
    userId: string;
    kind: 'SEASON' | 'FOUR' | 'SINGLE';
    seasonId: string;
  };
}

export interface BattlepassUsedEvent extends BaseEvent {
  type: 'battlepass.used';
  payload: {
    battlepassId: string;
    userId: string;
    sessionId: string;
    usesLeft: number;
  };
}

// Объединённый тип всех событий
export type SystemEvent = 
  | PaymentPaidEvent
  | PaymentFailedEvent
  | EnrollmentConfirmedEvent
  | EnrollmentCancelledEvent
  | ReportSubmittedEvent
  | UserRegisteredEvent
  | UserRoleChangedEvent
  | BattlepassActivatedEvent
  | BattlepassUsedEvent;

