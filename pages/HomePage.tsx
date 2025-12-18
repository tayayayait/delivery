import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Search, ChevronRight, Star, Clock, Sparkles, ShieldCheck, Crosshair } from 'lucide-react';
import { getCategories, getStores } from '../services/api';
import { Category, Store } from '../types';
import CartBar from '../components/CartBar';
import AddressSearchSheet, { SelectedLocation } from '../components/AddressSearchSheet';
import GoogleMap, { LatLng } from '../components/GoogleMap';
import { useLocation } from '../contexts/LocationContext';
import { loadGoogleMapsScript } from '../utils/googleMaps';

const CATEGORY_VISUALS: Record<string, { image: string; accent: string }> = {
  burger: {
    image: 'https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=900&q=80',
    accent: 'from-orange-100 to-orange-200',
  },
  chicken: {
    image: 'https://images.unsplash.com/photo-1506368249639-73a05d6f6488?auto=format&fit=crop&w=900&q=80',
    accent: 'from-yellow-100 to-yellow-200',
  },
  dessert: {
    image: 'https://images.unsplash.com/photo-1495214783159-3503fd1b572d?auto=format&fit=crop&w=900&q=80',
    accent: 'from-pink-100 to-pink-200',
  },
  noodle: {
    image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=900&q=80',
    accent: 'from-amber-100 to-amber-200',
  },
  cafe: {
    image: 'https://images.unsplash.com/photo-1432107294467-7fff8b43edc0?auto=format&fit=crop&w=900&q=80',
    accent: 'from-rose-100 to-rose-200',
  },
};

