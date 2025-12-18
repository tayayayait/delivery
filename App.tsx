
import React, { useState } from 'react';
import { HashRouter, Routes, Route, useParams } from 'react-router-dom';
import StatusTracker from './components/StatusTracker';
import WizardPanel from './components/WizardPanel';
import AdminLogin from './components/AdminLogin';
import { Zap } from 'lucide-react';
import { clearAdminToken, isAdminAuthenticated } from './services/api';
import StorePage from './pages/StorePage';
import CartPage from './pages/CartPage';
import { CartProvider } from './contexts/CartContext';
import { LocationProvider } from './contexts/LocationContext';
import HomePage from './pages/HomePage';
import CategoryPage from './pages/CategoryPage';

const Header = ({ isAdmin }: { isAdmin: boolean }) => {
  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-white border-b z-50 px-4 flex items-center justify-between shadow-sm">
      <div className="flex items-center gap-2 cursor-pointer" onClick={() => window.location.hash = '/'}>
        <div className="bg-yellow-400 p-1.5 rounded-lg shadow-sm">
          <Zap className="w-5 h-5 text-black fill-current" />
        </div>
        <span className="font-extrabold text-xl tracking-tighter">FLASH DELIVERY</span>
      </div>
      <div className="flex items-center gap-4">
        <button 
          onClick={() => window.location.hash = '/cart'} 
          className="text-[10px] font-bold text-gray-600 hover:text-gray-900 transition-colors border border-gray-200 px-2 py-1 rounded"
        >
          장바구니
        </button>
        <button 
          onClick={() => window.location.hash = '/admin'} 
          className="text-[10px] font-bold text-gray-400 hover:text-gray-600 transition-colors border border-gray-200 px-2 py-1 rounded"
        >
          {isAdmin ? '관리자 대시보드' : '관리자 로그인'}
        </button>
      </div>
    </header>
  );
};

const TrackPage = () => {
  const { uuid } = useParams();
  if (!uuid) return <div className="p-10 text-center font-bold">잘못된 링크입니다.</div>;
  return <StatusTracker trackingUuid={uuid} />;
};

const App: React.FC = () => {
  const [isAdmin, setIsAdmin] = useState(isAdminAuthenticated());

  const AdminPage: React.FC = () => {
    const [isAuthed, setIsAuthed] = useState(isAdminAuthenticated());

    const handleLogout = () => {
      clearAdminToken();
      setIsAuthed(false);
      setIsAdmin(false);
    };

    if (!isAuthed) {
      return <AdminLogin onSuccess={() => { setIsAuthed(true); setIsAdmin(true); }} />;
    }

    return <WizardPanel onUnauthorized={handleLogout} onLogout={handleLogout} />;
  };
  return (
    <LocationProvider>
      <CartProvider>
        <HashRouter>
          <div className="min-h-screen bg-gray-50 flex flex-col items-center">
            <Header isAdmin={isAdmin} />
            <main className="pt-16 max-w-md w-full min-h-screen bg-white shadow-lg relative overflow-x-hidden">
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/category/:id" element={<CategoryPage />} />
                <Route path="/store/:id" element={<StorePage />} />
                <Route path="/cart" element={<CartPage />} />
                <Route path="/track/:uuid" element={<TrackPage />} />
                <Route path="/admin" element={<AdminPage />} />
              </Routes>
            </main>
          </div>
        </HashRouter>
      </CartProvider>
    </LocationProvider>
  );
};

export default App;
