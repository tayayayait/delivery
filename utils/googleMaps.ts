export let googleMapsScriptPromise: Promise<void> | null = null;

export function loadGoogleMapsScript(apiKey: string): Promise<void> {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('브라우저 환경이 필요합니다.'));
  }
  if (!apiKey) {
    return Promise.reject(new Error('Google Maps API 키가 설정되지 않았습니다.'));
  }

  const google = (window as any).google;
  if (google?.maps) {
    return Promise.resolve();
  }

  if (googleMapsScriptPromise) {
    return googleMapsScriptPromise;
  }

  googleMapsScriptPromise = new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>('script[data-google-maps="true"]');
    if (existing) {
      if ((window as any).google?.maps) {
        resolve();
        return;
      }
      existing.addEventListener('load', () => resolve(), { once: true });
      existing.addEventListener('error', () => reject(new Error('Google Maps 스크립트를 불러오지 못했습니다.')), { once: true });
      return;
    }

    const script = document.createElement('script');
    script.dataset.googleMaps = 'true';
    script.async = true;
    script.defer = true;
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&libraries=places&v=weekly`;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Google Maps 스크립트를 불러오지 못했습니다.'));
    document.head.appendChild(script);
  });

  return googleMapsScriptPromise;
}
