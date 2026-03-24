import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { User } from '@supabase/supabase-js';
import { Header } from './components/layout/Header';
import { Footer } from './components/layout/Footer';
import { DashboardPage } from './features/dashboard/DashboardPage';
import { MealPage } from './features/meal/MealPage';
import { ShopPage } from './features/shop/ShopPage';
import { CartProvider } from './features/cart/context/CartContext';
import { CartModal } from './features/cart/components/CartModal';
import { supabase } from './api/supabaseClient';

const App: React.FC = () => {
  // ── 로그인 상태 관리 ──────────────────────────────────────────
  // User | null: 로그인 시 User 객체, 비로그인 시 null
  // undefined: 아직 Supabase에서 상태를 받아오기 전(로딩 중)
  const [user, setUser] = useState<User | null | undefined>(undefined);

  useEffect(() => {
    // 1) 앱 최초 로드 시 현재 세션 확인
    //    페이지 새로고침 후에도 로그인 상태를 복원하기 위함
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    // 2) 이후 로그인/로그아웃 이벤트를 실시간으로 감지
    //    onAuthStateChange는 Supabase가 자동으로 호출해주는 이벤트 리스너
    //    - SIGNED_IN : 로그인 성공 → session.user로 상태 업데이트
    //    - SIGNED_OUT: 로그아웃   → null로 상태 업데이트
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
      }
    );

    // 3) 컴포넌트가 언마운트될 때 리스너 정리 (메모리 누수 방지)
    return () => subscription.unsubscribe();
  }, []);

  // ── 로그아웃 함수 ─────────────────────────────────────────────
  // Header에 props로 내려줄 함수. 호출하면 Supabase 세션이 종료되고
  // onAuthStateChange가 SIGNED_OUT 이벤트를 발생시켜 user → null
  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  // user가 undefined면 아직 인증 상태 로딩 중 → 빈 화면 방지용
  if (user === undefined) {
    return null; // 또는 <SplashScreen /> 같은 로딩 UI로 교체 가능
  }

  return (
    <CartProvider>
      <BrowserRouter>
        <div className="min-h-screen flex flex-col bg-surface dark:bg-slate-950 transition-colors">
          {/* user와 handleSignOut을 Header에 props로 전달 */}
          <Header user={user} onSignOut={handleSignOut} />
          <main className="flex-grow pt-32 pb-20 px-6 max-w-7xl mx-auto w-full">
            <Routes>
              <Route path="/" element={<ShopPage />} />
              <Route path="/Dashboard" element={<DashboardPage />} />
              <Route path="/Meal" element={<MealPage />} />
            </Routes>
          </main>
          <Footer />
        </div>
        <CartModal />
      </BrowserRouter>
    </CartProvider>
  );
};

export default App;
