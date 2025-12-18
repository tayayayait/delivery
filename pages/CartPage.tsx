import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  MapPin,
  Phone,
  Wallet,
  CreditCard,
  AlertCircle,
  Minus,
  Plus,
  Trash2,
  Truck,
  Loader2,
} from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import { createOrder, getStore, getStoreMenu } from '../services/api';
import { MenuItem, PaymentMethod, StoreMenuSection, Store } from '../types';

const SUGGESTED_ADDRESSES = [
  '서울시 강남구 테헤란로 123, 1001호',
  '서울시 마포구 와우산로 12길 45, 302호',
  '경기도 성남시 분당구 판교로 200, 5층',
];

const SERVICE_KEYWORDS = ['서울', '성남', '분당', '강남', '마포'];

const CartPage: React.FC = () => {
  const navigate = useNavigate();
  const { state, totalPrice, totalQuantity, updateItemQuantity, removeItem, clearCart, setSpecialRequest } = useCart();
  const [storeInfo, setStoreInfo] = useState<Store | null>(null);
  const [menuSections, setMenuSections] = useState<StoreMenuSection[]>([]);
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('card');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showValidation, setShowValidation] = useState(false);
  const [isDeliverable, setIsDeliverable] = useState<boolean | null>(null);
  const [specialRequestInput, setSpecialRequestInput] = useState(state.specialRequest || '');
  const idempotencyKeyRef = useRef('');

  useEffect(() => {
    if (!idempotencyKeyRef.current) {
      idempotencyKeyRef.current =
        typeof crypto !== 'undefined' && 'randomUUID' in crypto
          ? crypto.randomUUID()
          : Math.random().toString(36).slice(2);
    }
  }, []);

  useEffect(() => {
    if (!state.storeId) return;
    Promise.all([getStore(state.storeId), getStoreMenu(state.storeId)])
      .then(([storeData, sections]) => {
        if (storeData) setStoreInfo(storeData);
        setMenuSections(sections);
      })
      .catch(() => {
        // ignore fetch errors, cart can still display
      });
  }, [state.storeId]);

  useEffect(() => {
    if (address.trim().length === 0) {
      setIsDeliverable(null);
      return;
    }
    const deliverable = SERVICE_KEYWORDS.some((keyword) => address.includes(keyword));
    setIsDeliverable(deliverable);
  }, [address]);

  const normalizedPhone = phone.replace(/\D/g, '');
  const isPhoneValid = /^0\d{8,10}$/.test(normalizedPhone);
  const isAddressValid = address.trim().length >= 10 && isDeliverable !== false;
  const isFormValid = isAddressValid && isPhoneValid && totalQuantity > 0 && Boolean(state.storeId);

  const menuLookup = useMemo(() => {
    const map: Record<number, MenuItem> = {};
    menuSections.forEach((section) => {
      section.items.forEach((item) => {
        map[item.id] = item;
      });
    });
    return map;
  }, [menuSections]);

  const handleSpecialRequest = (value: string) => {
    setSpecialRequestInput(value);
    setSpecialRequest(value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!state.storeId || loading) return;
    setShowValidation(true);
    if (!isFormValid) {
      setError('입력값을 확인해주세요.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const payload = {
        store_id: state.storeId,
        items: state.items.map((item) => ({
          menu_id: item.menuId,
          quantity: item.quantity,
          options: Object.entries(item.selections).map(([option_id, choice_ids]) => ({
            option_id,
            choice_ids,
          })),
        })),
        address,
        phone: normalizedPhone,
        payment_method: paymentMethod,
        idempotencyKey: idempotencyKeyRef.current,
      };
      const result = await createOrder(payload);
      if (result.success) {
        const uuid = result.tracking_uuid;
        clearCart();
        navigate(`/track/${uuid}`);
      }
    } catch (err: any) {
      setError(err?.message || '주문 처리 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const renderOptionSummary = (menuId: number, selections: Record<string, string[]>) => {
    const menu = menuLookup[menuId];
    if (!menu?.options) return null;
    return menu.options.map((option) => {
      const selected = selections[option.id] || [];
      if (selected.length === 0) return null;
      const labels = selected
        .map((choiceId) => option.choices.find((choice) => choice.id === choiceId)?.label)
        .filter(Boolean);
      if (labels.length === 0) return null;
      return (
        <p key={option.id} className="text-xs font-bold text-gray-400">
          {option.name} · {labels.join(', ')}
        </p>
      );
    });
  };

  if (!state.storeId || totalQuantity === 0) {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        <div className="p-4 flex items-center gap-4">
          <button onClick={() => navigate('/')} className="p-2 -ml-2 hover:bg-gray-100 rounded-full">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h2 className="font-black text-xl">장바구니</h2>
        </div>
        <div className="flex-1 flex flex-col justify-center items-center gap-4 px-6 text-center">
          <Truck className="w-12 h-12 text-gray-200" />
          <p className="font-black text-gray-800">아직 담은 메뉴가 없습니다.</p>
          <button
            onClick={() => navigate('/')}
            className="px-4 py-2 rounded-2xl bg-yellow-400 text-black font-black active:scale-95"
          >
            가게 둘러보기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-36 flex flex-col">
      <div className="p-4 flex items-center gap-4 bg-white">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 hover:bg-gray-100 rounded-full">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h2 className="font-black text-xl">장바구니 · 결제</h2>
      </div>

      <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
        <div className="p-4 space-y-6">
          <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-xs font-bold text-gray-400">주문 매장</p>
                <p className="text-lg font-black text-gray-900">{state.storeName || '알 수 없는 매장'}</p>
                {storeInfo && (
                  <p className="text-[11px] font-bold text-gray-400">
                    최소 {storeInfo.minOrder.toLocaleString()}원 · 배달비 {storeInfo.deliveryFee.toLocaleString()}원
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={clearCart}
                className="text-xs font-bold text-gray-400 hover:text-red-500 flex items-center gap-1"
              >
                <Trash2 className="w-4 h-4" /> 비우기
              </button>
            </div>

            <div className="space-y-3">
              {state.items.map((item) => (
                <div key={item.id} className="border border-gray-100 rounded-2xl p-4 bg-gray-50">
                  <div className="flex gap-3">
                    {item.menuImage && (
                      <img src={item.menuImage} alt={item.menuName} className="w-16 h-16 rounded-2xl object-cover" />
                    )}
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-black text-gray-900">{item.menuName}</p>
                          <p className="text-sm font-bold text-gray-500">
                            {(item.basePrice + item.optionsPrice).toLocaleString()}원
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeItem(item.id)}
                          className="text-xs font-bold text-gray-400 hover:text-red-500"
                        >
                          삭제
                        </button>
                      </div>
                      <div className="mt-2 space-y-1">{renderOptionSummary(item.menuId, item.selections)}</div>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => updateItemQuantity(item.id, item.quantity - 1)}
                        className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center active:scale-95"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="text-lg font-black">{item.quantity}</span>
                      <button
                        type="button"
                        onClick={() => updateItemQuantity(item.id, item.quantity + 1)}
                        className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center active:scale-95"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                    <p className="text-lg font-black text-gray-900">
                      {((item.basePrice + item.optionsPrice) * item.quantity).toLocaleString()}원
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <label className="flex items-center gap-2 text-xs font-black text-gray-400 uppercase tracking-widest">
              <MapPin className="w-3 h-3" /> 배달 주소
            </label>
            <textarea
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="도로명 주소 또는 지번 주소를 입력하세요 (동, 호수 포함)"
              className="w-full h-28 p-5 rounded-3xl bg-white border border-gray-100 focus:ring-2 focus:ring-yellow-400 outline-none resize-none font-medium placeholder:text-gray-300"
            />
            {(showValidation || address.length > 0) && !isAddressValid && (
              <p className="text-xs font-bold text-red-500">배달 가능 지역인지와 상세 주소(동/호수)를 확인해주세요.</p>
            )}
            <div className="flex items-center gap-2 flex-wrap">
              {SUGGESTED_ADDRESSES.map((addr) => (
                <button
                  type="button"
                  key={addr}
                  onClick={() => setAddress(addr)}
                  className="px-3 py-1 rounded-full bg-gray-100 text-xs font-bold text-gray-600 hover:bg-gray-200"
                >
                  {addr}
                </button>
              ))}
            </div>
            <p className="text-[11px] font-bold mt-1">
              {isDeliverable === null && <span className="text-gray-400">배송 가능 지역을 확인 중...</span>}
              {isDeliverable === true && <span className="text-green-600">배달 가능 지역입니다.</span>}
              {isDeliverable === false && <span className="text-red-500">배달 불가 지역일 수 있습니다.</span>}
            </p>
          </div>

          <div className="space-y-3">
            <label className="flex items-center gap-2 text-xs font-black text-gray-400 uppercase tracking-widest">
              <Phone className="w-3 h-3" /> 연락처
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
              placeholder="숫자만 입력하세요"
              className="w-full p-5 rounded-3xl bg-white border border-gray-100 focus:ring-2 focus:ring-yellow-400 outline-none font-medium placeholder:text-gray-300"
            />
            {(showValidation || phone.length > 0) && !isPhoneValid && (
              <p className="text-xs font-bold text-red-500">휴대폰 번호 9~11자리(숫자만)를 입력해주세요.</p>
            )}
          </div>

          <div className="space-y-3">
            <label className="flex items-center gap-2 text-xs font-black text-gray-400 uppercase tracking-widest">
              요청 사항
            </label>
            <textarea
              value={specialRequestInput}
              onChange={(e) => handleSpecialRequest(e.target.value)}
              placeholder="예: 초인종 누르지 말아주세요."
              className="w-full h-20 p-5 rounded-3xl bg-white border border-gray-100 focus:ring-2 focus:ring-yellow-400 outline-none resize-none font-medium placeholder:text-gray-300"
            />
          </div>

          <div className="space-y-3">
            <label className="flex items-center gap-2 text-xs font-black text-gray-400 uppercase tracking-widest">
              결제 수단
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setPaymentMethod('card')}
                className={`p-4 rounded-2xl border text-left flex items-center gap-2 ${
                  paymentMethod === 'card' ? 'border-gray-900 bg-gray-900 text-white' : 'border-gray-200 bg-white'
                }`}
              >
                <CreditCard className="w-4 h-4" />
                <div>
                  <p className="text-sm font-black">신용/체크카드</p>
                  <p className="text-[11px] font-bold opacity-80">간편 결제 지원</p>
                </div>
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod('cash')}
                className={`p-4 rounded-2xl border text-left flex items-center gap-2 ${
                  paymentMethod === 'cash' ? 'border-gray-900 bg-gray-900 text-white' : 'border-gray-200 bg-white'
                }`}
              >
                <Wallet className="w-4 h-4" />
                <div>
                  <p className="text-sm font-black">현장 결제</p>
                  <p className="text-[11px] font-bold opacity-80">현금/단말기</p>
                </div>
              </button>
            </div>
          </div>

          <div className="bg-white border border-dashed border-gray-200 rounded-3xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-black text-gray-400">총 주문 수량</span>
              <span className="text-sm font-black text-gray-900">{totalQuantity}개</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-black text-gray-400">상품 금액</span>
              <span className="text-lg font-black text-gray-900">{totalPrice.toLocaleString()}원</span>
            </div>
            {storeInfo && (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-black text-gray-400">배달비</span>
                  <span className="text-sm font-black text-gray-900">
                    {storeInfo.deliveryFee > 0 ? `${storeInfo.deliveryFee.toLocaleString()}원` : '무료'}
                  </span>
                </div>
                <div className="flex items-center justify-between border-t border-gray-100 pt-2">
                  <span className="text-sm font-black text-gray-400">최소 주문금액</span>
                  <span className="text-sm font-black text-gray-900">{storeInfo.minOrder.toLocaleString()}원</span>
                </div>
              </>
            )}
          </div>

          {error && (
            <div className="p-4 bg-red-50 rounded-2xl text-sm font-bold text-red-600 border border-red-100">
              {error}
            </div>
          )}
        </div>

        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-4 py-4">
          <button
            type="submit"
            disabled={loading || !isFormValid}
            className={`w-full py-4 rounded-2xl font-black text-lg flex items-center justify-center gap-2 ${
              loading || !isFormValid
                ? 'bg-gray-100 text-gray-300 cursor-not-allowed'
                : 'bg-yellow-400 text-black active:scale-[0.98]'
            }`}
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" /> 주문 전송 중...
              </>
            ) : (
              `${totalPrice.toLocaleString()}원 주문하기`
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CartPage;
