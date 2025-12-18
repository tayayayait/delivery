import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ChevronDown, Filter, Star, Clock, MapPin } from 'lucide-react';
import { getCategories, getStores } from '../services/api';
import { Category, Store } from '../types';

type SortOption = 'fast' | 'rating' | 'min_order';

const sortLabel: Record<SortOption, string> = {
  fast: '빠른 배달순',
  rating: '별점순',
  min_order: '최소주문 낮은순',
};

const SORT_FUNCTIONS: Record<SortOption, (a: Store, b: Store) => number> = {
  fast: (a, b) => a.etaMin - b.etaMin,
  rating: (a, b) => b.rating - a.rating,
  min_order: (a, b) => a.minOrder - b.minOrder,
};

const CategoryPage: React.FC = () => {
  const { id = 'all' } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const [categories, setCategories] = useState<Category[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sort, setSort] = useState<SortOption>(() => (searchParams.get('sort') as SortOption) || 'fast');
  const [filterOpen, setFilterOpen] = useState(false);

  useEffect(() => {
    getCategories()
      .then(setCategories)
      .catch(() => setCategories([]));
  }, []);

  useEffect(() => {
    setLoading(true);
    setError(null);
    getStores(id === 'all' ? undefined : { category: id })
      .then((data) => setStores(data))
      .catch((err: any) => setError(err?.message || '가게 목록을 불러오지 못했습니다.'))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set('sort', sort);
      return next;
    }, { replace: true });
  }, [sort, setSearchParams]);

  const sortedStores = useMemo(() => {
    const sorter = SORT_FUNCTIONS[sort];
    return [...stores].sort(sorter);
  }, [stores, sort]);

  const handleSortChange = (value: SortOption) => {
    setSort(value);
    setFilterOpen(false);
  };

  const handleCategorySelect = (categoryId: string) => {
    navigate(`/category/${categoryId}`);
  };

  const currentCategory = categories.find((cat) => cat.id === id) || { name: '전체보기' };

  return (
    <div className="min-h-screen bg-gray-50 pb-6">
      <div className="sticky top-16 z-40 bg-white border-b border-gray-100">
        <div className="px-4 py-4 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => setFilterOpen((prev) => !prev)}
            className="flex items-center gap-2 px-4 py-2 rounded-full border border-gray-200 text-sm font-black text-gray-700"
          >
            <Filter className="w-4 h-4" />
            {currentCategory.name}
            <ChevronDown className={`w-4 h-4 transition-transform ${filterOpen ? 'rotate-180' : ''}`} />
          </button>
          <div className="flex items-center gap-2">
            {(['fast', 'rating', 'min_order'] as SortOption[]).map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => handleSortChange(option)}
                className={`px-3 py-2 rounded-full text-xs font-black border ${
                  sort === option
                    ? 'bg-gray-900 text-white border-gray-900'
                    : 'border-gray-200 text-gray-500 bg-white'
                }`}
              >
                {sortLabel[option]}
              </button>
            ))}
          </div>
        </div>

        {filterOpen && (
          <div className="px-4 pb-3 grid grid-cols-2 gap-2 bg-white border-t border-gray-100">
            {categories.map((category) => (
              <button
                key={category.id}
                type="button"
                onClick={() => handleCategorySelect(category.id)}
                className={`px-4 py-3 rounded-2xl border text-left text-sm font-black ${
                  category.id === id
                    ? 'border-gray-900 text-gray-900 bg-gray-50'
                    : 'border-gray-200 text-gray-500'
                }`}
              >
                {category.name}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="px-4 pt-4 space-y-3">
        {loading && (
          <div className="space-y-4">
            {Array.from({ length: 4 }).map((_, idx) => (
              <div key={idx} className="h-28 bg-white rounded-[32px] border border-gray-100 animate-pulse" />
            ))}
          </div>
        )}

        {!loading && error && (
          <div className="p-6 bg-white border border-red-100 rounded-[32px] text-center text-sm font-bold text-red-500">
            {error}
          </div>
        )}

        {!loading && !error && sortedStores.length === 0 && (
          <div className="p-6 bg-white border border-dashed border-gray-200 rounded-[32px] text-center text-sm font-bold text-gray-400">
            조건에 맞는 매장이 없습니다.
          </div>
        )}

        {!loading && !error && sortedStores.length > 0 && (
          <div className="space-y-4">
            {sortedStores.map((store) => (
              <button
                key={store.id}
                onClick={() => navigate(`/store/${store.id}`)}
                className="w-full bg-white rounded-[32px] border border-gray-100 p-5 shadow-sm text-left flex gap-4 active:scale-[0.99] transition-all"
              >
                <div className="w-20 h-20 rounded-3xl bg-gray-100 overflow-hidden">
                  <img
                    src={store.logo || store.heroImage}
                    alt={store.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-lg font-black text-gray-900">{store.name}</p>
                      <div className="flex items-center gap-2 text-xs font-bold text-gray-500">
                        <span className="flex items-center gap-1">
                          <Star className="w-3 h-3 text-yellow-400 fill-current" />
                          {store.rating.toFixed(1)} ({store.reviewCount.toLocaleString()})
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-gray-400" />
                          {store.etaMin}~{store.etaMax}분
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-[11px] font-black text-gray-500 flex-wrap">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      최소 {store.minOrder.toLocaleString()}원
                    </span>
                    <span>배달비 {store.deliveryFee > 0 ? `${store.deliveryFee.toLocaleString()}원` : '무료'}</span>
                    {store.tags?.slice(0, 2).map((tag) => (
                      <span key={tag} className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded-full">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CategoryPage;
