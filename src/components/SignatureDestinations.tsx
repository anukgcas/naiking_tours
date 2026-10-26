import React, { useRef, useState } from 'react';
import { ArrowRight, ChevronLeft, ChevronRight, Compass } from 'lucide-react';
import { SignatureDestination } from '../types';

interface SignatureDestinationsProps {
  destinations: SignatureDestination[];
  onSelectDestination: (destName: string) => void;
  onStartCustomising: () => void;
}

const CARD_ORDER = ['bali', 'maldives', 'dubai', 'manali', 'goa', 'singapore'];

const CARD_META: Record<
  string,
  { country: string; tag: string; startPrice: string; category: string }
> = {
  bali: {
    country: 'Indonesia',
    tag: 'Tropical & Cultural',
    startPrice: '₹6,500/nt',
    category: 'Beach',
  },
  maldives: {
    country: 'Maldives',
    tag: 'Overwater Sanctuary',
    startPrice: '₹9,500/nt',
    category: 'Beach',
  },
  dubai: {
    country: 'UAE',
    tag: 'Skyline & Desert Oasis',
    startPrice: '₹8,500/nt',
    category: 'Skyline',
  },
  manali: {
    country: 'India',
    tag: 'Alpine Cedar & Peaks',
    startPrice: '₹3,800/nt',
    category: 'Mountains',
  },
  goa: {
    country: 'India',
    tag: 'Heritage & Coast',
    startPrice: '₹4,200/nt',
    category: 'Heritage',
  },
  singapore: {
    country: 'Southeast Asia',
    tag: 'Skyline & Michelin Cuisine',
    startPrice: '₹9,500/nt',
    category: 'Skyline',
  },
};

const THEME_FILTERS = [
  { id: 'All', label: 'All Destinations' },
  { id: 'Beach', label: 'Tropical Coast' },
  { id: 'Mountains', label: 'Snow & Peaks' },
  { id: 'Skyline', label: 'Iconic Skyline' },
  { id: 'Heritage', label: 'Heritage & Culture' },
];

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
  const [activeFilter, setActiveFilter] = useState('All');
  const scrollRef = useRef<HTMLDivElement>(null);

  const ordered = CARD_ORDER.map((id) => destinations.find((d) => d.id === id)).filter(
    (d): d is SignatureDestination => Boolean(d)
  );

  const filtered =
    activeFilter === 'All'
      ? ordered
      : ordered.filter((d) => CARD_META[d.id]?.category === activeFilter);

  const scroll = (direction: 'left' | 'right') => {
    const el = scrollRef.current;
    if (!el) return;
    const card = el.firstElementChild as HTMLElement | null;
    const gap = parseFloat(getComputedStyle(el).columnGap) || 0;
    const step = card ? card.offsetWidth + gap : 340;
    el.scrollBy({ left: direction === 'left' ? -step : step, behavior: 'smooth' });
  };

  return (
    <section id="signature-destinations" className="py-12 md:py-16 scroll-mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header Block */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-6 gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#0B4A82]/10 text-[#0B4A82] text-xs font-semibold uppercase tracking-wider mb-2">
              <Compass className="w-3.5 h-3.5" />
              <span>Explore Destinations</span>
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-[#16222E]">
              Signature Destinations
            </h2>
            <p className="mt-2 text-sm font-normal sm:text-base text-[#4B5563]">
              Pick a place, then shape every day of it your way
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Scroll Navigation Buttons for Desktop */}
            <div className="hidden md:flex lg:hidden items-center gap-2 mr-2">
              <button
                onClick={() => scroll('left')}
                className="w-9 h-9 rounded-full border border-[#16222E]/15 bg-white hover:bg-[#F6F8FA] flex items-center justify-center text-[#16222E] transition-colors shadow-2xs cursor-pointer"
                aria-label="Scroll destinations left"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => scroll('right')}
                className="w-9 h-9 rounded-full border border-[#16222E]/15 bg-white hover:bg-[#F6F8FA] flex items-center justify-center text-[#16222E] transition-colors shadow-2xs cursor-pointer"
                aria-label="Scroll destinations right"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <button
              onClick={onStartCustomising}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-white border border-[#16222E]/20 text-[14px] font-bold text-[#16222E] hover:border-[#0B4A82] hover:text-[#0B4A82] hover:bg-[#F6F8FA] transition-colors duration-200 group cursor-pointer shadow-2xs"
            >
              <span>Customise From Scratch</span>
              <ArrowRight className="w-3.5 h-3.5 transition-transform duration-200 ease-out group-hover:translate-x-1" />
            </button>
          </div>
        </div>

        {/* Theme Category Filter Bar */}
        <div className="flex items-center gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden mb-8 pb-1">
          {THEME_FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setActiveFilter(f.id)}
              className={`px-4 py-2 rounded-full text-xs sm:text-sm font-semibold transition-all duration-200 cursor-pointer shrink-0 ${
                activeFilter === f.id
                  ? 'bg-[#16222E] text-white shadow-xs'
                  : 'bg-white border border-[#16222E]/15 text-[#4B5563] hover:text-[#16222E] hover:border-[#16222E]/30 hover:bg-[#F6F8FA]'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Destination cards grid/slider */}
        <div
          ref={scrollRef}
          className="flex lg:grid lg:grid-cols-3 xl:grid-cols-6 gap-4 lg:gap-5 overflow-x-auto lg:overflow-visible pb-4 pt-1 scroll-smooth snap-x snap-mandatory [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {filtered.map((dest) => {
            const meta = CARD_META[dest.id];
            return (
              <div
                key={dest.id}
                role="button"
                tabIndex={0}
                onClick={() => onSelectDestination(dest.name)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onSelectDestination(dest.name);
                  }
                }}
                onPointerMove={tiltImage}
                onPointerLeave={resetImage}
                className="group relative flex-none w-[75%] sm:w-[48%] md:w-[38%] lg:w-auto aspect-[3/4.2] rounded-[1.75rem] cursor-pointer hover:z-20 select-none bg-[#E3E9EE] snap-start shadow-md hover:shadow-[0_22px_40px_-18px_rgba(22,34,46,0.45)] hover:-translate-y-1 transition-[transform,box-shadow] duration-300 ease-out focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0B4A82]"
              >
                {/* Clip layer */}
                <div className="absolute inset-0 overflow-hidden rounded-[1.75rem] [contain:paint] [transform:translateZ(0)]">
                  <img
                    src={dest.image}
                    alt={`${dest.name}, ${dest.country}`}
                    referrerPolicy="no-referrer"
                    data-tilt-img
                    className="w-full h-full object-cover [transform-origin:center] will-change-transform contrast-[1.04] saturate-[1.06]"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/60 to-transparent" />
                </div>

                {/* Stays from badge */}
                {meta?.startPrice && (
                  <div className="absolute top-4 right-4 z-10 px-2.5 py-1 rounded-full bg-black/40 backdrop-blur-md border border-white/30 text-[11px] font-bold text-white shadow-sm">
                    From {meta.startPrice}
                  </div>
                )}

                <div className="absolute bottom-5 left-5 right-5 z-10 text-white">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-[#8CC7C4]">
                    {meta?.country ?? dest.country}
                  </p>
                  <h3 className="mt-0.5 text-xl sm:text-2xl font-extrabold leading-tight text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.6)]">{dest.name}</h3>
                  <p className="mt-1 text-xs text-white/95 font-medium line-clamp-1">{meta?.tag ?? dest.tagline}</p>
                  <span className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-[#8CC7C4] group-hover:text-white transition-colors drop-shadow-sm">
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
