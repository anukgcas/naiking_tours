import React, { useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { TourPackage } from '../types';
import { TourCard } from './TourCard';

interface PopularPackagesProps {
  packages: TourPackage[];
  favorites: string[];
  onToggleFavorite: (pkg: TourPackage) => void;
  onSelectPackage: (pkg: TourPackage) => void;
  onViewAllPackages: () => void;
}

export const PopularPackages: React.FC<PopularPackagesProps> = ({
  packages,
  favorites,
  onToggleFavorite,
  onSelectPackage,
  onViewAllPackages,
}) => {
  const [filterStyle, setFilterStyle] = useState<string>('all');

  const filteredPackages =
    filterStyle === 'all'
      ? packages
      : packages.filter((p) => p.tripStyle.toLowerCase() === filterStyle.toLowerCase());

  return (
    <section className="py-12 lg:py-16 bg-[#F4F1EC]/40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#1E2022]">
              Popular Tour Packages
            </h2>
            <p className="mt-1 text-sm sm:text-base text-[#6B7280]">
              Handcrafted private itineraries featuring boutique stays and verified local guides.
            </p>
          </div>

          {/* Interactive filter tabs (functional buttons) */}
          <div className="flex items-center gap-1.5 p-1 bg-white/80 rounded-xl border border-[#1E2022]/8 overflow-x-auto scrollbar-none">
            {['all', 'luxury', 'romantic', 'culture', 'adventure'].map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setFilterStyle(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize whitespace-nowrap transition-colors cursor-pointer ${
                  filterStyle === cat
                    ? 'bg-[#1E2022] text-white shadow-xs'
                    : 'text-[#6B7280] hover:text-[#1E2022] hover:bg-[#FAF8F5]'
                }`}
              >
                {cat === 'all' ? 'All Journeys' : cat}
              </button>
            ))}
          </div>
        </div>

        {/* 2-Column Grid of Tour Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
          {filteredPackages.map((pkg) => (
            <TourCard
              key={pkg.id}
              pkg={pkg}
              isFavorite={favorites.includes(pkg.id)}
              onToggleFavorite={onToggleFavorite}
              onSelect={onSelectPackage}
            />
          ))}
        </div>

        {/* View All Bottom Banner */}
        <div className="mt-12 text-center">
          <button
            type="button"
            onClick={onViewAllPackages}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-sm font-semibold text-[#1E2022] bg-white border border-[#1E2022]/10 hover:border-[#1E2022]/30 hover:bg-[#FAF8F5] transition-all duration-300 shadow-xs active:scale-98 cursor-pointer"
          >
            <span>Browse All {packages.length}+ Packages</span>
            <ArrowRight className="w-4 h-4 text-[#C2571A]" />
          </button>
        </div>
      </div>
    </section>
  );
};
