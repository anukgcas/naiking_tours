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
                className="group relative flex flex-col rounded-[28px] bg-white p-3 border border-[#F1ECE6] shadow-[0_2px_4px_rgba(30,32,34,0.03),0_18px_44px_-22px_rgba(30,32,34,0.28)] hover:-translate-y-1.5 hover:shadow-[0_2px_4px_rgba(30,32,34,0.03),0_30px_60px_-24px_rgba(242,92,42,0.35)] transition-all duration-300"
              >
                {/* Photo, inset inside the card */}
                <div className="relative h-[250px] sm:h-[270px] rounded-[22px] overflow-hidden bg-[#EDE7DF]">
                  <img
                    src={pkg.image}
                    alt={pkg.name}
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-[900ms] ease-out group-hover:scale-110"
                  />

                  {/* Category (left) and save (right) */}
                  <div className="absolute top-3 left-3 inline-flex items-center gap-1.5 pl-2.5 pr-3 py-1.5 rounded-full bg-gradient-to-r from-[#F25C2A] to-[#FF9A3C] text-white text-[11px] font-bold uppercase tracking-[0.08em] shadow-[0_8px_18px_-8px_rgba(242,92,42,0.8)]">
                    {CATEGORY_ICON[pkg.category]}
                    {pkg.category}
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleSavePackage(pkg.id);
                    }}
                    className={`absolute top-3 right-3 w-10 h-10 flex items-center justify-center rounded-full backdrop-blur-xl border transition-all duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-white ${
                      isSaved
                        ? 'bg-[#F26B2A] border-[#F26B2A] text-white'
                        : 'bg-white/30 border-white/60 text-white hover:bg-white hover:text-[#F26B2A]'
                    }`}
                    aria-label={isSaved ? `Remove ${pkg.name} from saved` : `Save ${pkg.name} for later`}
                    title={isSaved ? 'Saved for Later' : 'Save for Later'}
                  >
                    <Heart className={`w-[18px] h-[18px] ${isSaved ? 'fill-current' : ''}`} />
                  </button>

                  {/* Duration (left) and price (right), both frosted glass */}
                  <div className="absolute bottom-3 left-3 inline-flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-white/25 backdrop-blur-xl backdrop-saturate-150 border border-white/50 text-white text-[13px] font-semibold shadow-[0_8px_24px_-10px_rgba(0,0,0,0.5)] drop-shadow">
                    <CalendarDays className="w-4 h-4" />
                    <span>{pkg.duration}</span>
                  </div>
                  <div className="absolute bottom-3 right-3 text-right px-3.5 py-2 rounded-2xl bg-gradient-to-br from-white/75 via-white/55 to-white/40 backdrop-blur-xl backdrop-saturate-150 border border-white/70 ring-1 ring-inset ring-white/50 shadow-[0_12px_30px_-12px_rgba(30,32,34,0.5),inset_0_1px_0_rgba(255,255,255,0.8)]">
                    <span className="text-[11px] font-semibold text-[#2F3B52] block leading-none">From</span>
                    <span className="mt-1 text-[22px] font-extrabold text-[#F26B2A] leading-none tracking-tight block">
                      {formatINR(pkg.pricePerPerson)}
                    </span>
                    <span className="mt-1 text-[11px] font-semibold text-[#2F3B52] block leading-none">/ person</span>
                  </div>
                </div>

                {/* Body */}
                <div className="flex flex-col flex-1 px-3 pt-5 pb-2">
                  <p className="inline-flex items-center gap-1.5 text-[12px] font-semibold uppercase tracking-[0.12em] text-[#F26B2A]">
                    <MapPin className="w-3.5 h-3.5" />
                    {dest ? `${dest.name}, ${dest.country}` : pkg.category}
                  </p>
                  <h3 className="mt-2 text-[22px] sm:text-[24px] font-bold tracking-tight text-[#14213D] leading-[1.15] group-hover:text-[#C2571A] transition-colors">
                    {pkg.name}
                  </h3>
                  <p className="mt-2 text-[14px] text-[#5B6475] line-clamp-2 leading-relaxed">{pkg.tagline}</p>

                  {/* Inclusions as a tidy tile row */}
                  <div className="mt-5 grid grid-cols-3 gap-2">
                    {pkg.inclusions.map((inc) => (
                      <div
                        key={inc}
                        className="flex flex-col items-center text-center gap-1.5 rounded-2xl bg-[#FFF6EE] px-2 py-3"
                      >
                        <span className="w-8 h-8 rounded-full bg-white text-[#F26B2A] flex items-center justify-center shadow-[0_4px_10px_-4px_rgba(242,92,42,0.4)]">
                          {inclusionIcon(inc)}
                        </span>
                        <span className="text-[11.5px] font-medium leading-tight text-[#3A3D42] line-clamp-2">{inc}</span>
                      </div>
                    ))}
                  </div>

                  {/* Highlights */}
                  <ul className="mt-5 space-y-2.5">
                    {pkg.highlights.map((h, i) => (
                      <li key={i} className="flex items-start gap-2.5 text-[13px] text-[#4B5563] leading-snug">
                        <span className="mt-[3px] w-4 h-4 rounded-full bg-[#F26B2A]/12 text-[#F26B2A] flex items-center justify-center shrink-0">
                          <Check className="w-2.5 h-2.5" strokeWidth={3.5} />
                        </span>
                        <span className="line-clamp-2">{h}</span>
                      </li>
                    ))}
                  </ul>

                  {/* Actions */}
                  <div className="mt-auto pt-6 flex items-center gap-2.5">
                    {onEnquirePackage && (
                      <button
                        type="button"
                        onClick={() => onEnquirePackage(pkg)}
                        className="w-12 h-12 sm:w-auto sm:px-5 inline-flex items-center justify-center gap-2 rounded-full border border-[#F26B2A]/40 bg-white text-[#F26B2A] font-bold text-sm hover:bg-[#FFF6EE] hover:border-[#F26B2A] focus:outline-none focus:ring-2 focus:ring-[#F26B2A]/40 active:scale-[0.97] transition-all duration-200 cursor-pointer shrink-0"
                        aria-label={`Enquire about ${pkg.name}`}
                        title="Ask questions or request a callback for this package"
                      >
                        <MessageCircle className="w-[18px] h-[18px]" />
                        <span className="hidden sm:inline">Enquire</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => onSelectPackage(pkg)}
                      className="flex-1 h-12 pl-6 pr-1.5 inline-flex items-center justify-between gap-3 rounded-full bg-[#14213D] hover:bg-[#1B2C52] text-white font-bold text-sm shadow-[0_14px_28px_-12px_rgba(20,33,61,0.7)] active:scale-[0.98] transition-all duration-200 cursor-pointer group/btn"
                    >
                      <span>Customise Itinerary</span>
                      <span className="w-9 h-9 rounded-full bg-gradient-to-br from-[#F25C2A] to-[#FF9A3C] flex items-center justify-center transition-transform duration-300 group-hover/btn:translate-x-0.5 group-hover/btn:rotate-[-8deg]">
                        <ArrowRight className="w-4 h-4" />
                      </span>
                    </button>
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