const DEFAULT_CATEGORY_IMAGE =
  'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=900&q=80';

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState<Category[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const locationContext = useLocation();
  const { address, lat, lng } = locationContext;
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState({ categories: true, stores: true });
  const [error, setError] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const mapsKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY ?? '';
  const [mapOpen, setMapOpen] = useState(false);
  const [locating, setLocating] = useState(false);
  const [mapLocating, setMapLocating] = useState(false);

  const mapCenter = useMemo<LatLng>(() => {
    if (typeof lat === 'number' && typeof lng === 'number') {
      return { lat, lng };
    }
    return { lat: 37.4979, lng: 127.0276 };
  }, [lat, lng]);

  useEffect(() => {
    setLoading((prev) => ({ ...prev, categories: true }));
    getCategories()
      .then((data) => setCategories(data))
      .catch((err: any) => setError(err?.message || '카테고리를 불러오지 못했습니다.'))
      .finally(() => setLoading((prev) => ({ ...prev, categories: false })));
  }, []);

  useEffect(() => {
    setLoading((prev) => ({ ...prev, stores: true }));
    getStores()
      .then((data) => setStores(data))
      .catch((err: any) => setError(err?.message || '추천 가게를 불러오지 못했습니다.'))
      .finally(() => setLoading((prev) => ({ ...prev, stores: false })));
  }, []);

  const featuredStores = useMemo(() => stores.slice(0, 4), [stores]);

  const handleEditAddress = () => {
    setSheetOpen(true);
  };

  const handleLocationSelect = (payload: SelectedLocation) => {
    locationContext.setLocation({
      address: payload.address,
      placeId: payload.placeId,
      lat: payload.lat,
      lng: payload.lng,
      updatedAt: new Date().toISOString(),
    });
  };

  const reverseGeocode = async (coords: LatLng): Promise<string | null> => {
    if (!mapsKey) return null;
    await loadGoogleMapsScript(mapsKey);
    const google = (window as any).google;
    if (!google?.maps) return null;
    return new Promise((resolve) => {
      const geocoder = new google.maps.Geocoder();
      geocoder.geocode({ location: coords }, (results: any, status: string) => {
        if (status === 'OK' && results?.length) {
          resolve(results[0].formatted_address);
          return;
        }
        resolve(null);
      });
    });
  };

  const updateCurrentLocation = async (coords: LatLng) => {
    let resolvedAddress = '현재 위치';
    try {
      const geocodedAddress = await reverseGeocode(coords);
      if (geocodedAddress) {
        resolvedAddress = geocodedAddress;
      }
    } catch {
      // ignore reverse geocoding errors
    }

    locationContext.setLocation({
      address: resolvedAddress,
      lat: coords.lat,
      lng: coords.lng,
      updatedAt: new Date().toISOString(),
    });
  };

  const handleGeolocationSuccess = (position: GeolocationPosition) => {
    const coords = {
      lat: position.coords.latitude,
      lng: position.coords.longitude,
    };
    return updateCurrentLocation(coords);
  };

  const requestGeolocation = (showAlert: boolean, onStart: () => void, onComplete: () => void) => {
    if (!navigator.geolocation) {
      if (showAlert) {
        window.alert('현재 브라우저는 위치 정보를 지원하지 않습니다.');
      }
      onComplete();
      return;
    }

    onStart();
    navigator.geolocation.getCurrentPosition(
      (position) => {
        handleGeolocationSuccess(position)
          .catch(() => {})
          .finally(onComplete);
      },
      () => {
        window.alert('위치 정보를 가져오는 데 실패했습니다. 설정에서 권한을 허용해 주세요.');
        onComplete();
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleDetectLocation = () => {
    requestGeolocation(true, () => setLocating(true), () => setLocating(false));
  };

  const handleRecenterToCurrentLocation = () => {
    requestGeolocation(false, () => setMapLocating(true), () => setMapLocating(false));
  };

  const handleSearchSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setMapOpen(true);
  };

  const handleCategoryClick = (categoryId: string) => {
    navigate(`/category/${categoryId}`);
  };

  const handleViewAllStores = () => {
    navigate('/category/all');
  };

  return (
    <div className="bg-gray-50 min-h-screen pb-28">
      <div className="bg-white pt-4 pb-6 px-5 border-b border-gray-100 space-y-4 sticky top-16 z-40">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-black text-pink-500 uppercase tracking-widest">배달지</p>
            <button
              type="button"
              onClick={handleEditAddress}
              className="text-left mt-1 text-lg font-black text-gray-900 leading-snug hover:text-pink-500"
            >
              {address}
            </button>
            <p className="text-[11px] font-bold text-gray-400 mt-1">지금 주소로 가장 빠른 매장을 추천해드려요</p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <button
              type="button"
              onClick={handleEditAddress}
              className="px-3 py-2 rounded-full border border-pink-100 text-xs font-black text-pink-500 hover:bg-pink-50"
            >
              변경
            </button>
            <button
              type="button"
              onClick={handleDetectLocation}
              disabled={locating}
              className={`px-3 py-2 rounded-full border ${locating ? 'border-gray-200 bg-gray-50 text-gray-400' : 'border-gray-200 text-gray-500 hover:bg-gray-50'} text-xs font-black`}
            >
              {locating ? '위치 찾는 중…' : '내 위치 찾기'}
            </button>
          </div>
        </div>

        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2">
          <div className="flex-1 flex items-center bg-gray-100 rounded-3xl px-4 py-3 gap-2">
            <Search className="w-4 h-4 text-gray-400" />
            <input
              type="search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="메뉴 또는 매장명으로 검색"
              className="flex-1 bg-transparent text-sm font-semibold text-gray-700 placeholder:text-gray-400 focus:outline-none"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-3 rounded-3xl bg-pink-500 text-white font-black text-sm active:scale-[0.98]"
          >
            검색
          </button>
        </form>
      </div>

      <div className="px-5 mt-6">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-black text-gray-900 uppercase tracking-widest">카테고리</p>
          <button
            type="button"
            onClick={handleViewAllStores}
            className="text-xs font-bold text-gray-500 flex items-center gap-1"
          >
            전체 보기 <ChevronRight className="w-3 h-3" />
          </button>
        </div>

        {loading.categories ? (
          <div className="grid grid-cols-2 gap-4">
            {Array.from({ length: 4 }).map((_, idx) => (
              <div key={idx} className="h-32 rounded-[30px] bg-gray-100 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {categories.map((category) => {
              const visual = CATEGORY_VISUALS[category.id] || {
                image: DEFAULT_CATEGORY_IMAGE,
                accent: 'from-gray-100 to-gray-200',
              };
              return (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => handleCategoryClick(category.id)}
                  className="relative h-32 rounded-[30px] overflow-hidden text-left shadow-sm border border-gray-100 active:scale-[0.99] transition-all bg-gradient-to-br"
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${visual.accent}`} />
                  <img
                    src={visual.image}
                    alt={category.name}
                    className="absolute right-0 bottom-0 w-28 h-28 object-cover opacity-80"
                  />
                  <div className="relative z-10 p-5 flex flex-col h-full justify-between">
                    <div>
                      <p className="text-[11px] font-black text-gray-500 uppercase tracking-widest">Category</p>
                      <p className="text-lg font-black text-gray-900 leading-tight">{category.name}</p>
                    </div>
                    {category.icon && <span className="text-2xl">{category.icon}</span>}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div className="px-5 mt-10 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[11px] font-black text-pink-500 uppercase tracking-widest">추천 매장</p>
            <h2 className="text-2xl font-black text-gray-900">지금 가장 빨라요</h2>
          </div>
          <Sparkles className="w-5 h-5 text-pink-400" />
        </div>

        {loading.stores ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, idx) => (
              <div key={idx} className="h-28 rounded-[32px] bg-white shadow-sm border border-gray-100 animate-pulse" />
            ))}
          </div>
        ) : featuredStores.length === 0 ? (
          <div className="p-6 bg-white border border-dashed border-gray-200 rounded-[32px] text-center text-sm font-bold text-gray-400">
            표시할 추천 매장이 없습니다.
          </div>
        ) : (
          <div className="space-y-4">
            {featuredStores.map((store) => (
              <button
                key={store.id}
                type="button"
                onClick={() => navigate(`/store/${store.id}`)}
                className="w-full bg-white border border-gray-100 rounded-[36px] p-5 shadow-sm text-left flex gap-4 active:scale-[0.99] transition-all"
              >
                <div className="w-20 h-20 rounded-3xl bg-gray-100 overflow-hidden">
                  <img
                    src={store.logo || store.heroImage}
                    alt={store.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 flex flex-col gap-2">
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
                    <ChevronRight className="w-4 h-4 text-gray-300" />
                  </div>
                  <div className="flex items-center gap-2 text-[11px] font-black text-gray-500 flex-wrap">
                    <span>최소주문 {store.minOrder.toLocaleString()}원</span>
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

      {error && (
        <div className="px-5 mt-8">
          <div className="p-4 bg-red-50 border border-red-100 rounded-3xl text-sm font-bold text-red-600 flex items-start gap-2">
            <ShieldCheck className="w-4 h-4 text-red-400" />
            {error}
          </div>
        </div>
      )}

      <div className="px-5 mt-10">
        <div className="p-5 rounded-[32px] bg-gradient-to-r from-pink-100 to-yellow-100 border border-white shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center">
            <MapPin className="w-5 h-5 text-pink-500" />
          </div>
          <div>
            <p className="text-[11px] font-black text-pink-500 uppercase tracking-widest">Flash Tip</p>
            <p className="text-sm font-bold text-gray-700">
              자주 이용하는 주소를 저장해두면 더 빠르게 추천받을 수 있어요.
            </p>
          </div>
        </div>
      </div>

      <CartBar />
      {mapOpen && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMapOpen(false)} />
          <div className="absolute inset-x-4 top-20 bottom-6 bg-white rounded-[32px] shadow-2xl border border-gray-100 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200">
              <div>
                <p className="text-xs font-black text-gray-400 uppercase tracking-widest">현재 배달지</p>
                <p className="text-sm font-black text-gray-900 leading-snug">{address}</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleRecenterToCurrentLocation}
                  disabled={mapLocating}
                  className={`flex items-center gap-1 px-3 py-1 rounded-full border text-xs font-black ${mapLocating ? 'border-gray-200 bg-gray-50 text-gray-400' : 'border-pink-100 text-pink-500 hover:bg-pink-50'}`}
                >
                  <Crosshair className="w-3 h-3" />
                  <span>{mapLocating ? '위치 확인 중…' : '내 위치'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setMapOpen(false)}
                  className="px-3 py-1 rounded-full border border-gray-200 text-xs font-black text-gray-600 hover:bg-gray-50"
                >
                  닫기
                </button>
              </div>
            </div>
            <div className="h-full p-4">
              <div className="h-full rounded-[28px] overflow-hidden shadow-inner border border-gray-100">
                <GoogleMap
                  apiKey={mapsKey}
                  center={mapCenter}
                  zoom={15}
                  marker={{ position: mapCenter }}
                  className="w-full h-full"
                />
              </div>
            </div>
          </div>
        </div>
      )}
      <AddressSearchSheet
        open={sheetOpen}
        apiKey={mapsKey}
        onClose={() => setSheetOpen(false)}
        onSelect={handleLocationSelect}
      />
    </div>
  );
};

export default HomePage;
