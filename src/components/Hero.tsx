import React, { useState, useEffect } from 'react';
import {
  MapPin,
  Calendar,
  Users,
  Wallet,
  ArrowRight,
  Compass,
  Check,
  ChevronDown,
  Volume2,
  VolumeX,
  Sun,
  Clock,
  Sparkles,
} from 'lucide-react';
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from 'motion/react';
import { CountUp, RotatingWord, Marquee } from './HeroParts';
import { TripSearchState } from '../types';
import { sanctuaryAudio } from '../utils/audioSanctuary';

interface HeroProps {
  onSearch: (search: TripSearchState) => void;
  onExploreDestination: (destName: string) => void;
  packagesCount?: number;
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

const BUDGET_OPTIONS = [
  { label: 'Any Budget', value: 'any' },
  { label: '₹15,000 – ₹30,000', value: '15k-30k' },
  { label: '₹30,000 – ₹60,000', value: '30k-60k' },
  { label: '₹60,000 – ₹1,20,000', value: '60k-120k' },
  { label: '₹1,20,000+ Luxury', value: '120k+' },
];

export const Hero: React.FC<HeroProps> = ({
  onSearch,
  onExploreDestination,
  packagesCount = 6,
}) => {
  const [activeReelIndex, setActiveReelIndex] = useState(0);
  const [destination, setDestination] = useState('');
  const [isDestOpen, setIsDestOpen] = useState(false);
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);
  const [guestsChosen, setGuestsChosen] = useState(false);
  const [isTravellersOpen, setIsTravellersOpen] = useState(false);
  const [budgetRange, setBudgetRange] = useState('');
  const [isBudgetOpen, setIsBudgetOpen] = useState(false);
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

  // Calculate nights
  const calculateNights = () => {
    if (!checkIn || !checkOut) return 0;
    const d1 = new Date(checkIn);
    const d2 = new Date(checkOut);
    const diff = Math.ceil(Math.abs(d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24));
    return isNaN(diff) ? 0 : diff;
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

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch({
      destination: destination.split(',')[0].trim() || 'all',
      checkIn,
      checkOut,
      adults,
      children,
      budgetRange: budgetRange || 'any',
    });
  };

  const selectedBudgetLabel =
    BUDGET_OPTIONS.find((b) => b.value === budgetRange)?.label || '';

  const headlineWords = ['Where', 'quiet', 'luxury', 'meets'];

