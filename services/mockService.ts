import { 
  Category, 
  Store, 
  StoreMenuSection, 
  MenuItem, 
  Order, 
  OrderStatus, 
  OrderItemOptionSelection, 
  PaymentMethod 
} from '../types';

const MOCK_CATEGORIES: Category[] = [
  { id: 'korean', name: '든든한 한식', icon: '🍚' },
  { id: 'burger', name: '버거 · 샌드', icon: '🍔' },
  { id: 'chicken', name: '치킨 · 야식', icon: '🍗' },
  { id: 'dessert', name: '디저트 · 카페', icon: '🍰' },
  { id: 'noodle', name: '면 · 분식', icon: '🍜' },
];

const MOCK_STORES: Store[] = [
  {
    id: 201,
    name: '번쩍 와규 버거',
    description: '숯불 향을 그대로 담은 프리미엄 수제버거 하우스',
    logo: 'https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=400&q=80',
    heroImage: 'https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=1200&q=80',
    categories: ['burger', 'chicken'],
    rating: 4.9,
    reviewCount: 1245,
    minOrder: 15000,
    deliveryFee: 2000,
    etaMin: 20,
    etaMax: 35,
    isOpen: true,
    tags: ['오늘만 3천원 할인', '포장 가능'],
    address: '서울시 강남구 테헤란로 428, 12층',
    phone: '02-123-4567',
    notice: '점심 피크타임에는 5분 정도 지연될 수 있어요.',
  },
  {
    id: 202,
    name: '서울 버블티 하우스',
    description: '대만 현지 레시피로 매일 브루잉하는 흑당 버블티 전문점',
    logo: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=400&q=80',
    heroImage: 'https://images.unsplash.com/photo-1481391032119-d89fee407e44?auto=format&fit=crop&w=1200&q=80',
    categories: ['dessert'],
    rating: 4.7,
    reviewCount: 980,
    minOrder: 9000,
    deliveryFee: 1500,
    etaMin: 15,
    etaMax: 25,
    isOpen: true,
    tags: ['스펀지보바 증정', '최소 주문 9천원'],
    address: '서울시 마포구 잔다리로 32',
    phone: '02-567-8901',
    notice: '타피오카는 4시간마다 새로 삶습니다.',
  },
  {
    id: 203,
    name: '판교 라멘 연구소',
    description: '매일 숙성한 육수와 수제 면으로 만드는 장인 라멘',
    logo: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=400&q=80',
    heroImage: 'https://images.unsplash.com/photo-1466978913421-dad2ebd01d17?auto=format&fit=crop&w=1200&q=80',
    categories: ['noodle'],
    rating: 4.8,
    reviewCount: 760,
    minOrder: 12000,
    deliveryFee: 2500,
    etaMin: 30,
    etaMax: 45,
    isOpen: false,
    tags: ['오늘 휴무', '미리주문 가능'],
    address: '경기도 성남시 분당구 판교역로 235',
    phone: '031-222-7777',
    notice: '매일 오전 11시 오픈, 재료 소진 시 조기 마감됩니다.',
  },
];

