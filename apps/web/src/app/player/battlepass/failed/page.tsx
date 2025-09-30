import Link from 'next/link';
import { db, orders, eq, and } from '@zv/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';

interface Props {
  searchParams: Promise<{ orderId?: string }>;
}

export default async function BattlepassFailedPage({ searchParams }: Props) {
  const session = await getServerSession(authOptions as any);
  
  if (!session?.user?.id) {
    redirect('/auth/login');
  }

  const { orderId } = await searchParams;
  let order = null;

  if (orderId) {
    // Находим заказ пользователя
    const [foundOrder] = await db.select()
      .from(orders)
      .where(and(
        eq(orders.id, orderId),
        eq(orders.forUserId, session.user.id)
      ))
      .limit(1);

    order = foundOrder;
  }

  const product = order?.productData as any;

  return (
    <div className="max-w-2xl mx-auto py-12 px-4">
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-8 mb-8">
        <div className="text-center">
          <div className="text-6xl mb-4">❌</div>
          <h1 className="text-2xl font-semibold text-red-600 mb-4">
            Оплата не удалась
          </h1>
          <p className="text-muted-foreground mb-6 text-lg">
            К сожалению, платеж не был завершен. Средства не были списаны с вашего счета.
          </p>

          {order && (
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 mb-6 text-left">
              <h3 className="font-medium text-foreground mb-3">Детали заказа:</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Заказ:</span>
                  <span className="font-mono text-xs">{order.id}</span>
                </div>
                {product && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Товар:</span>
                      <span>{product.title}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Сумма:</span>
                      <span>{product.priceRub} ₽</span>
                    </div>
                  </>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Статус:</span>
                  <span className="font-medium text-red-600">
                    {order.status === 'CANCELED' ? 'Отменен' : 'Не оплачен'}
                  </span>
                </div>
              </div>
            </div>
          )}

          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
            <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2">
              💡 Возможные причины:
            </h4>
            <ul className="text-sm text-blue-700 dark:text-blue-300 text-left space-y-1">
              <li>• Недостаточно средств на карте</li>
              <li>• Карта заблокирована или просрочена</li>
              <li>• Отмена платежа пользователем</li>
              <li>• Технические проблемы платежной системы</li>
              <li>• Превышено время ожидания</li>
            </ul>
          </div>

          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
            <h4 className="font-medium text-green-800 dark:text-green-200 mb-2">
              ✅ Что делать дальше:
            </h4>
            <ul className="text-sm text-green-700 dark:text-green-300 text-left space-y-1">
              <li>• Проверьте баланс карты</li>
              <li>• Попробуйте другой способ оплаты</li>
              <li>• Обратитесь в банк при проблемах с картой</li>
              <li>• Свяжитесь с поддержкой при повторных ошибках</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="flex gap-3 justify-center">
        <Link href="/player/battlepass" className="btn-primary">
          🔄 Попробовать снова
        </Link>
        <Link href="/player" className="btn-outline">
          ← Назад в кабинет
        </Link>
      </div>
    </div>
  );
}
