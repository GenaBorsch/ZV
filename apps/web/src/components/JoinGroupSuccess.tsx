"use client";

interface JoinGroupSuccessProps {
  group: {
    id: string;
    name: string;
    description: string | null;
    maxMembers: number;
    currentMembers: number;
    format: string;
    place: string | null;
  };
  message: string;
  onJoinAnother?: () => void;
}

export function JoinGroupSuccess({ 
  group, 
  message, 
  onJoinAnother 
}: JoinGroupSuccessProps) {
  return (
    <div className="bg-card p-6 rounded-lg border border-border">
      <div className="flex items-center mb-4">
        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3">
          <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-foreground">
          {message}
        </h3>
      </div>

      {/* Информация о группе */}
      <div className="bg-muted/50 p-4 rounded-md mb-6">
        <h4 className="font-medium text-foreground mb-2">{group.name}</h4>
        {group.description && (
          <p className="text-sm text-muted-foreground mb-2 break-words overflow-wrap-anywhere">{group.description}</p>
        )}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-muted-foreground">Участники:</span>
            <span className="ml-2 font-medium">{group.currentMembers}/{group.maxMembers}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Формат:</span>
            <span className="ml-2 font-medium">
              {group.format === 'ONLINE' ? 'Онлайн' : 
               group.format === 'OFFLINE' ? 'Оффлайн' : 'Смешанный'}
            </span>
          </div>
          {group.place && (
            <div className="col-span-2">
              <span className="text-muted-foreground">Место:</span>
              <span className="ml-2 font-medium break-words overflow-wrap-anywhere">{group.place}</span>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-4">
        <div className="p-3 bg-blue-50 rounded-md text-sm">
          <p className="font-medium text-blue-900 mb-1">Что дальше?</p>
          <p className="text-blue-700">
            Теперь вы участник группы! Мастер будет создавать игровые сессии, и вы сможете участвовать в них. 
            Следите за уведомлениями о предстоящих играх.
          </p>
        </div>

        {onJoinAnother && (
          <button 
            onClick={onJoinAnother} 
            className="w-full text-center px-3 py-2 text-sm text-muted-foreground hover:text-foreground rounded-md border border-dashed"
          >
            Присоединиться к другой группе
          </button>
        )}
      </div>
    </div>
  );
}