const STORE_MENUS: Record<number, StoreMenuSection[]> = {
  201: [
    {
      id: 'signature',
      title: '시그니처 버거',
      description: '숯불 향 가득한 하우스 버거',
      items: [
        {
          id: 4101,
          name: '플래시 시그니처 버거',
          price: 15800,
          is_sold_out: false,
          image: 'https://images.unsplash.com/photo-1551782450-a2132b4ba21d?auto=format&fit=crop&w=1000&q=80',
          description: '콜드 스모크 패티에 포테이토 번, 스모키 베이컨, 시그니처 소스를 더했습니다.',
          tag: 'BEST',
          options: [
            {
              id: 'bun',
              name: '번 선택',
              required: true,
              maxSelect: 1,
              choices: [
                { id: 'bun_classic', label: '클래식 번', price: 0 },
                { id: 'bun_cheese', label: '치즈 번', price: 800 },
              ],
            },
            {
              id: 'cook',
              name: '굽기',
              required: true,
              maxSelect: 1,
              choices: [
                { id: 'cook_regular', label: '미디엄', price: 0 },
                { id: 'cook_well', label: '웰던', price: 0 },
              ],
            },
            {
              id: 'extra',
              name: '토핑 추가',
              required: false,
              maxSelect: 2,
              choices: [
                { id: 'extra_cheese', label: '아메리칸 치즈', price: 1200 },
                { id: 'extra_guanciale', label: '구안치아레 크럼블', price: 1500 },
              ],
            },
          ],
        },
        {
          id: 4102,
          name: '스모키 더블 버거',
          price: 18900,
          is_sold_out: false,
          image: 'https://images.unsplash.com/photo-1466978913421-dad2ebd01d17?auto=format&fit=crop&w=1000&q=80',
          description: '두 장의 스모크 와규 패티를 겹겹이 쌓아 올린 시그니처 더블.',
          tag: 'HOT',
          options: [
            {
              id: 'bun',
              name: '번 선택',
              required: true,
              maxSelect: 1,
              choices: [
                { id: 'bun_classic', label: '클래식 번', price: 0 },
                { id: 'bun_cheese', label: '치즈 번', price: 800 },
              ],
            },
            {
              id: 'sauce',
              name: '소스 선택',
              required: true,
              maxSelect: 1,
              choices: [
                { id: 'sauce_classic', label: '시그니처 소스', price: 0 },
                { id: 'sauce_spicy', label: '스모키 칠리', price: 300 },
              ],
            },
          ],
        },
        {
          id: 4103,
          name: '트러플 머쉬룸 버거',
          price: 17800,
          is_sold_out: true,
          image: 'https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=1000&q=80',
          description: '버터에 절인 양송이와 트러플 크림을 듬뿍 올린 리미티드 메뉴.',
          tag: '준비중',
          options: [
            {
              id: 'bun',
              name: '번 선택',
              required: true,
              maxSelect: 1,
              choices: [
                { id: 'bun_classic', label: '클래식 번', price: 0 },
                { id: 'bun_truffle', label: '트러플 번', price: 1200 },
              ],
            },
          ],
        },
      ],
    },
    {
      id: 'sides',
      title: '사이드 & 쉐이크',
      items: [
        {
          id: 4110,
          name: '크리스피 와플 프라이',
          price: 5200,
          is_sold_out: false,
          image: 'https://images.unsplash.com/photo-1457573294499-86ac96b336ba?auto=format&fit=crop&w=1000&q=80',
          description: '허니 버터 시즈닝과 파마산 토핑을 곁들인 와플 프라이.',
          options: [
            {
              id: 'seasoning',
              name: '시즈닝',
              required: false,
              maxSelect: 2,
              choices: [
                { id: 'seasoning_honey', label: '허니 버터', price: 0 },
                { id: 'seasoning_truffle', label: '트러플 솔트', price: 700 },
              ],
            },
          ],
        },
        {
          id: 4111,
          name: '블랙 갈릭 치킨 텐더',
          price: 9800,
          is_sold_out: false,
          image: 'https://images.unsplash.com/photo-1608039829574-6cffb3a4dc29?auto=format&fit=crop&w=1000&q=80',
          description: '흑마늘 아이올리와 케이준 소스를 곁들인 텐더 세트.',
          options: [
            {
              id: 'dipping',
              name: '디핑 소스',
              required: true,
              maxSelect: 1,
              choices: [
                { id: 'dipping_aioli', label: '흑마늘 아이올리', price: 0 },
                { id: 'dipping_cajun', label: '케이준 랜치', price: 0 },
              ],
            },
          ],
        },
      ],
    },
  ],
  202: [
    {
      id: 'signature-tea',
      title: '시그니처 버블티',
      description: '타피오카는 4시간마다 새로 삶아요.',
      items: [
        {
          id: 4201,
          name: '흑당 버블 시그니처',
          price: 5900,
          is_sold_out: false,
          image: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=1000&q=80',
          description: '직접 졸인 흑당 시럽과 비밀 배합 우유가 만났습니다.',
          tag: '인기',
          options: [
            {
              id: 'sugar',
              name: '당도',
              required: true,
              maxSelect: 1,
              choices: [
                { id: 'sugar_0', label: '0%', price: 0 },
                { id: 'sugar_50', label: '50%', price: 0 },
                { id: 'sugar_100', label: '100%', price: 0 },
              ],
            },
            {
              id: 'ice',
              name: '얼음',
              required: true,
              maxSelect: 1,
              choices: [
                { id: 'ice_less', label: '적게', price: 0 },
                { id: 'ice_regular', label: '보통', price: 0 },
              ],
            },
            {
              id: 'topping',
              name: '토핑 추가',
              required: false,
              maxSelect: 2,
              choices: [
                { id: 'boba', label: '타피오카', price: 500 },
                { id: 'creama', label: '치즈 크리마', price: 800 },
                { id: 'pudding', label: '밀크 푸딩', price: 700 },
              ],
            },
          ],
        },
        {
          id: 4202,
          name: '딸기 말차 라떼',
          price: 6400,
          is_sold_out: false,
          image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1000&q=80',
          description: '후레시 딸기퓨레와 교토 말차가 어우러진 시즌 메뉴.',
          tag: 'NEW',
          options: [
            {
              id: 'sugar',
              name: '당도',
              required: true,
              maxSelect: 1,
              choices: [
                { id: 'sugar_0', label: '0%', price: 0 },
                { id: 'sugar_50', label: '50%', price: 0 },
                { id: 'sugar_75', label: '75%', price: 0 },
              ],
            },
          ],
        },
      ],
    },
    {
      id: 'snack',
      title: '디저트 & 사이드',
      items: [
        {
          id: 4210,
          name: '흑임자 크루아상 와플',
          price: 5200,
          is_sold_out: false,
          image: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=1000&q=80',
          description: '흑임자 크림과 버터 크럼블을 듬뿍 올린 와플.',
        },
      ],
    },
  ],
  203: [
    {
      id: 'ramen',
      title: '시그니처 라멘',
      items: [
        {
          id: 4301,
          name: '돈코츠 라멘',
          price: 12800,
          is_sold_out: false,
          image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1000&q=80',
          description: '진득한 돈코츠 국물에 수제 차슈와 반숙 계란을 더했습니다.',
          options: [
            {
              id: 'noodles',
              name: '면 선택',
              required: true,
              maxSelect: 1,
              choices: [
                { id: 'noodles_thin', label: '細면', price: 0 },
                { id: 'noodles_thick', label: '굵은 면', price: 0 },
              ],
            },
            {
              id: 'toppings',
              name: '토핑 추가',
              required: false,
              maxSelect: 2,
              choices: [
                { id: 'topping_spice', label: '매운 양념', price: 500 },
                { id: 'topping_butter', label: '버터', price: 700 },
              ],
            },
          ],
        },
        {
          id: 4302,
          name: '카라이 스파이시 라멘',
          price: 14200,
          is_sold_out: false,
          image: 'https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?auto=format&fit=crop&w=1000&q=80',
          description: '고추기름을 곁들인 중독성 있는 매운 라멘.',
          options: [
            {
              id: 'spice',
              name: '매운맛',
              required: true,
              maxSelect: 1,
              choices: [
                { id: 'spice_mild', label: '순한 맛', price: 0 },
                { id: 'spice_hot', label: '매운 맛', price: 0 },
                { id: 'spice_extra', label: '아주 매운 맛', price: 0 },
              ],
            },
          ],
        },
      ],
    },
    {
      id: 'side',
      title: '사이드',
      items: [
        {
          id: 4310,
          name: '미니 교자 (6pcs)',
          price: 6200,
          is_sold_out: false,
          image: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&w=1000&q=80',
          description: '철판에서 갓 구운 수제 교자.',
        },
      ],
    },
  ],
};

