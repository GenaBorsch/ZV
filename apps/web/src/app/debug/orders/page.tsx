import { db, orders, battlepasses, orderItems } from '@zv/db';

export default async function DebugOrdersPage() {
  // Получаем все заказы
  const allOrders = await db.select().from(orders).limit(10);
  
  // Получаем все баттлпассы
  const allBattlepasses = await db.select().from(battlepasses).limit(10);
  
  // Получаем все элементы заказов
  const allOrderItems = await db.select().from(orderItems).limit(10);

  return (
    <div className="max-w-6xl mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-6">Отладка заказов и баттлпассов</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Заказы */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border">
          <h2 className="text-lg font-semibold mb-4">Заказы ({allOrders.length})</h2>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {allOrders.map((order) => (
              <div key={order.id} className="border rounded p-3 text-sm">
                <div><strong>ID:</strong> {order.id}</div>
                <div><strong>Статус:</strong> {order.status}</div>
                <div><strong>Сумма:</strong> {order.totalRub} ₽</div>
                <div><strong>Для пользователя:</strong> {order.forUserId || 'Себя'}</div>
                <div><strong>Провайдер ID:</strong> {order.providerId || 'Нет'}</div>
                <div><strong>Создан:</strong> {order.createdAt.toLocaleString('ru-RU')}</div>
                {order.fulfilledAt && (
                  <div><strong>Выполнен:</strong> {order.fulfilledAt.toLocaleString('ru-RU')}</div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Элементы заказов */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border">
          <h2 className="text-lg font-semibold mb-4">Элементы заказов ({allOrderItems.length})</h2>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {allOrderItems.map((item) => (
              <div key={item.id} className="border rounded p-3 text-sm">
                <div><strong>Заказ ID:</strong> {item.orderId}</div>
                <div><strong>Товар:</strong> {item.productTitleSnapshot}</div>
                <div><strong>SKU:</strong> {item.productSkuSnapshot}</div>
                <div><strong>Цена:</strong> {item.priceRub} ₽</div>
                <div><strong>Количество:</strong> {item.qty}</div>
                <div><strong>Игры:</strong> {item.bpUsesTotalAtPurchase || 'Не указано'}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Баттлпассы */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border">
          <h2 className="text-lg font-semibold mb-4">Баттлпассы ({allBattlepasses.length})</h2>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {allBattlepasses.map((bp) => (
              <div key={bp.id} className="border rounded p-3 text-sm">
                <div><strong>Пользователь ID:</strong> {bp.userId}</div>
                <div><strong>Тип:</strong> {bp.kind}</div>
                <div><strong>Статус:</strong> {bp.status}</div>
                <div><strong>Использований:</strong> {bp.usesLeft}/{bp.usesTotal}</div>
                <div><strong>Создан:</strong> {bp.createdAt.toLocaleString('ru-RU')}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
        <h3 className="font-semibold mb-2">Поиск конкретного заказа:</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Ищем заказ с ID: <code>55c92345-55cc-47b0-909e-79f7772b8098</code>
        </p>
        {(() => {
          const targetOrder = allOrders.find(o => o.id === '55c92345-55cc-47b0-909e-79f7772b8098');
          const targetOrderItem = allOrderItems.find(i => i.orderId === '55c92345-55cc-47b0-909e-79f7772b8098');
          const targetBattlepass = allBattlepasses.find(bp => 
            targetOrder && bp.userId === targetOrder.forUserId
          );
          
          return (
            <div className="mt-2 space-y-2">
              <div>
                <strong>Заказ найден:</strong> {targetOrder ? '✅ Да' : '❌ Нет'}
                {targetOrder && (
                  <span className="ml-2 text-sm">
                    (Статус: {targetOrder.status}, Для: {targetOrder.forUserId})
                  </span>
                )}
              </div>
              <div>
                <strong>Элемент заказа найден:</strong> {targetOrderItem ? '✅ Да' : '❌ Нет'}
                {targetOrderItem && (
                  <span className="ml-2 text-sm">
                    ({targetOrderItem.productTitleSnapshot})
                  </span>
                )}
              </div>
              <div>
                <strong>Баттлпасс найден:</strong> {targetBattlepass ? '✅ Да' : '❌ Нет'}
                {targetBattlepass && (
                  <span className="ml-2 text-sm">
                    (Статус: {targetBattlepass.status}, Использований: {targetBattlepass.usesLeft}/{targetBattlepass.usesTotal})
                  </span>
                )}
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
}
