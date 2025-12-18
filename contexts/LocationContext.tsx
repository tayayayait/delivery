import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

const STORAGE_KEY = 'flash-location';

export interface LocationState {
  address: string;
  placeId?: string;
  lat?: number;
  lng?: number;
  updatedAt: string;
}

interface LocationContextValue extends LocationState {
  setLocation: (next: LocationState) => void;
  clearLocation: () => void;
}

const DEFAULT_ADDRESS = '서울시 강남구 테헤란로 123, 1001호';
const DEFAULT_LOCATION: LocationState = {
  address: DEFAULT_ADDRESS,
  updatedAt: new Date().toISOString(),
};

const LocationContext = createContext<LocationContextValue | undefined>(undefined);

function loadLocationFromStorage(): LocationState {
  if (typeof window === 'undefined') return DEFAULT_LOCATION;

  try {
    const serialized = window.localStorage.getItem(STORAGE_KEY);
    if (!serialized) return DEFAULT_LOCATION;
    const parsed = JSON.parse(serialized);
    if (typeof parsed.address !== 'string') return DEFAULT_LOCATION;
    return {
      address: parsed.address,
      placeId: typeof parsed.placeId === 'string' ? parsed.placeId : undefined,
      lat: typeof parsed.lat === 'number' ? parsed.lat : undefined,
      lng: typeof parsed.lng === 'number' ? parsed.lng : undefined,
      updatedAt: typeof parsed.updatedAt === 'string' ? parsed.updatedAt : DEFAULT_LOCATION.updatedAt,
    };
  } catch {
    return DEFAULT_LOCATION;
  }
}

export const LocationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<LocationState>(() => loadLocationFromStorage());

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // ignore
    }
  }, [state]);

  const setLocation = (next: LocationState) => {
    setState(next);
  };

  const clearLocation = () => {
    setState(DEFAULT_LOCATION);
  };

  const value = useMemo(
    () => ({
      ...state,
      setLocation,
      clearLocation,
    }),
    [state]
  );

  return <LocationContext.Provider value={value}>{children}</LocationContext.Provider>;
};

export function useLocation() {
  const context = useContext(LocationContext);
  if (!context) {
    throw new Error('LocationContext가 제공되지 않았습니다.');
  }
  return context;
}
