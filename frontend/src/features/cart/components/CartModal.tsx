// ─────────────────────────────────────────────────────────────
// CartModal.tsx
// 장바구니 Drawer의 "껍데기(모달 컨테이너)" 역할만 담당.
// - 배경 오버레이 (클릭 시 닫힘)
// - 우측 슬라이드 애니메이션 패널
// - 안에 들어갈 내용은 CartDrawer에게 완전히 위임
//
// [왜 이렇게 나누나요?]
// "언제 보이나?" (열림/닫힘, 애니메이션) 와
// "무엇을 보여주나?" (아이템 목록, 합계) 는 서로 다른 책임입니다.
// 껍데기와 내용을 분리하면, 나중에 애니메이션만 바꾸거나
// 내용만 바꿀 때 서로 영향을 주지 않습니다.
// ─────────────────────────────────────────────────────────────
import React from 'react';
import { useCartContext } from '../context/CartContext';
import { CartDrawer } from './CartDrawer';

export const CartModal: React.FC = () => {
    const { isOpen, closeCart } = useCartContext();

    return (
        <>
            {/* ── 배경 오버레이 ── */}
            {/* isOpen일 때만 렌더. 클릭하면 Drawer 닫힘 */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/40 z-40 backdrop-blur-sm"
                    onClick={closeCart}
                />
            )}

            {/* ── 슬라이드 패널 ── */}
            {/*
        translate-x-full  → 화면 오른쪽 밖에 숨겨둠 (닫힌 상태)
        translate-x-0     → 제자리로 슬라이드인 (열린 상태)
        transition-transform으로 300ms 부드럽게 애니메이션
      */}
            <aside
                className={`
          fixed top-0 right-0 h-full w-full max-w-sm
          bg-white dark:bg-slate-900
          shadow-2xl z-50
          transform transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : 'translate-x-full'}
        `}
            >
                {/* 실제 내용은 CartDrawer가 전담 */}
                <CartDrawer />
            </aside>
        </>
    );
};