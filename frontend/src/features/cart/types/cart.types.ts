// ─────────────────────────────────────────────────────────────
// cart.types.ts
// "이 데이터는 이런 모양이다"를 TypeScript와 미리 약속하는 파일.
// 인터페이스를 먼저 정의하면 오타나 잘못된 속성을 컴파일 타임에 잡아준다.
// ─────────────────────────────────────────────────────────────

/** DB의 cart_items 테이블 한 행을 그대로 표현하는 타입 */
export interface CartItem {
  id: string;           // cart_items 고유 PK (UUID)
  user_id: string;      // 로그인 유저 UUID
  food_id: number;      // food_items.id가 INTEGER이므로 number!
  quantity: number;     // 수량
  created_at: string;   // 생성 시각 (ISO 문자열)
}

/**
 * 장바구니 목록 화면에서 사용하는 확장 타입.
 * Supabase의 .select('*, food_items(...)') JOIN 결과를 표현한다.
 * CartItem을 그대로 상속(extends)하므로 중복 코드가 없다.
 */
export interface CartItemWithFood extends CartItem {
  food_items: {
    id: number;
    name: string;
    price: number;
    image_url: string;
    calories: number;
  };
}

/** 장바구니에 추가할 때 서비스 함수에 넘기는 최소 정보 */
export type DiscountType = 'amount' | 'percentage';

export interface Coupon {
  user_coupon_id: string;
  coupon_id: number;
  name: string;
  discount_type: DiscountType;
  discount_value: number;
  min_order_amount: number;
  is_used: boolean;
}

export interface AddToCartPayload {
  food_id: number;    // 어떤 음식을?
  quantity?: number;  // 몇 개? (생략하면 1로 처리)
}
