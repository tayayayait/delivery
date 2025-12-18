import React, { useEffect, useMemo, useState } from 'react';
import { MenuItem, MenuOption } from '../types';
import { useCart, StoreDescriptor } from '../contexts/CartContext';
import { X, Minus, Plus, AlertCircle } from 'lucide-react';

interface OptionBottomSheetProps {
  open: boolean;
  menu: MenuItem | null;
  store: StoreDescriptor | null;
  onClose: () => void;
  onAdded?: () => void;
}

type SelectionMap = Record<string, string[]>;

const OptionBottomSheet: React.FC<OptionBottomSheetProps> = ({ open, menu, store, onClose, onAdded }) => {
  const { addItem } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [selections, setSelections] = useState<SelectionMap>({});
  const [showValidation, setShowValidation] = useState(false);

  useEffect(() => {
    if (open) {
      setQuantity(1);
      setSelections({});
      setShowValidation(false);
    }
  }, [open, menu?.id]);

  const toggleChoice = (option: MenuOption, choiceId: string) => {
    setSelections((prev) => {
      const current = prev[option.id] || [];
      let next = current.includes(choiceId)
        ? current.filter((id) => id !== choiceId)
        : [...current, choiceId];
      if (next.length > option.maxSelect) {
        next = next.slice(next.length - option.maxSelect);
      }
      return { ...prev, [option.id]: next };
    });
  };

  const missingRequired = useMemo(() => {
    if (!menu?.options) return false;
    return menu.options.some((option) => option.required && (selections[option.id]?.length ?? 0) === 0);
  }, [menu, selections]);

  const totalOptionPrice = useMemo(() => {
    if (!menu?.options) return 0;
    return menu.options.reduce((sum, option) => {
      const selected = selections[option.id] || [];
      const optionTotal = selected.reduce((choiceSum, choiceId) => {
        const choice = option.choices.find((c) => c.id === choiceId);
        return choice ? choiceSum + choice.price : choiceSum;
      }, 0);
      return sum + optionTotal;
    }, 0);
  }, [menu, selections]);

  const unitPrice = (menu?.price ?? 0) + totalOptionPrice;
  const linePrice = unitPrice * quantity;

  const handleAddToCart = () => {
    if (!menu || !store) return;
    setShowValidation(true);
    if (missingRequired) return;
    addItem(store, {
      menuId: menu.id,
      menuName: menu.name,
      menuImage: menu.image,
      basePrice: menu.price,
      optionsPrice: totalOptionPrice,
      quantity,
      selections,
    });
    onAdded?.();
    onClose();
  };

  if (!open || !menu || !store) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-50 w-full max-w-md bg-white rounded-t-[32px] shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <p className="text-sm font-bold text-gray-400 uppercase tracking-wide">{store.name}</p>
            <h3 className="text-xl font-black text-gray-900">{menu.name}</h3>
          </div>
          <button className="p-2 rounded-full hover:bg-gray-100" onClick={onClose}>
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 py-4 space-y-6 max-h-[65vh] overflow-y-auto">
          {menu.image && (
            <div className="rounded-3xl overflow-hidden">
              <img src={menu.image} alt={menu.name} className="w-full h-48 object-cover" />
            </div>
          )}
          {menu.description && <p className="text-sm font-bold text-gray-500">{menu.description}</p>}
          {menu.options && menu.options.length > 0 && (
            <div className="space-y-6">
              {menu.options.map((option) => {
                const selected = selections[option.id] || [];
                const isMissing = option.required && showValidation && selected.length === 0;
                return (
                  <div key={option.id} className="space-y-3">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-black text-gray-900">{option.name}</p>
                      {option.required && <span className="text-[10px] font-black text-red-500">필수</span>}
                      <span className="text-[10px] font-bold text-gray-400">최대 {option.maxSelect}개</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {option.choices.map((choice) => {
                        const active = selected.includes(choice.id);
                        return (
                          <button
                            key={choice.id}
                            type="button"
                            onClick={() => toggleChoice(option, choice.id)}
                            className={`px-4 py-2 rounded-2xl border text-xs font-black transition-all ${
                              active
                                ? 'bg-gray-900 text-white border-gray-900'
                                : 'bg-gray-50 text-gray-700 border-gray-200'
                            }`}
                          >
                            {choice.label}
                            {choice.price > 0 && <span className="ml-1 text-[11px]">+{choice.price.toLocaleString()}원</span>}
                          </button>
                        );
                      })}
                    </div>
                    {isMissing && (
                      <div className="flex items-center gap-1 text-[11px] font-bold text-red-500">
                        <AlertCircle className="w-3 h-3" />
                        선택이 필요한 옵션입니다.
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          <div className="flex items-center justify-between bg-gray-50 rounded-2xl p-4">
            <span className="text-sm font-black text-gray-600">수량</span>
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => setQuantity((prev) => Math.max(1, prev - 1))}
                className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center active:scale-95"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="text-lg font-black">{quantity}</span>
              <button
                type="button"
                onClick={() => setQuantity((prev) => prev + 1)}
                className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center active:scale-95"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-100 p-4">
          {missingRequired && showValidation && (
            <div className="mb-3 flex items-center gap-2 text-xs font-bold text-red-500 bg-red-50 border border-red-100 rounded-2xl px-3 py-2">
              <AlertCircle className="w-3 h-3" />
              필수 옵션을 모두 선택해주세요.
            </div>
          )}
          <button
            type="button"
            disabled={missingRequired}
            onClick={handleAddToCart}
            className={`w-full py-4 rounded-2xl font-black text-lg flex items-center justify-between px-5 transition-all ${
              missingRequired
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-yellow-400 text-black active:scale-[0.98]'
            }`}
          >
            <span>담기</span>
            <span>{linePrice.toLocaleString()}원</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default OptionBottomSheet;
