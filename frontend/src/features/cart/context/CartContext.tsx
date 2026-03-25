import React, { createContext, useContext, useState, ReactNode, useCallback, useEffect } from 'react';
import { getCartItems, removeFromCart, clearCart, updateQuantity, addToCart } from '../services/cartService';
import { requestPayment } from '../services/paymentService';
import type { CartItemWithFood } from '../types/cart.types';

interface CartContextType {
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  cartItems: CartItemWithFood[];
  loading: boolean;
  error: string | null;
  totalPrice: number;
  totalCount: number;
  fetchCart: () => Promise<void>;
  handleAddToCart: (food_id: number) => Promise<void>;
  handleRemove: (id: string) => Promise<void>;
  handleClear: () => Promise<void>;
  handleUpdateQuantity: (id: string, q: number) => Promise<void>;
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

  // ⭐ 그 다음에 onGroupPayment 함수를 만듭니다.
  const onGroupPayment = useCallback(() => {
    if (cartItems.length === 0) {
      alert('장바구니가 비어 있습니다.');
      return;
    }
    const firstItemName = cartItems[0].food_items?.name || '상품';
    const remainingCount = cartItems.length - 1;
    const orderName = remainingCount > 0 ? `${firstItemName} 외 ${remainingCount}건` : firstItemName;
    const successUrl = `${window.location.origin}/payment-success?from=cart`;
    
    requestPayment(totalPrice, orderName, '사용자', successUrl);
  }, [cartItems, totalPrice]);

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
        fetchCart,
        handleAddToCart,
        handleRemove,
        handleClear,
        handleUpdateQuantity,
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