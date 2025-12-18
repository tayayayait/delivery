import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingBag } from 'lucide-react';
import { useCart } from '../contexts/CartContext';

const CartBar: React.FC = () => {
  const navigate = useNavigate();
  const { totalQuantity, totalPrice, state } = useCart();

  if (!state.storeId || totalQuantity === 0) return null;

  return (
    <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md px-4 pb-4 z-40 pointer-events-none">
      <button
        className="w-full bg-gray-900 text-white rounded-[28px] py-4 px-5 flex items-center justify-between shadow-2xl pointer-events-auto active:scale-[0.98]"
        onClick={() => navigate('/cart')}
      >
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center">
            <ShoppingBag className="w-5 h-5" />
          </div>
          <div className="text-left">
            <p className="text-xs font-bold text-gray-400">{state.storeName || '장바구니'}</p>
            <p className="text-sm font-black">{totalQuantity}개 담음</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-lg font-black">{totalPrice.toLocaleString()}원</p>
          <p className="text-[11px] font-bold text-yellow-400">장바구니 이동</p>
        </div>
      </button>
    </div>
  );
};

export default CartBar;
