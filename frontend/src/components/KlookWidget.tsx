'use client';

import { useEffect, useRef } from 'react';

export default function KlookWidget() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      // Clear container to prevent duplicates
      containerRef.current.innerHTML = '';

      const script = document.createElement('script');
      // The exact URL you provided
      script.src = 'https://tpwdgt.com/content?currency=USD&trs=492052&shmarker=698242.HomeScreen1-Romantic&locale=en&city_id=92&category=4&amount=3&powered_by=true&campaign_id=137&promo_id=4497';
      script.async = true;
      script.charset = 'utf-8';
      
      containerRef.current.appendChild(script);
    }
  }, []);

  return (
    <div className="w-full overflow-hidden rounded-2xl border border-[var(--border-light)] bg-white shadow-sm">
        <div ref={containerRef} className="min-h-[200px] w-full" />
    </div>
  );
}