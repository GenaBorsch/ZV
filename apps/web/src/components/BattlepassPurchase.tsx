'use client';

import { useState } from 'react';
import { PaymentModal } from './PaymentModal';
import { ProductImage } from './ProductImage';

interface Product {
  id: string;
  sku: string;
  title: string;
  description?: string;
  priceRub: number;
  bpUsesTotal: number;
  imageUrl?: string;
  active: boolean;
}

interface BattlepassPurchaseProps {
  products: Product[];
}

export function BattlepassPurchase({ products }: BattlepassPurchaseProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [paymentUrl, setPaymentUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handlePurchase = async (productSku: string) => {
    setIsLoading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('productSku', productSku);

      const response = await fetch('/api/payments/create-checkout', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (data.success && data.confirmationUrl) {
        setPaymentUrl(data.confirmationUrl);
        setIsModalOpen(true);
      } else {
        setError(data.error || 'Ошибка при создании платежа');
      }
    } catch (err) {
      console.error('Payment error:', err);
      setError('Произошла ошибка при создании платежа');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePaymentSuccess = () => {
    setIsModalOpen(false);
    // Можно добавить редирект на страницу успеха или обновление данных
    window.location.href = '/player/battlepass/success';
  };

  return (
    <>
      {error && (
        <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-red-800 dark:text-red-200">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {products.map((product) => (
          <div key={product.id} className="card p-4 flex flex-col">
            {product.imageUrl && (
              <div className="mb-3">
                <ProductImage 
                  src={product.imageUrl} 
                  alt={product.title}
                  className="w-full h-32 object-cover rounded-md"
                />
              </div>
            )}
            <div className="text-sm text-muted-foreground mb-1">{product.sku}</div>
            <div className="text-lg font-medium text-foreground">{product.title}</div>
            {product.description && (
              <div className="mt-1 text-sm text-muted-foreground">{product.description}</div>
            )}
            <div className="mt-2 text-foreground">{product.priceRub} ₽</div>
            <div className="mt-1 text-sm text-muted-foreground">Игры: {product.bpUsesTotal}</div>
            
            <button 
              className="btn-primary w-full mt-3" 
              onClick={() => handlePurchase(product.sku)}
              disabled={!product.active || isLoading}
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Создание платежа...
                </div>
              ) : (
                'Купить'
              )}
            </button>
          </div>
        ))}
      </div>

      <PaymentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        paymentUrl={paymentUrl}
        onSuccess={handlePaymentSuccess}
      />
    </>
  );
}


