
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { createOrder, getMenu } from '../services/api';
import { MenuItem, MenuOption, PaymentMethod } from '../types';
import { ArrowLeft, Loader2, MapPin, Phone, AlertCircle, Plus, Minus, ChevronDown, CreditCard, Wallet } from 'lucide-react';

interface QuickOrderProps {
  menuId: number;
  onOrderSuccess: (uuid: string) => void;
}

type SelectionMap = Record<string, string[]>;

interface CartItemState {
  menuId: number;
  quantity: number;
  selections: SelectionMap;
}

const SUGGESTED_ADDRESSES = [
  '서울시 강남구 테헤란로 123, 1001호',
  '서울시 마포구 와우산로 12길 45, 302호',
  '경기도 성남시 분당구 판교로 200, 5층',
];

const SERVICE_KEYWORDS = ['서울', '성남', '분당', '강남', '마포'];

const QuickOrder: React.FC<QuickOrderProps> = ({ menuId, onOrderSuccess }) => {
  const [menuList, setMenuList] = useState<MenuItem[]>([]);
  const [cart, setCart] = useState<CartItemState[]>([]);
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('card');
  const [loading, setLoading] = useState(false);
  const [fetchingItem, setFetchingItem] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showValidation, setShowValidation] = useState(false);
  const [isDeliverable, setIsDeliverable] = useState<boolean | null>(null);
  const addressInputRef = useRef<HTMLTextAreaElement>(null);
  const idempotencyKeyRef = useRef<string>('');

  const normalizedPhone = phone.replace(/\D/g, '');
  const isPhoneValid = /^0\d{8,10}$/.test(normalizedPhone);
  const isAddressValid = address.trim().length >= 10 && isDeliverable !== false;
  const isFormValid = isAddressValid && isPhoneValid && cart.length > 0 && cart.every((c) => c.quantity > 0);

  useEffect(() => {
    getMenu()
      .then(data => {
        setMenuList(data);
        const selected = data.find(i => i.id === menuId);
        if (selected) {
          setCart([{
            menuId: selected.id,
            quantity: 1,
            selections: {},
          }]);
        }
      })
      .catch((err: any) => {
        console.error(err);
        setError(err?.message || '메뉴 정보를 불러오지 못했습니다.');
      })
      .finally(() => setFetchingItem(false));
    setTimeout(() => addressInputRef.current?.focus(), 500);
    if (!idempotencyKeyRef.current) {
      idempotencyKeyRef.current = typeof crypto !== 'undefined' && 'randomUUID' in crypto 
        ? crypto.randomUUID() 
        : Math.random().toString(36).slice(2);
    }
  }, [menuId]);

  useEffect(() => {
    const deliverable = SERVICE_KEYWORDS.some((keyword) => address.includes(keyword));
    if (address.trim().length > 0) {
      setIsDeliverable(deliverable);
    } else {
      setIsDeliverable(null);
    }
  }, [address]);

  const getMenuById = (id: number) => menuList.find((m) => m.id === id) || null;

  const toggleChoice = (itemIndex: number, option: MenuOption, choiceId: string) => {
    setCart((prev) => prev.map((item, idx) => {
      if (idx !== itemIndex) return item;
      const current = item.selections[option.id] || [];
      let nextChoices = current.includes(choiceId)
        ? current.filter((c) => c !== choiceId)
        : [...current, choiceId];
      if (nextChoices.length > option.maxSelect) {
        nextChoices = nextChoices.slice(nextChoices.length - option.maxSelect);
      }
      return {
        ...item,
        selections: { ...item.selections, [option.id]: nextChoices },
      };
    }));
  };

  const updateQuantity = (index: number, delta: number) => {
    setCart((prev) => prev.map((c, idx) => idx === index ? { ...c, quantity: Math.max(1, c.quantity + delta) } : c));
  };

  const removeItem = (index: number) => {
    setCart((prev) => prev.filter((_, idx) => idx !== index));
  };

  const addMenuToCart = (id: number) => {
    const target = getMenuById(id);
    if (!target) return;
    setCart((prev) => [...prev, { menuId: target.id, quantity: 1, selections: {} }]);
  };

  const calcLinePrice = (cartItem: CartItemState) => {
    const menu = getMenuById(cartItem.menuId);
    if (!menu) return 0;
    const optionPrice = (menu.options || []).reduce((sum, opt) => {
      const choices = cartItem.selections[opt.id] || [];
      const choicePrice = choices.reduce((p, cid) => {
        const choice = opt.choices.find((c) => c.id === cid);
        return p + (choice ? choice.price : 0);
      }, 0);
      return sum + choicePrice;
    }, 0);
    return (menu.price + optionPrice) * cartItem.quantity;
  };

  const cartTotal = useMemo(() => cart.reduce((sum, ci) => sum + calcLinePrice(ci), 0), [cart]);

  const validateRequiredOptions = () => {
    for (const ci of cart) {
      const menu = getMenuById(ci.menuId);
      if (!menu) continue;
      for (const opt of menu.options || []) {
        if (opt.required) {
          const selected = ci.selections[opt.id] || [];
          if (selected.length === 0) {
            return `필수 옵션을 선택해주세요: ${opt.name}`;
          }
        }
      }
    }
    return null;
  };

  const buildOrderPayload = () => {
    return cart.map((ci) => ({
      menu_id: ci.menuId,
      quantity: ci.quantity,
      options: Object.entries(ci.selections).map(([option_id, choice_ids]) => ({
        option_id,
        choice_ids,
      })),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    const optionError = validateRequiredOptions();
    if (!isFormValid || optionError) {
      setShowValidation(true);
      setError(optionError || '입력값을 확인해주세요.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const result = await createOrder({ 
        items: buildOrderPayload(), 
        address, 
        phone, 
        payment_method: paymentMethod,
        idempotencyKey: idempotencyKeyRef.current 
      });
      if (result.success) {
        onOrderSuccess(result.tracking_uuid);
      }
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : '주문 처리 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  if (fetchingItem) return <div className="p-20 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-yellow-500" /></div>;
  if (cart.length === 0) return (
    <div className="p-20 text-center space-y-4">
      <div className="font-black text-gray-900">메뉴 정보를 찾을 수 없습니다.</div>
      {error && <div className="text-sm font-bold text-red-500">{error}</div>}
      <button
        onClick={() => window.history.back()}
        className="px-4 py-2 rounded-xl bg-yellow-400 text-black font-black text-sm active:scale-95"
      >
        메뉴 목록으로 돌아가기
      </button>
    </div>
  );

  return (
    <div className="flex flex-col min-h-[calc(100vh-64px)] bg-white">
      <div className="p-4 flex items-center gap-4 sticky top-0 bg-white z-20">
        <button onClick={() => window.history.back()} className="p-2 -ml-2 hover:bg-gray-100 rounded-full">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h2 className="font-black text-xl">주문하기</h2>
      </div>

      <form onSubmit={handleSubmit} className="flex-1 flex flex-col p-4 pb-32">
        <div className="space-y-6 flex-1">
          <div className="bg-gray-50 rounded-3xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-lg font-black text-gray-900">장바구니</h4>
              <span className="text-xs font-black text-gray-400">다중 메뉴/옵션 지원</span>
            </div>

            <div className="space-y-4">
              {cart.map((ci, idx) => {
                const menu = getMenuById(ci.menuId);
                if (!menu) return null;
                return (
                  <div key={`${ci.menuId}-${idx}`} className="bg-white border border-gray-100 rounded-3xl p-4 space-y-3 shadow-sm">
                    <div className="flex items-start gap-3">
                      <img src={menu.image} className="w-16 h-16 rounded-2xl object-cover" alt="" />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h5 className="font-black text-gray-900">{menu.name}</h5>
                          <button type="button" onClick={() => removeItem(idx)} className="text-xs font-bold text-gray-400 hover:text-red-500">삭제</button>
                        </div>
                        <p className="text-sm font-bold text-gray-500">{menu.price.toLocaleString()}원</p>
                      </div>
                    </div>

                    {(menu.options || []).map((opt) => (
                      <div key={opt.id} className="space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black text-gray-700">{opt.name}</span>
                          {opt.required && <span className="text-[10px] font-black text-red-500">필수</span>}
                          <span className="text-[10px] font-bold text-gray-400">최대 {opt.maxSelect}개</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {opt.choices.map((choice) => {
                            const selected = (ci.selections[opt.id] || []).includes(choice.id);
                            return (
                              <button
                                type="button"
                                key={choice.id}
                                onClick={() => toggleChoice(idx, opt, choice.id)}
                                className={`px-3 py-2 rounded-2xl text-xs font-black border transition-all ${
                                  selected ? 'bg-gray-900 text-white border-gray-900' : 'bg-gray-50 text-gray-700 border-gray-100'
                                }`}
                              >
                                {choice.label} {choice.price > 0 && `+${choice.price.toLocaleString()}원`}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <button type="button" onClick={() => updateQuantity(idx, -1)} className="w-9 h-9 rounded-full border border-gray-200 flex items-center justify-center active:scale-95">
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="text-lg font-black">{ci.quantity}</span>
                        <button type="button" onClick={() => updateQuantity(idx, 1)} className="w-9 h-9 rounded-full border border-gray-200 flex items-center justify-center active:scale-95">
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-bold text-gray-400">소계</p>
                        <p className="text-lg font-black text-gray-900">{calcLinePrice(ci).toLocaleString()}원</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="bg-white border border-dashed border-gray-200 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                  <span className="text-sm font-black text-gray-700">메뉴 추가</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {menuList.filter((m) => !m.is_sold_out).map((m) => (
                  <button
                    type="button"
                    key={m.id}
                    onClick={() => addMenuToCart(m.id)}
                    className="p-3 rounded-2xl border border-gray-100 bg-gray-50 text-left hover:bg-white active:scale-95"
                  >
                    <p className="text-sm font-black text-gray-900 line-clamp-1">{m.name}</p>
                    <p className="text-xs font-bold text-gray-500">{m.price.toLocaleString()}원</p>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <label className="flex items-center gap-2 text-xs font-black text-gray-400 uppercase tracking-widest">
              <MapPin className="w-3 h-3" /> 배달 주소
            </label>
            <textarea
              ref={addressInputRef}
              required
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="도로명 주소 또는 지번 주소를 입력하세요 (동, 호수 포함)"
              className="w-full h-28 p-5 rounded-3xl bg-gray-50 border-transparent focus:bg-white focus:ring-2 focus:ring-yellow-400 focus:border-transparent outline-none transition-all resize-none font-medium placeholder:text-gray-300"
            />
              {(showValidation || address.length > 0) && !isAddressValid && (
                <p className="text-xs font-bold text-red-500">배달 가능 지역인지와 상세 주소(동/호수)를 확인해주세요.</p>
              )}
            <div className="flex items-center gap-2 flex-wrap mt-2">
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
            <p className="text-[11px] font-bold mt-2">
              {isDeliverable === null && <span className="text-gray-400">배송 가능 지역을 확인 중...</span>}
              {isDeliverable === true && <span className="text-green-600">배달 가능 지역입니다.</span>}
              {isDeliverable === false && <span className="text-red-500">배달 불가 지역일 수 있습니다. 주소를 다시 확인해주세요.</span>}
            </p>
          </div>

          <div className="space-y-3">
            <label className="flex items-center gap-2 text-xs font-black text-gray-400 uppercase tracking-widest">
              <Phone className="w-3 h-3" /> 연락처
            </label>
            <input
              type="tel"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
              placeholder="숫자만 입력하세요"
              className="w-full p-5 rounded-3xl bg-gray-50 border-transparent focus:bg-white focus:ring-2 focus:ring-yellow-400 focus:border-transparent outline-none transition-all font-medium placeholder:text-gray-300"
            />
            {(showValidation || phone.length > 0) && !isPhoneValid && (
              <p className="text-xs font-bold text-red-500">휴대폰 번호 9~11자리(숫자만)를 입력해주세요.</p>
            )}
          </div>

          <div className="space-y-3">
            <label className="flex items-center gap-2 text-xs font-black text-gray-400 uppercase tracking-widest">
              결제 수단
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setPaymentMethod('card')}
                className={`p-4 rounded-2xl border text-left flex items-center gap-2 ${paymentMethod === 'card' ? 'border-gray-900 bg-gray-900 text-white' : 'border-gray-200 bg-gray-50'}`}
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
                className={`p-4 rounded-2xl border text-left flex items-center gap-2 ${paymentMethod === 'cash' ? 'border-gray-900 bg-gray-900 text-white' : 'border-gray-200 bg-gray-50'}`}
              >
                <Wallet className="w-4 h-4" />
                <div>
                  <p className="text-sm font-black">현장 결제</p>
                  <p className="text-[11px] font-bold opacity-80">현금/단말기</p>
                </div>
              </button>
            </div>
          </div>

          <div className="flex items-start gap-2 p-4 bg-blue-50 rounded-2xl">
            <AlertCircle className="w-4 h-4 text-blue-500 mt-0.5" />
            <p className="text-[11px] text-blue-600 font-bold leading-relaxed">
              안심번호 서비스가 기본으로 적용됩니다. 소중한 고객님의 개인정보를 보호합니다.
            </p>
          </div>

          {error && (
            <div className="p-4 bg-red-50 rounded-2xl text-sm font-bold text-red-600 border border-red-100">
              {error}
            </div>
          )}

          <div className="bg-gray-900 text-white rounded-3xl p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-gray-300">예상 결제 금액</p>
              <p className="text-2xl font-black">{cartTotal.toLocaleString()}원</p>
            </div>
            <div className="text-right">
              <p className="text-xs font-bold text-gray-300">주문 항목</p>
              <p className="text-sm font-black">{cart.length}개 메뉴</p>
            </div>
          </div>
        </div>

        <div className="fixed bottom-0 left-0 right-0 p-4 max-w-md mx-auto bg-white border-t">
          <button
            type="submit"
            disabled={loading || !isFormValid}
            className={`w-full py-5 rounded-2xl font-black text-lg shadow-lg transition-all flex items-center justify-center gap-2 ${
              loading || !isFormValid 
                ? 'bg-gray-100 text-gray-300 cursor-not-allowed shadow-none' 
                : 'bg-yellow-400 text-black active:scale-[0.98]'
            }`}
          >
            {loading ? (
              <>
                <Loader2 className="w-6 h-6 animate-spin" />
                주문 전송 중...
              </>
            ) : (
              `${cartTotal.toLocaleString()}원 결제하기`
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default QuickOrder;
