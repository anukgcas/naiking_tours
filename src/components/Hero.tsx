import React, { useState, useEffect, useMemo } from 'react';
import { MapPin, ArrowRight, Compass, Volume2, VolumeX, Sun, Sparkles, Search, X } from 'lucide-react';
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from 'motion/react';
import { CountUp, RotatingWord, Marquee } from './HeroParts';

import { sanctuaryAudio } from '../utils/audioSanctuary';

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
  climate: string;
  timezone: string;
  timeOffsetHours: number;
  highlight: string;
  audioMode: 'ocean' | 'rainforest' | 'breeze';
}

const DESTINATION_REELS: DestinationReel[] = [
  {
    id: 'bali',
    name: 'Bali',
    country: 'Indonesia',
    image: '/images/hero_bali_luxury_1790674276055.jpg',
    climate: '28°C · Petanu Valley Mist',
    timezone: 'WITA (UTC+8)',
    timeOffsetHours: 8,
    highlight: 'Kamandalu Rainforest Infinity Sanctuary',
    audioMode: 'rainforest',
  },
  {
    id: 'maldives',
    name: 'Maldives',
    country: 'Indian Ocean',
    image: '/images/dest_maldives_1790674294175.jpg',
    climate: '29°C · Calm Turquoise Swell',
    timezone: 'MVT (UTC+5)',
    timeOffsetHours: 5,
    highlight: 'Overwater Lagoon Bungalow Sanctuary',
    audioMode: 'ocean',
  },
  {
    id: 'dubai',
    name: 'Dubai',
    country: 'UAE',
    image: '/images/dest_dubai_1790674315094.jpg',
    climate: '31°C · Sunset Dune Glow',
    timezone: 'GST (UTC+4)',
    timeOffsetHours: 4,
    highlight: 'Burj Khalifa Sky & Bedouin Desert Camp',
    audioMode: 'breeze',
  },
  {
    id: 'manali',
    name: 'Manali',
    country: 'Himachal, India',
    image: '/images/dest_manali_1790674332732.jpg',
    climate: '15°C · Cedar Pine Breeze',
    timezone: 'IST (UTC+5.5)',
    timeOffsetHours: 5.5,
    highlight: 'Alpine Stone Castle & Fireplace Chalet',
    audioMode: 'breeze',
  },
  {
    id: 'goa',
    name: 'Goa',
    country: 'India',
    image: '/images/dest_goa_1790674366139.jpg',
    climate: '27°C · Palm Shade Coastal Sunset',
    timezone: 'IST (UTC+5.5)',
    timeOffsetHours: 5.5,
    highlight: 'Indo-Portuguese Heritage Estate & Quiet Cove',
    audioMode: 'ocean',
  },
  {
    id: 'singapore',
    name: 'Singapore',
    country: 'Southeast Asia',
    image: '/images/dest_singapore_1790674346843.jpg',
    climate: '30°C · Twilight Cloud Forest',
    timezone: 'SGT (UTC+8)',
    timeOffsetHours: 8,
    highlight: 'Marina Bay Skyline & Michelin Hawker Crawl',
    audioMode: 'rainforest',
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

export const Hero: React.FC<HeroProps> = ({ onStartWizard, onExploreDestination }) => {
  const [activeReelIndex, setActiveReelIndex] = useState(0);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);

  const [query, setQuery] = useState('');

  const currentReel = DESTINATION_REELS[activeReelIndex];

  const q = query.trim().toLowerCase();
  const matches = useMemo(
    () => (q ? DESTINATION_REELS.filter((r) => `${r.name} ${r.country} ${r.highlight}`.toLowerCase().includes(q)) : []),
    [q]
  );
  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (matches.length > 0) onExploreDestination(matches[0].name);
    else onStartWizard();
  };

  // Auto-advance the destination reel; any manual pick restarts the timer
  useEffect(() => {
    const id = setTimeout(() => {
      const next = (activeReelIndex + 1) % DESTINATION_REELS.length;
      setActiveReelIndex(next);
    }, REEL_INTERVAL_MS);
    return () => clearTimeout(id);
  }, [activeReelIndex]);

  // 3D tilt of the destination stage that follows the cursor
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const rotX = useSpring(useTransform(my, [-0.5, 0.5], [5, -5]), { stiffness: 120, damping: 18 });
  const rotY = useSpring(useTransform(mx, [-0.5, 0.5], [-7, 7]), { stiffness: 120, damping: 18 });
  const handleStageMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    mx.set((e.clientX - r.left) / r.width - 0.5);
    my.set((e.clientY - r.top) / r.height - 0.5);
  };
  const handleStageLeave = () => {
    mx.set(0);
    my.set(0);
  };

  const handleSelectReel = (index: number) => {
    setActiveReelIndex(index);
    const target = DESTINATION_REELS[index];
    if (isAudioPlaying) {
      sanctuaryAudio.play(target.audioMode);
    }
  };

  const toggleSound = () => {
    const nextState = sanctuaryAudio.toggle(currentReel.audioMode);
    setIsAudioPlaying(nextState);
  };

  const headlineWords = ['Where', 'quiet', 'luxury', 'meets'];

  return (
    <section className="relative pt-[76px] lg:pt-[84px] pb-0 overflow-x-clip">
        {/* Compact destination banner — kept short so the Trip Finder is visible on first load */}
        <motion.div
          className="relative w-full overflow-hidden h-[400px] lg:h-[calc(100svh-290px)] lg:min-h-[420px] lg:max-h-[520px] bg-[#1E2022]"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
        >
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
              transition={{ duration: 1.1, ease: 'easeInOut' }}
            />
          </AnimatePresence>
          <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/40 to-black/10 pointer-events-none" />

          <div className="relative h-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-8 lg:py-10 pb-28 lg:pb-32 flex flex-col">
            {/* Top row: tags + destination switcher */}
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/15 backdrop-blur-sm border border-white/20 text-xs font-semibold text-white">
                  <Compass className="w-3.5 h-3.5" />
                  Private Tailored Sanctuaries
                </span>
                <button
                  type="button"
                  onClick={toggleSound}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/15 hover:bg-white/25 backdrop-blur-sm border border-white/20 text-xs font-semibold text-white transition-colors cursor-pointer"
                  title="Toggle gentle ambient nature audio"
                >
                  {isAudioPlaying ? (
                    <>
                      <Volume2 className="w-3.5 h-3.5" />
                      <span>Audio on</span>
                    </>
                  ) : (
                    <>
                      <VolumeX className="w-3.5 h-3.5" />
                      <span>Ambience</span>
                    </>
                  )}
                </button>
              </div>

              <div className="hidden md:flex items-center gap-1 p-1 rounded-full bg-black/30 backdrop-blur-sm border border-white/15">
                {DESTINATION_REELS.map((reel, idx) => (
                  <button
                    key={reel.id}
                    type="button"
                    onClick={() => handleSelectReel(idx)}
                    className={`relative overflow-hidden px-3 py-1.5 rounded-full text-xs font-semibold transition-colors cursor-pointer ${
                      activeReelIndex === idx ? 'bg-white text-[#1E2022]' : 'text-white/80 hover:text-white'
                    }`}
                  >
                    {reel.name}
                    {activeReelIndex === idx && (
                      <motion.span
                        key={`bar-${activeReelIndex}`}
                        className="absolute left-0 bottom-0 h-[2px] bg-[#C2571A]"
                        initial={{ width: '0%' }}
                        animate={{ width: '100%' }}
                        transition={{ duration: REEL_INTERVAL_MS / 1000, ease: 'linear' }}
                      />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Headline */}
            <div className="mt-auto max-w-2xl">
              <h1 className="text-[2.1rem] sm:text-5xl lg:text-[3.4rem] font-extrabold tracking-tight text-white leading-[1.08]">
                {headlineWords.map((w, i) => (
                  <span key={w} className="inline-block overflow-hidden align-bottom mr-[0.25em] pb-1">
                    <motion.span
                      className="inline-block"
                      initial={{ y: '110%' }}
                      animate={{ y: '0%' }}
                      transition={{ duration: 0.8, delay: 0.25 + i * 0.08, ease: [0.16, 1, 0.3, 1] }}
                    >
                      {w}
                    </motion.span>
                  </span>
                ))}
                <br />
                <RotatingWord
                  words={['adventure.', 'heritage.', 'serenity.', 'romance.']}
                  className="text-[#F0AE45]"
                />
              </h1>
            </div>

            {/* Current destination caption */}
            <div className="hidden lg:block absolute right-8 bottom-32 text-right text-white">
              <span className="text-[11px] font-bold uppercase tracking-[0.25em] text-white/70 block">
                {currentReel.country}
              </span>
              <span className="text-2xl font-extrabold block">{currentReel.name}</span>
              <span className="text-xs text-white/80 flex items-center justify-end gap-3 mt-1">
                <span className="inline-flex items-center gap-1">
                  <Sun className="w-3.5 h-3.5" />
                  {currentReel.climate.split(' · ')[0]}
                </span>
                <button
                  type="button"
                  onClick={() => onExploreDestination(currentReel.name)}
                  className="underline underline-offset-4 hover:text-white cursor-pointer"
                >
                  Explore →
                </button>
              </span>
            </div>
          </div>
        </motion.div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* DESTINATION SEARCH — pick a place and go straight into planning; overlaps the banner so it is on the first screen */}
        <motion.div
          id="hero-search"
          className="relative z-30 -mt-24 lg:-mt-28 mx-1 sm:mx-2 lg:mx-4"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.35, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="rounded-[28px] bg-[#FDFBF8] border border-[#1E2022]/8 shadow-2xl p-4 sm:p-5 lg:p-5">
            <div className="flex items-center gap-3.5">
              <span className="w-11 h-11 rounded-full bg-[#EFEBE4] flex items-center justify-center shrink-0">
                <Compass className="w-5 h-5 text-[#1E2022]/70" />
              </span>
              <div className="min-w-0">
                <h2 className="text-lg sm:text-xl font-bold text-[#1E2022] leading-tight">Where do you want to go?</h2>
                <p className="text-xs text-[#6B7280]">Tap a place to add it to your trip.</p>
              </div>
            </div>

            <form onSubmit={submitSearch} className="mt-3 relative">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-[#9CA3AF] pointer-events-none" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search destinations — Bali, beach, UAE…"
                aria-label="Search destinations"
                enterKeyHint="search"
                autoComplete="off"
                className="w-full h-12 sm:h-14 lg:h-12 pl-12 pr-14 rounded-full bg-white border border-[#1E2022]/8 shadow-[inset_0_1px_3px_rgba(0,0,0,0.04)] text-base text-[#1E2022] placeholder:text-[#9CA3AF] focus:outline-none focus:border-[#C2571A] focus:ring-4 focus:ring-[#C2571A]/15 transition"
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
                <ul className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
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
                          <span className="block text-xs text-[#6B7280] truncate">
                            {reel.country} · {reel.highlight}
                          </span>
                        </span>
                        <ArrowRight className="w-4 h-4 text-[#C2571A] transition-transform group-hover:translate-x-1" />
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="mt-4 flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-[#FAF8F5] border border-[#1E2022]/8">
                  <p className="text-sm text-[#4B4F55]">No exact match for &ldquo;{query.trim()}&rdquo;. Let us suggest the perfect place.</p>
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
              <div className="mt-4">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold text-[#1E2022]">Popular Destinations</span>
                  <span className="h-px w-16 sm:w-24 bg-gradient-to-r from-[#C2571A]/50 to-transparent" />
                  <button
                    type="button"
                    onClick={onStartWizard}
                    className="ml-auto inline-flex items-center gap-1 text-[11px] font-semibold text-[#1E2022]/70 hover:text-[#C2571A] cursor-pointer"
                  >
                    View all destinations <ArrowRight className="w-3 h-3" />
                  </button>
                </div>

                <div className="mt-3 -mx-4 sm:mx-0 px-4 sm:px-0 flex sm:grid sm:grid-cols-3 lg:grid-cols-6 gap-3 overflow-x-auto sm:overflow-visible snap-x snap-mandatory pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                  {DESTINATION_REELS.map((reel) => (
                    <button
                      key={reel.id}
                      type="button"
                      onClick={() => onExploreDestination(reel.name)}
                      className="group relative shrink-0 snap-start w-[140px] sm:w-auto h-28 sm:h-[104px] lg:h-24 rounded-2xl overflow-hidden text-left cursor-pointer shadow-md"
                    >
                      <img
                        src={reel.image}
                        alt=""
                        loading="lazy"
                        className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                      />
                      <span className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/5 to-transparent" />
                      <span className="absolute inset-x-3 bottom-2.5 flex items-center justify-between gap-1 text-white">
                        <span className="inline-flex items-center gap-1.5 text-sm font-semibold min-w-0">
                          <MapPin className="w-3.5 h-3.5 shrink-0" />
                          <span className="truncate">{reel.name}</span>
                        </span>
                        <span className="w-6 h-6 rounded-full bg-white text-[#1E2022] flex items-center justify-center shrink-0 transition-transform group-hover:translate-x-0.5">
                          <ArrowRight className="w-3 h-3" />
                        </span>
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      <div className="mt-14">
        <Marquee items={MARQUEE_ITEMS} />
      </div>
    </section>
  );
};
