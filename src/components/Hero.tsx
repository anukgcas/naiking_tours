import React, { useState, useEffect, useMemo, useRef } from 'react';
import { MapPin, ArrowRight, Search, Sparkles, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence, animate, useMotionValue } from 'motion/react';
import { Marquee } from './HeroParts';

interface HeroProps {
  /** Opens the "Where do you want to go?" trip wizard. */
  onStartWizard: () => void;
  /** Opens the wizard with this place already chosen. */
  onExploreDestination: (destName: string) => void;
}

interface DestinationReel {
  id: string;
  name: string;
  country: string;
  image: string;
  tags: string;
  highlight: string;
}

const DESTINATION_REELS: DestinationReel[] = [
  {
    id: 'bali',
    name: 'Bali',
    country: 'Indonesia',
    image: '/images/hero_bali_luxury_1790674276055.jpg',
    tags: 'Culture • Beaches • Adventure',
    highlight: 'Kamandalu Rainforest Infinity Sanctuary',
  },
  {
    id: 'maldives',
    name: 'Maldives',
    country: 'Indian Ocean',
    image: '/images/dest_maldives_1790674294175.jpg',
    tags: 'Overwater • Romance • Calm',
    highlight: 'Overwater Lagoon Bungalow Sanctuary',
  },
  {
    id: 'dubai',
    name: 'Dubai',
    country: 'UAE',
    image: '/images/dest_dubai_1790674315094.jpg',
    tags: 'City • Shopping • Luxury',
    highlight: 'Burj Khalifa Sky & Bedouin Desert Camp',
  },
  {
    id: 'manali',
    name: 'Manali',
    country: 'Himachal, India',
    image: '/images/dest_manali_1790674332732.jpg',
    tags: 'Mountains • Snow • Adventure',
    highlight: 'Alpine Stone Castle & Fireplace Chalet',
  },
  {
    id: 'goa',
    name: 'Goa',
    country: 'India',
    image: '/images/dest_goa_1790674366139.jpg',
    tags: 'Beach • Party • Food',
    highlight: 'Indo-Portuguese Heritage Estate & Quiet Cove',
  },
  {
    id: 'singapore',
    name: 'Singapore',
    country: 'Southeast Asia',
    image: '/images/dest_singapore_1790674346843.jpg',
    tags: 'Skyline • Food • Family',
    highlight: 'Marina Bay Skyline & Michelin Hawker Crawl',
  },
];

const REEL_INTERVAL_MS = 6500;

const MARQUEE_ITEMS = [
  'Private Chauffeured Transit',
  'Handpicked Boutique Villas',
  'Bespoke Itineraries',
  'Zero Hidden Markups',
  '24/7 Trip Concierge',
  'Heritage & Adventure',
];

const EASE = [0.16, 1, 0.3, 1] as const;

/** A plane that keeps flying to random points inside its container, turning toward each one and leaving a fading smoke trail. */
const WanderingPlane: React.FC = () => {
  const box = useRef<HTMLDivElement>(null);
  const x = useMotionValue(-60);
  const y = useMotionValue(-60);
  const rot = useMotionValue(0);
  const flying = useRef(false);
  const [puffs, setPuffs] = useState<{ id: number; x: number; y: number; born: number }[]>([]);

  // Drop a smoke puff behind the tail while the plane is moving
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let id = 0;
    const timer = setInterval(() => {
      if (!flying.current) return;
      const a = (rot.get() * Math.PI) / 180;
      const now = Date.now();
      const puff = {
        id: id++,
        x: x.get() - Math.cos(a) * 20 + (Math.random() - 0.5) * 4,
        y: y.get() - Math.sin(a) * 20 + (Math.random() - 0.5) * 4,
        born: now,
      };
      setPuffs((prev) => [...prev.filter((p) => now - p.born < 2600), puff]);
    }, 110);
    return () => clearInterval(timer);
  }, [x, y, rot]);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let cancelled = false;
    const PAD = 40;
    const SPEED = 55; // px per second

    const run = async () => {
      // start off-canvas on the left, then wander
      let cx = -60;
      let cy = Math.random() * 300 + 100;
      x.set(cx);
      y.set(cy);
      while (!cancelled) {
        const el = box.current;
        if (!el) return;
        const w = el.clientWidth;
        const h = el.clientHeight;
        const tx = PAD + Math.random() * Math.max(1, w - PAD * 2);
        const ty = PAD + Math.random() * Math.max(1, h - PAD * 2);
        const dx = tx - cx;
        const dy = ty - cy;
        const dist = Math.hypot(dx, dy);
        if (dist < 80) continue;

        // turn the shortest way toward the heading
        const target = (Math.atan2(dy, dx) * 180) / Math.PI;
        let delta = ((target - rot.get() + 540) % 360) - 180;
        await animate(rot, rot.get() + delta, { duration: 0.9, ease: 'easeInOut' });
        if (cancelled) return;

        flying.current = true;
        await Promise.all([
          animate(x, tx, { duration: dist / SPEED, ease: 'easeInOut' }),
          animate(y, ty, { duration: dist / SPEED, ease: 'easeInOut' }),
        ]);
        flying.current = false;
        cx = tx;
        cy = ty;
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [x, y, rot]);

  return (
    <div ref={box} className="absolute inset-0">
      {puffs.map((p) => (
        <motion.span
          key={p.id}
          className="absolute w-3 h-3 -ml-1.5 -mt-1.5 rounded-full bg-slate-300/70 blur-[3px]"
          style={{ left: p.x, top: p.y }}
          initial={{ opacity: 0.6, scale: 0.5 }}
          animate={{ opacity: 0, scale: 3.2, y: -6 }}
          transition={{ duration: 2.4, ease: 'easeOut' }}
        />
      ))}
      <motion.svg
        viewBox="-16 -14 32 28"
        className="absolute left-0 top-0 w-11 h-10 -ml-[22px] -mt-5"
        style={{ x, y, rotate: rot }}
      >
        <path
          d="M12 0 L4 -2 L-2 -12 L-5 -12 L-2 -2 L-9 -3 L-11 -6 L-13 -6 L-11 0 L-13 6 L-11 6 L-9 3 L-2 2 L-5 12 L-2 12 L4 2 Z"
          fill="#C2571A"
          fillOpacity="0.85"
        />
      </motion.svg>
    </div>
  );
};