  return (
    <section className="relative pt-[88px] lg:pt-[96px] pb-0 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Compact destination banner — kept short so the Trip Finder is visible on first load */}
        <motion.div
          className="relative rounded-3xl overflow-hidden h-[400px] lg:h-[440px] bg-[#1E2022] shadow-xl"
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

          <div className="relative h-full p-5 sm:p-8 lg:p-10 pb-28 lg:pb-32 flex flex-col">
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
            <div className="hidden lg:block absolute right-10 bottom-32 text-right text-white">
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

        {/* TRIP FINDER — overlaps the banner so it is part of the first screen */}
        <motion.div
          id="hero-search"
          className="relative z-30 -mt-24 lg:-mt-28 mx-2 sm:mx-4 lg:mx-8"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.35, ease: [0.16, 1, 0.3, 1] }}
        >
          <div>
            <div className="relative rounded-3xl bg-white border border-[#1E2022]/12 shadow-2xl p-6 sm:p-8">
              <div className="mb-6">
                <h2 className="text-lg font-bold text-[#1E2022]">Find your perfect trip</h2>
                <p className="mt-0.5 text-sm text-[#6B7280]">Tell us where and when — we will shape the rest.</p>
              </div>
              <form
            onSubmit={handleSearchSubmit}
            className=""
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_1fr_1.2fr_auto] gap-4 items-stretch">
              {/* Field 1: Destination */}
              <div className="relative px-4 py-3.5 rounded-xl bg-white border border-[#1E2022]/12 hover:border-[#1E2022]/35 focus-within:border-[#1E2022] focus-within:ring-2 focus-within:ring-[#1E2022]/10 transition-colors">
                <div
                  onClick={() => setIsDestOpen(!isDestOpen)}
                  className="cursor-pointer"
                >
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-[#1E2022]">
                    <MapPin className="w-3.5 h-3.5 text-[#C2571A]" />
                    <span>Where do you want to go?</span>
                  </div>
                  <div className="mt-1 flex items-center justify-between">
                    <span className={`text-sm truncate ${destination ? 'font-semibold text-[#1E2022]' : 'font-normal text-[#9CA3AF]'}`}>
                      {destination || 'Search destination'}
                    </span>
                    <ChevronDown className="w-4 h-4 text-[#9CA3AF]" />
                  </div>
                </div>

                {isDestOpen && (
                  <div className="absolute top-full left-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-[#1E2022]/10 p-2 z-50">
                    <p className="text-[11px] font-semibold text-[#9CA3AF] px-3 py-1 uppercase tracking-wider">
                      Popular Choices
                    </p>
                    {DESTINATION_REELS.map((reel) => (
                      <button
                        key={reel.id}
                        type="button"
                        onClick={() => {
                          setDestination(`${reel.name}, ${reel.country}`);
                          setIsDestOpen(false);
                        }}
                        className="w-full text-left px-3 py-2 text-sm rounded-lg hover:bg-[#FAF8F5] flex items-center justify-between text-[#1E2022]"
                      >
                        <span>
                          {reel.name}, {reel.country}
                        </span>
                        {destination.startsWith(reel.name) && (
                          <Check className="w-4 h-4 text-[#C2571A]" />
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Field 2: Check-in */}
              <div className="px-4 py-3.5 rounded-xl bg-white border border-[#1E2022]/12 hover:border-[#1E2022]/35 focus-within:border-[#1E2022] focus-within:ring-2 focus-within:ring-[#1E2022]/10 transition-colors">
                <label
                  htmlFor="checkin-hero"
                  className="flex items-center gap-1.5 text-xs font-semibold text-[#1E2022]"
                >
                  <Calendar className="w-3.5 h-3.5 text-[#C2571A]" />
                  <span>Check-in</span>
                </label>
                <input
                  id="checkin-hero"
                  type="date"
                  value={checkIn}
                  onChange={(e) => setCheckIn(e.target.value)}
                  className={`mt-1 w-full text-sm bg-transparent focus:outline-none cursor-pointer ${checkIn ? 'font-semibold text-[#1E2022]' : 'font-normal text-[#9CA3AF]'}`}
                />
              </div>

              {/* Field 3: Check-out with Nights Pill */}
              <div className="px-4 py-3.5 rounded-xl bg-white border border-[#1E2022]/12 hover:border-[#1E2022]/35 focus-within:border-[#1E2022] focus-within:ring-2 focus-within:ring-[#1E2022]/10 transition-colors">
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="checkout-hero"
                    className="flex items-center gap-1.5 text-xs font-semibold text-[#1E2022]"
                  >
                    <Calendar className="w-3.5 h-3.5 text-[#C2571A]" />
                    <span>Check-out</span>
                  </label>
                  {calculateNights() > 0 && (
                    <span className="text-[10px] font-bold text-[#C2571A] bg-[#C2571A]/10 px-1.5 py-0.5 rounded">
                      {calculateNights()}N
                    </span>
                  )}
                </div>
                <input
                  id="checkout-hero"
                  type="date"
                  value={checkOut}
                  onChange={(e) => setCheckOut(e.target.value)}
                  className={`mt-1 w-full text-sm bg-transparent focus:outline-none cursor-pointer ${checkOut ? 'font-semibold text-[#1E2022]' : 'font-normal text-[#9CA3AF]'}`}
                />
              </div>

              {/* Field 4: Travellers */}
              <div className="relative px-4 py-3.5 rounded-xl bg-white border border-[#1E2022]/12 hover:border-[#1E2022]/35 focus-within:border-[#1E2022] focus-within:ring-2 focus-within:ring-[#1E2022]/10 transition-colors">
                <div
                  onClick={() => setIsTravellersOpen(!isTravellersOpen)}
                  className="cursor-pointer"
                >
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-[#1E2022]">
                    <Users className="w-3.5 h-3.5 text-[#C2571A]" />
                    <span>Travellers</span>
                  </div>
                  <div className="mt-1 flex items-center justify-between">
                    {guestsChosen ? (
                      <>
                        <span className="text-sm font-semibold text-[#1E2022]">
                          {adults + children} Guest{adults + children > 1 ? 's' : ''}
                        </span>
                        <span className="text-xs text-[#9CA3AF]">
                          {adults}A {children > 0 ? `· ${children}C` : ''}
                        </span>
                      </>
                    ) : (
                      <span className="text-sm font-normal text-[#9CA3AF]">Add guests</span>
                    )}
                  </div>
                </div>

                {isTravellersOpen && (
                  <div className="absolute top-full left-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-[#1E2022]/10 p-4 z-50 space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-[#1E2022]">Adults</p>
                        <p className="text-xs text-[#9CA3AF]">Age 12+</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          disabled={adults <= 1}
                          onClick={() => setAdults((prev) => Math.max(1, prev - 1))}
                          className="w-7 h-7 rounded-full border border-gray-300 flex items-center justify-center text-sm disabled:opacity-40"
                        >
                          -
                        </button>
                        <span className="text-sm font-semibold w-4 text-center">
                          {adults}
                        </span>
                        <button
                          type="button"
                          onClick={() => setAdults((prev) => prev + 1)}
                          className="w-7 h-7 rounded-full border border-gray-300 flex items-center justify-center text-sm"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-[#1E2022]">Children</p>
                        <p className="text-xs text-[#9CA3AF]">Age 0–11</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          disabled={children <= 0}
                          onClick={() => setChildren((prev) => Math.max(0, prev - 1))}
                          className="w-7 h-7 rounded-full border border-gray-300 flex items-center justify-center text-sm disabled:opacity-40"
                        >
                          -
                        </button>
                        <span className="text-sm font-semibold w-4 text-center">
                          {children}
                        </span>
                        <button
                          type="button"
                          onClick={() => setChildren((prev) => prev + 1)}
                          className="w-7 h-7 rounded-full border border-gray-300 flex items-center justify-center text-sm"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setGuestsChosen(true);
                        setIsTravellersOpen(false);
                      }}
                      className="w-full py-1.5 text-xs font-semibold rounded-lg bg-[#FAF8F5] hover:bg-gray-100 text-[#1E2022]"
                    >
                      Done
                    </button>
                  </div>
                )}
              </div>

              {/* Field 5: Budget */}
              <div className="relative px-4 py-3.5 rounded-xl bg-white border border-[#1E2022]/12 hover:border-[#1E2022]/35 focus-within:border-[#1E2022] focus-within:ring-2 focus-within:ring-[#1E2022]/10 transition-colors">
                <div
                  onClick={() => setIsBudgetOpen(!isBudgetOpen)}
                  className="cursor-pointer"
                >
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-[#1E2022]">
                    <Wallet className="w-3.5 h-3.5 text-[#C2571A]" />
                    <span>Budget</span>
                  </div>
                  <div className="mt-1 flex items-center justify-between">
                    <span className={`text-sm truncate ${selectedBudgetLabel ? 'font-semibold text-[#1E2022]' : 'font-normal text-[#9CA3AF]'}`}>
                      {selectedBudgetLabel || 'Select budget'}
                    </span>
                    <ChevronDown className="w-4 h-4 text-[#9CA3AF]" />
                  </div>
                </div>

                {isBudgetOpen && (
                  <div className="absolute top-full left-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-[#1E2022]/10 p-2 z-50">
                    <p className="text-[11px] font-semibold text-[#9CA3AF] px-3 py-1 uppercase tracking-wider">
                      Budget Per Person
                    </p>
                    {BUDGET_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => {
                          setBudgetRange(opt.value);
                          setIsBudgetOpen(false);
                        }}
                        className="w-full text-left px-3 py-2 text-sm rounded-lg hover:bg-[#FAF8F5] flex items-center justify-between text-[#1E2022]"
                      >
                        <span>{opt.label}</span>
                        {budgetRange === opt.value && (
                          <Check className="w-4 h-4 text-[#C2571A]" />
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Primary Search CTA */}
              <div className="sm:col-span-2 lg:col-span-1 flex">
                <button
                  type="submit"
                  className="group w-full min-h-[4rem] lg:px-9 px-6 rounded-xl bg-[#1E2022] hover:bg-black text-white font-semibold text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <span className="whitespace-nowrap">Search Trips</span>
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </button>
              </div>
            </div>
          </form>
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
