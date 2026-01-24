import type { Metadata } from 'next';
import { Manrope } from 'next/font/google';
import './globals.css';

const manrope = Manrope({
  subsets: ['latin'],
  variable: '--font-sans',
  weight: ['400', '500', '600', '700']
});

export const metadata: Metadata = {
  title: 'CheapAsTrips | Find cheap flights, trains & hotels',
  description: 'Compare real prices for flights, trains, and hotels to European destinations. Find the best value trips with transparent pricing.',
  keywords: 'cheap flights, budget travel, train deals, hotel comparison, European trips, city breaks',
  openGraph: {
    title: 'CheapAsTrips | Find cheap flights, trains & hotels',
    description: 'Compare real prices for flights, trains, and hotels to European destinations.',
    type: 'website',
  }
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={manrope.variable}>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" sizes="any" />
      </head>
      <body className="min-h-screen bg-[var(--sand)] text-[var(--ink)] antialiased">
        {children}
      </body>
    </html>
  );
}
