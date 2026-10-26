import { TourPattern } from './TourPattern';
import React from 'react';
import { ShieldCheck, Car, Clock, Compass, Headphones, Sparkles } from 'lucide-react';

/**
 * The Naiking Distinction — Six verified service standards behind every tailor-made journey.
 * Replaced unverified placeholder testimonials with authentic brand commitments and service guarantees.
 */
export interface DistinctionPillar {
  title: string;
  category: string;
  commitment: string;
  standard: string;
  icon: React.ComponentType<{ className?: string }>;
}

export const DISTINCTION_PILLARS: DistinctionPillar[] = [
  {
    category: 'Sanctuary Living',
    title: 'Curated Private Stays',
    commitment: 'Hand-selected boutique resorts, heritage properties, and private villas vetted personally for acoustic calm, privacy, and architectural character.',
    standard: 'Independently vetted stays',
    icon: Sparkles,
  },
  {
    category: 'Seamless Transit',
    title: 'Dedicated Chauffeur Care',
    commitment: 'Chauffeur meet-and-assist directly from airport arrival gates through private departures without ride-hailing friction or waiting lines.',
    standard: 'Zero waiting queues',
    icon: Car,
  },
  {
    category: 'Price Integrity',
    title: 'Guaranteed Transparent Pricing',
    commitment: 'Comprehensive final quotes inclusive of all local taxes, permits, and experiences. No hidden checkout surcharges or unexpected add-ons.',
    standard: 'No hidden surcharges',
    icon: ShieldCheck,
  },
  {
    category: 'Daily Rhythm',
    title: 'Unhurried Bespoke Pacing',
    commitment: 'Each itinerary is structured around natural waking rhythms, slow morning breakfasts, and flexible afternoons rather than rushed checklist touring.',
    standard: 'Unrushed morning pacing',
    icon: Clock,
  },
  {
    category: 'Local Insight',
    title: 'Resident Specialist Guides',
    commitment: 'Access to licensed resident storytellers and local naturalists who unlock uncrowded viewpoints, hidden culinary spots, and cultural heritage.',
    standard: 'Licensed resident guides',
    icon: Compass,
  },
  {
    category: 'Trip Concierge',
    title: 'Continuous Concierge Desk',
    commitment: 'Direct line to our senior destination desk from boarding gate to return arrival, handling reservation changes and on-trip requests in real time.',
    standard: '24/7 direct itinerary support',
    icon: Headphones,
  },
];

const PillarCard: React.FC<DistinctionPillar> = ({ category, title, commitment, standard, icon: Icon }) => {
  return (
    <figure className="w-[300px] sm:w-[360px] shrink-0 mr-5 rounded-3xl bg-[#FAF8F5] border border-[#1E2022]/12 p-6 flex flex-col justify-between shadow-[0_4px_16px_-4px_rgba(30,32,34,0.06)] hover:shadow-md hover:border-[#C2571A]/25 transition-all duration-300">
      <div>
        <div className="flex items-center justify-between">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-[#C2571A]/15 text-[12px] font-bold text-[#C2571A] shadow-2xs">
            <Icon className="w-3.5 h-3.5 text-[#C2571A]" />
            {category}
          </span>
          <span className="text-[11px] font-bold text-[#4B5563] tracking-wider uppercase">Commitment</span>
        </div>
        <h3 className="mt-4 text-base font-bold text-[#1E2022]">{title}</h3>
        <blockquote className="mt-2 text-[14px] leading-relaxed text-[#2D3748] font-normal">“{commitment}”</blockquote>
      </div>
      <figcaption className="mt-6 pt-4 border-t border-[#1E2022]/10 flex items-center justify-between text-xs">
        <span className="font-bold text-[#1E2022]">{standard}</span>
        <span className="text-[#C2571A] font-bold flex items-center gap-1">
          <ShieldCheck className="w-3.5 h-3.5 text-[#C2571A]" /> Westack Standard
        </span>
      </figcaption>
    </figure>
  );
};

export const WhyNaiking: React.FC = () => {
  return (
    <section id="why-naiking" className="relative py-16 lg:py-12 bg-gradient-to-b from-white via-[#FFF7EF] to-white overflow-hidden">
      <TourPattern variant="compass" />
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto text-center mb-10 lg:mb-14">
          <span className="text-base font-bold text-[#C2571A]">
            The Naiking Distinction
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#14213D] mt-2 text-balance" style={{ fontFamily: "'Playfair Display', serif" }}>
            Designed for travellers who value serenity over speed
          </h2>
          <p className="mt-3 text-sm sm:text-base text-[#4B5563]">
            Six foundational commitments behind every tailor-made Westack journey
          </p>
        </div>
      </div>

      {/* Endless distinction ribbon — pauses on hover, respects reduced motion */}
      <div className="relative group motion-reduce:overflow-x-auto motion-reduce:py-2">
        <div className="flex w-max animate-marquee [animation-duration:60s] group-hover:[animation-play-state:paused] motion-reduce:animate-none">
          {[...DISTINCTION_PILLARS, ...DISTINCTION_PILLARS].map((p, i) => (
            <PillarCard key={i} {...p} />
          ))}
        </div>
        <div className="pointer-events-none absolute inset-y-0 left-0 w-20 sm:w-40 bg-gradient-to-r from-white to-transparent motion-reduce:hidden" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-20 sm:w-40 bg-gradient-to-l from-white to-transparent motion-reduce:hidden" />
      </div>
    </section>
  );
};
