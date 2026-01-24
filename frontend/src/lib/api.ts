import { PackageSearchParams, PackageSearchResponse } from './types';

export async function searchPackages(
  params: PackageSearchParams,
  signal?: AbortSignal
): Promise<PackageSearchResponse> {
  // Build the query string from the params object
  const query = new URLSearchParams({
    origin: params.origin,
    maxBudget: params.maxBudget.toString(),
    nights: params.nights.toString(),
    adults: params.adults.toString(),
    mood: params.mood,
    transportType: params.transportType || 'any',
  });

  // Call our internal Next.js API route
  const response = await fetch(`/api/packages?${query.toString()}`, {
    signal,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Search failed: ${response.statusText}`);
  }

  const data = await response.json();
  if (!data.success) {
    throw new Error(data.error || 'Search failed');
  }
  return data as PackageSearchResponse;
}

export async function searchTrainPackages(
  params: Omit<PackageSearchParams, 'origin' | 'transportType'>,
  signal?: AbortSignal
): Promise<PackageSearchResponse> {
  return searchPackages(
    {
      ...params,
      origin: 'LON',
      transportType: 'train',
    },
    signal
  );
}

export async function getAddonsForCity(city: string): Promise<any> {
  const response = await fetch(`/api/addons/city/${encodeURIComponent(city)}`);

  if (!response.ok) {
    throw new Error(`Failed to fetch add-ons: ${response.statusText}`);
  }

  const data = await response.json();
  return data.data;
}

export async function compareTransport(
  destination: string,
  nights: number = 4,
  adults: number = 2
): Promise<any> {
  const query = new URLSearchParams({
    nights: nights.toString(),
    adults: adults.toString(),
  });

  const response = await fetch(
    `/api/packages/compare/${encodeURIComponent(destination)}?${query.toString()}`
  );

  if (!response.ok) {
    throw new Error(`Failed to compare transport: ${response.statusText}`);
  }

  const data = await response.json();
  return data.data;
}
