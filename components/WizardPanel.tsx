
import React, { useEffect, useState } from 'react';
import { getAllOrders, updateOrderStatus, getMenu, UnauthorizedError } from '../services/api';
import { Order, OrderStatus, MenuItem } from '../types';
import { ExternalLink, RefreshCw, Check, CookingPot, Bike, PackageCheck, XCircle, LogOut } from 'lucide-react';

interface WizardPanelProps {
  onUnauthorized?: () => void;
  onLogout?: () => void;
}

const WizardPanel: React.FC<WizardPanelProps> = ({ onUnauthorized, onLogout }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [initialLoad, setInitialLoad] = useState(true);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [fetchedOrders, fetchedMenu] = await Promise.all([getAllOrders(), getMenu()]);
      setOrders(fetchedOrders);
      setMenu(fetchedMenu);
    } catch (err: any) {
      if (err instanceof UnauthorizedError) {
        onUnauthorized?.();
        setError('관리자 인증이 필요합니다. 다시 로그인해주세요.');
      } else {
        setError(err?.message || '주문 목록을 불러오지 못했습니다.');
      }
    } finally {
      setLoading(false);
      setInitialLoad(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleUpdate = async (id: number, status: OrderStatus, eta?: number) => {
    setActionId(id);
    try {
      await updateOrderStatus(id, status, eta);
      await loadData();
    } catch (err: any) {
      if (err instanceof UnauthorizedError) {
        onUnauthorized?.();
      } else {
        setError(err?.message || '상태 변경에 실패했습니다.');
      }
    }
    setActionId(null);
  };

  const getItemName = (id: number) => menu.find(i => i.id === id)?.name || '알 수 없는 메뉴';
  const getOrderSummary = (order: Order) => {
    const items = order.items || [];
    const count = items.reduce((sum, it) => sum + it.quantity, 0) || 1;
    const total = order.total_price ?? items.reduce((sum, it) => sum + it.line_price, 0);
    return { count, total };
  };

  return (
    <div className="p-4 bg-gray-50 min-h-screen">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-black">매장 관리 시스템</h1>
          <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest">Wizard Dashboard</p>
        </div>
        <div className="flex items-center gap-2">
          {error && <span className="text-[11px] font-bold text-red-500">{error}</span>}
          {onLogout && (
            <button 
              onClick={onLogout}
              className="p-3 bg-white border border-gray-100 rounded-2xl shadow-sm active:scale-95 transition-all flex items-center gap-2 text-xs font-black text-gray-500"
            >
              <LogOut className="w-4 h-4" /> 로그아웃
            </button>
          )}
          <button 
            onClick={loadData}
            disabled={loading}
            className="p-3 bg-white border border-gray-100 rounded-2xl shadow-sm active:scale-95 transition-all"
          >
            <RefreshCw className={`w-5 h-5 text-gray-400 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {initialLoad && loading && (
          <div className="bg-white border border-gray-100 rounded-[2rem] p-12 text-center shadow-sm">
            <RefreshCw className="w-8 h-8 text-yellow-400 animate-spin mx-auto mb-3" />
            <p className="text-sm font-bold text-gray-500">주문 목록을 불러오는 중...</p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-100 rounded-[1.5rem] p-4 flex items-center justify-between">
            <p className="text-[11px] font-bold text-red-600">{error}</p>
            <button 
              onClick={loadData}
              className="text-[11px] font-black text-red-600 underline"
            >
              다시 시도
            </button>
          </div>
        )}

        {orders.length === 0 && !loading && (
          <div className="bg-white border-2 border-dashed border-gray-200 rounded-[2rem] p-16 text-center text-gray-300 font-bold">
            아직 들어온 주문이 없습니다.
            <div className="mt-4">
              <button 
                onClick={loadData}
                className="px-4 py-2 rounded-xl bg-yellow-400 text-black text-xs font-black active:scale-95"
              >
                새로고침
              </button>
            </div>
          </div>
        )}
        
        {orders.map((order) => (
          <div key={order.id} className="bg-white border border-gray-100 rounded-[2rem] p-6 shadow-sm">
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[10px] font-black bg-gray-900 text-white px-2 py-0.5 rounded">#{order.id}</span>
                  <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded border ${
                    order.status === OrderStatus.PENDING ? 'bg-blue-50 text-blue-600 border-blue-100' : 
                    order.status === OrderStatus.ARRIVED ? 'bg-green-50 text-green-600 border-green-100' : 
                    'bg-gray-50 text-gray-500 border-gray-100'
                  }`}>
                    {order.status}
                  </span>
                </div>
                <h3 className="font-black text-xl text-gray-900 mb-1">{getItemName(order.menu_id)}</h3>
                <div className="text-xs font-bold text-gray-500">
                  {(() => {
                    const { count, total } = getOrderSummary(order);
                    return `${count}개 항목 · ${total ? total.toLocaleString() + '원' : '총액 미확인'}`;
                  })()}
                </div>
                <p className="text-xs font-bold text-gray-500 bg-gray-50 inline-block px-2 py-1 rounded mb-2">{order.customer_address}</p>
                <div className="text-sm font-black text-blue-500">{order.customer_phone}</div>
              </div>
              <a 
                href={`#/track/${order.tracking_uuid}`} 
                target="_blank" 
                rel="noreferrer"
                className="p-3 bg-gray-50 rounded-2xl hover:bg-gray-100 transition-colors"
              >
                <ExternalLink className="w-5 h-5 text-gray-400" />
              </a>
            </div>

            <div className="grid grid-cols-2 gap-2 mt-6">
              {order.status === OrderStatus.PENDING && (
                <button 
                  onClick={() => handleUpdate(order.id, OrderStatus.ACCEPTED, 20)}
                  disabled={actionId === order.id}
                  className="flex items-center justify-center gap-2 bg-blue-600 text-white py-3 rounded-2xl text-xs font-black shadow-md active:scale-95 transition-all"
                >
                  <Check className="w-4 h-4" /> 주문 수락 (20분)
                </button>
              )}
              {order.status === OrderStatus.ACCEPTED && (
                <button 
                  onClick={() => handleUpdate(order.id, OrderStatus.COOKING)}
                  disabled={actionId === order.id}
                  className="flex items-center justify-center gap-2 bg-orange-500 text-white py-3 rounded-2xl text-xs font-black shadow-md active:scale-95 transition-all"
                >
                  <CookingPot className="w-4 h-4" /> 조리 시작
                </button>
              )}
              {order.status === OrderStatus.COOKING && (
                <button 
                  onClick={() => handleUpdate(order.id, OrderStatus.DELIVERING)}
                  disabled={actionId === order.id}
                  className="flex items-center justify-center gap-2 bg-yellow-400 text-black py-3 rounded-2xl text-xs font-black shadow-md active:scale-95 transition-all"
                >
                  <Bike className="w-4 h-4" /> 배달 시작
                </button>
              )}
              {order.status === OrderStatus.DELIVERING && (
                <button 
                  onClick={() => handleUpdate(order.id, OrderStatus.ARRIVED)}
                  disabled={actionId === order.id}
                  className="flex items-center justify-center gap-2 bg-black text-white py-3 rounded-2xl text-xs font-black shadow-md active:scale-95 transition-all"
                >
                  <PackageCheck className="w-4 h-4" /> 배달 완료
                </button>
              )}
              {order.status !== OrderStatus.ARRIVED && order.status !== OrderStatus.CANCELED && (
                <button 
                  onClick={() => handleUpdate(order.id, OrderStatus.CANCELED)}
                  disabled={actionId === order.id}
                  className="flex items-center justify-center gap-2 bg-red-50 text-red-500 py-3 rounded-2xl text-xs font-black active:scale-95 transition-all"
                >
                  <XCircle className="w-4 h-4" /> 주문 취소
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default WizardPanel;
