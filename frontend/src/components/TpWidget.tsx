'use client';

import { useEffect, useRef } from 'react';

interface TpWidgetProps {
  src: string;
  height?: string;
  className?: string;
}

export default function TpWidget({ src, height = "250px", className = "" }: TpWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.innerHTML = ''; // Clear to prevent duplicates
      const script = document.createElement('script');
      script.src = src;
      script.async = true;
      script.charset = 'utf-8';
      containerRef.current.appendChild(script);
    }
  }, [src]);

  return (
    <div className={`w-full overflow-hidden rounded-2xl bg-white shadow-sm border border-[var(--border-light)] ${className}`}>
      <div ref={containerRef} style={{ minHeight: height }} className="w-full" />
    </div>
  );
}