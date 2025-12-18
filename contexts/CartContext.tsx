import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { CartItem, CartState } from '../types';

const STORAGE_KEY = 'flash_delivery_cart_state';

const createEmptyState = (): CartState => ({
  storeId: null,
  storeName: null,
  storeLogo: null,
  items: [],
  specialRequest: '',
});

const generateLineId = () =>
  typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);

const normalizeSelections = (input: Record<string, string[]> = {}) => {
  const normalized: Record<string, string[]> = {};
  Object.entries(input).forEach(([key, values]) => {
    normalized[key] = [...values].sort();
  });
  return normalized;
};

const buildSelectionKey = (selections: Record<string, string[]>) =>
  Object.entries(selections)
    .map(([key, values]) => `${key}:${values.join(',')}`)
    .sort()
    .join('|');

const sanitizeCartItem = (item: any): CartItem | null => {
  if (!item || typeof item !== 'object') return null;
  const menuId = Number(item.menuId);
  const quantity = Math.max(1, Number(item.quantity) || 1);
  const basePrice = Number(item.basePrice) || 0;
  const optionsPrice = Number(item.optionsPrice) || 0;
  const menuName = typeof item.menuName === 'string' ? item.menuName : '메뉴';
  const selections = normalizeSelections((item.selections ?? {}) as Record<string, string[]>);

  if (!Number.isFinite(menuId)) return null;

  return {
    id: typeof item.id === 'string' ? item.id : generateLineId(),
    menuId,
    menuName,
    menuImage: typeof item.menuImage === 'string' ? item.menuImage : undefined,
    basePrice,
    optionsPrice,
    quantity,
    selections,
  };
};

const sanitizeCartState = (raw: any): CartState => {
  if (!raw || typeof raw !== 'object') {
    return createEmptyState();
  }

  const items = Array.isArray(raw.items)
    ? raw.items.map(sanitizeCartItem).filter(Boolean) as CartItem[]
    : [];

  return {
    storeId: typeof raw.storeId === 'number' ? raw.storeId : null,
    storeName: typeof raw.storeName === 'string' ? raw.storeName : null,
    storeLogo: typeof raw.storeLogo === 'string' ? raw.storeLogo : null,
    items,
    specialRequest: typeof raw.specialRequest === 'string' ? raw.specialRequest : '',
  };
};

const loadInitialState = (): CartState => {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
    return createEmptyState();
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return createEmptyState();
    }
    return sanitizeCartState(JSON.parse(raw));
  } catch {
    return createEmptyState();
  }
};

const mergeCartItems = (items: CartItem[], draft: CartItemDraft) => {
  const normalizedSelections = normalizeSelections(draft.selections);
  const quantity = Math.max(1, draft.quantity || 1);
  const fingerprint = buildSelectionKey(normalizedSelections);
  const index = items.findIndex(
    (item) => item.menuId === draft.menuId && buildSelectionKey(item.selections) === fingerprint
  );

  if (index >= 0) {
    const next = items.slice();
    const existing = next[index];
    next[index] = {
      ...existing,
      quantity: existing.quantity + quantity,
      basePrice: draft.basePrice,
      optionsPrice: draft.optionsPrice,
    };
    return next;
  }

  return [
    ...items,
    {
      ...draft,
      id: generateLineId(),
      selections: normalizedSelections,
      quantity,
    },
  ];
};

const appendItemToState = (prev: CartState, store: StoreDescriptor, draft: CartItemDraft): CartState => {
  const sameStore = prev.storeId === store.id && prev.storeId !== null;
  const workingItems = sameStore ? prev.items.slice() : [];
  const merged = mergeCartItems(workingItems, draft);

  return {
    storeId: store.id,
    storeName: store.name,
    storeLogo: store.logo ?? null,
    items: merged,
    specialRequest: sameStore ? (prev.specialRequest ?? '') : '',
  };
};

const CartContext = createContext<CartContextValue | undefined>(undefined);

export interface CartItemDraft extends Omit<CartItem, 'id'> {}

export interface StoreDescriptor {
  id: number;
  name: string;
  logo?: string | null;
}

export interface PendingCartSwitch {
  store: StoreDescriptor;
  item: CartItemDraft;
}

