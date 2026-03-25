import React from 'react';
// import { useCartContext } from '../context/CartContext'; // 삭제: useCart 하나로 충분합니다.
import { useCart } from '../hooks/useCart';

export const CartIcon: React.FC = () => {
  // useCart 훅 하나에서 모든 필요한 정보를 가져옵니다.
  // 이렇게 해야 Context의 상태 변화를 useCart가 감지해서 아이콘 숫자를 즉시 바꿔줍니다.
  const { openCart, totalCount } = useCart(); 

  return (
    <button
      onClick={openCart}
      className="relative flex items-center justify-center p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
      aria-label="장바구니 열기"
    >
      <span className="material-symbols-outlined text-slate-500 dark:text-slate-400 hover:text-blue-600 transition-all">
        shopping_cart
      </span>

      {/* 수량 배지: 1개 이상 담겼을 때만 표시 */}
      {totalCount > 0 && (
        <span className="absolute -top-0.5 -right-0.5 w-4 h-4 text-[10px] font-bold bg-blue-600 text-white rounded-full flex items-center justify-center shadow-sm">
          {totalCount > 9 ? '9+' : totalCount}
        </span>
      )}
    </button>
  );
};