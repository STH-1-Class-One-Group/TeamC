import { supabase } from '../../../api/supabaseClient';
import type { AddToCartPayload, CartItemWithFood, Coupon } from '../types/cart.types';

/**
 * 장바구니에 음식을 추가합니다. (Upsert 방식)
 */
export async function addToCart(payload: AddToCartPayload): Promise<void> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('로그인이 필요합니다.');
  }

  // 1. 이미 있는지 확인
  const { data: existing } = await supabase
    .from('cart_items')
    .select('id, quantity')
    .eq('user_id', user.id)
    .eq('food_id', payload.food_id)
    .maybeSingle();

  if (existing) {
    // 2-A. 업데이트
    const { error } = await supabase
      .from('cart_items')
      .update({ quantity: existing.quantity + 1 })
      .eq('id', existing.id);

    if (error) throw error;
  } else {
    // 2-B. 신규 삽입
    const { error } = await supabase.from('cart_items').insert({
      user_id: user.id,
      food_id: payload.food_id,
      quantity: payload.quantity ?? 1,
    });

    if (error) throw error;
  }
}

/**
 * 현재 유저의 장바구니 목록을 가져옵니다.
 * [수정 포인트]: user_id 필터를 명시하고, 최신순 정렬을 보장합니다.
 */
export async function getCartItems(): Promise<CartItemWithFood[]> {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return []; // 로그인 안 되어 있으면 빈 배열 반환

  const { data, error } = await supabase
    .from('cart_items')
    .select(`
      *,
      food_items (
        id,
        name,
        price,
        image_url,
        calories
      )
    `)
    .eq('user_id', user.id) // ✅ [핵심] 내 장바구니만 가져오도록 명시!
    .order('created_at', { ascending: false });

  if (error) {
    console.error("장바구니 조회 에러:", error);
    throw error;
  }

  return (data ?? []) as CartItemWithFood[];
}

/**
 * 특정 아이템 삭제
 */
export async function removeFromCart(cartItemId: string): Promise<void> {
  const { error } = await supabase
    .from('cart_items')
    .delete()
    .eq('id', cartItemId);

  if (error) throw error;
}

/**
 * 장바구니 전체 비우기
 */
export async function clearCart(): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('로그인이 필요합니다.');

  const { error } = await supabase
    .from('cart_items')
    .delete()
    .eq('user_id', user.id);

  if (error) throw error;
}

/**
 * 로그인 유저의 사용 가능한 쿠폰 목록을 조회합니다.
 */
export async function getAvailableCouponsForUser(): Promise<Coupon[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('user_coupons')
    .select(`
      id,
      coupon_id,
      is_used,
      coupons (id, name, discount_type, discount_value, min_order_amount)
    `)
    .eq('user_id', user.id)
    .eq('is_used', false);

  if (error) {
    console.error('쿠폰 조회 에러:', error);
    throw error;
  }

  return (data ?? []).map((item: any) => ({
    user_coupon_id: item.id,
    coupon_id: item.coupon_id,
    is_used: item.is_used,
    name: item.coupons?.name ?? '알 수 없는 쿠폰',
    discount_type: item.coupons?.discount_type ?? 'amount',
    discount_value: item.coupons?.discount_value ?? 0,
    min_order_amount: item.coupons?.min_order_amount ?? 0,
  }));
}

/**
 * 로그인 유저의 모든 쿠폰 목록을 조회합니다. (사용한 쿠폰 포함)
 */
export async function getUserCouponsForUser(): Promise<Coupon[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('user_coupons')
    .select(`
      id,
      coupon_id,
      is_used,
      coupons (id, name, discount_type, discount_value, min_order_amount)
    `)
    .eq('user_id', user.id);

  if (error) {
    console.error('쿠폰 조회 에러:', error);
    throw error;
  }

  return (data ?? []).map((item: any) => ({
    user_coupon_id: item.id,
    coupon_id: item.coupon_id,
    is_used: item.is_used,
    name: item.coupons?.name ?? '알 수 없는 쿠폰',
    discount_type: item.coupons?.discount_type ?? 'amount',
    discount_value: item.coupons?.discount_value ?? 0,
    min_order_amount: item.coupons?.min_order_amount ?? 0,
  }));
}

/**
 * 수량 업데이트
 */
export async function updateQuantity(targetId: string, newQuantity: number): Promise<void> {
  if (newQuantity < 1) throw new Error('수량은 1 이상이어야 합니다.');

  const { error } = await supabase
    .from('cart_items')
    .update({ quantity: newQuantity })
    .eq('id', targetId);

  if (error) throw error;
}