const networkDelay = (ms = 350) => new Promise((resolve) => setTimeout(resolve, ms));
const makeUuid = () => (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
  ? crypto.randomUUID()
  : Math.random().toString(36).slice(2));

const flattenRawStoreMenu = (storeId: number) =>
  (STORE_MENUS[storeId] ?? []).flatMap((section) => section.items);

const cloneMenuItem = (item: MenuItem): MenuItem => ({
  ...item,
  options: item.options?.map((option) => ({
    ...option,
    choices: option.choices.map((choice) => ({ ...choice })),
  })),
});

const cloneSections = (sections: StoreMenuSection[]): StoreMenuSection[] =>
  sections.map((section) => ({
    ...section,
    items: section.items.map(cloneMenuItem),
  }));

const cloneStore = (store: Store): Store => ({
  ...store,
  categories: [...store.categories],
  tags: store.tags ? [...store.tags] : undefined,
});

const cloneOrder = (order: Order): Order => ({
  ...order,
  items: order.items?.map((item) => ({
    ...item,
    options: item.options.map((opt) => ({
      option_id: opt.option_id,
      choice_ids: [...opt.choice_ids],
    })),
  })),
});

const findStore = (storeId: number) => MOCK_STORES.find((store) => store.id === storeId);

const findStoreByMenu = (menuId: number) => {
  for (const store of MOCK_STORES) {
    const exists = flattenRawStoreMenu(store.id).some((item) => item.id === menuId);
    if (exists) return store.id;
  }
  return null;
};

