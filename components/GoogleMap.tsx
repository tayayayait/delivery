import React, { useEffect, useMemo, useRef, useState } from 'react';
import { loadGoogleMapsScript } from '../utils/googleMaps';

type LatLng = { lat: number; lng: number };

type MarkerSpec = {
  position: LatLng;
  title?: string;
};

type GoogleMapProps = {
  apiKey: string;
  center: LatLng;
  zoom?: number;
  marker?: MarkerSpec;
  className?: string;
};

const GoogleMap: React.FC<GoogleMapProps> = ({ apiKey, center, zoom = 15, marker, className }) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapOptions = useMemo(
    () => ({
      center,
      zoom,
      clickableIcons: false,
      disableDefaultUI: true,
      zoomControl: true,
      gestureHandling: 'greedy' as const,
    }),
    [center, zoom]
  );

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      if (!apiKey) {
        setError('Google Maps API 키가 설정되지 않았습니다.');
        return;
      }
      if (!containerRef.current) return;
      setError(null);

      try {
        await loadGoogleMapsScript(apiKey);
        if (cancelled) return;

        const google = (window as any).google as any;
        if (!google?.maps) {
          setError('Google Maps 로딩에 실패했습니다.');
          return;
        }

        const map = new google.maps.Map(containerRef.current, mapOptions);

        if (marker) {
          new google.maps.Marker({
            position: marker.position,
            map,
            title: marker.title,
          });
        }
      } catch (e: any) {
        if (cancelled) return;
        setError(e?.message || 'Google Maps를 초기화하지 못했습니다.');
      }
    }

    init();
    return () => {
      cancelled = true;
    };
  }, [apiKey, marker, mapOptions]);

  if (error) {
    return (
      <div className={className}>
        <div className="w-full h-full rounded-3xl bg-gray-50 border border-dashed border-gray-200 flex items-center justify-center px-4 text-center">
          <p className="text-xs font-bold text-gray-500">{error}</p>
        </div>
      </div>
    );
  }

  return <div ref={containerRef} className={className} />;
};

export default GoogleMap;
export type { LatLng };
