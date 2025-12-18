
export enum OrderStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  COOKING = 'cooking',
  DELIVERING = 'delivering',
  ARRIVED = 'arrived',
  CANCELED = 'canceled'
}

export type PaymentMethod = 'card' | 'cash';

export interface Category {
  id: string;
  name: string;
  icon?: string;
}

export interface MenuOptionChoice {
  id: string;
  label: string;
  price: number;
}

export interface MenuOption {
  id: string;
  name: string;
  required: boolean;
  maxSelect: number;
  choices: MenuOptionChoice[];
}

export interface MenuItem {
  id: number;
  name: string;
  price: number;
  is_sold_out: boolean;
  image: string;
  description: string;
  tag?: string;
  options?: MenuOption[];
}

export interface Store {
  id: number;
  name: string;
  description: string;
  logo: string;
  heroImage: string;
  categories: string[];
  rating: number;
  reviewCount: number;
  minOrder: number;
  deliveryFee: number;
  etaMin: number;
  etaMax: number;
  isOpen: boolean;
  tags?: string[];
  address?: string;
  phone?: string;
  notice?: string;
}

export interface StoreMenuSection {
  id: string;
  title: string;
  description?: string;
  items: MenuItem[];
}

export interface OrderItemOptionSelection {
  option_id: string;
  choice_ids: string[];
}

export interface OrderItem {
  menu_id: number;
  quantity: number;
  options: OrderItemOptionSelection[];
  unit_price: number;
  options_price: number;
  line_price: number;
  menu_name?: string;
}

export interface CartItem {
  id: string;
  menuId: number;
  menuName: string;
  menuImage?: string;
  basePrice: number;
  optionsPrice: number;
  quantity: number;
  selections: Record<string, string[]>;
}

export interface CartState {
  storeId: number | null;
  storeName?: string | null;
  storeLogo?: string | null;
  items: CartItem[];
  specialRequest?: string;
}

export interface Order {
  id: number;
  customer_phone: string;
  customer_address: string;
  store_id: number;
  menu_id: number;
  items?: OrderItem[];
  total_price?: number;
  status: OrderStatus;
  order_time: string;
  delivery_eta: string | null;
  tracking_uuid: string;
  payment_method?: PaymentMethod;
  store_name?: string;
}

export interface ApiStatusResponse {
  success: boolean;
  status: OrderStatus;
  delivery_eta: string | null;
}
