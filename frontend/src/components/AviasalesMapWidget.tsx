'use client';

import { useEffect, useRef } from 'react';

export default function AviasalesMapWidget() {
  const mapContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (mapContainerRef.current) {
      mapContainerRef.current.innerHTML = '';

      const script = document.createElement('script');
      script.src = 'https://tpwdgt.com/content?currency=usd&trs=492052&shmarker=698242.HomeScreen-Map&lat=51.51&lng=0.06&powered_by=true&search_host=www.aviasales.com%2Fsearch&locale=en&origin=LON&value_min=0&value_max=1000000&round_trip=true&only_direct=false&radius=1&draggable=true&disable_zoom=false&show_logo=false&scrollwheel=true&primary=%233FABDB&secondary=%23FFFFFF&light=%23FFFFFF&width=1500&height=500&zoom=2&promo_id=4054&campaign_id=100';
      script.async = true;
      script.charset = 'utf-8';

      mapContainerRef.current.appendChild(script);
    }
  }, []);

  return (
    <div className="w-full overflow-hidden rounded-2xl border border-[var(--border-light)] bg-white shadow-lg">
      <div ref={mapContainerRef} className="w-full" style={{ minHeight: '500px' }} />
    </div>
  );
}