export interface CartContextValue {
  state: CartState;
  totalQuantity: number;
  totalPrice: number;
  pendingSwitch: PendingCartSwitch | null;
  addItem: (store: StoreDescriptor, item: CartItemDraft) => void;
  replaceItem: (itemId: string, item: CartItemDraft) => void;
  updateItemQuantity: (itemId: string, quantity: number) => void;
  removeItem: (itemId: string) => void;
  clearCart: () => void;
  setSpecialRequest: (value: string) => void;
  confirmSwitch: () => void;
  cancelSwitch: () => void;
}

export const CartProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [state, setState] = useState<CartState>(() => loadInitialState());
  const [pendingSwitch, setPendingSwitch] = useState<PendingCartSwitch | null>(null);

  const persistState = useCallback((next: CartState) => {
    if (typeof localStorage === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // fail silently
    }
  }, []);

  const addItem = useCallback(
    (store: StoreDescriptor, draft: CartItemDraft) => {
      setState((prev) => {
        if (prev.storeId && prev.storeId !== store.id) {
          setPendingSwitch({ store, item: draft });
          return prev;
        }
        const next = appendItemToState(prev, store, draft);
        persistState(next);
        setPendingSwitch(null);
        return next;
      });
    },
    [persistState]
  );

  const replaceItem = useCallback(
    (itemId: string, draft: CartItemDraft) => {
      setState((prev) => {
        const index = prev.items.findIndex((item) => item.id === itemId);
        if (index < 0) return prev;
        const normalized = normalizeSelections(draft.selections);
        const nextItems = prev.items.slice();
        nextItems[index] = { ...draft, id: itemId, selections: normalized };
        const nextState = { ...prev, items: nextItems };
        persistState(nextState);
        return nextState;
      });
    },
    [persistState]
  );

  const removeItem = useCallback(
    (itemId: string) => {
      setState((prev) => {
        const items = prev.items.filter((item) => item.id !== itemId);
        if (items.length === prev.items.length) {
          return prev;
        }
        const nextState = items.length === 0
          ? createEmptyState()
          : { ...prev, items };
        persistState(nextState);
        return nextState;
      });
    },
    [persistState]
  );

  const updateItemQuantity = useCallback(
    (itemId: string, quantity: number) => {
      if (quantity <= 0) {
        removeItem(itemId);
        return;
      }
      setState((prev) => {
        const index = prev.items.findIndex((item) => item.id === itemId);
        if (index < 0) return prev;
        const nextItems = prev.items.slice();
        nextItems[index] = { ...nextItems[index], quantity };
        const nextState = { ...prev, items: nextItems };
        persistState(nextState);
        return nextState;
      });
    },
    [persistState, removeItem]
  );

  const clearCart = useCallback(() => {
    setPendingSwitch(null);
    setState(() => {
      const empty = createEmptyState();
      persistState(empty);
      return empty;
    });
  }, [persistState]);

  const setSpecialRequest = useCallback(
    (value: string) => {
      setState((prev) => {
        if (!prev.storeId) return prev;
        const nextState = { ...prev, specialRequest: value };
        persistState(nextState);
        return nextState;
      });
    },
    [persistState]
  );

  const confirmSwitch = useCallback(() => {
    setPendingSwitch((current) => {
      if (!current) return null;
      setState(() => {
        const next = appendItemToState(createEmptyState(), current.store, current.item);
        persistState(next);
        return next;
      });
      return null;
    });
  }, [persistState]);

  const cancelSwitch = useCallback(() => {
    setPendingSwitch(null);
  }, []);

  const totalQuantity = useMemo(
    () => state.items.reduce((sum, item) => sum + item.quantity, 0),
    [state.items]
  );

  const totalPrice = useMemo(
    () => state.items.reduce((sum, item) => sum + (item.basePrice + item.optionsPrice) * item.quantity, 0),
    [state.items]
  );

  const value: CartContextValue = {
    state,
    totalQuantity,
    totalPrice,
    pendingSwitch,
    addItem,
    replaceItem,
    updateItemQuantity,
    removeItem,
    clearCart,
    setSpecialRequest,
    confirmSwitch,
    cancelSwitch,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useCart = (): CartContextValue => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within CartProvider');
  }
  return context;
};
