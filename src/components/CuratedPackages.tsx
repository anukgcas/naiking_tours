import React, { useState } from 'react';
import {
  ArrowRight,
  BedDouble,
  CalendarDays,
  Car,
  Check,
  Gem,
  Heart,
  Landmark,
  MapPin,
  MessageCircle,
  Mountain,
  Palmtree,
  Plane,
  Sparkles,
} from 'lucide-react';
import { formatINR, getDestination } from '../data/planner';
import { useSavedPackages } from '../context/SavedPackagesContext';

export interface CuratedPackage {
  id: string;
  destinationId: string;
  name: string;
  tagline: string;
  duration: string;
  nights: number;
  category: 'Beach' | 'Mountains' | 'Luxury' | 'Culture';
  image: string;
  pricePerPerson: number;
  inclusions: string[];
  highlights: string[];
}

export const CURATED_PACKAGES: CuratedPackage[] = [
  {
    id: 'pkg-bali-sanctuary',
    destinationId: 'bali',
    name: 'Kamandalu Rainforest & Ocean Sanctuary',
    tagline: 'Terraced rice sanctuaries, clifftop temple dances & beach club sunsets',
    duration: '5 Days • 4 Nights',
    nights: 4,
    category: 'Beach',
    image: '/images/hero_bali_luxury_1790674276055.jpg',
    pricePerPerson: 48500,
    inclusions: ['Private Chauffeur', 'Boutique Rainforest Villa', 'Curated Experiences'],
    highlights: [
      'Tegallalang sunrise terraces & Tirta Empul purification ritual',
      'Uluwatu clifftop Kecak fire dance at sunset',
      'Jimbaran fresh seafood dinner with toes in the sand',
    ],
  },
  {
    id: 'pkg-dubai-mirage',
    destinationId: 'dubai',
    name: 'Desert Mirage & Futuristic Skyline',
    tagline: 'Burj Khalifa sunset levels, red dune safaris & private marina yachting',
    duration: '4 Days • 3 Nights',
    nights: 3,
    category: 'Luxury',
    image: '/images/dest_dubai_1790674315094.jpg',
    pricePerPerson: 44000,
    inclusions: ['Lexus Chauffeur Service', '5-Star Skyline Sanctuary', 'Private Desert Safari'],
    highlights: [
      'Burj Khalifa Level 148 Sky Lounge at sunset',
      'Private 4x4 dune safari with Bedouin starlit dinner',
      'Marina luxury yacht cruise along illuminated towers',
    ],
  },
  {
    id: 'pkg-maldives-solitude',
    destinationId: 'maldives',
    name: 'Overwater Lagoon & Sandbank Bliss',
    tagline: 'Turquoise solitude, overwater couples treatments & floating villa dining',
    duration: '4 Days • 3 Nights',
    nights: 3,
    category: 'Beach',
    image: '/images/dest_maldives_1790674294175.jpg',
    pricePerPerson: 89000,
    inclusions: ['Private Speedboat Transit', 'Signature Overwater Bungalow', 'Marine Safari'],
    highlights: [
      'Private white-linen lunch on a secluded sandbank',
      'Glass-floor overwater couples massage above the lagoon',
      'Golden hour sunset dolphin cruise with dhoni boat',
    ],
  },
  {
    id: 'pkg-manali-peaks',
    destinationId: 'manali',
    name: 'Alpine Cedar & Snow Peaks Retreat',
    tagline: 'Himalayan pine chalets, Solang snowfields & riverside woodfires',
    duration: '4 Days • 3 Nights',
    nights: 3,
    category: 'Mountains',
    image: '/images/dest_manali_1790674332732.jpg',
    pricePerPerson: 24500,
    inclusions: ['Private 4x4 SUV', 'Heritage Pine Chalet', 'Guided Excursions'],
    highlights: [
      'Solang Valley snow adventures & Atal Tunnel drive to Sissu',
      'Ancient Hadimba Devi cedar forest temple walk',
      'Riverside bonfire with traditional Himachali thali dinner',
    ],
  },
  {
    id: 'pkg-goa-heritage',
    destinationId: 'goa',
    name: 'Latin Quarter Charm & Sunlit Shores',
    tagline: 'Portuguese heritage estates, hidden waterfalls & quiet southern sands',
    duration: '4 Days • 3 Nights',
    nights: 3,
    category: 'Culture',
    image: '/images/dest_goa_1790674366139.jpg',
    pricePerPerson: 28000,
    inclusions: ['Chauffeured Transit', 'Indo-Portuguese Villa', 'Artisan Food Tours'],
    highlights: [
      'Fontainhas pastel alleys & azulejo tile heritage trail',
      'Dudhsagar waterfall jungle jeep safari',
      'Spice plantation feast & quiet southern cove sunset',
    ],
  },
  {
    id: 'pkg-singapore-skyline',
    destinationId: 'singapore',
    name: 'Metropolitan Supertrees & Michelin Trail',
    tagline: 'Gardens by the Bay domes, nocturnal safaris & skyline cocktails',
    duration: '4 Days • 3 Nights',
    nights: 3,
    category: 'Luxury',
    image: '/images/dest_singapore_1790674346843.jpg',
    pricePerPerson: 54000,
    inclusions: ['Private Mercedes Transit', 'Marina Bay Skyline Stays', 'Michelin Food Guide'],
    highlights: [
      'Gardens by the Bay Cloud Forest & Supertree light show',
      'Michelin-starred street food crawl through historic hawkers',
      'Night Safari nocturnal tram & Marina Bay SkyPark',
    ],
  },
];

