import Link from 'next/link';
import { db, orders, battlepasses, orderItems, eq, and } from '@zv/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';

interface Props {
  searchParams: { orderId?: string };
}

export default async function BattlepassSuccessPage({ searchParams }: Props) {
  const session = await getServerSession(authOptions as any);
  
  if (!session?.user?.id) {
    redirect('/auth/login');
  }

  const { orderId } = searchParams;
  let order = null;
  let battlepass = null;

  if (orderId) {
    // Находим заказ по ID
    const [foundOrder] = await db.select()
      .from(orders)
      .where(eq(orders.id, orderId))
      .limit(1);

    // Проверяем, принадлежит ли заказ текущему пользователю
    if (foundOrder) {
      const isUserOrder = foundOrder.forUserId === session.user.id || 
                         (foundOrder.forUserId === null && foundOrder.userId === session.user.id);
      
      if (isUserOrder) {
        order = foundOrder;
      }
    }

    // Если заказ оплачен, ищем выданный баттлпасс
    if (order && order.status === 'PAID') {
      const [foundBattlepass] = await db.select()
        .from(battlepasses)
        .where(eq(battlepasses.userId, session.user.id))
        .limit(1);
      
      battlepass = foundBattlepass;
    }
  }

  // Определяем статус и контент
  const getStatusContent = () => {
    if (!order) {
      return {
        icon: '❓',
        title: 'Заказ не найден',
        message: 'Не удалось найти информацию о заказе. Обратитесь в поддержку, если средства были списаны.',
        color: 'text-yellow-600',
        bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
        borderColor: 'border-yellow-200 dark:border-yellow-800'
      };
    }

    switch (order.status) {
      case 'PAID':
        return {
          icon: '✅',
          title: 'Оплата успешна!',
          message: battlepass 
            ? `Путёвки успешно выданы! У вас есть ${battlepass.usesLeft} из ${battlepass.usesTotal} использований.`
            : 'Путёвки скоро будут выданы. Если они не появились в течение 5 минут, обратитесь в поддержку.',
          color: 'text-green-600',
          bgColor: 'bg-green-50 dark:bg-green-900/20',
          borderColor: 'border-green-200 dark:border-green-800'
        };
      
      case 'CANCELLED':
        return {
          icon: '❌',
          title: 'Оплата отменена',
          message: 'Платеж был отменен. Средства не были списаны с вашего счета.',
          color: 'text-red-600',
          bgColor: 'bg-red-50 dark:bg-red-900/20',
          borderColor: 'border-red-200 dark:border-red-800'
        };
      
      case 'PENDING':
        return {
          icon: '⏳',
          title: 'Ожидание подтверждения',
          message: 'Платеж обрабатывается. Это может занять несколько минут.',
          color: 'text-blue-600',
          bgColor: 'bg-blue-50 dark:bg-blue-900/20',
          borderColor: 'border-blue-200 dark:border-blue-800'
        };
      
      default:
        return {
          icon: '⚠️',
          title: 'Статус неизвестен',
          message: 'Обрабатываем ваш платеж. Обновите страницу через несколько минут.',
          color: 'text-gray-600',
          bgColor: 'bg-gray-50 dark:bg-gray-900/20',
          borderColor: 'border-gray-200 dark:border-gray-800'
        };
    }
  };

  const status = getStatusContent();
  
  // Получаем информацию о товаре из order_items
  let product = null;
  if (order) {
    const [orderItem] = await db.select()
      .from(orderItems)
      .where(eq(orderItems.orderId, order.id))
      .limit(1);
    
    if (orderItem) {
      product = {
        title: orderItem.productTitleSnapshot,
        priceRub: orderItem.priceRub,
        sku: orderItem.productSkuSnapshot
      };
    }
  }

  return (
    <div className="max-w-2xl mx-auto py-12 px-4">
      <div className={`${status.bgColor} ${status.borderColor} border rounded-lg p-8 mb-8`}>
        <div className="text-center">
          <div className="text-6xl mb-4">{status.icon}</div>
          <h1 className={`text-2xl font-semibold ${status.color} mb-4`}>
            {status.title}
          </h1>
          <p className="text-muted-foreground mb-6 text-lg">
            {status.message}
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
                  <span className={`font-medium ${status.color}`}>
                    {order.status === 'PAID' ? 'Оплачен' : 
                     order.status === 'CANCELLED' ? 'Отменен' :
                     order.status === 'PENDING' ? 'Ожидает' : order.status}
                  </span>
                </div>
                {order.fulfilledAt && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Дата выполнения:</span>
                    <span>{new Date(order.fulfilledAt).toLocaleString('ru-RU')}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex gap-3 justify-center">
        {order?.status === 'PAID' && (
          <Link href="/player" className="btn-primary">
            🎮 В личный кабинет
          </Link>
        )}
        {order?.status === 'CANCELLED' && (
          <Link href="/player/battlepass" className="btn-primary">
            🔄 Попробовать снова
          </Link>
        )}
        {order?.status === 'PENDING' && (
          <Link href={`/player/battlepass/success?orderId=${orderId}`} className="btn-primary">
            🔄 Обновить статус
          </Link>
        )}
        <Link href="/player" className="btn-outline">
          ← Назад в кабинет
        </Link>
      </div>
    </div>
  );
}


