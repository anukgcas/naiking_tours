import React, { useState, useEffect } from 'react';
import { MapPin, ArrowRight, Compass, Volume2, VolumeX, Sun, Sparkles, Clock } from 'lucide-react';
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

  const currentReel = DESTINATION_REELS[activeReelIndex];

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
          className="relative w-full overflow-hidden h-[400px] lg:h-[460px] bg-[#1E2022]"
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
        {/* TRIP LAUNCHER — one tap into the guided trip planner; overlaps the banner so it is on the first screen */}
        <motion.div
          id="hero-search"
          className="relative z-30 -mt-24 lg:-mt-28 mx-2 sm:mx-4 lg:mx-8"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.35, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="rounded-3xl bg-white border border-[#1E2022]/12 shadow-2xl p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-1">
              <h2 className="text-lg font-bold text-[#1E2022]">Design your own trip</h2>
              <p className="inline-flex items-center gap-1.5 text-xs text-[#6B7280]">
                <Clock className="w-3.5 h-3.5" /> Takes about 30 seconds · No payment needed
              </p>
            </div>

            <button
              type="button"
              onClick={onStartWizard}
              className="group mt-4 w-full flex items-center gap-4 pl-5 pr-2 py-2 rounded-2xl bg-[#FAF8F5] border border-[#1E2022]/12 hover:border-[#1E2022] hover:bg-white focus-visible:ring-2 focus-visible:ring-[#C2571A] focus:outline-none transition-colors text-left cursor-pointer"
            >
              <MapPin className="w-5 h-5 text-[#C2571A] shrink-0" />
              <span className="flex-1 min-w-0 py-2">
                <span className="block text-xs font-semibold text-[#1E2022]">Where do you want to go?</span>
                <span className="block text-sm sm:text-base text-[#9CA3AF] truncate">
                  Bali, Maldives, Dubai… or let AI surprise you
                </span>
              </span>
              <span className="shrink-0 inline-flex items-center gap-2 px-5 sm:px-7 py-3.5 rounded-xl bg-[#1E2022] group-hover:bg-[#C2571A] text-white text-sm font-semibold transition-colors">
                <span className="whitespace-nowrap">Start planning</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </span>
            </button>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold text-[#9CA3AF] mr-1">Popular</span>
              {DESTINATION_REELS.map((reel) => (
                <button
                  key={reel.id}
                  type="button"
                  onClick={() => onExploreDestination(reel.name)}
                  className="px-3.5 py-1.5 rounded-full bg-white border border-[#1E2022]/12 text-xs font-semibold text-[#1E2022] hover:border-[#C2571A] hover:text-[#C2571A] transition-colors cursor-pointer"
                >
                  {reel.name}
                </button>
              ))}
              <button
                type="button"
                onClick={onStartWizard}
                className="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-full bg-[#C2571A]/10 text-xs font-bold text-[#C2571A] hover:bg-[#C2571A]/20 transition-colors cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" /> Let AI choose
              </button>
            </div>
          </div>
        </motion.div>
      </div>

      <div className="mt-14">
        <Marquee items={MARQUEE_ITEMS} />
      </div>
    </section>
  );
};
