'use client';

import Link from 'next/link';

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-[var(--sand)]">
      {/* Header */}
      <header className="border-b border-[var(--border-light)] bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="mx-auto max-w-[1400px] px-4 md:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="text-xl font-bold text-[var(--ink)] hover:opacity-80 transition-opacity">
              CheapAsTrips
            </Link>
            <Link href="/" className="text-sm font-medium text-[var(--accent)] hover:underline">
              ← Back to Home
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-4 py-12 md:py-16">
        <article className="prose prose-slate max-w-none bg-white p-8 md:p-12 rounded-2xl border border-[var(--border-light)] shadow-sm">
          <h1 className="text-3xl font-bold text-[var(--ink)] mb-8">Privacy Policy</h1>
          
          <p className="text-[var(--ink-muted)] mb-6 text-sm">Last Updated: January 2026</p>

          <section className="space-y-6 text-[var(--ink)]">
            <div>
              <h2 className="text-xl font-semibold mb-3">1. Introduction</h2>
              <p className="leading-relaxed text-[var(--ink-muted)]">
                Welcome to CheapAsTrips. We are committed to protecting your personal information and your right to privacy. 
                This policy explains how we handle your data when you visit our website. As a search aggregator, we do not 
                process payments or store sensitive financial data directly.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-semibold mb-3">2. Information We Collect</h2>
              <p className="leading-relaxed text-[var(--ink-muted)]">
                We collect minimal data to provide our search services:
              </p>
              <ul className="list-disc pl-5 mt-2 space-y-1 text-[var(--ink-muted)]">
                <li><strong>Search Data:</strong> Origin city, budget preferences, travel dates, and passenger counts.</li>
                <li><strong>Usage Data:</strong> How you interact with our site (e.g., clicks, page views) to improve user experience.</li>
                <li><strong>Device Data:</strong> IP address, browser type, and operating system for security and analytics.</li>
              </ul>
            </div>

            <div>
              <h2 className="text-xl font-semibold mb-3">3. How We Use Your Information</h2>
              <p className="leading-relaxed text-[var(--ink-muted)]">
                We use your data solely to:
              </p>
              <ul className="list-disc pl-5 mt-2 space-y-1 text-[var(--ink-muted)]">
                <li>Fetch real-time flight and hotel prices from our partners (Amadeus, Booking.com, etc.).</li>
                <li>Display relevant travel packages that match your search criteria.</li>
                <li>Maintain the security and performance of our website.</li>
              </ul>
            </div>

            <div>
              <h2 className="text-xl font-semibold mb-3">4. Third-Party Links & Bookings</h2>
              <p className="leading-relaxed text-[var(--ink-muted)]">
                CheapAsTrips is a search engine. When you click "View Deal" or "Book," you are redirected to third-party 
                websites (e.g., airline websites, Booking.com). We are not responsible for the privacy practices or 
                content of these external sites. We encourage you to read their privacy policies before providing any personal information.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-semibold mb-3">5. Cookies</h2>
              <p className="leading-relaxed text-[var(--ink-muted)]">
                We use cookies to remember your search preferences (like your last selected budget) so you don't have to 
                re-enter them. You can disable cookies in your browser settings, though some features of the site may not work as intended.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-semibold mb-3">6. Contact Us</h2>
              <p className="leading-relaxed text-[var(--ink-muted)]">
                If you have questions about this policy, please contact us at privacy@cheapastrips.com.
              </p>
            </div>
          </section>

          <div className="mt-12 pt-8 border-t border-[var(--border-light)]">
             <Link href="/faq" className="text-[var(--accent)] font-medium hover:underline">
                View Frequently Asked Questions →
             </Link>
          </div>
        </article>
      </div>
    </main>
  );
}