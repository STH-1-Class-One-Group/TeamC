import React, { useState } from 'react';
import { Product } from '../hooks/useProducts';
import { supabase } from '../../../api/supabaseClient';
import { requestPayment } from '../../cart/services/paymentService';
import { useCartContext } from '../../cart/context/CartContext';

interface ProductCardProps {
  product: Product;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const [cartLoading, setCartLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ msg: string; ok: boolean } | null>(null);
  
  // ⭐ Context에서 미리 만들어둔 handleAddToCart를 가져옵니다.
  // 이 함수는 DB 저장 + 목록 새로고침 + 장바구니 열기를 한 번에 해줍니다.
  const { handleAddToCart } = useCartContext();

  const buyNow = () => {
    const orderName = product.name;
    const customerName = '사용자'; 
    const successUrl = `${window.location.origin}/payment-success`;
    
    // 결제 서비스 호출
    requestPayment(product.price, orderName, customerName, successUrl);
  };

  // 이미지 URL 처리
  const imageUrl = product.image_url.startsWith('http')
    ? product.image_url
    : supabase.storage.from('food-images').getPublicUrl(product.image_url).data.publicUrl;

  // ⭐ 장바구니 담기 버튼 클릭 핸들러
  const onAddToCartClick = async () => {
    setCartLoading(true);
    setFeedback(null);
    try {
      // Context의 함수를 호출하여 복잡한 과정을 한 번에 처리합니다.
      await handleAddToCart(product.id);
      
      setFeedback({ msg: '✅ 장바구니에 담겼습니다!', ok: true });
      setTimeout(() => setFeedback(null), 2000);
    } catch (err: any) {
      const isAuthError = err.message === '로그인이 필요합니다.';
      setFeedback({
        msg: isAuthError ? '🔒 로그인 후 이용해 주세요.' : '❌ 오류가 발생했습니다.',
        ok: false,
      });
      setTimeout(() => setFeedback(null), 2500);
    } finally {
      setCartLoading(false);
    }
  };

  return (
    <div className="group bg-surface-container-lowest rounded-xl overflow-hidden hover:shadow-[0_12px_40px_rgba(27,28,28,0.06)] transition-all duration-300">
      <div className="aspect-square bg-surface-dim relative overflow-hidden">
        <img
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          src={imageUrl}
        />
      </div>
      <div className="p-5">
        <h3 className="text-lg font-bold text-on-surface mb-2 tracking-tight">{product.name}</h3>
        <p className="text-on-surface-variant text-sm mb-4 line-clamp-2">칼로리: {product.calories} kcal</p>

        {feedback && (
          <p className={`text-xs mb-2 text-center font-medium ${feedback.ok ? 'text-green-600' : 'text-red-500'}`}>
            {feedback.msg}
          </p>
        )}

        <div className="flex items-center justify-between">
          <span className="text-lg font-extrabold text-primary">₩ {product.price.toLocaleString()}</span>
          <div className="flex gap-2">
            <button
              onClick={buyNow}
              className="w-10 h-10 flex items-center justify-center rounded-full bg-surface-container-low text-on-surface hover:bg-primary hover:text-on-primary transition-all"
              aria-label="바로 구매"
            >
              <span className="material-symbols-outlined text-[20px]" translate="no">credit_card</span>
            </button>
            <button
              onClick={onAddToCartClick}
              disabled={cartLoading}
              className="w-10 h-10 flex items-center justify-center rounded-full bg-surface-container-low text-on-surface hover:bg-primary hover:text-on-primary transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="장바구니에 담기"
            >
              <span className="material-symbols-outlined text-[20px]" translate="no">
                {cartLoading ? 'hourglass_empty' : 'shopping_cart'}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};