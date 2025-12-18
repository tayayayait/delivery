
import React, { useEffect, useState, useCallback } from 'react';
import { getOrderStatus, getMenu } from '../services/api';
import { Order, OrderStatus, MenuItem } from '../types';
import { CheckCircle2, Bike, Flame, Timer, Share2, AlertCircle, RefreshCcw, Zap, ShoppingBag, Home } from 'lucide-react';

const STATUS_CONFIG = {
  [OrderStatus.PENDING]: {
    label: "주문 확인 중",
    desc: "매장에서 주문을 확인하고 있습니다.",
    icon: Timer,
    color: "bg-blue-500",
    step: 0
  },
  [OrderStatus.ACCEPTED]: {
    label: "주문 접수 완료",
    desc: "매장에서 곧 조리를 시작합니다.",
    icon: CheckCircle2,
    color: "bg-green-500",
    step: 1
  },
  [OrderStatus.COOKING]: {
    label: "맛있게 조리 중",
    desc: "음식이 정성스럽게 준비되고 있어요!",
    icon: Flame,
    color: "bg-orange-500",
    step: 2
  },
  [OrderStatus.DELIVERING]: {
    label: "번쩍 배달 중",
    desc: "플래시 라이더가 빠르게 이동하고 있습니다.",
    icon: Bike,
    color: "bg-yellow-500",
    step: 3
  },
  [OrderStatus.ARRIVED]: {
    label: "배달 완료",
    desc: "음식이 도착했습니다. 맛있게 드세요!",
    icon: CheckCircle2,
    color: "bg-green-600",
    step: 4
  },
  [OrderStatus.CANCELED]: {
    label: "주문 취소",
    desc: "주문이 취소되었습니다. 고객센터로 문의주세요.",
    icon: AlertCircle,
    color: "bg-red-500",
    step: -1
  }
};

