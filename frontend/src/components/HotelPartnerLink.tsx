'use client';

type HotelPartnerLinkProps = {
  city: string;
  link: string;
  partnerName?: string;
};

export default function HotelPartnerLink({ city, link, partnerName = 'Klook' }: HotelPartnerLinkProps) {
  if (!city || !link) return null;

  return (
    <section className="rounded-2xl border border-[var(--border-light)] bg-white px-5 py-4 shadow-[var(--shadow-card)]">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-[var(--ink)]">Need a place to stay?</p>
          <p className="text-sm text-[var(--ink-muted)]">
            Browse hotels in {city} — opens {partnerName} in a new tab.
          </p>
        </div>
        <a
          href={link}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--border-light)] px-4 py-2 text-sm font-medium text-[var(--ink)] transition hover:border-[var(--ink)]"
        >
          Browse hotels
        </a>
      </div>
      <p className="mt-3 text-xs text-[var(--ink-muted)]">Powered by {partnerName}</p>
    </section>
  );
}
