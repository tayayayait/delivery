import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Star, Clock, MapPin, ShieldCheck, AlertTriangle, PhoneCall, Info, MessageSquare } from 'lucide-react';
import { getStore, getStoreMenu } from '../services/api';
import { MenuItem, StoreMenuSection, Store } from '../types';
import OptionBottomSheet from '../components/OptionBottomSheet';
import CartBar from '../components/CartBar';
import { StoreDescriptor } from '../contexts/CartContext';

const StorePage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const storeId = Number(id);
  const [store, setStore] = useState<Store | null>(null);
  const [sections, setSections] = useState<StoreMenuSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedMenu, setSelectedMenu] = useState<MenuItem | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'menu' | 'info' | 'review'>('menu');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!storeId) {
      setError('가게 정보를 찾을 수 없습니다.');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    Promise.all([getStore(storeId), getStoreMenu(storeId)])
      .then(([storeData, menuData]) => {
        if (!storeData) {
          setError('가게 정보를 찾을 수 없습니다.');
          return;
        }
        setStore(storeData);
        setSections(menuData);
      })
      .catch((err: any) => {
        setError(err?.message || '가게 정보를 불러오지 못했습니다.');
      })
      .finally(() => setLoading(false));
  }, [storeId]);

  const storeDescriptor = useMemo<StoreDescriptor | null>(() => {
    if (!store) return null;
    return { id: store.id, name: store.name, logo: store.logo };
  }, [store]);

  const handleSelectMenu = (item: MenuItem) => {
    if (item.is_sold_out) return;
    setSelectedMenu(item);
    setSheetOpen(true);
  };

  useEffect(() => {
    if (!toastMessage) return;
    const timer = setTimeout(() => setToastMessage(null), 2500);
    return () => clearTimeout(timer);
  }, [toastMessage]);

  const closeSheet = () => {
    setSheetOpen(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        <div className="p-4 flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 hover:bg-gray-100 rounded-full">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h2 className="font-black text-xl">가게 불러오는 중...</h2>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin w-10 h-10 border-4 border-yellow-100 border-t-yellow-400 rounded-full" />
        </div>
      </div>
    );
  }

  if (error || !store) {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        <div className="p-4 flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 hover:bg-gray-100 rounded-full">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h2 className="font-black text-xl">가게 정보</h2>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center gap-4 px-6 text-center">
          <AlertTriangle className="w-10 h-10 text-red-500" />
          <p className="font-black text-gray-700">{error || '가게 데이터를 불러올 수 없습니다.'}</p>
          <button
            onClick={() => navigate('/')}
            className="px-4 py-2 rounded-2xl bg-yellow-400 text-black font-black active:scale-95"
          >
            홈으로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-28 bg-gray-50 min-h-screen">
      <div className="relative">
        <div className="absolute top-4 left-4 z-10">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-full bg-white/80 backdrop-blur hover:bg-white shadow-sm"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        </div>
        <img
          src={store.heroImage || store.logo}
          alt={store.name}
          className="w-full h-52 object-cover"
        />
      </div>

      <div className="px-5 -mt-8 space-y-4">
        <div className="bg-white rounded-[32px] shadow-sm p-5">
          <div className="flex items-start gap-4">
            {store.logo && (
              <img src={store.logo} alt={store.name} className="w-16 h-16 rounded-2xl object-cover border border-gray-100" />
            )}
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-2xl font-black">{store.name}</h1>
                {store.isOpen ? (
                  <span className="text-[11px] font-black text-green-600 bg-green-50 px-2 py-0.5 rounded-full">영업 중</span>
                ) : (
                  <span className="text-[11px] font-black text-red-500 bg-red-50 px-2 py-0.5 rounded-full">준비 중</span>
                )}
              </div>
              {store.description && <p className="text-sm font-bold text-gray-500">{store.description}</p>}
              <div className="flex items-center gap-3 mt-3 text-sm font-bold text-gray-700">
                <span className="flex items-center gap-1">
                  <Star className="w-4 h-4 text-yellow-400 fill-current" />
                  {store.rating.toFixed(1)} ({store.reviewCount.toLocaleString()}명)
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4 text-gray-400" />
                  {store.etaMin}~{store.etaMax}분
                </span>
              </div>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <span className="text-[11px] font-bold text-gray-500 flex items-center gap-1">
              <MapPin className="w-3 h-3" /> 최소 {store.minOrder.toLocaleString()}원
            </span>
            <span className="text-[11px] font-bold text-gray-500">
              배달비 {store.deliveryFee > 0 ? `${store.deliveryFee.toLocaleString()}원` : '무료'}
            </span>
            {store.tags?.map((tag) => (
              <span key={tag} className="text-[11px] font-black text-gray-900 bg-gray-100 px-2 py-0.5 rounded-full">
                {tag}
              </span>
            ))}
          </div>
          {store.notice && (
            <div className="mt-4 p-3 rounded-2xl bg-yellow-50 border border-yellow-100 text-[12px] font-bold text-yellow-800 flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 mt-0.5" />
              {store.notice}
            </div>
          )}
        </div>
        <div className="rounded-[32px] bg-white border border-gray-100 p-2 flex items-center gap-2 text-sm font-black text-gray-500">
          <button
            type="button"
            onClick={() => setActiveTab('menu')}
            className={`flex-1 py-3 rounded-2xl transition ${
              activeTab === 'menu' ? 'bg-gray-900 text-white' : 'bg-white text-gray-500'
            }`}
          >
            메뉴
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('info')}
            className={`flex-1 py-3 rounded-2xl transition ${
              activeTab === 'info' ? 'bg-gray-900 text-white' : 'bg-white text-gray-500'
            }`}
          >
            정보
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('review')}
            className={`flex-1 py-3 rounded-2xl transition ${
              activeTab === 'review' ? 'bg-gray-900 text-white' : 'bg-white text-gray-500'
            }`}
          >
            리뷰
          </button>
        </div>
      </div>

      <div className="px-5 py-6 space-y-8">
        {activeTab === 'menu' && sections.map((section) => (
          <div key={section.id}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-xl font-black text-gray-900">{section.title}</h3>
                {section.description && (
                  <p className="text-sm font-bold text-gray-400">{section.description}</p>
                )}
              </div>
            </div>
            <div className="space-y-4">
              {section.items.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleSelectMenu(item)}
                  disabled={item.is_sold_out}
                  className={`w-full bg-white rounded-3xl border border-gray-100 p-4 flex gap-4 text-left transition-all ${
                    item.is_sold_out ? 'opacity-60 cursor-not-allowed' : 'active:scale-[0.99]'
                  }`}
                >
                  {item.image && (
                    <div className="relative">
                      <img src={item.image} alt={item.name} className="w-24 h-24 rounded-2xl object-cover" />
                      {item.is_sold_out && (
                        <span className="absolute inset-0 bg-black/40 text-white flex items-center justify-center text-xs font-black rounded-2xl">
                          준비 중
                        </span>
                      )}
                    </div>
                  )}
                  <div className="flex-1 flex flex-col gap-2">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h4 className="text-lg font-black text-gray-900">{item.name}</h4>
                        {item.description && (
                          <p className="text-[13px] font-bold text-gray-400 line-clamp-2">{item.description}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-black text-gray-900">{item.price.toLocaleString()}원</p>
                        {item.tag && <span className="text-[10px] font-black text-yellow-500">{item.tag}</span>}
                      </div>
                    </div>
                    {item.options && item.options.length > 0 && (
                      <p className="text-[11px] font-bold text-gray-400">
                        옵션 {item.options.length}개 · 필수 {item.options.filter((opt) => opt.required).length}개
                      </p>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        ))}

        {activeTab === 'info' && (
          <div className="bg-white rounded-[32px] border border-gray-100 p-5 space-y-4">
            <h3 className="text-lg font-black text-gray-900 flex items-center gap-2">
              <Info className="w-4 h-4" /> 매장 정보
            </h3>
            {store.address && (
              <div className="flex items-start gap-3 text-sm font-bold text-gray-600">
                <MapPin className="w-4 h-4 text-gray-400 mt-1" />
                <div>
                  <p className="text-xs uppercase text-gray-400 font-black">주소</p>
                  <p>{store.address}</p>
                </div>
              </div>
            )}
            {store.phone && (
              <div className="flex items-start gap-3 text-sm font-bold text-gray-600">
                <PhoneCall className="w-4 h-4 text-gray-400 mt-1" />
                <div>
                  <p className="text-xs uppercase text-gray-400 font-black">연락처</p>
                  <p>{store.phone}</p>
                </div>
              </div>
            )}
            {store.notice && (
              <div className="flex items-start gap-3 text-sm font-bold text-gray-600">
                <ShieldCheck className="w-4 h-4 text-gray-400 mt-1" />
                <div>
                  <p className="text-xs uppercase text-gray-400 font-black">공지</p>
                  <p>{store.notice}</p>
                </div>
              </div>
            )}
            {store.tags?.length ? (
              <div className="flex items-center gap-2 flex-wrap">
                {store.tags.map((tag) => (
                  <span key={tag} className="px-3 py-1 rounded-full bg-gray-50 text-xs font-black text-gray-600 border border-gray-100">
                    {tag}
                  </span>
                ))}
              </div>
            ) : null}
          </div>
        )}

        {activeTab === 'review' && (
          <div className="bg-white rounded-[32px] border border-gray-100 p-6 text-center space-y-3">
            <MessageSquare className="w-8 h-8 text-gray-200 mx-auto" />
            <p className="text-sm font-bold text-gray-500">
              아직 리뷰 시스템이 연결되지 않았습니다.
            </p>
            <p className="text-xs font-bold text-gray-400">빠른 시일 내 실제 고객 리뷰를 보여드릴게요.</p>
          </div>
        )}
      </div>

      <CartBar />
      <OptionBottomSheet
        open={sheetOpen}
        menu={selectedMenu}
        store={storeDescriptor}
        onClose={closeSheet}
        onAdded={() => setToastMessage('장바구니에 추가했어요!')}
      />
      {toastMessage && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-sm font-bold px-4 py-2 rounded-full shadow-lg">
          {toastMessage}
        </div>
      )}
    </div>
  );
};

export default StorePage;