interface CuratedPackagesProps {
  onSelectPackage: (pkg: CuratedPackage) => void;
  onEnquirePackage?: (pkg: CuratedPackage) => void;
}

const CATEGORIES = ['All', 'Beach', 'Mountains', 'Luxury', 'Culture'] as const;

const CATEGORY_ICON: Record<CuratedPackage['category'], React.ReactNode> = {
  Beach: <Palmtree className="w-3.5 h-3.5" />,
  Mountains: <Mountain className="w-3.5 h-3.5" />,
  Luxury: <Plane className="w-3.5 h-3.5" />,
  Culture: <Landmark className="w-3.5 h-3.5" />,
};

/** Picks a small icon for an inclusion chip from what it says. */
const inclusionIcon = (text: string) => {
  const t = text.toLowerCase();
  if (/chauffeur|transit|suv|speedboat|mercedes|lexus|transfer|car/.test(t)) return <Car className="w-4 h-4" />;
  if (/villa|resort|bungalow|chalet|sanctuary|stay|hotel|lodge/.test(t)) return <BedDouble className="w-4 h-4" />;
  return <Gem className="w-4 h-4" />;
};

export const CuratedPackages: React.FC<CuratedPackagesProps> = ({
  onSelectPackage,
  onEnquirePackage,
}) => {
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const { isPackageSaved, toggleSavePackage } = useSavedPackages();

  const filtered =
    activeCategory === 'All'
      ? CURATED_PACKAGES
      : CURATED_PACKAGES.filter((p) => p.category === activeCategory);

  return (
    <section id="curated-packages" className="py-12 md:py-16 bg-[#FAF8F5] scroll-mt-20 border-t border-[#1E2022]/8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
          <div>
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#C2571A]/10 border border-[#C2571A]/20 text-[#C2571A] text-xs font-bold uppercase tracking-wider mb-2.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Signature Journeys</span>
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-[#1E2022]">
              Curated Travel Packages
            </h2>
            <p className="mt-2 text-sm sm:text-base text-[#4B5563]">
              Handcrafted baseline itineraries ready for you to customize, adapt, and refine
            </p>
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden pb-1">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setActiveCategory(cat)}
                className={`px-4 py-2 rounded-full text-xs sm:text-sm font-semibold transition-all duration-200 cursor-pointer shrink-0 ${
                  activeCategory === cat
                    ? 'bg-[#1E2022] text-white shadow-sm'
                    : 'bg-white border border-[#1E2022]/15 text-[#4B5563] hover:text-[#1E2022] hover:border-[#1E2022]/30 hover:bg-[#FAF8F5]'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Package Cards Grid (3 across on desktop, 2 on tablet, 1 on mobile) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {filtered.map((pkg) => {
            const isSaved = isPackageSaved(pkg.id);
            const dest = getDestination(pkg.destinationId);
            return (
              <article
                key={pkg.id}
                className="group relative isolate h-[580px] sm:h-[600px] rounded-[32px] overflow-hidden bg-[#EDE7DF] shadow-[0_18px_40px_-28px_rgba(30,32,34,0.3)] hover:shadow-[0_26px_50px_-30px_rgba(30,32,34,0.38)] hover:-translate-y-1 transition-all duration-500"
              >
                {/* Full-bleed photo */}
                <img
                  src={pkg.image}
                  alt={pkg.name}
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-110"
                />

                {/* Top row: category and save */}
                <div className="absolute top-4 left-4 right-4 flex items-start justify-between z-10">
                  <div className="inline-flex items-center gap-1.5 pl-2.5 pr-3.5 py-2 rounded-full bg-[#14213D]/45 backdrop-blur-lg border border-white/25 text-white text-[11px] font-bold uppercase tracking-[0.12em] shadow-[0_6px_16px_-8px_rgba(20,33,61,0.6)]">
                    {CATEGORY_ICON[pkg.category]}
                    {pkg.category}
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleSavePackage(pkg.id);
                    }}
                    className={`w-11 h-11 flex items-center justify-center rounded-full backdrop-blur-lg border transition-all duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-white ${
                      isSaved
                        ? 'bg-[#F26B2A] border-[#F26B2A] text-white'
                        : 'bg-[#14213D]/45 border-white/25 text-white hover:bg-white hover:text-[#C2571A] shadow-[0_6px_16px_-8px_rgba(20,33,61,0.6)]'
                    }`}
                    aria-label={isSaved ? `Remove ${pkg.name} from saved` : `Save ${pkg.name} for later`}
                    title={isSaved ? 'Saved for Later' : 'Save for Later'}
                  >
                    <Heart className={`w-5 h-5 ${isSaved ? 'fill-current' : ''}`} />
                  </button>
                </div>

                {/* Floating glass sheet anchored to the bottom */}
                <div className="absolute inset-x-3 bottom-3 z-10 rounded-[26px] p-5 text-[#14213D] bg-white/72 backdrop-blur-2xl backdrop-saturate-150 border border-white/50 shadow-[0_10px_30px_-18px_rgba(30,32,34,0.3)]">
                  <div className="flex items-center justify-between gap-3 text-[11.5px] font-semibold uppercase tracking-[0.12em]">
                    <span className="inline-flex items-center gap-1.5 text-[#5B6475] min-w-0">
                      <MapPin className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">{dest ? `${dest.name}, ${dest.country}` : pkg.category}</span>
                    </span>
                    <span className="inline-flex items-center gap-1.5 text-[#5B6475] shrink-0 normal-case tracking-normal text-[12.5px]">
                      <CalendarDays className="w-3.5 h-3.5" />
                      {pkg.duration}
                    </span>
                  </div>

                  <h3 className="mt-2.5 text-[22px] sm:text-[23px] font-bold tracking-tight leading-[1.15]">{pkg.name}</h3>
                  <p className="mt-1.5 text-[13.5px] text-[#4B5563] leading-snug line-clamp-2">{pkg.tagline}</p>

                  {/* Inclusions as compact icon chips */}
                  <div className="mt-3.5 flex flex-wrap gap-1.5">
                    {pkg.inclusions.map((inc) => (
                      <span
                        key={inc}
                        className="inline-flex items-center gap-1.5 pl-1.5 pr-2.5 py-1 rounded-full bg-white/60 text-[11.5px] font-medium text-[#3A3D42]"
                      >
                        <span className="w-5 h-5 rounded-full bg-[#14213D]/[0.06] text-[#14213D]/70 flex items-center justify-center [&>svg]:w-3 [&>svg]:h-3">
                          {inclusionIcon(inc)}
                        </span>
                        {inc}
                      </span>
                    ))}
                  </div>

                  {/* Highlights: open on touch screens, slide open on hover on larger ones */}
                  <div className="grid grid-rows-[1fr] md:grid-rows-[0fr] md:group-hover:grid-rows-[1fr] md:group-focus-within:grid-rows-[1fr] transition-[grid-template-rows] duration-500 ease-out">
                    <ul className="overflow-hidden space-y-2">
                      {pkg.highlights.map((h, i) => (
                        <li key={i} className={`flex items-start gap-2 text-[12.5px] text-[#4B5563] leading-snug ${i === 0 ? 'pt-3.5' : ''}`}>
                          <Check className="w-3.5 h-3.5 mt-[2px] text-[#14213D]/50 shrink-0" strokeWidth={3} />
                          <span>{h}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Price + actions */}
                  <div className="mt-4 pt-4 border-t border-[#14213D]/[0.06] flex items-center justify-between gap-3">
                    <div className="leading-none">
                      <span className="text-[11px] font-semibold text-[#5B6475]">From / person</span>
                      <span className="mt-1.5 block text-[26px] font-extrabold tracking-tight text-[#14213D]">
                        {formatINR(pkg.pricePerPerson)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {onEnquirePackage && (
                        <button
                          type="button"
                          onClick={() => onEnquirePackage(pkg)}
                          className="w-11 h-11 inline-flex items-center justify-center rounded-full bg-white/80 text-[#14213D]/75 hover:bg-white hover:text-[#14213D] focus:outline-none focus:ring-2 focus:ring-[#F26B2A]/40 active:scale-95 transition-all duration-200 cursor-pointer"
                          aria-label={`Enquire about ${pkg.name}`}
                          title="Ask questions or request a callback"
                        >
                          <MessageCircle className="w-[18px] h-[18px]" />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => onSelectPackage(pkg)}
                        className="h-11 pl-5 pr-1.5 inline-flex items-center gap-3 rounded-full bg-gradient-to-r from-[#C2571A] via-[#E5501A] to-[#F7931E] text-white font-bold text-[13.5px] shadow-[0_8px_18px_-8px_rgba(194,87,26,0.5)] hover:brightness-110 active:scale-[0.97] transition-all duration-200 cursor-pointer group/btn"
                      >
                        <span>Customise</span>
                        <span className="w-8 h-8 rounded-full bg-white/20 text-white flex items-center justify-center transition-transform duration-300 group-hover/btn:translate-x-0.5">
                          <ArrowRight className="w-4 h-4" />
                        </span>
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
};
