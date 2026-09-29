import React, { useState, useMemo } from 'react';
import { Search, RotateCcw, SlidersHorizontal } from 'lucide-react';
import { TourPackage, TripStyle } from '../types';
import { TourCard } from './TourCard';

interface ToursPageProps {
  packages: TourPackage[];
  favorites: string[];
  onToggleFavorite: (pkg: TourPackage) => void;
  onSelectPackage: (pkg: TourPackage) => void;
  initialDestination?: string;
}

export const ToursPage: React.FC<ToursPageProps> = ({
  packages,
  favorites,
  onToggleFavorite,
  onSelectPackage,
  initialDestination = 'all',
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDestination, setSelectedDestination] = useState<string>(
    initialDestination.toLowerCase() === 'all' ? 'all' : initialDestination
  );
  const [selectedStyle, setSelectedStyle] = useState<string>('all');
  const [selectedDuration, setSelectedDuration] = useState<string>('all');
  const [selectedBudget, setSelectedBudget] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'recommended' | 'price-asc' | 'price-desc' | 'rating'>(
    'recommended'
  );

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedDestination('all');
    setSelectedStyle('all');
    setSelectedDuration('all');
    setSelectedBudget('all');
    setSortBy('recommended');
  };

  const destinationsList = useMemo(() => {
    const list = Array.from(new Set(packages.map((p) => p.destination)));
    return ['all', ...list];
  }, [packages]);

  const tripStylesList: (string | TripStyle)[] = [
    'all',
    'Beach',
    'Adventure',
    'Luxury',
    'Family',
    'Romantic',
    'Nature',
    'Culture',
  ];

  const filteredAndSortedPackages = useMemo(() => {
    let result = packages.filter((pkg) => {
      // Search Query
      if (
        searchQuery &&
        !pkg.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !pkg.destination.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !pkg.shortHighlight.toLowerCase().includes(searchQuery.toLowerCase())
      ) {
        return false;
      }

      // Destination filter
      if (
        selectedDestination !== 'all' &&
        pkg.destination.toLowerCase() !== selectedDestination.toLowerCase()
      ) {
        return false;
      }

      // Trip Style filter
      if (
        selectedStyle !== 'all' &&
        pkg.tripStyle.toLowerCase() !== selectedStyle.toLowerCase()
      ) {
        return false;
      }

      // Duration filter
      if (selectedDuration !== 'all') {
        if (selectedDuration === '3' && pkg.daysCount !== 3) return false;
        if (selectedDuration === '4' && pkg.daysCount !== 4) return false;
        if (selectedDuration === '5+' && pkg.daysCount < 5) return false;
      }

      // Budget filter
      if (selectedBudget !== 'all') {
        if (selectedBudget === 'under25k' && pkg.startingPrice >= 25000) return false;
        if (
          selectedBudget === '25k-50k' &&
          (pkg.startingPrice < 25000 || pkg.startingPrice > 50000)
        )
          return false;
        if (selectedBudget === '50k+' && pkg.startingPrice <= 50000) return false;
      }

      return true;
    });

    // Sorting
    if (sortBy === 'price-asc') {
      result.sort((a, b) => a.startingPrice - b.startingPrice);
    } else if (sortBy === 'price-desc') {
      result.sort((a, b) => b.startingPrice - a.startingPrice);
    } else if (sortBy === 'rating') {
      result.sort((a, b) => b.rating - a.rating);
    }

    return result;
  }, [
    packages,
    searchQuery,
    selectedDestination,
    selectedStyle,
    selectedDuration,
    selectedBudget,
    sortBy,
  ]);

  return (
    <div className="pt-28 pb-20 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top Header */}
        <div className="mb-8">
          <span className="text-xs font-bold uppercase tracking-wider text-[#C2571A]">
            Curated Escapes
          </span>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-[#1E2022] mt-1">
            Find your next trip
          </h1>
          <p className="mt-2 text-sm sm:text-base text-[#6B7280] max-w-xl">
            Filter by destination, style, and pacing to discover a journey attuned to your rhythm.
          </p>
        </div>

        {/* Filter & Search Bar */}
        <div className="bg-white rounded-3xl p-5 border border-[#1E2022]/8 shadow-sm space-y-4 mb-10">
          {/* Top row: Search input + Sort dropdown */}
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-[#9CA3AF] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by destination or keyword..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-sm rounded-xl bg-[#FAF8F5] border border-black/5 focus:outline-none focus:ring-2 focus:ring-[#C2571A]/30 text-[#1E2022]"
              />
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
              <div className="flex items-center gap-2 text-xs text-[#6B7280]">
                <SlidersHorizontal className="w-3.5 h-3.5 text-[#C2571A]" />
                <span className="font-medium">Sort by:</span>
              </div>
              <select
                aria-label="Sort packages by"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="text-xs font-semibold text-[#1E2022] bg-[#FAF8F5] px-3 py-2 rounded-xl border border-black/5 focus:outline-none cursor-pointer"
              >
                <option value="recommended">Recommended</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="rating">Highest Rated</option>
              </select>
            </div>
          </div>

          {/* Filter Controls Row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-[#1E2022]/6">
            {/* Destination */}
            <div>
              <label
                htmlFor="filter-destination"
                className="block text-[11px] font-semibold text-[#9CA3AF] uppercase tracking-wider mb-1"
              >
                Destination
              </label>
              <select
                id="filter-destination"
                value={selectedDestination}
                onChange={(e) => setSelectedDestination(e.target.value)}
                className="w-full text-xs font-semibold text-[#1E2022] bg-[#FAF8F5] px-3 py-2 rounded-xl border border-black/5 focus:outline-none capitalize cursor-pointer"
              >
                {destinationsList.map((d) => (
                  <option key={d} value={d}>
                    {d === 'all' ? 'All Destinations' : d}
                  </option>
                ))}
              </select>
            </div>

            {/* Trip Type */}
            <div>
              <label
                htmlFor="filter-trip-style"
                className="block text-[11px] font-semibold text-[#9CA3AF] uppercase tracking-wider mb-1"
              >
                Trip Style
              </label>
              <select
                id="filter-trip-style"
                value={selectedStyle}
                onChange={(e) => setSelectedStyle(e.target.value)}
                className="w-full text-xs font-semibold text-[#1E2022] bg-[#FAF8F5] px-3 py-2 rounded-xl border border-black/5 focus:outline-none capitalize cursor-pointer"
              >
                {tripStylesList.map((s) => (
                  <option key={s} value={s}>
                    {s === 'all' ? 'All Styles' : s}
                  </option>
                ))}
              </select>
            </div>

            {/* Duration */}
            <div>
              <label
                htmlFor="filter-duration"
                className="block text-[11px] font-semibold text-[#9CA3AF] uppercase tracking-wider mb-1"
              >
                Duration
              </label>
              <select
                id="filter-duration"
                value={selectedDuration}
                onChange={(e) => setSelectedDuration(e.target.value)}
                className="w-full text-xs font-semibold text-[#1E2022] bg-[#FAF8F5] px-3 py-2 rounded-xl border border-black/5 focus:outline-none cursor-pointer"
              >
                <option value="all">Any Duration</option>
                <option value="3">3 Days (Long Weekend)</option>
                <option value="4">4 Days (Signature)</option>
                <option value="5+">5+ Days (Grand Journey)</option>
              </select>
            </div>

            {/* Budget */}
            <div>
              <label
                htmlFor="filter-budget"
                className="block text-[11px] font-semibold text-[#9CA3AF] uppercase tracking-wider mb-1"
              >
                Budget Range
              </label>
              <select
                id="filter-budget"
                value={selectedBudget}
                onChange={(e) => setSelectedBudget(e.target.value)}
                className="w-full text-xs font-semibold text-[#1E2022] bg-[#FAF8F5] px-3 py-2 rounded-xl border border-black/5 focus:outline-none cursor-pointer"
              >
                <option value="all">All Budgets</option>
                <option value="under25k">Under ₹25,000</option>
                <option value="25k-50k">₹25,000 – ₹50,000</option>
                <option value="50k+">₹50,000+ Luxury</option>
              </select>
            </div>
          </div>

          {/* Quick Active Filters Summary & Reset */}
          <div className="flex items-center justify-between pt-2 text-xs text-[#6B7280]">
            <span>
              Showing <strong>{filteredAndSortedPackages.length}</strong> matching packages
            </span>
            <button
              onClick={resetFilters}
              className="inline-flex items-center gap-1 text-[#C2571A] hover:underline cursor-pointer font-medium"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset Filters</span>
            </button>
          </div>
        </div>

        {/* 2-Column Grid of Tour Cards */}
        {filteredAndSortedPackages.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
            {filteredAndSortedPackages.map((pkg) => (
              <TourCard
                key={pkg.id}
                pkg={pkg}
                isFavorite={favorites.includes(pkg.id)}
                onToggleFavorite={onToggleFavorite}
                onSelect={onSelectPackage}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-white rounded-3xl border border-[#1E2022]/8 p-8">
            <h3 className="text-lg font-bold text-[#1E2022]">No journeys found</h3>
            <p className="text-sm text-[#6B7280] mt-1 mb-4">
              Try adjusting your destination or budget filters to explore other destinations.
            </p>
            <button
              onClick={resetFilters}
              className="px-5 py-2.5 rounded-full bg-[#1E2022] text-white text-xs font-semibold hover:bg-[#C2571A] transition-colors"
            >
              Reset All Filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
