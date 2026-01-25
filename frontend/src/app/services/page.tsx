'use client';

import Link from 'next/link';
import TpWidget from '../../components/TpWidget';

export default function ServicesPage() {
  return (
    <main className="min-h-screen bg-[var(--sand)] pb-24">
      {/* Header */}
      <header className="border-b border-[var(--border-light)] bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="mx-auto max-w-[1400px] px-4 md:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="text-xl font-bold text-[var(--ink)] hover:opacity-80 transition-opacity">
              CheapAsTrips
            </Link>
            <Link href="/" className="text-sm font-medium text-[var(--accent)] hover:underline">
              ← Back to Flights
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-[1200px] px-4 pt-12">
        
        {/* HERO SECTION: Value Proposition */}
        <div className="text-center mb-16 space-y-4">
          <span className="inline-block py-1 px-3 rounded-full bg-blue-100 text-blue-700 text-xs font-bold tracking-wider uppercase">
            Travel Smart
          </span>
          <h1 className="text-4xl md:text-5xl font-bold text-[var(--ink)]">
            Everything else you need.
          </h1>
          <p className="text-lg text-[var(--ink-muted)] max-w-2xl mx-auto">
            Secure your airport transfers, train tickets, and attraction passes now. 
            Booking ahead saves an average of <span className="text-[var(--ink)] font-bold">20% vs paying on the day</span>.
          </p>
        </div>

        <div className="space-y-20">
          
          {/* --- SECTION 1: GROUND TRANSPORT --- */}
          <section>
            <div className="flex items-center gap-3 mb-8">
              <div className="h-12 w-12 rounded-2xl bg-green-100 flex items-center justify-center text-2xl shadow-sm">🚖</div>
              <div>
                <h2 className="text-2xl font-bold text-[var(--ink)]">Airport Transfers</h2>
                <p className="text-sm text-[var(--ink-muted)]">Don't haggle with taxis. Book a fixed-price ride.</p>
              </div>
            </div>
            
            <div className="grid lg:grid-cols-2 gap-8">
              
              {/* CARD 1: GetTransfer */}
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-[var(--border-light)] flex flex-col">
                <div className="mb-4">
                  <div className="flex justify-between items-start">
                    <h3 className="text-xl font-bold text-gray-900">Private Transfers</h3>
                    <span className="bg-green-100 text-green-700 text-[10px] font-bold px-2 py-1 rounded uppercase">Best Price</span>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    Drivers bid on your ride, so you get the lowest possible price. Great for long distances.
                  </p>
                </div>
                <div className="flex-grow">
                   <TpWidget 
                     src="https://tpwdgt.com/content?currency=USD&trs=492052&shmarker=698242.HomeScreen-Map&locale=en&from=&to=&country=&powered_by=true&height=&wtype=true&transfers_limit=10&bg_color=%23f5f5f5&button_color=%23239a54&button_font_color=%23ffffff&button_hover_color=%230274da&border_color=%23f9ac1a&input_font_color=%23c8ced4&input_bg_color=%23ffffff&input_label_color=%23c8ced4&icon_bg_color=%23ffffff&icon_arrow_color=%236c7c8c&icon_bg_color_mobile=%23f9ac1a&icon_arrow_color_mobile=%23ffffff&autocomplete_font_color=%23373f47&autocomplete_bg_color=%23ffffff&autocomplete_font_color_active=%23ffffff&autocomplete_bg_color_active=%23239a54&loader_color=%23f9ac1a&empty_color=%23373f47&info_bg_color=%23fff0cc&info_icon_color=%234a4a4a&info_caption_color=%234a4a4a&class_background=%23ffffff&class_font_color=%23373f47&class_header_color=%236c7c8c&class_button_background=%2326a65b&class_button_font_color=%23ffffff&class_button_background_hover=%230274da&class_comment_background=%23bfc0c4&class_comment_font=%23bfc0c4&more_background=&more_background_hover=&more_font_color=%230267c1&notification_background=%23f6f1ec&notification_border_color=%23e37f17&notification_color=%23373f47&transfer_background=%23f6f7f8&transfer_background_hover=%23f6f7f8&transfer_font_color=%23373f47&campaign_id=1&promo_id=2949" 
                     height="340px"
                     className="border-0 shadow-none"
                   />
                </div>
              </div>

              {/* CARD 2: KiwiTaxi */}
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-[var(--border-light)] flex flex-col">
                <div className="mb-4">
                  <div className="flex justify-between items-start">
                    <h3 className="text-xl font-bold text-gray-900">Meet & Greet Pickup</h3>
                    <span className="bg-blue-100 text-blue-700 text-[10px] font-bold px-2 py-1 rounded uppercase">Most Reliable</span>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    The driver waits for you with a name sign. Fixed price, no hidden fees, and English support.
                  </p>
                </div>
                <div className="flex-grow">
                   <TpWidget 
                     src="https://tpwdgt.com/content?currency=usd&trs=492052&shmarker=698242.HomeScreen-Map&locale=en&powered_by=true&transfer_options_limit=10&transfer_options=MCR&disable_currency_selector=true&hide_form_extras=true&hide_external_links=true&campaign_id=1&promo_id=3879" 
                     height="340px"
                     className="border-0 shadow-none"
                   />
                </div>
              </div>

            </div>
          </section>

          {/* --- SECTION 2: ADVENTURE & TRAINS --- */}
          <section>
             <div className="flex items-center gap-3 mb-8">
                <div className="h-12 w-12 rounded-2xl bg-indigo-100 flex items-center justify-center text-2xl shadow-sm">🚄</div>
                <div>
                  <h2 className="text-2xl font-bold text-[var(--ink)]">Trains, Buses & Ferries</h2>
                  <p className="text-sm text-[var(--ink-muted)]">Ideal for backpacking Europe or exploring Asia.</p>
                </div>
             </div>
             
             <div className="bg-white rounded-3xl p-8 shadow-sm border border-[var(--border-light)]">
               <div className="max-w-xl mb-6">
                 <h3 className="text-xl font-bold text-gray-900">Find the scenic route</h3>
                 <p className="text-sm text-gray-500 mt-2">
                   Often cheaper and more scenic than flying. Compare train, bus, and ferry tickets across 100+ countries instantly.
                 </p>
               </div>
               <TpWidget 
                 src="https://tpwdgt.com/content?currency=USD&trs=492052&shmarker=698242.HomeScreen-Map&language=en&theme=1&powered_by=true&campaign_id=1&promo_id=1486" 
                 height="200px"
                 className="border-0 shadow-none"
               />
             </div>
          </section>

          {/* --- SECTION 3: FLIGHT COMPENSATION --- */}
          <section>
             <div className="flex items-center gap-3 mb-8">
                <div className="h-12 w-12 rounded-2xl bg-purple-100 flex items-center justify-center text-2xl shadow-sm">🛡️</div>
                <div>
                  <h2 className="text-2xl font-bold text-[var(--ink)]">Flight Protection</h2>
                  <p className="text-sm text-[var(--ink-muted)]">Get money back for disruptions.</p>
                </div>
             </div>
             
             <div className="grid lg:grid-cols-1 max-w-3xl">
               
               {/* Compensation */}
               <div className="bg-white rounded-3xl p-6 shadow-sm border border-[var(--border-light)]">
                 <div className="mb-4 border-b border-gray-100 pb-4">
                   <h3 className="text-lg font-bold text-gray-900">💰 Flight Compensation</h3>
                   <p className="text-sm text-gray-500 mt-1">
                     Flight delayed or cancelled in the last 3 years? You could be owed up to €600.
                   </p>
                 </div>
                 <TpWidget 
                   src="https://tpwdgt.com/content?trs=492052&shmarker=698242.HomeScreen-Map&locale=en&show_header=true&powered_by=true&campaign_id=627&promo_id=8951" 
                   height="300px"
                   className="border-0 shadow-none"
                 />
                 <div className="mt-4 bg-gray-50 rounded-xl p-3 text-center">
                    <p className="text-xs text-gray-500 font-medium">Check for free • No win, no fee</p>
                 </div>
               </div>
             </div>
          </section>

          {/* --- SECTION 4: ATTRACTIONS --- */}
          <section>
             <div className="flex items-center gap-3 mb-8">
                <div className="h-12 w-12 rounded-2xl bg-yellow-100 flex items-center justify-center text-2xl shadow-sm">🎟️</div>
                <div>
                  <h2 className="text-2xl font-bold text-[var(--ink)]">Tickets & Experiences</h2>
                  <p className="text-sm text-[var(--ink-muted)]">Don't waste holiday time standing in queues.</p>
                </div>
             </div>
             
             <div className="bg-white rounded-3xl p-6 shadow-sm border border-[var(--border-light)] relative overflow-hidden">
               <div className="relative z-10 mb-6 max-w-lg">
                  <h3 className="text-2xl font-bold text-gray-900">Skip the line</h3>
                  <p className="text-gray-500 mt-2">
                    Buy tickets for the Louvre, Colosseum, Burj Khalifa, and thousands of other top attractions instantly on your phone.
                  </p>
               </div>
               
               <TpWidget 
                 src="https://tpwdgt.com/content?trs=492052&shmarker=698242.HomeScreen-Map&lang=en&powered_by=true&campaign_id=120&promo_id=8679" 
                 height="360px"
                 className="border-0 shadow-none"
               />
             </div>
          </section>

        </div>
      </div>
    </main>
  );
}