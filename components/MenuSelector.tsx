
import React, { useEffect, useState } from 'react';
import { getMenu } from '../services/api';
import { MenuItem } from '../types';
import { Loader2, ChevronRight, Zap } from 'lucide-react';

interface MenuSelectorProps {
  onSelect: (id: number) => void;
}

const MenuSelector: React.FC<MenuSelectorProps> = ({ onSelect }) => {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadMenu = () => {
    setLoading(true);
    setError(null);
    getMenu().then(data => {
      setItems(data);
      setLoading(false);
    }).catch((err: any) => {
      setError(err?.message || '메뉴를 불러오지 못했습니다.');
      setLoading(false);
    });
  };

  useEffect(() => {
    loadMenu();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-yellow-500" />
        <p className="mt-4 text-sm font-bold text-gray-400">맛집 메뉴 불러오는 중...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-96 space-y-4">
        <p className="text-sm font-bold text-red-500">{error}</p>
        <button 
          onClick={loadMenu}
          className="px-4 py-2 rounded-xl bg-yellow-400 text-black font-black text-sm active:scale-95"
        >
          다시 시도하기
        </button>
      </div>
    );
  }

  if (!loading && !error && items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-96 space-y-4">
        <p className="text-sm font-bold text-gray-500">표시할 메뉴가 없습니다.</p>
        <button 
          onClick={loadMenu}
          className="px-4 py-2 rounded-xl bg-yellow-400 text-black font-black text-sm active:scale-95"
        >
          새로고침
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6">
      <div className="py-4">
        <h1 className="text-3xl font-black leading-tight">오늘 뭐 드실래요?</h1>
        <div className="flex items-center gap-1 mt-2">
          <Zap className="w-4 h-4 text-yellow-500 fill-current" />
          <p className="text-gray-500 text-sm font-bold">플래시 특급 메뉴</p>
        </div>
      </div>

      <div className="space-y-5">
        {items.map((item) => (
          <div 
            key={item.id}
            className={`group relative overflow-hidden rounded-[2rem] bg-white border border-gray-100 shadow-sm transition-all duration-300 ${
              item.is_sold_out ? 'opacity-60 cursor-not-allowed' : 'hover:shadow-md active:scale-[0.98] cursor-pointer'
            }`}
            onClick={() => !item.is_sold_out && onSelect(item.id)}
          >
            <div className="h-56 overflow-hidden relative">
              <img 
                src={item.image} 
                alt={item.name}
                className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-500"
              />
              {item.tag && !item.is_sold_out && (
                <div className="absolute top-4 left-4 bg-yellow-400 text-black text-[11px] font-black px-3 py-1 rounded-full shadow-sm">
                  {item.tag}
                </div>
              )}
              {item.is_sold_out && (
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                  <span className="bg-white/90 text-black px-6 py-2 rounded-full font-black text-sm">준비 중</span>
                </div>
              )}
            </div>
            <div className="p-5">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-xl font-black text-gray-900">{item.name}</h3>
                  <p className="text-gray-500 text-sm mt-1 line-clamp-1">{item.description}</p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-black text-gray-900">{item.price.toLocaleString()}원</div>
                </div>
              </div>
              <div className="mt-4 flex justify-end">
                <div className="w-8 h-8 rounded-full bg-gray-900 text-white flex items-center justify-center">
                  <ChevronRight className="w-5 h-5" />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="p-6 bg-yellow-50 border border-yellow-100 rounded-3xl mt-10">
        <p className="text-yellow-800 text-[10px] font-black uppercase tracking-widest mb-1">Flash Promise</p>
        <p className="text-yellow-900 font-bold italic text-sm leading-relaxed">
          "지금 주문하면 다른 앱보다 평균 15분 더 일찍 도착합니다."
        </p>
      </div>
    </div>
  );
};

export default MenuSelector;