export const Hero: React.FC<HeroProps> = ({ onStartWizard, onExploreDestination }) => {
  const [activeReelIndex, setActiveReelIndex] = useState(0);
  const [query, setQuery] = useState('');
  const rowRef = useRef<HTMLDivElement>(null);

  const currentReel = DESTINATION_REELS[activeReelIndex];

  // Auto-advance the scenic image; hovering a card restarts the timer
  useEffect(() => {
    const id = setTimeout(() => {
      setActiveReelIndex((activeReelIndex + 1) % DESTINATION_REELS.length);
    }, REEL_INTERVAL_MS);
    return () => clearTimeout(id);
  }, [activeReelIndex]);

  const q = query.trim().toLowerCase();
  const matches = useMemo(
    () =>
      q
        ? DESTINATION_REELS.filter((r) =>
            `${r.name} ${r.country} ${r.tags} ${r.highlight}`.toLowerCase().includes(q)
          )
        : [],
    [q]
  );

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (matches.length > 0) onExploreDestination(matches[0].name);
    else onStartWizard();
  };

  const scrollRow = (dir: 1 | -1) =>
    rowRef.current?.scrollBy({ left: dir * 380, behavior: 'smooth' });

  return (
    <section className="relative pt-[72px] lg:pt-[88px] overflow-x-clip bg-white">
      {/* Scenic image: fades into the page — downwards on mobile, leftwards on desktop */}
      <div className="pointer-events-none absolute inset-x-0 top-[72px] h-[320px] lg:top-[88px] lg:bottom-0 lg:left-auto lg:right-0 lg:h-auto lg:w-[62%] [mask-image:linear-gradient(to_bottom,black_45%,transparent)] lg:[mask-image:linear-gradient(to_right,transparent,black_42%)]">
        <AnimatePresence initial={false}>
          <motion.img
            key={currentReel.id}
            src={currentReel.image}
            alt={`${currentReel.name}, ${currentReel.country}`}
            referrerPolicy="no-referrer"
            className="absolute inset-0 w-full h-full object-cover animate-kenburns"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.2, ease: 'easeInOut' }}
          />
        </AnimatePresence>
      </div>

      {/* Ambient backdrop, kept inside the white area (left of the photo): a plane wandering to random points, plus drifting clouds */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-0 right-0 top-[392px] bottom-0 lg:top-[88px] lg:right-[60%] overflow-hidden motion-reduce:hidden"
      >
        <motion.div
          className="absolute top-[14%] w-32 h-9 rounded-full bg-sky-100/80 blur-xl"
          initial={{ left: '-35%' }}
          animate={{ left: '105%' }}
          transition={{ duration: 28, ease: 'linear', repeat: Infinity }}
        />
        <motion.div
          className="absolute top-[70%] w-44 h-10 rounded-full bg-orange-100/80 blur-xl"
          initial={{ left: '-45%' }}
          animate={{ left: '105%' }}
          transition={{ duration: 38, ease: 'linear', repeat: Infinity, delay: 6 }}
        />
        <WanderingPlane />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-[140px] sm:pt-[180px] lg:pt-14 pb-8 lg:pb-14 flex lg:items-center">
        <div className="w-full lg:max-w-[640px]">
          <motion.p
            className="mb-2 text-[11px] sm:text-xs font-bold uppercase tracking-[0.22em] text-[#C2571A]"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: EASE }}
          >
            WHERE ARE YOU GOING?
          </motion.p>

          <motion.h1
            className="text-[1.6rem] sm:text-4xl lg:text-[2.4rem] font-extrabold tracking-tight leading-[1.08] text-[#1E2022]"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1, ease: EASE }}
          >
            Pick a destination or
            <br />
            let us inspire you.
          </motion.h1>

          <motion.div
            id="hero-search"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3, ease: EASE }}
          >
            <form onSubmit={submitSearch} className="mt-6 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-[#6B7280] pointer-events-none" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search for a destination…"
                aria-label="Search for a destination"
                enterKeyHint="search"
                autoComplete="off"
                className="w-full h-14 pl-11 pr-14 rounded-full bg-white border border-[#1E2022]/10 shadow-[0_8px_30px_-12px_rgba(30,32,34,0.25)] text-base text-[#1E2022] placeholder:text-[#9CA3AF] focus:outline-none focus:border-[#C2571A] focus:ring-4 focus:ring-[#C2571A]/15 transition"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery('')}
                  aria-label="Clear search"
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full flex items-center justify-center text-[#6B7280] hover:bg-[#1E2022]/5 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </form>

            {q ? (
              matches.length > 0 ? (
                <ul className="mt-5 grid gap-2 sm:grid-cols-2">
                  {matches.map((reel) => (
                    <li key={reel.id}>
                      <button
                        type="button"
                        onClick={() => onExploreDestination(reel.name)}
                        className="group w-full flex items-center gap-3 p-2 pr-3 rounded-2xl bg-white border border-[#1E2022]/8 hover:border-[#C2571A]/50 hover:shadow-md transition text-left cursor-pointer"
                      >
                        <img src={reel.image} alt="" className="w-14 h-14 rounded-xl object-cover shrink-0" />
                        <span className="flex-1 min-w-0">
                          <span className="block text-sm font-bold text-[#1E2022]">{reel.name}</span>
                          <span className="block text-xs text-[#6B7280] truncate">{reel.tags}</span>
                        </span>
                        <ArrowRight className="w-4 h-4 text-[#C2571A] transition-transform group-hover:translate-x-1" />
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="mt-5 flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-[#FAF8F5] border border-[#1E2022]/8">
                  <p className="text-sm text-[#4B4F55]">
                    No exact match for &ldquo;{query.trim()}&rdquo;. Let us suggest the perfect place.
                  </p>
                  <button
                    type="button"
                    onClick={onStartWizard}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#1E2022] hover:bg-[#C2571A] text-white text-xs font-semibold transition-colors cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5" /> Surprise me
                  </button>
                </div>
              )
            ) : (
              <div className="mt-6">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm font-bold text-[#1E2022]">Popular Destinations</span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => scrollRow(-1)}
                      aria-label="Scroll destinations left"
                      className="w-8 h-8 rounded-full bg-white border border-[#1E2022]/12 shadow-sm flex items-center justify-center text-[#1E2022] hover:bg-[#1E2022] hover:text-white transition-colors cursor-pointer"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => scrollRow(1)}
                      aria-label="Scroll destinations right"
                      className="w-8 h-8 rounded-full bg-white border border-[#1E2022]/12 shadow-sm flex items-center justify-center text-[#1E2022] hover:bg-[#1E2022] hover:text-white transition-colors cursor-pointer"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div ref={rowRef} className="mt-3 -mx-4 sm:-mx-2 px-4 sm:px-2 pt-2 pb-5 -mb-2 flex gap-3 overflow-x-auto snap-x snap-mandatory [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                  {DESTINATION_REELS.map((reel, idx) => (
                    <button
                      key={reel.id}
                      type="button"
                      onClick={() => onExploreDestination(reel.name)}
                      onMouseEnter={() => setActiveReelIndex(idx)}
                      className={`group relative shrink-0 snap-start w-[168px] sm:w-[178px] h-[130px] sm:h-[136px] rounded-2xl overflow-hidden text-left cursor-pointer shadow-lg transition-all duration-300 ${
                        activeReelIndex === idx ? 'ring-2 ring-white outline outline-2 outline-[#C2571A]' : ''
                      }`}
                    >
                      <img
                        src={reel.image}
                        alt=""
                        loading="lazy"
                        className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                      />
                      <span className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />
                      <span className="absolute inset-x-3 bottom-2.5 text-white">
                        <span className="block text-sm font-bold leading-tight">{reel.name}</span>
                        <span className="block text-[10px] leading-snug text-white/85 truncate">{reel.tags}</span>
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        </div>

        {/* Current destination caption, over the scenic image (desktop) */}
        <div className="hidden lg:flex absolute right-8 bottom-10 flex-col items-end gap-3 text-right text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.5)]">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-[0.25em] text-white/80 block">
              {currentReel.country}
            </span>
            <span className="text-2xl font-extrabold block">{currentReel.name}</span>
            <button
              type="button"
              onClick={() => onExploreDestination(currentReel.name)}
              className="inline-flex items-center gap-1 text-xs underline underline-offset-4 hover:text-white/80 cursor-pointer"
            >
              <MapPin className="w-3 h-3" /> Explore →
            </button>
          </div>
        </div>
      </div>

      <Marquee items={MARQUEE_ITEMS} />
    </section>
  );
};