const findMenu = (storeId: number, menuId: number) =>
  flattenRawStoreMenu(storeId).find((item) => item.id === menuId);

const computeOptionsPrice = (menu: MenuItem | undefined, selections: OrderItemOptionSelection[]) => {
  if (!menu) return 0;
  return selections.reduce((total, selection) => {
    const option = menu.options?.find((opt) => opt.id === selection.option_id);
    if (!option) return total;
    return total + selection.choice_ids.reduce((sum, choiceId) => {
      const choice = option.choices.find((c) => c.id === choiceId);
      return sum + (choice?.price ?? 0);
    }, 0);
  }, 0);
};

const computeEta = (status: OrderStatus, baseMinutes = 25) => {
  if (status === OrderStatus.ARRIVED || status === OrderStatus.CANCELED) {
    return null;
  }
  return new Date(Date.now() + baseMinutes * 60000).toISOString();
};

const baseOrders: Order[] = [
  {
    id: 1001,
    store_id: 201,
    store_name: '번쩍 와규 버거',
    customer_phone: '01012345678',
    customer_address: '서울시 강남구 테헤란로 428, 12층',
    menu_id: 4101,
    items: [
      {
        menu_id: 4101,
        quantity: 1,
        options: [
          { option_id: 'bun', choice_ids: ['bun_classic'] },
          { option_id: 'cook', choice_ids: ['cook_regular'] },
          { option_id: 'extra', choice_ids: ['extra_cheese'] },
        ],
        unit_price: 15800,
        options_price: 1200,
        line_price: 17000,
        menu_name: '플래시 시그니처 버거',
      },
    ],
    total_price: 17000,
    status: OrderStatus.DELIVERING,
    order_time: new Date(Date.now() - 1000 * 60 * 8).toISOString(),
    delivery_eta: new Date(Date.now() + 1000 * 60 * 12).toISOString(),
    tracking_uuid: 'mock-tracking-1001',
    payment_method: 'card',
  },
  {
    id: 1000,
    store_id: 202,
    store_name: '서울 버블티 하우스',
    customer_phone: '01098765432',
    customer_address: '서울시 마포구 독막로 342',
    menu_id: 4201,
    items: [
      {
        menu_id: 4201,
        quantity: 2,
        options: [
          { option_id: 'sugar', choice_ids: ['sugar_50'] },
          { option_id: 'ice', choice_ids: ['ice_less'] },
          { option_id: 'topping', choice_ids: ['boba'] },
        ],
        unit_price: 5900,
        options_price: 500,
        line_price: (5900 + 500) * 2,
        menu_name: '흑당 버블 시그니처',
      },
    ],
    total_price: (5900 + 500) * 2,
    status: OrderStatus.COOKING,
    order_time: new Date(Date.now() - 1000 * 60 * 18).toISOString(),
    delivery_eta: new Date(Date.now() + 1000 * 60 * 20).toISOString(),
    tracking_uuid: 'mock-tracking-1000',
    payment_method: 'cash',
  },
];

let latestOrderId = 1002;
const mockOrders: Order[] = baseOrders.map(cloneOrder);

export const getCategories = async (): Promise<Category[]> => {
  await networkDelay();
  return MOCK_CATEGORIES.map((category) => ({ ...category }));
};

export const getStores = async (filters?: { category?: string }): Promise<Store[]> => {
  await networkDelay();
  const category = filters?.category;
  const filtered = category
    ? MOCK_STORES.filter((store) => store.categories.includes(category))
    : MOCK_STORES;
  return filtered.map(cloneStore);
};

export const getStore = async (storeId: number): Promise<Store | null> => {
  await networkDelay();
  const store = findStore(storeId);
  return store ? cloneStore(store) : null;
};

