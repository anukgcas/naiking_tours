import React from 'react';
import { Star } from 'lucide-react';

/**
 * The Naiking Distinction — a calm, endlessly scrolling row of guest reviews.
 * NOTE: names and quotes are sample copy; replace with verified reviews.
 */
const REVIEWS = [
  {
    quote: 'We woke up to mist over the rice terraces from our own villa deck. It felt like a home prepared just for us.',
    guest: 'Devika & Rohan Mehta',
    trip: 'Bali · Sep 2026',
  },
  {
    quote: 'No 6 AM alarms, no checklist. We spent an afternoon watching the lagoon change colour — the best part of the trip.',
    guest: 'Ananya Iyer',
    trip: 'Maldives · Aug 2026',
  },
  {
    quote: 'Our chauffeur was waiting before we cleared customs. Not a single queue, the entire week.',
    guest: 'Karan & Simran Malhotra',
    trip: 'Dubai · Nov 2026',
  },
  {
    quote: 'The quote we received is exactly what we paid. No add-ons, no awkward conversations.',
    guest: 'Vikram Deshpande',
    trip: 'Manali · Jun 2026',
  },
  {
    quote: 'Slow mornings, quiet beaches and a guide who knew every story of the old quarter. Truly restful.',
    guest: 'Meera & Aditya Rao',
    trip: 'Goa · Dec 2026',
  },
  {
    quote: 'Every detail was handled before we even thought of it. We just arrived and exhaled.',
    guest: 'Sanjana Kulkarni',
    trip: 'Singapore · Oct 2026',
  },
];

const ReviewCard: React.FC<(typeof REVIEWS)[number]> = ({ quote, guest, trip }) => {
  const initials = guest
    .split(/[ &]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join('');
  return (
    <figure className="w-[300px] sm:w-[360px] shrink-0 mr-5 rounded-3xl bg-[#FAF8F5] border border-[#1E2022]/8 p-6 flex flex-col justify-between cursor-pointer">
      <div>
        <div className="flex gap-0.5 text-[#C2571A]" aria-label="5 out of 5 stars">
          {[0, 1, 2, 3, 4].map((i) => (
            <Star key={i} className="w-3.5 h-3.5 fill-current" />
          ))}
        </div>
        <blockquote className="mt-4 text-[15px] leading-relaxed text-[#1E2022]">“{quote}”</blockquote>
      </div>
      <figcaption className="mt-6 flex items-center gap-3">
        <span className="w-9 h-9 rounded-full bg-[#1E2022] text-white flex items-center justify-center text-xs font-bold">
          {initials}
        </span>
        <span className="leading-tight">
          <span className="block text-sm font-bold text-[#1E2022]">{guest}</span>
          <span className="block text-xs text-[#6B7280]">{trip}</span>
        </span>
      </figcaption>
    </figure>
  );
};

export const WhyNaiking: React.FC = () => {
  return (
    <section id="why-naiking" className="py-16 lg:py-12 bg-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto text-center mb-10 lg:mb-14">
          <span className="text-md font-semibold text-[#C2571A]">
            The Naiking Distinction
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#1E2022] mt-2 text-balance">
            Designed for travellers who value serenity over speed
          </h2>
          <p className="mt-3 text-sm sm:text-base text-[#6B7280]">Hear it from those who travelled with us</p>
        </div>
      </div>

      {/* Endless review ribbon — pauses on hover */}
      <div className="relative group">
        <div className="flex w-max animate-marquee [animation-duration:60s] group-hover:[animation-play-state:paused]">
          {[...REVIEWS, ...REVIEWS].map((r, i) => (
            <ReviewCard key={i} {...r} />
          ))}
        </div>
        <div className="pointer-events-none absolute inset-y-0 left-0 w-20 sm:w-40 bg-gradient-to-r from-white to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-20 sm:w-40 bg-gradient-to-l from-white to-transparent" />
      </div>
    </section>
  );
};
