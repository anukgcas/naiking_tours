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
    image: '/src/assets/images/hero_bali_luxury_1790674276055.jpg',
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
    image: '/src/assets/images/dest_maldives_1790674294175.jpg',
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
    image: '/src/assets/images/dest_dubai_1790674315094.jpg',
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
    image: '/src/assets/images/dest_manali_1790674332732.jpg',
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
    image: '/src/assets/images/dest_goa_1790674366139.jpg',
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
    image: '/src/assets/images/dest_singapore_1790674346843.jpg',
    climate: '30°C · Twilight Cloud Forest',
    timezone: 'SGT (UTC+8)',
    timeOffsetHours: 8,
    highlight: 'Marina Bay Skyline & Michelin Hawker Crawl',
    audioMode: 'rainforest',
  },
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
  const [destination, setDestination] = useState('Bali, Indonesia');
  const [isDestOpen, setIsDestOpen] = useState(false);
  const [checkIn, setCheckIn] = useState('2026-10-18');
  const [checkOut, setCheckOut] = useState('2026-10-22');
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);
  const [isTravellersOpen, setIsTravellersOpen] = useState(false);
  const [budgetRange, setBudgetRange] = useState('30k-60k');
  const [isBudgetOpen, setIsBudgetOpen] = useState(false);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);

  const currentReel = DESTINATION_REELS[activeReelIndex];

  // Calculate nights
  const calculateNights = () => {
    const d1 = new Date(checkIn);
    const d2 = new Date(checkOut);
    const diff = Math.ceil(Math.abs(d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24));
    return isNaN(diff) || diff === 0 ? 3 : diff;
  };

  const handleSelectReel = (index: number) => {
    setActiveReelIndex(index);
    const target = DESTINATION_REELS[index];
    setDestination(`${target.name}, ${target.country}`);
    if (isAudioPlaying) {
      sanctuaryAudio.play(target.audioMode);
    }
  };

  const toggleSound = () => {
    const nextState = sanctuaryAudio.toggle(currentReel.audioMode);
    setIsAudioPlaying(nextState);
  };

  const applyQuickPreset = (preset: 'weekend' | 'beach' | 'alpine' | 'honeymoon') => {
    if (preset === 'weekend') {
      setCheckIn('2026-10-23');
      setCheckOut('2026-10-26');
      setDestination('Goa, India');
    } else if (preset === 'beach') {
      setDestination('Maldives, Indian Ocean');
      setActiveReelIndex(1);
    } else if (preset === 'alpine') {
      setDestination('Manali, Himachal, India');
      setActiveReelIndex(3);
    } else if (preset === 'honeymoon') {
      setDestination('Bali, Indonesia');
      setAdults(2);
      setChildren(0);
      setActiveReelIndex(0);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch({
      destination: destination.split(',')[0].trim(),
      checkIn,
      checkOut,
      adults,
      children,
      budgetRange,
    });
  };

  const selectedBudgetLabel =
    BUDGET_OPTIONS.find((b) => b.value === budgetRange)?.label || 'Select Budget';

  return (
    <section className="relative pt-24 pb-14 lg:pt-32 lg:pb-20 overflow-hidden">
      {/* Background soft ambient radial light */}
      <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-[#E05A47]/4 blur-3xl pointer-events-none rounded-full" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Top Hero Layout: Editorial Brand Statement + Interactive Destination Portal */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center mb-10 lg:mb-12">
          {/* Left Column (6.5 cols): Editorial Brand Statement & Live Sound Ambience */}
          <div className="lg:col-span-6 space-y-6">
            <div className="flex flex-wrap items-center gap-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#1E2022]/5 border border-[#1E2022]/8 text-xs font-semibold text-[#1E2022]">
                <Compass className="w-3.5 h-3.5 text-[#E05A47]" />
                <span>Private Tailored Sanctuaries</span>
              </div>

              {/* Web Audio Sanctuary Sound Toggle */}
              <button
                type="button"
                onClick={toggleSound}
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                  isAudioPlaying
                    ? 'bg-[#E05A47] text-white shadow-xs'
                    : 'bg-white border border-[#1E2022]/10 text-[#6B7280] hover:text-[#1E2022]'
                }`}
                title="Toggle gentle ambient nature audio"
              >
                {isAudioPlaying ? (
                  <>
                    <Volume2 className="w-3.5 h-3.5 animate-pulse" />
                    <span>Sanctuary Audio: On</span>
                  </>
                ) : (
                  <>
                    <VolumeX className="w-3.5 h-3.5" />
                    <span>Ambience Audio</span>
                  </>
                )}
              </button>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-[#1E2022] leading-[1.08] text-balance">
              Where quiet luxury meets authentic adventure.
            </h1>

            <p className="text-base sm:text-lg text-[#555A60] max-w-xl font-normal leading-relaxed">
              Curated boutique sanctuaries, dedicated local chauffeurs, and unhurried itineraries
              designed for the discerning traveler.
            </p>

            {/* Quick Proof Pills */}
            <div className="grid grid-cols-3 gap-3 pt-2 max-w-lg text-xs">
              <div className="p-3 rounded-2xl bg-white border border-[#1E2022]/6 shadow-2xs">
                <span className="font-bold text-[#1E2022] block">100% Private</span>
                <span className="text-[#6B7280] text-[11px]">Chauffeured Transit</span>
              </div>
              <div className="p-3 rounded-2xl bg-white border border-[#1E2022]/6 shadow-2xs">
                <span className="font-bold text-[#1E2022] block">Boutique</span>
                <span className="text-[#6B7280] text-[11px]">Handpicked Villas</span>
              </div>
              <div className="p-3 rounded-2xl bg-white border border-[#1E2022]/6 shadow-2xs">
                <span className="font-bold text-[#E05A47] block">Zero Markups</span>
                <span className="text-[#6B7280] text-[11px]">Direct Pricing</span>
              </div>
            </div>
          </div>

          {/* Right Column (6 cols): Interactive Dynamic Destination Reel */}
          <div className="lg:col-span-6 space-y-3">
            {/* Visual Screen with Live Overlay */}
            <div className="relative rounded-3xl overflow-hidden aspect-[16/10] shadow-2xl border border-black/10 bg-[#ECE8E1] group">
              <img
                src={currentReel.image}
                alt={`${currentReel.name}, ${currentReel.country}`}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover transition-all duration-700 ease-out group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent pointer-events-none" />

              {/* Top Live Destination Status Badge */}
              <div className="absolute top-4 left-4 right-4 flex items-center justify-between text-white text-xs">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/40 backdrop-blur-md border border-white/15">
                  <Sun className="w-3.5 h-3.5 text-amber-300" />
                  <span>{currentReel.climate}</span>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/40 backdrop-blur-md border border-white/15">
                  <Clock className="w-3.5 h-3.5 text-white/80" />
                  <span>{currentReel.timezone}</span>
                </div>
              </div>

              {/* Bottom Caption & Instant Explore */}
              <div className="absolute bottom-5 left-5 right-5 flex items-end justify-between text-white gap-4">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-[#E05A47] block mb-0.5">
                    {currentReel.country}
                  </span>
                  <h3 className="text-xl sm:text-2xl font-bold leading-tight">
                    {currentReel.name}
                  </h3>
                  <p className="text-xs text-white/85 line-clamp-1 mt-0.5">
                    {currentReel.highlight}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onExploreDestination(currentReel.name)}
                  className="px-4 py-2 rounded-full bg-white/20 backdrop-blur-md hover:bg-white/30 text-white font-semibold text-xs transition-colors shrink-0 cursor-pointer"
                >
                  Explore →
                </button>
              </div>
            </div>

            {/* Interactive Destination Switcher Bar */}
            <div className="flex items-center justify-between gap-1 p-1 bg-white rounded-2xl border border-[#1E2022]/8 shadow-xs overflow-x-auto scrollbar-none">
              {DESTINATION_REELS.map((reel, idx) => (
                <button
                  key={reel.id}
                  type="button"
                  onClick={() => handleSelectReel(idx)}
                  className={`flex-1 py-1.5 px-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                    activeReelIndex === idx
                      ? 'bg-[#1E2022] text-white shadow-xs'
                      : 'text-[#6B7280] hover:text-[#1E2022] hover:bg-[#FAF8F5]'
                  }`}
                >
                  {reel.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Floating Rounded Trip-Search Panel with Quick Mood Chips */}
        <div className="relative z-30">
          {/* Quick Mood Chips */}
          <div className="flex items-center gap-2 mb-2 px-1 overflow-x-auto scrollbar-none">
            <span className="text-[11px] font-bold text-[#9CA3AF] uppercase tracking-wider whitespace-nowrap hidden sm:inline">
              Quick Filter:
            </span>
            <button
              type="button"
              onClick={() => applyQuickPreset('weekend')}
              className="text-xs px-3 py-1 rounded-full bg-white/80 hover:bg-white border border-[#1E2022]/10 text-[#555A60] whitespace-nowrap transition-colors cursor-pointer"
            >
              ⚡ 3-Day Long Weekend
            </button>
            <button
              type="button"
              onClick={() => applyQuickPreset('beach')}
              className="text-xs px-3 py-1 rounded-full bg-white/80 hover:bg-white border border-[#1E2022]/10 text-[#555A60] whitespace-nowrap transition-colors cursor-pointer"
            >
              🏝️ Lagoon Overwater
            </button>
            <button
              type="button"
              onClick={() => applyQuickPreset('alpine')}
              className="text-xs px-3 py-1 rounded-full bg-white/80 hover:bg-white border border-[#1E2022]/10 text-[#555A60] whitespace-nowrap transition-colors cursor-pointer"
            >
              🏔️ Alpine Chalet
            </button>
            <button
              type="button"
              onClick={() => applyQuickPreset('honeymoon')}
              className="text-xs px-3 py-1 rounded-full bg-white/80 hover:bg-white border border-[#1E2022]/10 text-[#555A60] whitespace-nowrap transition-colors cursor-pointer"
            >
              🥂 Romantic Sanctuary
            </button>
          </div>

          <form
            onSubmit={handleSearchSubmit}
            className="bg-white/95 backdrop-blur-md rounded-2xl sm:rounded-3xl p-3 sm:p-4 shadow-xl border border-[#1E2022]/8 transition-all hover:border-[#1E2022]/15"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 lg:gap-2 items-center">
              {/* Field 1: Destination */}
              <div className="lg:col-span-3 relative p-3 rounded-xl hover:bg-[#FAF8F5] transition-colors border border-transparent hover:border-[#1E2022]/8">
                <div
                  onClick={() => setIsDestOpen(!isDestOpen)}
                  className="cursor-pointer"
                >
                  <div className="flex items-center gap-1.5 text-xs font-medium text-[#6B7280]">
                    <MapPin className="w-3.5 h-3.5 text-[#E05A47]" />
                    <span>Where do you want to go?</span>
                  </div>
                  <div className="mt-1 flex items-center justify-between">
                    <span className="text-sm font-semibold text-[#1E2022] truncate">
                      {destination}
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
                          <Check className="w-4 h-4 text-[#E05A47]" />
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Field 2: Check-in */}
              <div className="lg:col-span-2 p-3 rounded-xl hover:bg-[#FAF8F5] transition-colors border border-transparent hover:border-[#1E2022]/8">
                <label
                  htmlFor="checkin-hero"
                  className="flex items-center gap-1.5 text-xs font-medium text-[#6B7280]"
                >
                  <Calendar className="w-3.5 h-3.5 text-[#E05A47]" />
                  <span>Check-in</span>
                </label>
                <input
                  id="checkin-hero"
                  type="date"
                  value={checkIn}
                  onChange={(e) => setCheckIn(e.target.value)}
                  className="mt-1 w-full text-sm font-semibold text-[#1E2022] bg-transparent focus:outline-none cursor-pointer"
                />
              </div>

              {/* Field 3: Check-out with Nights Pill */}
              <div className="lg:col-span-2 p-3 rounded-xl hover:bg-[#FAF8F5] transition-colors border border-transparent hover:border-[#1E2022]/8">
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="checkout-hero"
                    className="flex items-center gap-1.5 text-xs font-medium text-[#6B7280]"
                  >
                    <Calendar className="w-3.5 h-3.5 text-[#E05A47]" />
                    <span>Check-out</span>
                  </label>
                  <span className="text-[10px] font-bold text-[#E05A47] bg-[#E05A47]/10 px-1.5 py-0.5 rounded">
                    {calculateNights()}N
                  </span>
                </div>
                <input
                  id="checkout-hero"
                  type="date"
                  value={checkOut}
                  onChange={(e) => setCheckOut(e.target.value)}
                  className="mt-1 w-full text-sm font-semibold text-[#1E2022] bg-transparent focus:outline-none cursor-pointer"
                />
              </div>

              {/* Field 4: Travellers */}
              <div className="lg:col-span-2 relative p-3 rounded-xl hover:bg-[#FAF8F5] transition-colors border border-transparent hover:border-[#1E2022]/8">
                <div
                  onClick={() => setIsTravellersOpen(!isTravellersOpen)}
                  className="cursor-pointer"
                >
                  <div className="flex items-center gap-1.5 text-xs font-medium text-[#6B7280]">
                    <Users className="w-3.5 h-3.5 text-[#E05A47]" />
                    <span>Travellers</span>
                  </div>
                  <div className="mt-1 flex items-center justify-between">
                    <span className="text-sm font-semibold text-[#1E2022]">
                      {adults + children} Guest{adults + children > 1 ? 's' : ''}
                    </span>
                    <span className="text-xs text-[#9CA3AF]">
                      {adults}A {children > 0 ? `· ${children}C` : ''}
                    </span>
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
                      onClick={() => setIsTravellersOpen(false)}
                      className="w-full py-1.5 text-xs font-semibold rounded-lg bg-[#FAF8F5] hover:bg-gray-100 text-[#1E2022]"
                    >
                      Done
                    </button>
                  </div>
                )}
              </div>

              {/* Field 5: Budget */}
              <div className="lg:col-span-2 relative p-3 rounded-xl hover:bg-[#FAF8F5] transition-colors border border-transparent hover:border-[#1E2022]/8">
                <div
                  onClick={() => setIsBudgetOpen(!isBudgetOpen)}
                  className="cursor-pointer"
                >
                  <div className="flex items-center gap-1.5 text-xs font-medium text-[#6B7280]">
                    <Wallet className="w-3.5 h-3.5 text-[#E05A47]" />
                    <span>Budget</span>
                  </div>
                  <div className="mt-1 flex items-center justify-between">
                    <span className="text-sm font-semibold text-[#1E2022] truncate">
                      {selectedBudgetLabel}
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
                          <Check className="w-4 h-4 text-[#E05A47]" />
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Primary Search CTA: Plan My Trip → (Live Package Count) */}
              <div className="lg:col-span-1 flex justify-end">
                <button
                  type="submit"
                  className="w-full lg:w-auto h-12 lg:h-14 px-6 rounded-2xl bg-[#1E2022] hover:bg-[#E05A47] text-white font-semibold text-sm flex items-center justify-center gap-2 transition-all duration-300 shadow-md active:scale-98 cursor-pointer shrink-0"
                >
                  <span className="lg:hidden">Plan My Trip ({packagesCount})</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
};