export const getStoreMenu = async (storeId: number): Promise<StoreMenuSection[]> => {
  await networkDelay();
  const sections = STORE_MENUS[storeId] ?? [];
  return cloneSections(sections);
};

export const searchStores = async (query: string): Promise<Store[]> => {
  await networkDelay();
  const normalized = query.trim().toLowerCase();
  if (!normalized) {
    return MOCK_STORES.slice(0, 6).map(cloneStore);
  }
  const matched = MOCK_STORES.filter((store) =>
    store.name.toLowerCase().includes(normalized) ||
    store.tags?.some((tag) => tag.toLowerCase().includes(normalized))
  );
  return matched.map(cloneStore);
};

// Legacy helper: until UI가 전면 개편되기 전까지만 사용
export const getMenu = async (): Promise<MenuItem[]> => {
  await networkDelay();
  return Object.values(STORE_MENUS)
    .flatMap((sections) => sections.flatMap((section) => section.items))
    .map(cloneMenuItem);
};

export const loginAdmin = async (_password: string): Promise<string> => {
  await networkDelay();
  return 'design-mode-token';
};

const resolveStoreId = (items: { menu_id: number }[], fallback?: number) => {
  for (const item of items) {
    const mapped = findStoreByMenu(item.menu_id);
    if (mapped) return mapped;
  }
  return fallback ?? MOCK_STORES[0].id;
};

export const createOrder = async (orderData: {
  store_id?: number;
  items: { menu_id: number; quantity: number; options: OrderItemOptionSelection[] }[];
  address: string;
  phone: string;
  payment_method: PaymentMethod;
  idempotencyKey?: string;
}): Promise<{ success: boolean; tracking_uuid: string }> => {
  await networkDelay(600);

  if (orderData.items.length === 0) {
    throw new Error('주문할 메뉴가 없습니다.');
  }

  const resolvedStoreId = orderData.store_id ?? resolveStoreId(orderData.items);
  const store = findStore(resolvedStoreId);
  if (!store) {
    throw new Error('가게를 찾을 수 없습니다.');
  }

  const tracking_uuid = orderData.idempotencyKey || makeUuid();

  const assembledItems = orderData.items.map((item) => {
    const menu = findMenu(resolvedStoreId, item.menu_id);
    if (!menu) {
      throw new Error('가게 메뉴 정보가 올바르지 않습니다.');
    }
    const optionsPrice = computeOptionsPrice(menu, item.options);
    const unitPrice = menu.price;
    const linePrice = (unitPrice + optionsPrice) * item.quantity;
    return {
      menu_id: item.menu_id,
      quantity: item.quantity,
      options: item.options,
      unit_price: unitPrice,
      options_price: optionsPrice,
      line_price: linePrice,
      menu_name: menu.name,
    };
  });

  const order: Order = {
    id: latestOrderId++,
    store_id: store.id,
    store_name: store.name,
    customer_phone: orderData.phone,
    customer_address: orderData.address,
    menu_id: orderData.items[0]?.menu_id ?? flattenRawStoreMenu(store.id)[0]?.id ?? 0,
    items: assembledItems,
    total_price: assembledItems.reduce((sum, itm) => sum + itm.line_price, 0),
    status: OrderStatus.PENDING,
    order_time: new Date().toISOString(),
    delivery_eta: computeEta(OrderStatus.PENDING, store.etaMax),
    tracking_uuid,
    payment_method: orderData.payment_method,
  };

  mockOrders.unshift(order);
  return { success: true, tracking_uuid };
};

export const getOrderStatus = async (uuid: string): Promise<Order | null> => {
  await networkDelay();
  const found = mockOrders.find((order) => order.tracking_uuid === uuid);
  return found ? cloneOrder(found) : null;
};

export const getAllOrders = async (): Promise<Order[]> => {
  await networkDelay();
  return mockOrders.map(cloneOrder);
};

export const updateOrderStatus = async (id: number, status: OrderStatus, etaMinutes?: number): Promise<boolean> => {
  await networkDelay();
  const order = mockOrders.find((o) => o.id === id);
  if (!order) return false;
  order.status = status;
  const base = etaMinutes ?? (status === OrderStatus.DELIVERING ? 12 : 18);
  order.delivery_eta = computeEta(status, base);
  return true;
};
