import { TourPattern } from './TourPattern';
import React, { useState } from 'react';
import { ArrowRight, Minus } from 'lucide-react';

/**
 * The Naiking Standard — an editorial index of four principles.
 * Click (desktop/touch) or press Enter/Space (keyboard) to toggle rows.
 * Initial row starts open for immediate editorial preview; panels never collapse unexpectedly.
 */
const PRINCIPLES = [
  {
    title: 'Chauffeured Transit',
    body: 'Private luxury SUV, personal chauffeur, chilled bottles and custom stops.',
    phrase: 'Your journey moves at your pace.',
  },
  {
    title: 'Boutique Sanctuaries',
    body: 'Private villas, heritage estates and overwater stays.',
    phrase: 'Stay somewhere that becomes part of the journey.',
  },
  {
    title: 'Daily Pacing & Privacy',
    body: 'Unhurried mornings, flexible schedules and peaceful private experiences.',
    phrase: 'Nothing rushed. Nothing imposed.',
  },
  {
    title: 'Artisan Gastronomy',
    body: 'Curated chef dining, organic stays and private culinary experiences.',
    phrase: 'Food becomes part of the story.',
  },
];

export const StandardVsNaiking: React.FC = () => {
  const [active, setActive] = useState<number | null>(0);

  return (
    <section id="naiking-standard" className="scroll-mt-20 pt-16 pb-[54px] sm:pt-24 sm:pb-[86px] lg:pt-28 lg:pb-[102px] relative overflow-hidden bg-gradient-to-b from-white via-[#F2FAFA] to-white">
      <TourPattern variant="topo" />
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-[2fr_3fr] gap-10 lg:gap-20 items-start">
          {/* Left: editorial introduction */}
          <div className="lg:sticky lg:top-32">
            <span className="text-base font-bold text-[#C2571A]">
              The Naiking Standard
            </span>
            <h2 className="mt-4 text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight leading-[1.1] text-[#14213D] text-balance" style={{ fontFamily: "'Playfair Display', serif" }}>
              Why discerning travellers choose quiet luxury
            </h2>
            <p className="mt-5 max-w-md text-sm sm:text-base leading-relaxed text-[#374151]">
              The difference between checking off a tourist checklist and feeling truly renewed
            </p>
          </div>

          {/* Right: interactive index */}
          <ol className="border-t border-[#1E2022]/15 lg:min-h-[440px]">
            {PRINCIPLES.map((p, i) => {
              const isActive = active === i;
              return (
                <li key={p.title} className="border-b border-[#1E2022]/15">
                  <button
                    type="button"
                    id={`principle-${i}`}
                    aria-expanded={isActive}
                    aria-controls={`principle-panel-${i}`}
                    onClick={() => setActive((curr) => (curr === i ? null : i))}
                    className={`group relative w-full text-left cursor-pointer overflow-hidden px-4 sm:px-6 py-6 sm:py-7 transition-colors duration-300 ease-out focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#C2571A] motion-reduce:transition-none ${
                      isActive ? 'bg-[#F3EEE6]' : 'bg-transparent hover:bg-[#FAF8F5]'
                    }`}
                  >
                    {/* Accent rule */}
                    <span
                      aria-hidden="true"
                      className={`absolute left-0 top-0 bottom-0 w-[2px] bg-[#C2571A] origin-top transition-transform duration-500 ease-out motion-reduce:transition-none ${
                        isActive ? 'scale-y-100' : 'scale-y-0'
                      }`}
                    />
                    <div className="relative flex items-start gap-4 sm:gap-8">
                      <span
                        className={`w-7 shrink-0 pt-1 text-xs font-bold tracking-widest tabular-nums transition-[transform,color] duration-500 ease-out motion-reduce:transition-none ${
                          isActive ? 'text-[#C2571A] translate-x-1 motion-reduce:translate-x-0' : 'text-[#4B5563]'
                        }`}
                      >
                        0{i + 1}
                      </span>

                      <div className="flex-1 min-w-0">
                        <h3
                          className={`text-base sm:text-lg transition-[transform,color] duration-500 ease-out motion-reduce:transition-none ${
                            isActive
                              ? 'font-bold text-[#1E2022] translate-x-1.5 motion-reduce:translate-x-0'
                              : 'font-semibold text-[#1E2022]/85 group-hover:text-[#C2571A]'
                          }`}
                        >
                          {p.title}
                        </h3>

                        {/* Expanding content */}
                        <div
                          id={`principle-panel-${i}`}
                          role="region"
                          aria-labelledby={`principle-${i}`}
                          className={`grid transition-[grid-template-rows,opacity] duration-500 ease-out motion-reduce:transition-opacity ${
                            isActive ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
                          }`}
                        >
                          <div className="overflow-hidden">
                            <div
                              className={`pt-4 pr-12 sm:pr-20 transition-transform duration-500 ease-out motion-reduce:transition-none ${
                                isActive ? 'translate-y-0' : 'translate-y-2 motion-reduce:translate-y-0'
                              }`}
                            >
                              <p className="max-w-md text-sm sm:text-[16px] leading-relaxed text-[#2D3748]">{p.body}</p>
                              <p className="mt-3 text-sm sm:text-[16px] leading-relaxed text-[#C2571A] font-semibold">{p.phrase}</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Arrow ⇄ minus indicator */}
                      <span className="relative mt-1 w-5 h-5 shrink-0 text-[#1E2022]/70" aria-hidden="true">
                        <ArrowRight
                          className={`absolute inset-0 w-5 h-5 transition-[transform,opacity] duration-500 ease-out group-hover:translate-x-1.5 motion-reduce:transition-opacity motion-reduce:group-hover:translate-x-0 ${
                            isActive ? 'opacity-0' : 'opacity-100'
                          }`}
                        />
                        <Minus
                          className={`absolute inset-0 w-5 h-5 text-[#C2571A] transition-opacity duration-500 ease-out ${
                            isActive ? 'opacity-100' : 'opacity-0'
                          }`}
                        />
                      </span>
                    </div>
                  </button>
                </li>
              );
            })}
          </ol>
        </div>
      </div>
    </section>
  );
};
