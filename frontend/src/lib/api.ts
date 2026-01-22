import type { PackageSearchParams, PackageSearchResponse } from './types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export async function searchPackages(
  params: PackageSearchParams,
  signal?: AbortSignal
): Promise<PackageSearchResponse> {
  const query = new URLSearchParams({
    origin: params.origin,
    maxBudget: params.maxBudget.toString(),
    nights: params.nights.toString(),
    adults: params.adults.toString(),
    mood: params.mood
  });

  const response = await fetch(`${API_URL}/api/packages/search?${query.toString()}`, {
    method: 'GET',
    signal
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    const message = payload?.error || 'Failed to fetch packages';
    throw new Error(message);
  }

  return response.json();
}
