import type { Metadata } from 'next';
import { Fraunces, Space_Grotesk } from 'next/font/google';
import './globals.css';

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-sans'
});

const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-display'
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
    <html lang="en" className={`${spaceGrotesk.variable} ${fraunces.variable}`}>
      <body className="min-h-screen bg-sand text-ink antialiased">
        {children}
      </body>
    </html>
  );
}
