import React, { useState, useEffect, useRef } from 'react';
import { MapPin, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence, animate, useMotionValue } from 'motion/react';
import { Marquee } from './HeroParts';
import { TripPlanningConsole } from './TripPlanningConsole';
import { TripDraft } from '../types';

interface HeroProps {
  /** Opens the "Where do you want to go?" trip wizard. */
  onStartWizard: () => void;
  /** Opens the wizard with this place already chosen. */
  onExploreDestination: (destName: string) => void;
  /** Launches planning with user-configured draft parameters from the console */
  onStartPlanningWithDraft?: (patch: Partial<TripDraft>, initialStep?: number) => void;
  /** Directly navigates to planner with crafted active itinerary */
  onCraftItinerary?: () => void;
  /** Holds the background slideshow on its first scene (e.g. while the splash screen is up). */
  paused?: boolean;
  /** Opens the planner card with the current trip filled in (used by "Edit trip details"). */
  prefillConsole?: boolean;
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
    image: '/images/hero_bali_day.jpg',
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
const FEATURED_REELS = DESTINATION_REELS.slice(0, 4);

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
    <div ref={box} className="absolute inset-0 pointer-events-none">
      {puffs.map((p) => (
        <motion.span
          key={p.id}
          className="absolute w-3 h-3 -ml-1.5 -mt-1.5 rounded-full bg-white/80 blur-[3px]"
          style={{ left: p.x, top: p.y }}
          initial={{ opacity: 0.6, scale: 0.5 }}
          animate={{ opacity: 0, scale: 3.2, y: -6 }}
          transition={{ duration: 2.4, ease: 'easeOut' }}
        />
      ))}
      <motion.svg
        viewBox="-16 -14 32 28"
        className="absolute left-0 top-0 w-14 h-12 -ml-[28px] -mt-6 drop-shadow-[0_4px_8px_rgba(0,0,0,0.4)]"
        style={{ x, y, rotate: rot }}
      >
        <path
          d="M12 0 L4 -2 L-2 -12 L-5 -12 L-2 -2 L-9 -3 L-11 -6 L-13 -6 L-11 0 L-13 6 L-11 6 L-9 3 L-2 2 L-5 12 L-2 12 L4 2 Z"
          fill="#FFFFFF"
          stroke="#F26B2A"
          strokeWidth="1.4"
          strokeLinejoin="round"
        />
      </motion.svg>
    </div>
  );
};

