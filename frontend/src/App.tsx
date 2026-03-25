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
import { ProfileSetupModal, Profile } from './components/common/ProfileSetupModal';
import { CommunityPage } from './features/community/CommunityPage';
import { PostDetailPage } from './features/community/PostDetailPage';
import { PostWritePage } from './features/community/PostWritePage';
import PaymentSuccess from './features/cart/components/PaymentSuccess';

type StorageEntry = {
  key: string;
  store: Storage;
};

const getSupabaseAuthStorageEntries = (): StorageEntry[] => {
  if (typeof window === 'undefined') {
    return [];
  }

  const stores = [window.localStorage, window.sessionStorage];
  const entries: StorageEntry[] = [];

  for (const store of stores) {
    for (const key of Object.keys(store)) {
      if (key.startsWith('sb-') || key.startsWith('supabase.auth.')) {
        entries.push({ key, store });
      }
    }
  }

  return entries;
};

const clearSupabaseAuthStorage = () => {
  for (const entry of getSupabaseAuthStorageEntries()) {
    entry.store.removeItem(entry.key);
  }
};

const hasSupabaseAuthStorage = () => getSupabaseAuthStorageEntries().length > 0;

const loadProfile = async (currentUser: User): Promise<Profile | null> => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', currentUser.id)
    .maybeSingle();

  if (error) {
    console.error('[App] profile lookup failed:', error);
    return null;
  }

  return (data as Profile | null) ?? null;
};

const App: React.FC = () => {
  const [user, setUser] = useState<User | null | undefined>(undefined);
  const [profile, setProfile] = useState<Profile | null | undefined>(undefined);
  const [showProfileSetup, setShowProfileSetup] = useState(false);

  useEffect(() => {
    let isActive = true;

    const syncInitialSession = async () => {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      if (!isActive) {
        return;
      }

      if (error) {
        console.error('[App] getSession failed:', error);
      }

      const currentUser = session?.user ?? null;
      setUser(currentUser);
      if (!currentUser) {
        setProfile(null);
        setShowProfileSetup(false);
      }
    };

    void syncInitialSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!isActive) {
        return;
      }

      const currentUser = session?.user ?? null;
      setUser(currentUser);

      if (!currentUser) {
        setProfile(null);
        setShowProfileSetup(false);
      }
    });

    return () => {
      isActive = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    let isActive = true;

    const syncProfile = async () => {
      if (user === undefined) {
        return;
      }

      if (!user) {
        setProfile(null);
        setShowProfileSetup(false);
        return;
      }

      setProfile(undefined);
      setShowProfileSetup(false);

      const nextProfile = await loadProfile(user);
      if (!isActive) {
        return;
      }

      setProfile(nextProfile);
      setShowProfileSetup(!nextProfile);
    };

    void syncProfile();

    return () => {
      isActive = false;
    };
  }, [user]);

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut({ scope: 'local' });
    if (error) {
      console.error('[App] signOut failed:', error);
    }

    clearSupabaseAuthStorage();

    const {
      data: { session },
    } = await supabase.auth.getSession();
    const hasResidualStorage = hasSupabaseAuthStorage();

    setUser(null);
    setProfile(null);
    setShowProfileSetup(false);

    if ((session || hasResidualStorage) && typeof window !== 'undefined') {
      console.error('[App] signOut verification failed:', {
        hasSession: Boolean(session),
        hasResidualStorage,
      });
      window.location.replace(window.location.pathname);
    }
  };

  if (user === undefined) {
    return null;
  }

  return (
    <CartProvider>
      <BrowserRouter>
        <div className="min-h-screen flex flex-col bg-surface dark:bg-slate-950 transition-colors">
          <Header user={user} profile={profile ?? null} onSignOut={handleSignOut} />
          <main className="flex-grow pt-32 pb-20 px-6 max-w-7xl mx-auto w-full">
            <Routes>
              <Route path="/" element={<ShopPage />} />
              <Route path="/Dashboard" element={<DashboardPage />} />
              <Route path="/Meal" element={<MealPage />} />
              <Route path="/News" element={<NewsPage />} />
              <Route path="/payment-success" element={<PaymentSuccess />} />
              <Route path="/Community" element={<CommunityPage user={user} profile={profile ?? null} />} />
              <Route path="/Community/write" element={<PostWritePage user={user} profile={profile ?? null} />} />
              <Route path="/Community/:postId" element={<PostDetailPage user={user} profile={profile ?? null} />} />
              <Route path="/Community/:postId/edit" element={<PostWritePage user={user} profile={profile ?? null} />} />
            </Routes>
          </main>
          <Footer />
        </div>
        <CartModal />
        {showProfileSetup && user && (
          <ProfileSetupModal
            user={user}
            onProfileCreated={(newProfile) => {
              setProfile(newProfile);
              setShowProfileSetup(false);
            }}
            onSignOut={handleSignOut}
          />
        )}
      </BrowserRouter>
    </CartProvider>
  );
};

export default App;
