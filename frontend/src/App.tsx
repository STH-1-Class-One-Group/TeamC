import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Header } from './components/layout/Header';
import { Footer } from './components/layout/Footer';
import { DashboardPage } from './features/dashboard/DashboardPage';
import { ShopPage } from './features/shop/ShopPage';

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <div className="min-h-screen flex flex-col bg-surface dark:bg-slate-950 transition-colors">
        <Header />
        <main className="flex-grow pt-32 pb-20 px-6 max-w-7xl mx-auto w-full">
          <Routes>
            <Route path="/" element={<ShopPage />} />
            <Route path="/Dashboard" element={<DashboardPage />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </BrowserRouter>
  );
};

export default App;
