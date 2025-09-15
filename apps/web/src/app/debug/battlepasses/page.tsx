import { db, battlepasses, eq } from '@zv/db';

export default async function DebugBattlepassesPage() {
  // Получаем все баттлпассы для демо пользователя
  const demoUserId = 'ca323aa6-fe00-4043-ae15-9767d6f8fadf';
  
  const userBattlepasses = await db.select()
    .from(battlepasses)
    .where(eq(battlepasses.userId, demoUserId));

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-6">Баттлпассы демо игрока</h1>
      
      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 mb-6">
        <h3 className="font-semibold mb-2">Информация:</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          <strong>User ID:</strong> {demoUserId}
        </p>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          <strong>Найдено баттлпассов:</strong> {userBattlepasses.length}
        </p>
      </div>

      {userBattlepasses.length > 0 ? (
        <div className="space-y-4">
          {userBattlepasses.map((bp) => (
            <div key={bp.id} className="bg-white dark:bg-gray-800 rounded-lg p-6 border">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-foreground">
                    {bp.kind === 'SEASON' ? 'Сезонный баттлпасс' : 
                     bp.kind === 'SINGLE' ? 'Разовый баттлпасс' : 
                     bp.kind === 'FOUR' ? 'Баттлпасс на 4 игры' :
                     'Баттлпасс'}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    ID: {bp.id}
                  </p>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  bp.status === 'ACTIVE' 
                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                    : bp.status === 'EXPIRED'
                    ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                    : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                }`}>
                  {bp.status === 'ACTIVE' ? 'Активен' : 
                   bp.status === 'EXPIRED' ? 'Истек' :
                   bp.status === 'USED_UP' ? 'Использован' : bp.status}
                </span>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <span className="text-sm text-muted-foreground">Использований:</span>
                  <div className="text-lg font-semibold text-foreground">
                    {bp.usesLeft} из {bp.usesTotal}
                  </div>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">Создан:</span>
                  <div className="text-sm text-foreground">
                    {new Date(bp.createdAt).toLocaleString('ru-RU')}
                  </div>
                </div>
              </div>
              
              {bp.usesLeft > 0 && (
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-muted-foreground">Прогресс использования</span>
                    <span className="text-muted-foreground">
                      {Math.round((bp.usesLeft / bp.usesTotal) * 100)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                    <div 
                      className="bg-green-600 h-3 rounded-full transition-all duration-300"
                      style={{ width: `${(bp.usesLeft / bp.usesTotal) * 100}%` }}
                    ></div>
                  </div>
                </div>
              )}
              
              {bp.usesLeft === 0 && (
                <div className="text-center py-2 text-muted-foreground">
                  Все использования исчерпаны
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6 text-center">
          <h3 className="text-lg font-semibold text-yellow-800 dark:text-yellow-200 mb-2">
            Баттлпассы не найдены
          </h3>
          <p className="text-yellow-700 dark:text-yellow-300">
            У демо игрока пока нет активных баттлпассов.
          </p>
        </div>
      )}

      <div className="mt-8">
        <a 
          href="/debug/orders" 
          className="inline-block bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
        >
          ← Вернуться к отладке заказов
        </a>
      </div>
    </div>
  );
}
