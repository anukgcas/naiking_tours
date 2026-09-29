import React, { useState } from 'react';
import { Check, X, Shield, Sparkles } from 'lucide-react';

export const StandardVsNaiking: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'all' | 'transit' | 'stays' | 'dining'>('all');

  const comparisons = [
    {
      category: 'transit',
      label: 'Chauffeured Transit',
      mass: '45-passenger tourist bus, rigid scheduled stops, crowded boarding queues.',
      naiking: 'Dedicated private luxury SUV with private chauffeur, on-board chilled bottles & custom departures.',
    },
    {
      category: 'stays',
      label: 'Boutique Sanctuaries',
      mass: 'Generic commercial high-rise hotels in noisy tourist districts.',
      naiking: 'Private pool villas, 400-year heritage estates, and overwater atoll bungalows with butler service.',
    },
    {
      category: 'pacing',
      label: 'Daily Pacing & Privacy',
      mass: 'Rushed 6:00 AM alarm calls, megaphone tour guides, and mandatory gift-shop detours.',
      naiking: 'Unhurried mornings, dawn temple visits before crowds arrive, and zero commercial stops.',
    },
    {
      category: 'dining',
      label: 'Artisan Gastronomy',
      mass: 'Pre-set banquet buffets in noisy group dining halls.',
      naiking: 'Curated candlelit chef dinners, organic treehouse dining, and private champagne picnics.',
    },
  ];

  const filtered =
    activeTab === 'all'
      ? comparisons
      : comparisons.filter((c) => c.category === activeTab);

  return (
    <section className="py-16 sm:py-24 bg-white border-y border-[#1E2022]/8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E05A47]/10 text-xs font-bold text-[#E05A47] mb-2 uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            <span>The Naiking Standard</span>
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-[#1E2022]">
            Why discerning travellers choose quiet luxury.
          </h2>
          <p className="mt-2 text-sm sm:text-base text-[#6B7280]">
            The difference between checking off a tourist checklist and feeling truly renewed.
          </p>
        </div>

        {/* Comparison Table / Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-5xl mx-auto">
          {/* Left Column: Standard Mass Tourism */}
          <div className="p-6 sm:p-8 rounded-3xl bg-[#FAF8F5] border border-black/5 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-6 pb-4 border-b border-[#1E2022]/8">
                <div className="w-8 h-8 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center font-bold text-xs">
                  ✕
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-700">Mass Group Tourism</h3>
                  <span className="text-xs text-gray-500">The conventional route</span>
                </div>
              </div>

              <div className="space-y-5">
                {comparisons.map((item, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-red-100 text-red-600 flex items-center justify-center shrink-0 mt-0.5">
                      <X className="w-3 h-3" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-gray-700 block uppercase tracking-wider">
                        {item.label}
                      </span>
                      <p className="text-xs text-gray-600 mt-0.5 leading-relaxed">
                        {item.mass}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-8 pt-4 border-t border-black/5 text-center text-xs text-gray-500">
              High crowd density · Little individual attention
            </div>
          </div>

          {/* Right Column: Naiking Private Sanctuary */}
          <div className="p-6 sm:p-8 rounded-3xl bg-[#1E2022] text-white border border-[#1E2022] shadow-2xl flex flex-col justify-between relative overflow-hidden">
            <div className="absolute top-0 right-0 w-48 h-48 bg-[#E05A47]/10 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10">
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-[#E05A47] text-white flex items-center justify-center font-bold text-xs shadow-md">
                    ✓
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">Naiking Tours</h3>
                    <span className="text-xs text-[#E05A47] font-semibold">Quiet Luxury Standard</span>
                  </div>
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-950/80 px-2.5 py-1 rounded-full border border-emerald-500/20">
                  100% Private
                </span>
              </div>

              <div className="space-y-5">
                {comparisons.map((item, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-[#E05A47] text-white flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                      <Check className="w-3 h-3" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-white block uppercase tracking-wider">
                        {item.label}
                      </span>
                      <p className="text-xs text-gray-300 mt-0.5 leading-relaxed">
                        {item.naiking}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-8 pt-4 border-t border-white/10 text-center text-xs text-gray-400 relative z-10">
              ✨ Pure privacy · Fluid custom schedules · Verified local historians
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
