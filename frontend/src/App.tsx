import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { User } from '@supabase/supabase-js';
import { Header } from './components/layout/Header';
import { Footer } from './components/layout/Footer';
import { DashboardPage } from './features/dashboard/DashboardPage';
import { MealPage } from './features/meal/MealPage';
import { NewsPage } from './features/news/NewsPage';
import { ShopPage } from './features/shop/ShopPage';
import { CartProvider } from './features/cart/context/CartContext';
import { CartModal } from './features/cart/components/CartModal';
import { supabase } from './api/supabaseClient';
// ⭐ 1. 성공 페이지 컴포넌트를 임포트합니다.
import PaymentSuccess from './features/cart/components/PaymentSuccess';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null | undefined>(undefined);

  useEffect(() => {
    supabase.auth.getSession()
      .then(({ data: { session } }) => {
        setUser(session?.user ?? null);
      })
      .catch((error) => {
        console.error('[App] failed to initialize auth session:', error);
        setUser(null);
      });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error('[App] sign out failed:', error);
    }
  };

  if (user === undefined) {
    return null; 
  }

  return (
    <CartProvider>
      <BrowserRouter>
        <div className="min-h-screen flex flex-col bg-surface dark:bg-slate-950 transition-colors">
          <Header user={user} onSignOut={handleSignOut} />
          <main className="flex-grow pt-32 pb-20 px-6 max-w-7xl mx-auto w-full">
            <Routes>
              <Route path="/" element={<ShopPage />} />
              <Route path="/Dashboard" element={<DashboardPage />} />
              <Route path="/Meal" element={<MealPage />} />
              <Route path="/News" element={<NewsPage />} />
              {/* ⭐ 2. 결제 성공 페이지 경로를 추가합니다. */}
              <Route path="/payment-success" element={<PaymentSuccess />} />
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
