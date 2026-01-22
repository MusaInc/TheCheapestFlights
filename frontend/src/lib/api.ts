import { PackageSearchParams, PackageSearchResponse } from './types';

export async function searchPackages(
  params: PackageSearchParams,
  signal?: AbortSignal
): Promise<PackageSearchResponse> {
  // We build the query string from the params object
  const query = new URLSearchParams({
    origin: params.origin,
    maxBudget: params.maxBudget.toString(),
    nights: params.nights.toString(),
    adults: params.adults.toString(),
    mood: params.mood,
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
  return data as PackageSearchResponse;
}