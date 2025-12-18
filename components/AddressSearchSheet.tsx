import React, { useCallback, useEffect, useRef, useState } from 'react';
import { MapPin, X, Loader2 } from 'lucide-react';
import { fetchAddressFallbackSuggestions, AddressFallbackSuggestion } from '../utils/addressFallback';
import { loadGoogleMapsScript } from '../utils/googleMaps';

export interface SelectedLocation {
  address: string;
  placeId: string;
  lat: number;
  lng: number;
}

type GooglePredictionItem = {
  source: 'google';
  id: string;
  placeId: string;
  description: string;
  secondaryText?: string;
};

type FallbackPredictionItem = AddressFallbackSuggestion & { source: 'nominatim' };

type PredictionItem = GooglePredictionItem | FallbackPredictionItem;

type AddressSearchSheetProps = {
  open: boolean;
  onClose: () => void;
  onSelect: (location: SelectedLocation) => void;
  apiKey: string;
};

const AddressSearchSheet: React.FC<AddressSearchSheetProps> = ({ open, onClose, onSelect, apiKey }) => {
  const [query, setQuery] = useState('');
  const [predictions, setPredictions] = useState<PredictionItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [fallbackLoading, setFallbackLoading] = useState(false);
  const [selecting, setSelecting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const autocompleteRef = useRef<any>(null);
  const geocoderRef = useRef<any>(null);
  const abortRef = useRef(false);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const queryRef = useRef<string>('');
  const fallbackAbortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!open) return;
    abortRef.current = false;
    loadGoogleMapsScript(apiKey)
      .then(() => {
        if (abortRef.current) return;
        const google = (window as any).google;
        if (!google?.maps) {
          setMessage('Google Maps 초기화에 실패했습니다.');
          return;
        }
        autocompleteRef.current = new google.maps.places.AutocompleteService();
        geocoderRef.current = new google.maps.Geocoder();
      })
      .catch((err) => {
        if (abortRef.current) return;
        setMessage(err?.message || 'Google Maps를 로딩하지 못했습니다.');
      });

    const focusTimer = window.setTimeout(() => {
      inputRef.current?.focus();
    }, 200);

    return () => {
      abortRef.current = true;
      window.clearTimeout(focusTimer);
    };
  }, [apiKey, open]);

  const runFallbackSearch = useCallback(async (searchQuery: string) => {
    fallbackAbortRef.current?.abort();
    const controller = new AbortController();
    fallbackAbortRef.current = controller;
    setFallbackLoading(true);

    try {
      const suggestions = await fetchAddressFallbackSuggestions(searchQuery, controller.signal);
      if (controller.signal.aborted) {
        return;
      }
      if (queryRef.current.trim() !== searchQuery) {
        return;
      }
      if (suggestions.length > 0) {
        setPredictions(suggestions.map((item) => ({ ...item, source: 'nominatim' })));
        setMessage(null);
        return;
      }
      setPredictions([]);
      setMessage('검색 결과가 없습니다.');
    } catch (error) {
      if (controller.signal.aborted) {
        return;
      }
      setMessage((prev) => prev || '주소를 찾을 수 없습니다.');
    } finally {
      setFallbackLoading(false);
    }
  }, []);

  useEffect(() => {
    queryRef.current = query;
    const trimmedQuery = query.trim();
    if (!trimmedQuery) {
      setPredictions([]);
      setMessage(null);
      setLoading(false);
      fallbackAbortRef.current?.abort();
      return;
    }
    if (!autocompleteRef.current) return;

    setLoading(true);
    const handler = window.setTimeout(() => {
      const currentQuery = trimmedQuery;
      autocompleteRef.current.getPlacePredictions(
        {
          input: currentQuery,
          types: ['address', 'establishment'],
          componentRestrictions: { country: 'kr' },
        },
        (results: any, status: string) => {
          if (queryRef.current.trim() !== currentQuery) {
            return;
          }
          setLoading(false);
          fallbackAbortRef.current?.abort();

          if (status === 'OK' && results?.length) {
            setPredictions(
              results.map((prediction: any) => ({
                source: 'google' as const,
                id: prediction.place_id,
                placeId: prediction.place_id,
                description: prediction.description,
                secondaryText: prediction.structured_formatting?.secondary_text,
              }))
            );
            setMessage(null);
            return;
          }

          setPredictions([]);
          if (status === 'ZERO_RESULTS') {
            setMessage('검색 결과가 없습니다.');
          } else {
            setMessage('주소를 찾을 수 없습니다.');
          }
          runFallbackSearch(currentQuery);
        }
      );
    }, 250);

    return () => {
      window.clearTimeout(handler);
    };
  }, [query, runFallbackSearch]);

  useEffect(() => {
    return () => {
      fallbackAbortRef.current?.abort();
    };
  }, []);

  const handleSelect = (prediction: PredictionItem) => {
    if (prediction.source === 'nominatim') {
      onSelect({
        address: prediction.description,
        placeId: prediction.id,
        lat: prediction.lat,
        lng: prediction.lng,
      });
      setQuery('');
      setPredictions([]);
      onClose();
      return;
    }

    if (!geocoderRef.current || selecting) return;
    setSelecting(true);
    geocoderRef.current.geocode({ placeId: prediction.placeId }, (results: any, status: string) => {
      setSelecting(false);
      if (status !== 'OK' || !results?.length) {
        setMessage('위치를 불러오지 못했습니다.');
        return;
      }
      const result = results[0];
      const location = result.geometry?.location;
      if (!location) {
        setMessage('좌표 정보를 찾을 수 없습니다.');
        return;
      }
      onSelect({
        address: result.formatted_address,
        placeId: prediction.placeId,
        lat: location.lat(),
        lng: location.lng(),
      });
      setQuery('');
      setPredictions([]);
      onClose();
    });
  };

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="absolute bottom-0 left-0 right-0 rounded-t-[32px] bg-white shadow-2xl max-h-[70vh] overflow-hidden flex flex-col">
        <div className="px-5 pt-5 pb-3 flex items-center justify-between border-b border-gray-100">
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-pink-500" />
            <div>
              <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest">배달지 설정</p>
              <p className="text-sm font-bold text-gray-900">주소를 검색해 주세요.</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="p-2 rounded-full text-gray-500 hover:bg-gray-100">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-5 pb-4 pt-3 border-b border-gray-100">
          <div className="relative">
            <input
              ref={inputRef}
              type="search"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
              }}
              placeholder="도로명/지번 입력"
              className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-bold text-gray-700 focus:border-pink-400 focus:outline-none"
            />
            {loading && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-pink-500">
                <Loader2 className="w-4 h-4 animate-spin" />
              </div>
            )}
          </div>
          {message && (
            <p className="text-[11px] font-bold text-gray-400 mt-2">{message}</p>
          )}
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="py-2 px-5 space-y-2">
            {selecting && (
              <p className="text-xs font-bold text-gray-500 flex items-center gap-1">
                <Loader2 className="w-3 h-3 animate-spin" /> 장소 정보를 확인하는 중입니다.
              </p>
            )}
            {fallbackLoading && !selecting && (
              <p className="text-xs font-bold text-gray-500 flex items-center gap-1">
                <Loader2 className="w-3 h-3 animate-spin" /> 다른 주소 데이터를 불러오는 중입니다.
              </p>
            )}
            {predictions.length === 0 && !selecting && !loading && !fallbackLoading && (
              <p className="text-xs font-bold text-gray-400">
                주소를 입력하면 자동완성 결과가 나옵니다.
              </p>
            )}
            {predictions.map((prediction) => (
              <button
                key={prediction.id}
                type="button"
                onClick={() => handleSelect(prediction)}
                disabled={selecting}
                className="w-full text-left rounded-2xl border border-gray-100 bg-white px-4 py-3 text-sm font-bold text-gray-800 shadow-sm flex flex-col gap-1 transition hover:border-pink-200 active:scale-[0.99]"
              >
                {prediction.secondaryText && (
                  <span className="text-xs font-black uppercase text-gray-400 tracking-wide">
                    {prediction.secondaryText}
                  </span>
                )}
                <span>{prediction.description}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddressSearchSheet;
