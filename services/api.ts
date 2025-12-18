
import { 
  Order, 
  OrderStatus, 
  MenuItem, 
  PaymentMethod, 
  OrderItemOptionSelection, 
  Category,
  Store,
  StoreMenuSection
} from '../types';
import * as mockService from './mockService';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000').replace(/\/+$/, '');
const ADMIN_TOKEN_KEY = 'flash_delivery_admin_token';
const USE_DESIGN_MODE = import.meta.env.VITE_DESIGN_MODE !== 'false';

export class ApiError extends Error {
  status?: number;
  data?: unknown;

  constructor(message: string, status?: number, data?: unknown) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

export class UnauthorizedError extends ApiError {}

const buildUrl = (path: string) => `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;

const makeUuid = () => (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
  ? crypto.randomUUID()
  : Math.random().toString(36).slice(2));

const readJson = async (response: Response) => {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
};

const apiFetch = async <T>(
  path: string,
  options: RequestInit & { skipAuth?: boolean; timeoutMs?: number } = {}
): Promise<T> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), options.timeoutMs ?? 10000);

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  const token = getAdminToken();
  if (!options.skipAuth && token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  let response: Response;
  try {
    response = await fetch(buildUrl(path), {
      ...options,
      headers,
      signal: controller.signal,
    });
  } catch (err: any) {
    clearTimeout(timeoutId);
    throw new ApiError(err?.message || '네트워크 오류');
  }

  clearTimeout(timeoutId);
  const data = await readJson(response);

  if (!response.ok) {
    if (response.status === 401) {
      throw new UnauthorizedError('인증이 필요합니다.', response.status, data);
    }
    const message = (data as any)?.error || `요청이 실패했습니다. (status ${response.status})`;
    throw new ApiError(message, response.status, data);
  }

  return data as T;
};

export const getAdminToken = () => (typeof localStorage === 'undefined' ? null : localStorage.getItem(ADMIN_TOKEN_KEY));
export const setAdminToken = (token: string) => localStorage.setItem(ADMIN_TOKEN_KEY, token);
export const clearAdminToken = () => localStorage.removeItem(ADMIN_TOKEN_KEY);
export const isAdminAuthenticated = () => Boolean(getAdminToken());

export const loginAdmin = async (password: string): Promise<string> => {
  if (USE_DESIGN_MODE) {
    const token = await mockService.loginAdmin(password);
    setAdminToken(token);
    return token;
  }
  const result = await apiFetch<{ token: string }>('/admin/login', {
    method: 'POST',
    body: JSON.stringify({ password }),
    skipAuth: true,
  });
  setAdminToken(result.token);
  return result.token;
};

export const getCategories = async (): Promise<Category[]> => {
  if (USE_DESIGN_MODE) {
    return mockService.getCategories();
  }
  return apiFetch<Category[]>('/categories', { method: 'GET', skipAuth: true, timeoutMs: 5000 });
};

export interface StoreListParams {
  category?: string;
}

export const getStores = async (params?: StoreListParams): Promise<Store[]> => {
  if (USE_DESIGN_MODE) {
    return mockService.getStores(params);
  }
  const query = new URLSearchParams();
  if (params?.category) query.set('category', params.category);
  const queryString = query.toString();
  const path = queryString ? `/stores?${queryString}` : '/stores';
  return apiFetch<Store[]>(path, { method: 'GET', skipAuth: true, timeoutMs: 5000 });
};

export const searchStores = async (keyword: string): Promise<Store[]> => {
  if (USE_DESIGN_MODE) {
    return mockService.searchStores(keyword);
  }
  const query = new URLSearchParams({ q: keyword });
  return apiFetch<Store[]>(`/stores/search?${query.toString()}`, { method: 'GET', skipAuth: true, timeoutMs: 5000 });
};

export const getStore = async (storeId: number): Promise<Store | null> => {
  if (USE_DESIGN_MODE) {
    return mockService.getStore(storeId);
  }
  try {
    return await apiFetch<Store>(`/stores/${storeId}`, { method: 'GET', skipAuth: true, timeoutMs: 5000 });
  } catch (err: any) {
    if (err instanceof ApiError && err.status === 404) {
      return null;
    }
    throw err;
  }
};

export const getStoreMenu = async (storeId: number): Promise<StoreMenuSection[]> => {
  if (USE_DESIGN_MODE) {
    return mockService.getStoreMenu(storeId);
  }
  return apiFetch<StoreMenuSection[]>(`/stores/${storeId}/menu`, { method: 'GET', skipAuth: true, timeoutMs: 5000 });
};

export const getMenu = async (): Promise<MenuItem[]> => {
  if (USE_DESIGN_MODE) {
    return mockService.getMenu();
  }
  return apiFetch<MenuItem[]>('/menus', { method: 'GET', skipAuth: true, timeoutMs: 5000 });
};

export interface OrderItemInput {
  menu_id: number;
  quantity: number;
  options: OrderItemOptionSelection[];
}

export interface CreateOrderInput {
  store_id?: number;
  items: OrderItemInput[];
  address: string;
  phone: string;
  payment_method: PaymentMethod;
  idempotencyKey?: string;
}

export const createOrder = async (orderData: CreateOrderInput): Promise<{ success: boolean; tracking_uuid: string }> => {
  if (USE_DESIGN_MODE) {
    return mockService.createOrder(orderData);
  }
  const idempotencyKey = orderData.idempotencyKey || makeUuid();

  return apiFetch<{ success: boolean; tracking_uuid: string }>('/orders', {
    method: 'POST',
    headers: { 'Idempotency-Key': idempotencyKey },
    body: JSON.stringify({
      store_id: orderData.store_id,
      items: orderData.items,
      address: orderData.address,
      phone: orderData.phone,
      payment_method: orderData.payment_method,
    }),
    skipAuth: true,
    timeoutMs: 8000,
  });
};

export const getOrderStatus = async (uuid: string): Promise<Order | null> => {
  if (USE_DESIGN_MODE) {
    return mockService.getOrderStatus(uuid);
  }
  try {
    return await apiFetch<Order>(`/orders/${uuid}`, { method: 'GET', skipAuth: true, timeoutMs: 5000 });
  } catch (err: any) {
    if (err instanceof ApiError && err.status === 404) {
      return null;
    }
    throw err;
  }
};

export const getAllOrders = async (): Promise<Order[]> => {
  if (USE_DESIGN_MODE) {
    return mockService.getAllOrders();
  }
  return apiFetch<Order[]>('/admin/orders', { method: 'GET', timeoutMs: 5000 });
};

export const updateOrderStatus = async (id: number, status: OrderStatus, etaMinutes?: number): Promise<boolean> => {
  if (USE_DESIGN_MODE) {
    return mockService.updateOrderStatus(id, status, etaMinutes);
  }
  await apiFetch<{ success: boolean }>(`/admin/orders/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({
      status,
      eta_minutes: etaMinutes,
    }),
    timeoutMs: 8000,
  });
  return true;
};
