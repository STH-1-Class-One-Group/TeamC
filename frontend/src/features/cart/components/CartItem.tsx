// ─────────────────────────────────────────────────────────────
// CartItem.tsx
// 장바구니 목록의 "개별 아이템 행" 하나만 담당하는 컴포넌트.
//
// [왜 분리하나요?]
// 하나의 컴포넌트는 하나의 책임만 가져야 합니다 (단일 책임 원칙).
// CartDrawer가 "목록을 어떻게 출력할지"를 걱정한다면,
// CartItem은 "아이템 한 줄을 어떻게 보여줄지"만 담당합니다.
// → 나중에 아이템 UI를 바꿀 때 이 파일만 수정하면 됩니다.
// ─────────────────────────────────────────────────────────────
import React from 'react';
import { supabase } from '../../../api/supabaseClient';
import type { CartItemWithFood } from '../types/cart.types';

interface CartItemProps {
  item: CartItemWithFood; // food_id: number를 포함한 확장 타입
  onRemove: (cartItemId: string) => void; // 삭제 콜백 (부모에서 처리)
  onUpdateQuantity: (cartItemId: string, newQuantity: number) => void; // 수량 업데이트 콜백
}

export const CartItem: React.FC<CartItemProps> = ({ item, onRemove, onUpdateQuantity }) => {
  // 이미지 URL 처리: Storage 경로면 publicUrl로 변환, 이미 http면 그대로 사용
  const imageUrl = item.food_items.image_url.startsWith('http')
    ? item.food_items.image_url
    : supabase.storage
        .from('food-images')
        .getPublicUrl(item.food_items.image_url).data.publicUrl;

  return (
    <div className="flex items-center gap-3 p-3 rounded-xl bg-surface-container-lowest dark:bg-slate-800">
      {/* 음식 이미지 */}
      <img
        src={imageUrl}
        alt={item.food_items.name}
        className="w-16 h-16 object-cover rounded-lg flex-shrink-0"
      />

      {/* 음식 정보 */}
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-on-surface dark:text-white text-sm truncate">
          {item.food_items.name}
        </p>
        <p className="text-xs text-on-surface-variant mt-0.5">
          수량: {item.quantity}개
        </p>
        <p className="text-sm font-bold text-primary mt-1">
          ₩ {(item.food_items.price * item.quantity).toLocaleString()}
        </p>
      </div>

      {/* 삭제 버튼: 실제 삭제 처리는 부모(CartDrawer)가 담당 */}
      <div className="flex flex-col gap-1 flex-shrink-0">
        {/* + 버튼 */}
        <button
          onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
          className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-green-100 dark:hover:bg-green-900/30 text-green-500 transition-colors"
          aria-label="수량 증가"
        >
          <span className="material-symbols-outlined text-[18px]">add</span>
        </button>
        {/* - 버튼 */}
        <button
          onClick={() => onUpdateQuantity(item.id, Math.max(1, item.quantity - 1))}
          className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-orange-100 dark:hover:bg-orange-900/30 text-orange-500 transition-colors"
          aria-label="수량 감소"
        >
          <span className="material-symbols-outlined text-[18px]">remove</span>
        </button>
        {/* 삭제 버튼 */}
        <button
          onClick={() => onRemove(item.id)}
          className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-red-100 dark:hover:bg-red-900/30 text-red-500 transition-colors"
          aria-label="장바구니에서 삭제"
        >
          <span className="material-symbols-outlined text-[18px]">delete</span>
        </button>
      </div>
    </div>
  );
};
