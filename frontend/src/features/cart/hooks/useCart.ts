import { useCartContext } from '../context/CartContext';

export function useCart() {
  // context가 바뀌면 이 훅을 쓰는 모든 컴포넌트(Header, Icon, Drawer)가 
  // 즉시 리렌더링되도록 연결만 해줍니다.
  return useCartContext();
}