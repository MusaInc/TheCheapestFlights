'use client';

import { useEffect, useMemo, useRef } from 'react';
import Map, { Marker, NavigationControl, MapRef } from 'react-map-gl';
import type { PackageDeal } from '../lib/types';
import { formatMoney } from '../lib/format';

const DEFAULT_VIEW = {
  longitude: 8.0,
  latitude: 48.0,
  zoom: 3.2
};

type PackageMapProps = {
  packages: PackageDeal[];
  selectedId: string | null;
  onSelect: (id: string) => void;
};

export default function PackageMap({ packages, selectedId, onSelect }: PackageMapProps) {
  const mapRef = useRef<MapRef | null>(null);
  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';

  const selectedPackage = useMemo(
    () => packages.find((item) => item.id === selectedId) || null,
    [packages, selectedId]
  );

  useEffect(() => {
    if (!mapRef.current || packages.length === 0) return;

    if (packages.length === 1) {
      mapRef.current.flyTo({
        center: [packages[0].lng, packages[0].lat],
        zoom: 5.4,
        duration: 800
      });
      return;
    }

    const lngs = packages.map((item) => item.lng);
    const lats = packages.map((item) => item.lat);

    const bounds: [[number, number], [number, number]] = [
      [Math.min(...lngs), Math.min(...lats)],
      [Math.max(...lngs), Math.max(...lats)]
    ];

    mapRef.current.fitBounds(bounds, {
      padding: 60,
      duration: 800
    });
  }, [packages]);

  if (!token) {
    return (
      <div className="flex h-[420px] w-full items-center justify-center rounded-3xl border border-clay/30 bg-white/70 text-sm text-ink/70">
        Mapbox token missing. Add `NEXT_PUBLIC_MAPBOX_TOKEN` to `frontend/.env.local`.
      </div>
    );
  }

  return (
    <div className="relative h-[420px] w-full overflow-hidden rounded-3xl border border-clay/50 bg-white shadow-soft">
      <Map
        ref={mapRef}
        mapboxAccessToken={token}
        initialViewState={DEFAULT_VIEW}
        mapStyle="mapbox://styles/mapbox/light-v11"
      >
        <NavigationControl position="bottom-right" />

        {packages.map((deal) => {
          const isActive = selectedId === deal.id;
          return (
            <Marker
              key={deal.id}
              longitude={deal.lng}
              latitude={deal.lat}
              anchor="bottom"
              onClick={(event) => {
                event.originalEvent.stopPropagation();
                onSelect(deal.id);
              }}
            >
              <button
                type="button"
                className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
                  isActive
                    ? 'border-ink bg-ink text-white'
                    : 'border-clay/50 bg-white text-ink'
                }`}
              >
                {formatMoney(deal.totalPrice, deal.currency)}
              </button>
            </Marker>
          );
        })}
      </Map>

      {selectedPackage ? (
        <div className="absolute left-4 top-4 rounded-2xl border border-clay/50 bg-white/90 px-4 py-3 text-sm shadow-soft backdrop-blur">
          <p className="text-xs uppercase tracking-[0.2em] text-ink/60">Selected</p>
          <p className="font-display text-lg text-ink">{selectedPackage.city}</p>
          <p className="text-xs text-ink/50">{selectedPackage.country}</p>
        </div>
      ) : null}
    </div>
  );
}
