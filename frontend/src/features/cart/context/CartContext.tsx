import React, { createContext, useContext, useState, ReactNode, useCallback, useEffect, useMemo } from 'react';
import { getCartItems, removeFromCart, clearCart, updateQuantity, addToCart } from '../services/cartService';
import { requestPayment } from '../services/paymentService';
import type { CartItemWithFood, Coupon } from '../types/cart.types';

interface CartContextType {
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  cartItems: CartItemWithFood[];
  loading: boolean;
  error: string | null;
  totalPrice: number;
  totalCount: number;
  appliedCoupon: Coupon | null;
  discountValue: number;
  finalPrice: number;
  fetchCart: () => Promise<void>;
  handleAddToCart: (food_id: number) => Promise<void>;
  handleRemove: (id: string) => Promise<void>;
  handleClear: () => Promise<void>;
  handleUpdateQuantity: (id: string, q: number) => Promise<void>;
  applyCoupon: (coupon: Coupon) => void;
  clearCoupon: () => void;
  onGroupPayment: () => void;
}

const CartContext = createContext<CartContextType | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [cartItems, setCartItems] = useState<CartItemWithFood[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCart = useCallback(async () => {
    try {
      setLoading(true);
      const items = await getCartItems();
      setCartItems([...items]);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  // ⭐ 순서 중요: totalPrice 계산을 먼저 합니다.
  const totalPrice = cartItems.reduce(
    (sum, item: CartItemWithFood) => sum + (item.food_items?.price || 0) * item.quantity,
    0
  );
  const totalCount = cartItems.reduce((sum, item: CartItemWithFood) => sum + item.quantity, 0);

  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);

  const discountValue = useMemo(() => {
    if (!appliedCoupon) return 0;
    if (totalPrice < appliedCoupon.min_order_amount) return 0;

    if (appliedCoupon.discount_type === 'amount') {
      return Math.min(appliedCoupon.discount_value, totalPrice);
    }

    if (appliedCoupon.discount_type === 'percentage') {
      return Math.floor((totalPrice * appliedCoupon.discount_value) / 100);
    }

    return 0;
  }, [appliedCoupon, totalPrice]);

  const finalPrice = Math.max(0, totalPrice - discountValue);

  const applyCoupon = useCallback(
    (coupon: Coupon) => {
      if (totalPrice < coupon.min_order_amount) {
        alert(`이 쿠폰은 최소 주문 금액 ${coupon.min_order_amount.toLocaleString()}원 이상에서 사용 가능합니다.`);
        return;
      }
      setAppliedCoupon(coupon);
    },
    [totalPrice]
  );

  const clearCoupon = useCallback(() => setAppliedCoupon(null), []);

  /**
   * [수정 포인트]: 결제 성공 URL에 선택된 쿠폰의 ID를 포함시킵니다.
   */
  const onGroupPayment = useCallback(() => {
    if (cartItems.length === 0) {
      alert('장바구니가 비어 있습니다.');
      return;
    }

    const firstItemName = cartItems[0].food_items?.name || '상품';
    const remainingCount = cartItems.length - 1;
    const orderName = remainingCount > 0 ? `${firstItemName} 외 ${remainingCount}건` : firstItemName;
    
    // 기본 성공 URL 설정
    let successUrl = `${window.location.origin}/payment-success?from=cart`;
    
    // ⭐ 적용된 쿠폰이 있다면 URL 파라미터에 추가 (is_used 처리를 위해)
    if (appliedCoupon && (appliedCoupon as any).user_coupon_id) {
      successUrl += `&couponId=${(appliedCoupon as any).user_coupon_id}`;
    }

    requestPayment(finalPrice, orderName, '사용자', successUrl);
  }, [cartItems, finalPrice, appliedCoupon]); // appliedCoupon 의존성 추가

  const handleAddToCart = async (food_id: number) => {
    try {
      setLoading(true);
      await addToCart({ food_id, quantity: 1 });
      const freshItems = await getCartItems();
      setCartItems([...freshItems]);
      setIsOpen(true);
    } catch (err: any) {
      alert("장바구니 담기 실패: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (cartItemId: string) => {
    try {
      await removeFromCart(cartItemId);
      setCartItems((prev) => prev.filter((item) => item.id !== cartItemId));
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleUpdateQuantity = async (cartItemId: string, newQuantity: number) => {
    try {
      if (newQuantity < 1) return;
      await updateQuantity(cartItemId, newQuantity);
      setCartItems((prev) =>
        prev.map((item) =>
          item.id === cartItemId ? { ...item, quantity: newQuantity } : item
        )
      );
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleClear = async () => {
    try {
      await clearCart();
      setCartItems([]);
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <CartContext.Provider
      value={{
        isOpen,
        openCart: () => setIsOpen(true),
        closeCart: () => setIsOpen(false),
        cartItems,
        loading,
        error,
        totalPrice,
        totalCount,
        appliedCoupon,
        discountValue,
        finalPrice,
        fetchCart,
        handleAddToCart,
        handleRemove,
        handleClear,
        handleUpdateQuantity,
        applyCoupon,
        clearCoupon,
        onGroupPayment,
      }}
    >
      {children}
    </CartContext.Provider>
  );  
}

export function useCartContext() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCartContext는 CartProvider 안에서 사용해야 합니다.');
  return ctx;
}