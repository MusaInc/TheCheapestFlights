'use client';

import { useEffect, useRef } from 'react';

export default function AviasalesSearchWidget() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      // Clear previous content to prevent duplicates
      containerRef.current.innerHTML = '';

      const script = document.createElement('script');
      script.src = 'https://tpwdgt.com/content?currency=usd&trs=492052&shmarker=698242.HomeScreenSearch&show_hotels=true&powered_by=true&locale=en&searchUrl=www.aviasales.com%2Fsearch&primary_override=%23FF3605ff&color_button=%2332a8dd&color_icons=%2332a8dd&dark=%23262626&light=%23FFFFFF&secondary=%23FFFFFF&special=%23C4C4C4&color_focused=%2332a8dd&border_radius=0&no_labels=&plain=true&promo_id=7879&campaign_id=100';
      script.async = true;
      script.charset = 'utf-8';
      
      containerRef.current.appendChild(script);
    }
  }, []);

  return (
    <div className="w-full overflow-hidden rounded-2xl bg-white shadow-lg">
       <div ref={containerRef} className="min-h-[200px] w-full" />
    </div>
  );
}