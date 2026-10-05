import React, { useState, useEffect, useRef } from 'react';
import { MapPin, ArrowRight, Search } from 'lucide-react';
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
// Only these destinations are shown in the strip, so the loop cycles through just them
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
  // Hovering the destination previews pauses the auto-advance so the chosen background stays put
  const [reelsHovered, setReelsHovered] = useState(false);

  const currentReel = FEATURED_REELS[activeReelIndex];

  // Auto-advance the scenic image; hovering a card restarts the timer
  useEffect(() => {
    if (reelsHovered) return;
    const id = setTimeout(() => {
      setActiveReelIndex((activeReelIndex + 1) % FEATURED_REELS.length);
    }, REEL_INTERVAL_MS);
    return () => clearTimeout(id);
  }, [activeReelIndex, reelsHovered]);

  return (
    <section id="hero" className="relative bg-[#1E2022]" style={{ fontFamily: "'Jost', sans-serif" }}>
      <div className="relative pt-[72px] lg:pt-[120px] overflow-hidden">
        {/* One unified scene: the featured destination photo fills the hero */}
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
          {/* Readability: dark on the text side and at the bottom, clear in the middle of the scene */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#14110F]/55 via-[#14110F]/15 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#14110F]/80 via-transparent to-[#14110F]/25" />
        </div>

        <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden motion-reduce:hidden">
          <WanderingPlane />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-16 lg:pb-20 flex flex-col">
          {/* Title + trip-start action */}
          <div className="w-full max-w-[760px] mx-auto text-center">
            <motion.p
              className="mb-3 text-[17px] sm:text-base font-semibold tracking-[0.18em] text-[#FFB27A]"
              style={{ fontFamily: "'Marcellus', serif" }}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: EASE }}
            >
              LET’S BUILD YOUR TRIP
            </motion.p>

            <motion.h1
              className="text-[2.1rem] sm:text-5xl lg:text-[3.4rem] font-normal tracking-tight leading-[1.08] text-white drop-shadow-[0_2px_18px_rgba(0,0,0,0.35)]"
              style={{ fontFamily: "'Marcellus', serif" }}
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.1, ease: EASE }}
            >
              A Journey Designed
              <br />
              Around You
            </motion.h1>

            <motion.div
              id="hero-search"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3, ease: EASE }}
            >
              <button
                type="button"
                onClick={onStartWizard}
                aria-label="Where should we take you"
                className="mt-7 mx-auto group relative w-full max-w-[560px] h-14 pl-12 pr-14 rounded-full bg-white/10 backdrop-blur-md border border-white/25 shadow-[0_18px_40px_-20px_rgba(0,0,0,0.6)] text-left text-base text-white/85 hover:bg-white/20 focus:outline-none focus-visible:ring-4 focus-visible:ring-white/40 active:scale-[0.99] transition cursor-pointer"
              >
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-white" />
                Where should we take you
                <span className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-[#C2571A]/90 shadow-[inset_0_1px_0_rgba(255,255,255,0.45)] group-hover:bg-[#C2571A] text-white flex items-center justify-center transition-colors">
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                </span>
              </button>
            </motion.div>
          </div>

          {/* Featured destination story + floating destination previews */}
          <div className="pt-[84px] flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8 lg:gap-10">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={currentReel.id}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.45, ease: 'easeOut' }}
                className="text-white p-5 sm:p-6 rounded-3xl bg-white/10 backdrop-blur-md border border-white/25 shadow-[0_18px_40px_-20px_rgba(0,0,0,0.6)] lg:w-[300px] shrink-0 lg:translate-y-6"
              >
                <span className="text-[14px] font-regular text-white/90 block">
                  {currentReel.country}
                </span>
                <span className="mt-1 text-3xl sm:text-4xl font-medium block leading-tight">{currentReel.name}</span>
                <span className="mt-2 text-[14px] leading-relaxed text-white/80 block">{currentReel.highlight}</span>
                <button
                  type="button"
                  onClick={() => onExploreDestination(currentReel.name)}
                  className="mt-4 inline-flex items-center gap-1 px-4 py-2 rounded-full border border-white/40 bg-white/10 hover:bg-white/20 text-sm cursor-pointer transition-colors"
                >
                  <MapPin className="w-3.5 h-3.5" /> Explore →
                </button>
              </motion.div>
            </AnimatePresence>

            <div className="min-w-0 lg:max-w-[640px] text-white lg:-translate-y-8">
              <div className="flex items-center justify-between gap-3">
                <span className="text-md font-medium leading-none tracking-wide">Popular Destinations</span>
                <button
                  type="button"
                  onClick={onStartWizard}
                  className="group inline-flex items-center gap-1 text-md font-medium leading-none text-[#FFB27A] cursor-pointer"
                >
                  Explore destinations
                  <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
                </button>
              </div>

              <div
                onMouseEnter={() => setReelsHovered(true)}
                onMouseLeave={() => setReelsHovered(false)}
                className="mt-3 -mx-4 px-4 sm:mx-0 sm:px-0 flex items-stretch gap-3 h-[190px] sm:h-[210px] overflow-x-auto lg:overflow-visible snap-x [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
              >
                {FEATURED_REELS.map((reel, idx) => {
                  const active = activeReelIndex === idx;
                  return (
                    <motion.button
                      key={reel.id}
                      type="button"
                      // The first tap features a destination; tapping the featured one opens the wizard with it chosen
                      onClick={() => (active ? onExploreDestination(reel.name) : setActiveReelIndex(idx))}
                      aria-label={active ? `Plan a trip to ${reel.name}` : `Feature ${reel.name}`}
                      // Mouse only: on touch, the first tap still features a card and the second opens the wizard
                      onPointerEnter={(e) => e.pointerType === 'mouse' && setActiveReelIndex(idx)}
                      whileHover={{ y: -4 }}
                      className={`group relative shrink-0 snap-start flex flex-col text-left cursor-pointer transition-[width] duration-500 ease-out ${
                        active ? 'w-[250px] sm:w-[300px]' : 'w-[84px] sm:w-[104px]'
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
                          className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
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
                        <span className="block pt-2.5 text-white drop-shadow-[0_1px_8px_rgba(0,0,0,0.6)]">
                          <span className="block text-sm font-medium leading-tight">{reel.name}</span>
                          <span className="block mt-0.5 text-[13px] leading-snug text-white/85">{reel.tags}</span>
                        </span>
                      )}
                    </motion.button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Sits over the bottom of the photo, so it stays transparent */}
        <Marquee items={MARQUEE_ITEMS} />
      </div>
    </section>
  );
};