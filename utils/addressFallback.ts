type NominatimAddress = {
  house_number?: string;
  road?: string;
  neighbourhood?: string;
  suburb?: string;
  village?: string;
  town?: string;
  city?: string;
  county?: string;
  state?: string;
  postcode?: string;
  country?: string;
};

interface NominatimRaw {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
  address?: NominatimAddress;
}

const NOMINATIM_ENDPOINT = 'https://nominatim.openstreetmap.org/search';

export interface AddressFallbackSuggestion {
  id: string;
  description: string;
  secondaryText?: string;
  lat: number;
  lng: number;
}

const buildSecondaryText = (address?: NominatimAddress): string | undefined => {
  if (!address) return undefined;
  const parts = [
    address.city || address.town || address.village,
    address.county,
    address.state,
    address.country,
  ]
    .filter(Boolean)
    .join(', ');

  return parts || undefined;
};

export async function fetchAddressFallbackSuggestions(
  query: string,
  signal?: AbortSignal
): Promise<AddressFallbackSuggestion[]> {
  const url = new URL(NOMINATIM_ENDPOINT);
  url.searchParams.set('q', query);
  url.searchParams.set('format', 'json');
  url.searchParams.set('addressdetails', '1');
  url.searchParams.set('limit', '5');
  url.searchParams.set('countrycodes', 'kr');

  const response = await fetch(url.toString(), {
    signal,
    headers: {
      'Accept-Language': 'ko',
      'User-Agent': 'FlashDelivery/1.0',
    },
  });

  if (!response.ok) {
    throw new Error('주소 데이터를 불러오는 도중 오류가 발생했습니다.');
  }

  const data = (await response.json()) as NominatimRaw[];
  if (!Array.isArray(data)) {
    return [];
  }

  return data
    .map((item) => {
      const latitude = parseFloat(item.lat);
      const longitude = parseFloat(item.lon);
      if (Number.isNaN(latitude) || Number.isNaN(longitude)) {
        return null;
      }
      return {
        id: `osm-${item.place_id}`,
        description: item.display_name,
        secondaryText: buildSecondaryText(item.address),
        lat: latitude,
        lng: longitude,
      };
    })
    .filter((item): item is AddressFallbackSuggestion => Boolean(item));
}
