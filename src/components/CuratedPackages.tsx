import React, { useState } from 'react';
import {
  Compass,
  ArrowRight,
  Clock,
  Sparkles,
  Car,
  Home,
  Check,
  Bookmark,
  MessageSquare,
} from 'lucide-react';
import { formatINR } from '../data/planner';
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
            return (
              <div
                key={pkg.id}
                className="group bg-white rounded-3xl border border-[#1E2022]/12 overflow-hidden shadow-[0_4px_16px_-4px_rgba(30,32,34,0.06)] hover:shadow-[0_22px_45px_-12px_rgba(30,32,34,0.18)] hover:border-[#C2571A]/25 transition-all duration-300 flex flex-col justify-between"
              >
                <div>
                  {/* Photo Header */}
                  <div className="relative aspect-[16/10] overflow-hidden bg-slate-200">
                    <img
                      src={pkg.image}
                      alt={pkg.name}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 contrast-[1.04] saturate-[1.06]"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent" />
                    
                    {/* Duration Badge */}
                    <div className="absolute top-4 left-4 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#1E2022]/90 backdrop-blur-md text-white text-xs font-bold border border-white/20 shadow-sm">
                      <Clock className="w-3.5 h-3.5 text-[#FFC94D]" />
                      <span>{pkg.duration}</span>
                    </div>

                    {/* Category Pill & Save for Later Toggle */}
                    <div className="absolute top-4 right-4 flex items-center gap-2">
                      <div className="px-3 py-1 rounded-full bg-white text-[#1E2022] text-xs font-bold uppercase tracking-wider shadow-sm border border-black/10">
                        {pkg.category}
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleSavePackage(pkg.id);
                        }}
                        className={`min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full backdrop-blur-md transition-all duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-white ${
                          isSaved
                            ? 'bg-[#C2571A] text-white shadow-sm ring-2 ring-white/50'
                            : 'bg-black/60 text-white hover:bg-black/80 hover:text-white border border-white/25 shadow-sm'
                        }`}
                        aria-label={isSaved ? `Remove ${pkg.name} from saved` : `Save ${pkg.name} for later`}
                        title={isSaved ? 'Saved for Later' : 'Save for Later'}
                      >
                        <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-current' : ''}`} />
                      </button>
                    </div>

                    {/* Starting Price Overlay */}
                    <div className="absolute bottom-3 right-4 text-right text-white">
                      <span className="text-[11px] font-semibold text-white/90 block">From</span>
                      <span className="text-2xl font-extrabold text-white leading-none tracking-tight drop-shadow-sm">
                        {formatINR(pkg.pricePerPerson)}
                      </span>
                      <span className="text-[11px] font-medium text-white/85 block">/ person</span>
                    </div>
                  </div>

                  {/* Content Body */}
                  <div className="p-5 sm:p-6">
                    <h3 className="text-lg sm:text-xl font-bold text-[#1E2022] group-hover:text-[#C2571A] transition-colors leading-snug">
                      {pkg.name}
                    </h3>
                    <p className="mt-2 text-xs sm:text-sm text-[#374151] line-clamp-2 leading-relaxed font-normal">
                      {pkg.tagline}
                    </p>

                    {/* Inclusions Row */}
                    <div className="mt-4 pt-4 border-t border-[#1E2022]/10 flex flex-wrap gap-2">
                      {pkg.inclusions.map((inc) => (
                        <span
                          key={inc}
                          className="text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-[#FAF8F5] text-[#1E2022] border border-[#1E2022]/12"
                        >
                          {inc}
                        </span>
                      ))}
                    </div>

                    {/* Highlights Bulleted */}
                    <div className="mt-4 space-y-1.5">
                      {pkg.highlights.map((h, i) => (
                        <div key={i} className="flex items-start gap-2 text-xs text-[#2D3748] font-medium">
                          <Check className="w-3.5 h-3.5 text-[#E5501A] shrink-0 mt-0.5" />
                          <span className="line-clamp-1">{h}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Action Footer */}
                <div className="p-5 sm:p-6 pt-0 flex items-center gap-2 sm:gap-3">
                  {onEnquirePackage && (
                    <button
                      type="button"
                      onClick={() => onEnquirePackage(pkg)}
                      className="min-h-[44px] inline-flex items-center justify-center gap-1.5 py-2.5 px-3.5 sm:px-4 rounded-2xl border border-[#1E2022]/20 bg-white text-[#1E2022] font-bold text-sm hover:bg-[#FAF8F5] hover:border-[#C2571A] hover:text-[#C2571A] focus:outline-none focus:ring-2 focus:ring-[#C2571A] active:scale-[0.98] transition-all duration-200 cursor-pointer shrink-0 shadow-2xs"
                      aria-label={`Enquire about ${pkg.name}`}
                      title="Ask questions or request a callback for this package"
                    >
                      <MessageSquare className="w-4 h-4 text-[#C2571A]" />
                      <span>Enquire</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => onSelectPackage(pkg)}
                    className="flex-1 inline-flex items-center justify-center gap-2 py-3 px-5 rounded-2xl bg-gradient-to-r from-[#1E2022] to-[#C2571A] hover:from-[#C2571A] hover:to-[#F7931E] text-white font-bold text-sm shadow-[0_6px_18px_-4px_rgba(194,87,26,0.35)] active:scale-[0.98] transition-all duration-200 cursor-pointer group/btn"
                  >
                    <span>Customise Itinerary</span>
                    <ArrowRight className="w-4 h-4 transition-transform group-hover/btn:translate-x-1" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
