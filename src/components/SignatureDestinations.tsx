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

const TILT_MAX = 12; // degrees
const TILT_SCALE = 1.15; // enough overscan that no edge shows at max tilt
const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Tilts the image inside a card toward the cursor. Writes straight to the DOM (rAF-throttled) so React never re-renders. */
const tiltImage = (e: React.PointerEvent<HTMLDivElement>) => {
  if (e.pointerType !== 'mouse' || prefersReducedMotion()) return;
  const card = e.currentTarget;
  const img = card.querySelector<HTMLImageElement>('[data-tilt-img]');
  if (!img) return;
  const r = card.getBoundingClientRect();
  const x = (e.clientX - r.left) / r.width;
  const y = (e.clientY - r.top) / r.height;
  const rx = (0.5 - y) * 2 * TILT_MAX;
  const ry = (x - 0.5) * 2 * TILT_MAX;
  const prev = (img as any)._raf as number | undefined;
  if (prev) cancelAnimationFrame(prev);
  (img as any)._raf = requestAnimationFrame(() => {
    // short transition while tracking = smooth, spring-like follow
    img.style.transition = 'transform 160ms ease-out';
    img.style.transform = `perspective(500px) rotateX(${rx.toFixed(2)}deg) rotateY(${ry.toFixed(2)}deg) scale(${TILT_SCALE})`;
  });
};
const resetImage = (e: React.PointerEvent<HTMLDivElement>) => {
  const img = e.currentTarget.querySelector<HTMLImageElement>('[data-tilt-img]');
  if (!img) return;
  const prev = (img as any)._raf as number | undefined;
  if (prev) cancelAnimationFrame(prev);
  img.style.transition = 'transform 400ms ease-out';
  img.style.transform = 'perspective(500px) rotateX(0deg) rotateY(0deg) scale(1)';
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
            <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-[#1E2022]">
              Signature Destinations
            </h2>
            <p className="mt-2 text-sm font-medium sm:text-base text-[#6B7280]">
              Pick a place, then shape every day of it your way
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
              className="inline-flex items-center gap-1.5 px-5 py-2 rounded-full bg-white border border-[#1E2022]/10 text-[14px] sm:text-[14px] font-semibold text-[#000000] hover:border-[#1E2022]/25 hover:bg-[#1E2022]/[0.025] transition-colors duration-200 group cursor-pointer"
            >
              <span>Start Customising</span>
              <ArrowRight className="w-3.5 h-3.5 transition-transform duration-200 ease-out group-hover:translate-x-1" />
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
                onPointerMove={tiltImage}
                onPointerLeave={resetImage}
                className="group relative flex-none w-[68%] sm:w-[42%] md:w-[30%] lg:w-auto aspect-[3/4] rounded-[1.75rem] cursor-pointer hover:z-20 select-none bg-[#EAE6DF] snap-start shadow-md hover:shadow-[0_22px_40px_-18px_rgba(30,32,34,0.45)] hover:-translate-y-1 transition-[transform,box-shadow] duration-300 ease-out"
              >
                {/* Clip layer: keeps the image strictly inside THIS card */}
                <div className="absolute inset-0 overflow-hidden rounded-[1.75rem] [contain:paint] [transform:translateZ(0)]">
                <img
                  src={dest.image}
                  alt={`${dest.name}, ${dest.country}`}
                  referrerPolicy="no-referrer"
                  data-tilt-img
                  className="w-full h-full object-cover [transform-origin:center] will-change-transform"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent" />

                </div>

                <div className="absolute bottom-6 left-6 right-6 z-10 text-white">
                  <p className="text-xs font-medium uppercase tracking-wider text-white/85">
                    {meta?.country ?? dest.country}
                  </p>
                  <h3 className="mt-0.5 text-2xl font-semibold leading-tight">{dest.name}</h3>
                  <p className="mt-1 text-sm text-white/85">{meta?.tag ?? dest.tagline}</p>
                  <span className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-[#F28A55]">
                    Plan This Trip
                    <ArrowRight className="w-3.5 h-3.5 transition-transform duration-200 ease-out group-hover:translate-x-1" />
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
