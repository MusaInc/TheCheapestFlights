import type { Metadata } from 'next';
import { Manrope } from 'next/font/google';
import './globals.css';

const manrope = Manrope({
  subsets: ['latin'],
  variable: '--font-sans',
  weight: ['300', '400', '500', '600', '700', '800']
});

export const metadata: Metadata = {
  title: 'The Cheapest Flights | Real holiday discovery',
  description: 'Discover real flight-led holiday packages with transparent pricing and affiliate hotel links.'
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={manrope.variable}>
      <body className="min-h-screen bg-sand text-ink antialiased">
        {children}
      </body>
    </html>
  );
}