export const Hero: React.FC<HeroProps> = ({
  onStartWizard,
  onExploreDestination,
  onStartPlanningWithDraft,
  onCraftItinerary,
  paused = false,
  prefillConsole = false,
}) => {
  const [activeReelIndex, setActiveReelIndex] = useState(0);
  const [reelsHovered, setReelsHovered] = useState(false);

  const currentReel = FEATURED_REELS[activeReelIndex];

  // Auto-advance scenic background; hovering preview strip pauses timer
  useEffect(() => {
    if (reelsHovered || paused) return;
    const id = setTimeout(() => {
      setActiveReelIndex((activeReelIndex + 1) % FEATURED_REELS.length);
    }, REEL_INTERVAL_MS);
    return () => clearTimeout(id);
  }, [activeReelIndex, reelsHovered, paused]);

  const handleScrollToDestinations = () => {
    document.getElementById('signature-destinations')?.scrollIntoView({ behavior: 'smooth' });
  };

  const handlePlanningAction = (draftPatch: Partial<TripDraft>, initialStep?: number) => {
    if (onStartPlanningWithDraft) {
      onStartPlanningWithDraft(draftPatch, initialStep);
    } else {
      onStartWizard();
    }
  };

  return (
    <section id="hero" className="relative bg-[#FAF8F5]" style={{ fontFamily: "'Jost', sans-serif" }}>
      <div className="relative pt-[76px] lg:pt-[96px] overflow-hidden">
        {/* Unified scenic background photo */}
        <div className="absolute inset-0">
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

        <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-10 overflow-hidden motion-reduce:hidden">
          <WanderingPlane />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 pb-16 lg:pb-20 flex flex-col z-20">
          {/* Title + Branding Statement */}
          <div className="w-full max-w-[800px] mx-auto text-center mb-6 sm:mb-8">
            <motion.p
              className="mb-3 inline-flex items-center gap-3 text-[12px] sm:text-[14px] font-semibold tracking-[0.2em] text-[#16878C] uppercase drop-shadow-[0_1px_8px_rgba(255,255,255,0.9)]"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: EASE }}
            >
              <span aria-hidden="true" className="h-px w-6 sm:w-9 bg-[#16878C]/70" />
              Your next chapter starts here
              <span aria-hidden="true" className="h-px w-6 sm:w-9 bg-[#16878C]/70" />
            </motion.p>

            <motion.h1
              className="text-[2.5rem] sm:text-6xl lg:text-[3.9rem] font-bold tracking-tight leading-[1.06] text-[#14213D] drop-shadow-[0_2px_18px_rgba(255,255,255,0.75)]"
              style={{ fontFamily: "'Playfair Display', serif" }}
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.1, ease: EASE }}
            >
              A journey designed
              <br />
              around you
            </motion.h1>

            <motion.p
              className="mt-4 mx-auto max-w-xl text-[15px] sm:text-base font-medium leading-relaxed text-[#2F3B52] drop-shadow-[0_1px_10px_rgba(255,255,255,0.85)]"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2, ease: EASE }}
            >
              Custom itineraries, handpicked experiences and unforgettable moments — all tailored to your travel style.
            </motion.p>
          </div>

          {/* Primary Trip-Planning Entry Point (5-Field MakeMyTrip-Inspired Console) */}
          <motion.div
            id="hero-planner-console"
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.25, ease: EASE }}
            className="w-full"
          >
            <TripPlanningConsole
              key={prefillConsole ? 'edit' : 'new'}
              prefill={prefillConsole}
              onStartPlanning={handlePlanningAction}
              onExploreDestination={onExploreDestination}
              onCraftItinerary={onCraftItinerary}
            />
          </motion.div>

          {/* Featured destination story card + Popular Destinations strip */}
          <div className="pt-10 sm:pt-14 flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8 lg:gap-10">
            {/* Story Card */}
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={currentReel.id}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.45, ease: 'easeOut' }}
                className="text-white p-5 sm:p-6 rounded-3xl bg-gradient-to-br from-white/20 via-[#1E2022]/30 to-[#1E2022]/45 backdrop-blur-2xl backdrop-saturate-150 border border-white/35 shadow-[0_20px_45px_-15px_rgba(0,0,0,0.75)] ring-1 ring-inset ring-white/25 lg:w-[300px] shrink-0"
              >
                <span className="text-xs font-bold text-[#6FCFD3] uppercase tracking-wider block">
                  {currentReel.country}
                </span>
                <span className="mt-1 text-2xl sm:text-3xl font-extrabold block leading-tight text-white drop-shadow-sm">
                  {currentReel.name}
                </span>
                <span className="mt-2 text-xs sm:text-sm leading-relaxed text-white/95 block font-medium">
                  {currentReel.highlight}
                </span>
                <button
                  type="button"
                  onClick={() => onExploreDestination(currentReel.name)}
                  className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-white/40 bg-white/15 hover:bg-white/25 text-xs font-bold text-white cursor-pointer transition-colors shadow-2xs"
                >
                  <MapPin className="w-3.5 h-3.5 text-[#6FCFD3]" />
                  <span>Explore {currentReel.name} →</span>
                </button>
              </motion.div>
            </AnimatePresence>

            {/* Popular Destinations Strip */}
            <div className="min-w-0 lg:max-w-[640px] text-white">
              <div className="flex items-center justify-between gap-3 mb-3">
                <span className="text-sm font-bold tracking-wide text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">
                  Popular Destinations
                </span>
                <button
                  type="button"
                  onClick={handleScrollToDestinations}
                  className="group inline-flex items-center gap-1 text-xs font-bold text-[#8EE3E7] hover:text-white hover:underline cursor-pointer transition-colors drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]"
                >
                  <span>View All 6 Destinations</span>
                  <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5" />
                </button>
              </div>

              <div
                onMouseEnter={() => setReelsHovered(true)}
                onMouseLeave={() => setReelsHovered(false)}
                className="flex items-stretch gap-3 h-[180px] sm:h-[195px] overflow-x-auto lg:overflow-visible snap-x [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
              >
                {FEATURED_REELS.map((reel, idx) => {
                  const active = activeReelIndex === idx;
                  return (
                    <motion.button
                      key={reel.id}
                      type="button"
                      onClick={() => (active ? onExploreDestination(reel.name) : setActiveReelIndex(idx))}
                      aria-label={active ? `Plan a trip to ${reel.name}` : `Feature ${reel.name}`}
                      onPointerEnter={(e) => e.pointerType === 'mouse' && setActiveReelIndex(idx)}
                      whileHover={{ y: -4 }}
                      className={`group relative shrink-0 snap-start flex flex-col text-left cursor-pointer transition-[width] duration-500 ease-out ${
                        active ? 'w-[240px] sm:w-[280px]' : 'w-[84px] sm:w-[100px]'
                      }`}
                    >
                      <span
                        className={`relative block w-full overflow-hidden rounded-2xl shadow-[0_18px_36px_-16px_rgba(0,0,0,0.7)] ${
                          active ? 'flex-1 min-h-0' : 'h-full'
                        }`}
                      >
                        <img
                          src={reel.image}
                          alt=""
                          loading="lazy"
                          className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 contrast-[1.04] saturate-[1.06]"
                        />
                        <span
                          className={`absolute inset-0 bg-gradient-to-t from-black/70 to-transparent transition-opacity duration-500 ${
                            active ? 'opacity-0' : 'opacity-100'
                          }`}
                        />
                        {!active && (
                          <span className="absolute inset-x-2 bottom-2 text-xs font-bold text-white leading-tight">
                            {reel.name}
                          </span>
                        )}
                      </span>
                      {active && (
                        <span className="block pt-2 text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">
                          <span className="block text-sm font-semibold leading-tight">{reel.name}</span>
                          <span className="block mt-0.5 text-xs text-white/95 truncate">{reel.tags}</span>
                        </span>
                      )}
                    </motion.button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Marquee Banner */}
        <Marquee items={MARQUEE_ITEMS} />
      </div>
    </section>
  );
};