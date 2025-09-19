import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// Принудительно делаем страницу динамической
export const dynamic = 'force-dynamic';

export default async function DebugUserPage() {
  let session = null;
  let error = null;
  
  try {
    session = await getServerSession(authOptions as any);
  } catch (e: any) {
    error = e.message;
  }

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-6">Отладка пользователя</h1>
      
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border mb-4">
        <h2 className="text-lg font-semibold mb-4">Сессия NextAuth</h2>
        {error ? (
          <div className="text-red-600">
            <strong>Ошибка:</strong> {error}
          </div>
        ) : session ? (
          <div className="space-y-2">
            <div><strong>Авторизован:</strong> ✅ Да</div>
            <div><strong>User ID:</strong> {session.user?.id || 'Не указан'}</div>
            <div><strong>Email:</strong> {session.user?.email || 'Не указан'}</div>
            <div><strong>Name:</strong> {session.user?.name || 'Не указан'}</div>
            <div><strong>Role:</strong> {(session.user as any)?.role || 'Не указан'}</div>
          </div>
        ) : (
          <div className="text-yellow-600">
            <strong>Статус:</strong> ❌ Не авторизован
          </div>
        )}
      </div>

      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
        <h3 className="font-semibold mb-2">Информация:</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Эта страница показывает текущую сессию пользователя. 
          Если пользователь не авторизован, страницы success/failed не смогут найти его заказы.
        </p>
      </div>
    </div>
  );
}