const StatusTracker: React.FC<{ trackingUuid: string }> = ({ trackingUuid }) => {
  const [order, setOrder] = useState<Order | null>(null);
  const [item, setItem] = useState<MenuItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorCount, setErrorCount] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [pollDelay, setPollDelay] = useState(5000);
  const [shouldPoll, setShouldPoll] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isCopying, setIsCopying] = useState(false);

  const fetchStatus = useCallback(async () => {
    const isFirstLoad = loading;
    if (!isFirstLoad) setRefreshing(true);
    try {
      const updatedOrder = await getOrderStatus(trackingUuid);
      if (updatedOrder) {
        setOrder(updatedOrder);
        if (!item) {
          const menu = await getMenu();
          setItem(menu.find(i => i.id === updatedOrder.menu_id) || null);
        }
        setErrorCount(0);
        setErrorMessage(null);
        setPollDelay(5000);
        if (updatedOrder.status === OrderStatus.ARRIVED || updatedOrder.status === OrderStatus.CANCELED) {
          setShouldPoll(false);
        } else {
          setShouldPoll(true);
        }
      } else {
        setOrder(null);
        setShouldPoll(false);
        setErrorMessage('주문을 찾을 수 없습니다.');
      }
    } catch (err) {
      setErrorMessage('상태를 불러오지 못했습니다. 네트워크를 확인해주세요.');
      setErrorCount(prev => {
        const next = prev + 1;
        if (next >= 5) {
          setShouldPoll(false);
        }
        return next;
      });
      setPollDelay((prev) => Math.min(prev * 2, 40000));
    } finally {
      if (isFirstLoad) {
        setLoading(false);
      }
      setRefreshing(false);
    }
  }, [trackingUuid, item, loading]);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  useEffect(() => {
    if (!shouldPoll) return;
    const timer = setTimeout(() => {
      fetchStatus();
    }, pollDelay);
    return () => clearTimeout(timer);
  }, [fetchStatus, pollDelay, shouldPoll]);

  const handleShare = () => {
    const url = `${window.location.origin}${window.location.pathname}#/track/${trackingUuid}`;
    navigator.clipboard.writeText(url);
    setIsCopying(true);
    setTimeout(() => setIsCopying(false), 2000);
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-screen -mt-16 bg-white">
      <div className="relative">
        <div className="w-16 h-16 border-4 border-yellow-100 border-t-yellow-400 rounded-full animate-spin"></div>
        <Zap className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 text-yellow-500 fill-current" />
      </div>
      <p className="mt-6 font-black text-gray-400 animate-pulse">주문 정보 찾는 중...</p>
    </div>
  );

  if (!order) return <div className="p-20 text-center"><AlertCircle className="w-10 h-10 mx-auto text-red-500 mb-2"/>주문을 찾을 수 없습니다.</div>;

  const currentStatus = STATUS_CONFIG[order.status];
  const steps = [OrderStatus.ACCEPTED, OrderStatus.COOKING, OrderStatus.DELIVERING, OrderStatus.ARRIVED];
  const currentStepIndex = steps.indexOf(order.status);
  const orderItems = order.items && order.items.length > 0
    ? order.items
    : item ? [{ menu_name: item.name, quantity: 1, line_price: item.price, menu_id: item.id, options: [], unit_price: item.price, options_price: 0 }] : [];
  const totalPrice = order.total_price ?? orderItems.reduce((sum, it: any) => sum + (it.line_price || 0), 0);

  return (
    <div className="pb-10 bg-white animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* ETA & Status Header */}
      <div className="p-6 pt-10 text-center border-b border-gray-50">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-yellow-400 rounded-full mb-4">
          <Zap className="w-3 h-3 text-black fill-current" />
          <span className="text-[10px] font-black uppercase tracking-wider">Flash Delivery</span>
        </div>
        
        {order.delivery_eta ? (
          <div className="mb-2">
            <h1 className="text-4xl font-black text-gray-900">
              {new Date(order.delivery_eta).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} 도착 예정
            </h1>
            <p className="text-sm font-bold text-gray-400 mt-2">다른 앱보다 15분 더 일찍!</p>
          </div>
        ) : (
          <h1 className="text-3xl font-black text-gray-900">{currentStatus.label}</h1>
        )}
      </div>

      {/* Progress Illustration (Coupang Eats Style) */}
      <div className="p-8 px-10">
        <div className="flex justify-between items-center relative mb-12">
          <div className="absolute top-1/2 left-0 right-0 h-[2px] bg-gray-100 -translate-y-1/2 z-0"></div>
          <div 
            className="absolute top-1/2 left-0 h-[2px] bg-yellow-400 -translate-y-1/2 z-0 transition-all duration-1000"
            style={{ width: `${Math.max(0, currentStepIndex) * 33.33}%` }}
          ></div>

          {[
            { icon: ShoppingBag, label: "접수" },
            { icon: Flame, label: "조리" },
            { icon: Bike, label: "배달" },
            { icon: Home, label: "완료" }
          ].map((s, idx) => {
            const isActive = idx <= currentStepIndex;
            return (
              <div key={idx} className="relative z-10 flex flex-col items-center gap-3">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center border-4 border-white shadow-sm transition-all duration-500 ${
                  isActive ? 'bg-yellow-400 text-black scale-110' : 'bg-gray-100 text-gray-300'
                }`}>
                  <s.icon className="w-5 h-5" />
                </div>
                <span className={`text-xs font-black ${isActive ? 'text-gray-900' : 'text-gray-300'}`}>{s.label}</span>
              </div>
            );
          })}
        </div>

        {/* Status Description Card */}
        <div className="bg-gray-50 rounded-[2.5rem] p-8 text-center border border-gray-100">
          <p className="text-xl font-black text-gray-900 mb-2">{currentStatus.label}</p>
          <p className="text-sm font-bold text-gray-400">{currentStatus.desc}</p>
        </div>
      </div>

      {/* Order Info Summary */}
      <div className="px-6 mb-8">
        <div className="bg-white border border-gray-100 rounded-3xl p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-gray-400">주문 번호</p>
              <p className="text-sm font-black text-gray-900">#{order.id}</p>
            </div>
            <div className="text-right">
              <p className="text-xs font-bold text-gray-400">총 결제 금액</p>
              <p className="text-lg font-black text-gray-900">{totalPrice.toLocaleString()}원</p>
            </div>
          </div>
          <div className="divide-y divide-gray-100">
            {orderItems.map((oi: any, idx: number) => (
              <div key={idx} className="py-2 flex items-center justify-between">
                <div className="flex flex-col">
                  <p className="text-sm font-black text-gray-900">{oi.menu_name || item?.name}</p>
                  <p className="text-[11px] font-bold text-gray-400">x {oi.quantity}</p>
                </div>
                <p className="text-sm font-black text-gray-900">{(oi.line_price || 0).toLocaleString()}원</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Share Button */}
      <div className="px-6 space-y-4">
        <button 
          onClick={handleShare}
          className={`w-full py-5 rounded-2xl font-black text-lg transition-all active:scale-[0.98] border-2 flex items-center justify-center gap-2 ${
            isCopying ? 'bg-green-500 text-white border-green-500' : 'bg-white text-gray-900 border-gray-100 shadow-sm'
          }`}
        >
          {isCopying ? (
            <>
              <CheckCircle2 className="w-6 h-6" /> 링크 복사 완료
            </>
          ) : (
            <>
              <Share2 className="w-6 h-6" /> 실시간 위치 공유하기
            </>
          )}
        </button>
        
        <div className="flex items-center justify-center gap-2 py-4">
          <RefreshCcw className={`w-3 h-3 ${refreshing ? 'text-yellow-500 animate-spin' : 'text-gray-300'}`} />
          <p className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">
            {shouldPoll ? `자동 업데이트 (다음: ${(pollDelay / 1000).toFixed(0)}초)` : '자동 업데이트가 일시 중지됨'}
          </p>
        </div>
      </div>

      {(errorMessage || errorCount > 0) && (
        <div className="mt-4 px-6 space-y-2">
          {errorMessage && (
            <div className="bg-red-50 p-4 rounded-2xl flex items-center justify-between border border-red-100">
              <p className="text-[11px] font-bold text-red-600">{errorMessage}</p>
              <button 
                onClick={() => { setPollDelay(5000); setShouldPoll(true); fetchStatus(); }}
                className="text-[11px] font-black text-red-600 underline"
              >
                다시 시도
              </button>
            </div>
          )}
          {errorCount > 0 && (
            <div className="bg-orange-50 p-3 rounded-2xl text-[11px] font-bold text-orange-600">
              네트워크 재시도 중... ({errorCount}/5) &nbsp; 백오프: {(pollDelay / 1000).toFixed(0)}초
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default StatusTracker;
