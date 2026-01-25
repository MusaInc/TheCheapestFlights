'use client';

import { useState } from 'react';
import Link from 'next/link';

interface FAQItemProps {
  question: string;
  answer: string;
  isOpen: boolean;
  onClick: () => void;
}

function FAQItem({ question, answer, isOpen, onClick }: FAQItemProps) {
  return (
    <div className="border-b border-[var(--border-light)] last:border-0">
      <button
        onClick={onClick}
        className="flex w-full items-center justify-between py-5 text-left transition-colors hover:text-[var(--accent)]"
      >
        <span className="text-lg font-medium text-[var(--ink)]">{question}</span>
        <span className={`ml-4 flex-shrink-0 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}>
          <svg className="h-5 w-5 text-[var(--ink-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </span>
      </button>
      <div
        className={`overflow-hidden transition-[max-height,opacity] duration-300 ease-in-out ${
          isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <p className="pb-5 text-[var(--ink-muted)] leading-relaxed">{answer}</p>
      </div>
    </div>
  );
}

export default function FAQPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  const faqs = [
    {
      question: "How does CheapAsTrips find these prices?",
      answer: "We connect directly to global travel databases like Amadeus (for flights) and Booking.com (for hotels) in real-time. We don't set the prices ourselves; we simply find the best combinations that fit your budget and mood, then show you the total estimated cost."
    },
    {
      question: "Are the prices I see final?",
      answer: "The prices are highly accurate estimates based on live data. However, airline and hotel pricing changes by the minute. The final price is confirmed only when you click through to the partner's website to complete your booking."
    },
    {
      question: "Do I book directly with you?",
      answer: "No, we are a search engine, not a travel agency. When you find a deal you like, we redirect you to trusted partners (like the airline directly or Booking.com) to complete the transaction safely and securely."
    },
    {
      question: "Why can't I find a trip under my budget?",
      answer: "Travel costs fluctuate based on season, demand, and availability. If your budget is very tight, try selecting 'Random' for the mood or checking dates further in the future. We also show 'fallback' options if we can't find an exact match, so you can see how close you are."
    },
    {
      question: "Is my payment information safe?",
      answer: "Absolutely. Since you don't book on our site, we never ask for or store your credit card details. All payments happen on the secure websites of our partners, who use bank-grade encryption."
    },
    {
      question: "Can I search for trains instead of flights?",
      answer: "Yes! In the search panel, you can toggle between 'Flights' and 'Trains' (where available). This is perfect for eco-conscious travelers or those looking to explore Europe by rail."
    },
    {
      question: "What if I need to cancel my trip?",
      answer: "Cancellation policies depend entirely on the airline or hotel you booked with. Please check the confirmation email you received from the partner (e.g., Booking.com or British Airways) for their specific cancellation terms."
    }
  ];

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
              ← Back to Search
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-4 py-12 md:py-20">
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-bold text-[var(--ink)] mb-4">
            Frequently Asked Questions
          </h1>
          <p className="text-[var(--ink-muted)]">
            Everything you need to know about finding the best deals.
          </p>
        </div>

        <div className="rounded-2xl bg-white border border-[var(--border-light)] shadow-sm px-6 py-2 md:px-8">
          {faqs.map((faq, index) => (
            <FAQItem
              key={index}
              question={faq.question}
              answer={faq.answer}
              isOpen={openIndex === index}
              onClick={() => toggleFAQ(index)}
            />
          ))}
        </div>

        <div className="mt-12 text-center">
          <p className="text-[var(--ink-muted)] mb-4">Still have questions?</p>
          <Link 
            href="/privacy" 
            className="text-sm font-medium text-[var(--accent)] hover:underline"
          >
            Read our Privacy Policy
          </Link>
        </div>
      </div>
    </main>
  );
}