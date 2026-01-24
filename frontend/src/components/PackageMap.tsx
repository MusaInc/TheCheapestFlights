'use client';

import { useEffect, useMemo, useRef } from 'react';
import Map, { Marker, NavigationControl, MapRef } from 'react-map-gl/maplibre';
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
  const mapStyle =
    process.env.NEXT_PUBLIC_MAP_STYLE_URL || 'https://demotiles.maplibre.org/style.json';

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

  return (
    <div className="relative h-[320px] md:h-[380px] w-full bg-[var(--border-light)]">
      <Map
        ref={mapRef}
        initialViewState={DEFAULT_VIEW}
        mapStyle={mapStyle}
        style={{ width: '100%', height: '100%' }}
      >
        <NavigationControl position="bottom-right" showCompass={false} />

        {packages.map((deal) => {
          const isActive = selectedId === deal.id;
          const isTrain = deal.transportType === 'train';
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
                className={`flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold transition-all ${
                  isActive
                    ? 'border-[var(--ink)] bg-[var(--ink)] text-white scale-110 shadow-lg z-10'
                    : 'border-[var(--border)] bg-white text-[var(--ink)] hover:border-[var(--ink)] hover:shadow-md'
                }`}
                style={{ transform: isActive ? 'scale(1.1)' : 'scale(1)' }}
              >
                <span className="text-[10px]">{isTrain ? '🚄' : '✈️'}</span>
                {formatMoney(deal.totalPrice, deal.currency)}
              </button>
            </Marker>
          );
        })}
      </Map>

      {/* Selected Location Card */}
      {selectedPackage && (
        <div className="absolute left-3 top-3 max-w-[200px] rounded-xl border border-[var(--border-light)] bg-white p-3 shadow-[var(--shadow-md)]">
          <p className="text-xs font-medium text-[var(--ink-muted)]">Selected</p>
          <p className="font-semibold text-[var(--ink)]">{selectedPackage.city}</p>
          <p className="text-xs text-[var(--ink-muted)]">{selectedPackage.country}</p>
          <p className="mt-1 text-sm font-bold text-[var(--ink)]">
            {formatMoney(selectedPackage.totalPrice, selectedPackage.currency)}
          </p>
        </div>
      )}

      {/* Map Legend */}
      <div className="absolute bottom-3 left-3 flex items-center gap-3 rounded-lg bg-white/90 px-3 py-2 text-[10px] text-[var(--ink-muted)] backdrop-blur-sm">
        <span className="flex items-center gap-1">
          <span>✈️</span> Flight
        </span>
        <span className="flex items-center gap-1">
          <span>🚄</span> Train
        </span>
      </div>
    </div>
  );
}
