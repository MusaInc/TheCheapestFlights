import React from 'react';

type SidebarAdsProps = {
  position: 'left' | 'right';
};

type BannerSlot = {
  id: string;
  width: number;
  height: number;
  imageUrl?: string;
  linkUrl?: string;
  label: string;
};

const parseList = (value?: string) =>
  value
    ? value
        .split('|')
        .map((item) => item.trim())
        .filter(Boolean)
    : [];

const pickFromList = (items: string[], index: number) =>
  items.length > 0 ? items[index % items.length] : undefined;

const resolveBanner = (
  id: string,
  width: number,
  height: number,
  imageEnv?: string,
  linkEnv?: string,
  label = 'Sponsored'
): BannerSlot => {
  const images = parseList(imageEnv);
  const links = parseList(linkEnv);
  const index = images.length > 1 ? Math.floor(Math.random() * images.length) : 0;

  return {
    id,
    width,
    height,
    imageUrl: pickFromList(images, index),
    linkUrl: pickFromList(links, index) || pickFromList(links, 0),
    label
  };
};

const buildSlots = (position: SidebarAdsProps['position']) => {
  const isLeft = position === 'left';
  return [
    resolveBanner(
      `${position}-primary`,
      300,
      600,
      isLeft
        ? process.env.NEXT_PUBLIC_AD_LEFT_PRIMARY_IMAGE
        : process.env.NEXT_PUBLIC_AD_RIGHT_PRIMARY_IMAGE,
      isLeft
        ? process.env.NEXT_PUBLIC_AD_LEFT_PRIMARY_LINK
        : process.env.NEXT_PUBLIC_AD_RIGHT_PRIMARY_LINK
    ),
    resolveBanner(
      `${position}-secondary`,
      160,
      600,
      isLeft
        ? process.env.NEXT_PUBLIC_AD_LEFT_SECONDARY_IMAGE
        : process.env.NEXT_PUBLIC_AD_RIGHT_SECONDARY_IMAGE,
      isLeft
        ? process.env.NEXT_PUBLIC_AD_LEFT_SECONDARY_LINK
        : process.env.NEXT_PUBLIC_AD_RIGHT_SECONDARY_LINK
    )
  ];
};

const fallbackCopy = [
  {
    title: 'Discover cheap city breaks',
    subtitle: 'Curated deals for flexible dates.'
  },
  {
    title: 'Weekend escapes',
    subtitle: 'Flights + hotels, ranked by total cost.'
  }
];

function BannerSlotView({ slot, index }: { slot: BannerSlot; index: number }) {
  const fallback = fallbackCopy[index % fallbackCopy.length];

  return (
    <div className="flex flex-col gap-2">
      <span className="text-[11px] uppercase tracking-[0.2em] text-ink/50">{slot.label}</span>
      <div
        className="overflow-hidden rounded-2xl border border-clay/60 bg-white shadow-soft"
        style={{ width: slot.width, height: slot.height }}
      >
        {slot.imageUrl ? (
          <a
            href={slot.linkUrl || '#'}
            target="_blank"
            rel="noreferrer"
            className="block h-full w-full"
            aria-label="Open sponsored travel offer"
          >
            <img
              src={slot.imageUrl}
              alt="Sponsored travel offer"
              loading="lazy"
              className="h-full w-full object-cover"
              width={slot.width}
              height={slot.height}
            />
          </a>
        ) : (
          <div className="flex h-full w-full flex-col items-start justify-end bg-haze/80 p-6">
            <p className="text-sm font-semibold text-ink">{fallback.title}</p>
            <p className="mt-2 text-xs text-ink/60">{fallback.subtitle}</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function SidebarAds({ position }: SidebarAdsProps) {
  const slots = buildSlots(position);

  return (
    <div className="flex flex-col items-center gap-5">
      {slots.map((slot, index) => (
        <BannerSlotView key={slot.id} slot={slot} index={index} />
      ))}
    </div>
  );
}
