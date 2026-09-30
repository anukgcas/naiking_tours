import React, { useRef } from 'react';
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { SignatureDestination } from '../types';

interface SignatureDestinationsProps {
  destinations: SignatureDestination[];
  onSelectDestination: (destName: string) => void;
  onStartCustomising: () => void;
}

const CARD_ORDER = ['bali', 'maldives', 'dubai', 'manali', 'goa'];
const CARD_META: Record<string, { country: string; tag: string }> = {
  bali: { country: 'Indonesia', tag: 'Tropical & Cultural' },
  maldives: { country: 'Maldives', tag: 'Overwater Sanctuary' },
  dubai: { country: 'UAE', tag: 'Skyline & Desert Oasis' },
  manali: { country: 'India', tag: 'Alpine Cedar & Peaks' },
  goa: { country: 'India', tag: 'Heritage & Coast' },
};

const tiltMove = (e: React.MouseEvent<HTMLDivElement>) => {
  const el = e.currentTarget;
  const r = el.getBoundingClientRect();
  const x = (e.clientX - r.left) / r.width;
  const y = (e.clientY - r.top) / r.height;
  el.style.setProperty('--rx', `${((0.5 - y) * 10).toFixed(2)}deg`);
  el.style.setProperty('--ry', `${((x - 0.5) * 12).toFixed(2)}deg`);
  el.style.setProperty('--mx', `${(x * 100).toFixed(1)}%`);
  el.style.setProperty('--my', `${(y * 100).toFixed(1)}%`);
};
const tiltLeave = (e: React.MouseEvent<HTMLDivElement>) => {
  const el = e.currentTarget;
  el.style.setProperty('--rx', '0deg');
  el.style.setProperty('--ry', '0deg');
};

export const SignatureDestinations: React.FC<SignatureDestinationsProps> = ({
  destinations,
  onSelectDestination,
  onStartCustomising,
}) => {
  const ordered = CARD_ORDER.map((id) => destinations.find((d) => d.id === id)).filter(
    (d): d is SignatureDestination => Boolean(d)
  );
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const offset = direction === 'left' ? -340 : 340;
      scrollRef.current.scrollBy({ left: offset, behavior: 'smooth' });
    }
  };

  return (
    <section className="py-12 lg:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header Block: Left Title & Small Subtext, Right "View All Packages →" */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#1E2022]">
              Signature Destinations
            </h2>
            <p className="mt-1 text-sm sm:text-base text-[#6B7280]">
              Pick a place, then shape every day of it your way.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Scroll Navigation Buttons for Desktop */}
            <div className="hidden md:flex lg:hidden items-center gap-2 mr-2">
              <button
                onClick={() => scroll('left')}
                className="w-9 h-9 rounded-full border border-[#1E2022]/10 bg-white hover:bg-[#FAF8F5] flex items-center justify-center text-[#1E2022] transition-colors shadow-2xs"
                aria-label="Scroll destinations left"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => scroll('right')}
                className="w-9 h-9 rounded-full border border-[#1E2022]/10 bg-white hover:bg-[#FAF8F5] flex items-center justify-center text-[#1E2022] transition-colors shadow-2xs"
                aria-label="Scroll destinations right"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <button
              onClick={onStartCustomising}
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#1E2022] hover:text-[#C2571A] transition-colors group cursor-pointer"
            >
              <span>Start Customising</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </button>
          </div>
        </div>

        {/* Destination cards: five across on desktop, swipeable row on smaller screens */}
        <div
          ref={scrollRef}
          className="flex lg:grid lg:grid-cols-5 gap-4 lg:gap-5 overflow-x-auto lg:overflow-visible pb-4 pt-1 scroll-smooth snap-x snap-mandatory"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {ordered.map((dest) => {
            const meta = CARD_META[dest.id];
            return (
              <div
                key={dest.id}
                onClick={() => onSelectDestination(dest.name)}
                onMouseMove={tiltMove}
                onMouseLeave={tiltLeave}
                style={{ transform: 'perspective(900px) rotateX(var(--rx,0deg)) rotateY(var(--ry,0deg))', transition: 'transform 0.25s ease-out, box-shadow 0.3s' }}
                className="group relative flex-none w-[68%] sm:w-[42%] md:w-[30%] lg:w-auto aspect-[3/4] rounded-[1.75rem] cursor-pointer hover:z-20 select-none bg-[#EAE6DF] snap-start shadow-md hover:shadow-2xl"
              >
                {/* Clip layer: keeps image, glare and shimmer strictly inside THIS card */}
                <div className="absolute inset-0 overflow-hidden rounded-[1.75rem] [contain:paint] [transform:translateZ(0)]">
                <img
                  src={dest.image}
                  alt={`${dest.name}, ${dest.country}`}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent" />

                {/* Cursor-following glare */}
                <div
                  className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  style={{ background: 'radial-gradient(circle at var(--mx,50%) var(--my,50%), rgba(255,255,255,0.22), transparent 45%)' }}
                />
                {/* Shimmer sweep */}
                <div className="absolute inset-0 pointer-events-none overflow-hidden">
                  <div className="absolute top-0 left-0 h-full w-1/2 -translate-x-[160%] group-hover:translate-x-[320%] -skew-x-12 bg-gradient-to-r from-transparent via-white/35 to-transparent transition-transform duration-[900ms] ease-in-out" />
                </div>
                <div className="absolute inset-0 rounded-[1.75rem] ring-1 ring-inset ring-white/0 group-hover:ring-white/40 transition-all duration-300 pointer-events-none" />

                </div>

                <div className="absolute bottom-6 left-6 right-6 z-10 text-white">
                  <p className="text-xs font-bold uppercase tracking-wider text-white/85">
                    {meta?.country ?? dest.country}
                  </p>
                  <h3 className="mt-0.5 text-2xl font-extrabold leading-tight">{dest.name}</h3>
                  <p className="mt-1 text-sm text-white/85">{meta?.tag ?? dest.tagline}</p>
                  <span className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-[#F28A55]">
                    Plan This Trip
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
