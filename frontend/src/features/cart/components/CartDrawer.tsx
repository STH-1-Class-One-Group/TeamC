import React from 'react';
import { useCart } from '../hooks/useCart';
import { CartItem } from './CartItem';

export const CartDrawer: React.FC = () => {
  // ⭐ 기존 기능에 onGroupPayment만 추가로 가져옵니다.
  const {
    closeCart,
    cartItems,
    loading,
    error,
    totalPrice,
    totalCount,
    handleRemove,
    handleClear,
    handleUpdateQuantity,
    onGroupPayment, // 여기서 결제 함수를 가져옵니다.
  } = useCart();

  return (
    <div className="flex flex-col h-full">
      {/* ── 헤더 ── */}
      <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-700 flex-shrink-0">
        <h2 className="text-lg font-bold text-on-surface dark:text-white">
          🛒 장바구니
          {totalCount > 0 && (
            <span className="ml-2 text-sm font-medium text-primary">
              ({totalCount}개)
            </span>
          )}
        </h2>
        <button
          onClick={closeCart}
          className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-surface-container-high dark:hover:bg-slate-700 transition-colors"
          aria-label="장바구니 닫기"
        >
          <span className="material-symbols-outlined text-[20px] text-on-surface-variant">
            close
          </span>
        </button>
      </div>

      {/* ── 아이템 목록 (스크롤) ── */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {loading ? (
          <p className="text-center py-10">불러오는 중...</p>
        ) : error ? (
          <p className="text-center text-red-500 py-10">{error}</p>
        ) : cartItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-on-surface-variant">
            <span className="material-symbols-outlined text-6xl mb-3">
              shopping_cart
            </span>
            <p className="text-sm">장바구니가 비어 있습니다.</p>
          </div>
        ) : (
          cartItems.map((item) => (
            <CartItem
              key={item.id}
              item={item}
              onRemove={handleRemove}
              onUpdateQuantity={handleUpdateQuantity}
            />
          ))
        )}
      </div>

      {/* ── 하단: 합계 + 버튼 ── */}
      {cartItems.length > 0 && (
        <div className="p-5 border-t border-slate-200 dark:border-slate-700 space-y-3 flex-shrink-0">
          <div className="flex justify-between items-center">
            <span className="text-on-surface-variant text-sm">합계</span>
            <span className="text-xl font-extrabold text-on-surface dark:text-white">
              ₩ {totalPrice.toLocaleString()}
            </span>
          </div>
          <button
            className="w-full py-3 rounded-xl bg-primary text-on-primary font-bold hover:opacity-90 transition-opacity"
            // ⭐ alert를 지우고 실제 결제 함수인 onGroupPayment를 연결했습니다.
            onClick={onGroupPayment}
          >
            주문하기
          </button>
          <button
            className="w-full py-2 rounded-xl text-sm text-on-surface-variant hover:text-red-500 transition-colors"
            onClick={handleClear}
          >
            장바구니 비우기
          </button>
        </div>
      )}
    </div>
  );
};