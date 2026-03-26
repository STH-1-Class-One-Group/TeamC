import React, { useState } from 'react';
import { useCart } from '../hooks/useCart';
import { CartItem } from './CartItem';
import { getAvailableCouponsForUser } from '../services/cartService';
import type { Coupon } from '../types/cart.types';

export const CartDrawer: React.FC = () => {
  const {
    closeCart,
    cartItems,
    loading,
    error,
    totalPrice,
    totalCount,
    appliedCoupon,
    discountValue,
    finalPrice,
    handleRemove,
    handleClear,
    handleUpdateQuantity,
    applyCoupon,
    clearCoupon,
    onGroupPayment,
  } = useCart();

  const [couponMenuOpen, setCouponMenuOpen] = useState(false);
  const [availableCoupons, setAvailableCoupons] = useState<Coupon[]>([]);
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState<string | null>(null);

  const toggleCouponMenu = async () => {
    if (couponMenuOpen) {
      setCouponMenuOpen(false);
      return;
    }

    setCouponMenuOpen(true);
    setCouponError(null);
    setCouponLoading(true);

    try {
      const coupons = await getAvailableCouponsForUser();
      setAvailableCoupons(coupons);
    } catch (err: any) {
      setCouponError(err.message || '쿠폰을 불러오지 못했습니다.');
    } finally {
      setCouponLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900">
      {/* ── 헤더 ── */}
      <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-800 flex-shrink-0">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">
          🛒 장바구니
          {totalCount > 0 && (
            <span className="ml-2 text-sm font-medium text-primary">
              ({totalCount}개)
            </span>
          )}
        </h2>
        <button
          onClick={closeCart}
          className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          aria-label="장바구니 닫기"
        >
          <span className="material-symbols-outlined text-[20px] text-slate-500 dark:text-slate-400">
            close
          </span>
        </button>
      </div>

      {/* ── 아이템 목록 (스크롤) ── */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {loading ? (
          <p className="text-center py-10 text-slate-500 dark:text-slate-400">불러오는 중...</p>
        ) : error ? (
          <p className="text-center text-red-500 py-10">{error}</p>
        ) : cartItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400 dark:text-slate-600">
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
        <div className="p-5 border-t border-slate-200 dark:border-slate-800 space-y-4 flex-shrink-0 bg-white dark:bg-slate-900">
          <button
            className="w-full py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-100 font-bold hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            onClick={toggleCouponMenu}
          >
            쿠폰 선택
          </button>

          {appliedCoupon ? (
            <div className="rounded-xl border border-emerald-200 dark:border-emerald-800/50 bg-emerald-50 dark:bg-emerald-900/20 p-3 text-sm space-y-1">
              <div className="flex justify-between items-center">
                <span className="text-emerald-900 dark:text-emerald-100 font-bold">
                  적용된 쿠폰: {appliedCoupon.name}
                </span>
                <button
                  className="text-xs font-semibold text-red-500 dark:text-red-400 hover:underline"
                  onClick={clearCoupon}
                >
                  취소
                </button>
              </div>
              <p className="text-emerald-700 dark:text-emerald-300">할인: {appliedCoupon.discount_type === 'amount' ? `₩ ${appliedCoupon.discount_value.toLocaleString()}` : `${appliedCoupon.discount_value}%`}</p>
              <p className="text-emerald-600 dark:text-emerald-400/80">최소 주문: ₩ {appliedCoupon.min_order_amount.toLocaleString()} 이상</p>
            </div>
          ) : (
            <p className="text-xs text-center text-slate-500 dark:text-slate-400 font-medium">쿠폰을 적용하여 할인 받을 수 있습니다.</p>
          )}

          {couponMenuOpen && (
            <div className="rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-3 space-y-2 shadow-xl animate-in fade-in zoom-in-95">
              {couponLoading ? (
                <p className="text-center text-sm text-slate-500 dark:text-slate-400">쿠폰을 불러오는 중...</p>
              ) : couponError ? (
                <p className="text-center text-sm text-red-500">{couponError}</p>
              ) : availableCoupons.length === 0 ? (
                <p className="text-center text-sm text-slate-500 dark:text-slate-400">사용 가능한 쿠폰이 없습니다.</p>
              ) : (
                availableCoupons.map((coupon) => (
                  <button
                    key={coupon.user_coupon_id}
                    onClick={() => {
                      applyCoupon(coupon);
                      setCouponMenuOpen(false);
                    }}
                    className="w-full text-left rounded-lg border border-slate-200 dark:border-slate-700 p-3 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors group"
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-slate-800 dark:text-slate-100 group-hover:text-primary transition-colors">{coupon.name}</span>
                      <span className="text-sm font-black text-primary">
                        {coupon.discount_type === 'amount'
                          ? `₩ ${coupon.discount_value.toLocaleString()}`
                          : `${coupon.discount_value}%`}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      최소 주문 ₩ {coupon.min_order_amount.toLocaleString()}
                    </p>
                  </button>
                ))
              )}
            </div>
          )}

          <div className="space-y-2 pt-2">
            <div className="flex justify-between items-center">
              <span className="text-slate-500 dark:text-slate-400 text-sm font-medium">합계</span>
              <span className="text-lg font-bold text-slate-900 dark:text-white">₩ {totalPrice.toLocaleString()}</span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-slate-500 dark:text-slate-400 text-sm font-medium">쿠폰 할인</span>
              <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">- ₩ {discountValue.toLocaleString()}</span>
            </div>

            <div className="flex justify-between items-center pt-3 border-t border-slate-100 dark:border-slate-800">
              <span className="text-slate-900 dark:text-white font-bold">최종 결제</span>
              <span className="text-2xl font-black text-primary">₩ {finalPrice.toLocaleString()}</span>
            </div>
          </div>

          <button
            className="w-full py-4 rounded-2xl bg-primary text-white font-black text-lg hover:brightness-110 active:scale-[0.98] transition-all shadow-lg shadow-primary/20"
            onClick={onGroupPayment}
          >
            결제하기
          </button>
          
          <button
            className="w-full py-1 text-sm text-slate-400 dark:text-slate-500 hover:text-red-500 dark:hover:text-red-400 transition-colors"
            onClick={handleClear}
          >
            장바구니 비우기
          </button>
        </div>
      )}
    </div>
  );
};