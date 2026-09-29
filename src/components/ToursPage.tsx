import React, { useState, useMemo } from 'react';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import { TourPackage } from '../types';
import { TourCard } from './TourCard';

interface ToursPageProps {
  packages: TourPackage[];
  favorites: string[];
  onToggleFavorite: (pkg: TourPackage) => void;
  onSelectPackage: (pkg: TourPackage) => void;
  initialDestination?: string;
}

const RATING_OPTIONS = [
  { label: 'Any Rating', value: 0 },
  { label: '4.8 ★+', value: 4.8 },
  { label: '4.9 ★+', value: 4.9 },
];

const formatINR = (n: number) => '₹' + n.toLocaleString('en-IN');

export const ToursPage: React.FC<ToursPageProps> = ({
  packages,
  favorites,
  onToggleFavorite,
  onSelectPackage,
  initialDestination = 'all',
}) => {
  const bounds = useMemo(() => {
    const days = packages.map((p) => p.daysCount);
    const prices = packages.map((p) => p.startingPrice);
    return {
      minDays: Math.min(...days),
      maxDays: Math.max(...days),
      minPrice: Math.floor(Math.min(...prices) / 5000) * 5000,
      maxPrice: Math.ceil(Math.max(...prices) / 5000) * 5000,
    };
  }, [packages]);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDestination, setSelectedDestination] = useState<string>(
    initialDestination.toLowerCase() === 'all' ? 'all' : initialDestination
  );
  const [selectedStyle, setSelectedStyle] = useState<string>('all');
  const [maxDays, setMaxDays] = useState(bounds.maxDays);
  const [maxBudget, setMaxBudget] = useState(bounds.maxPrice);
  const [minRating, setMinRating] = useState(0);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [sortBy, setSortBy] = useState<'recommended' | 'price-asc' | 'price-desc' | 'rating'>(
    'recommended'
  );

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedDestination('all');
    setSelectedStyle('all');
    setMaxDays(bounds.maxDays);
    setMaxBudget(bounds.maxPrice);
    setMinRating(0);
    setSortBy('recommended');
  };

  const destinationsList = useMemo(
    () => Array.from(new Set(packages.map((p) => p.destination))),
    [packages]
  );
  const stylesList = useMemo(
    () => Array.from(new Set(packages.map((p) => p.tripStyle))),
    [packages]
  );

  const filteredAndSortedPackages = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const result = packages.filter((pkg) => {
      if (
        q &&
        ![pkg.name, pkg.destination, pkg.country, pkg.shortHighlight, pkg.tripStyle].some((t) =>
          t.toLowerCase().includes(q)
        )
      )
        return false;
      if (
        selectedDestination !== 'all' &&
        pkg.destination.toLowerCase() !== selectedDestination.toLowerCase()
      )
        return false;
      if (selectedStyle !== 'all' && pkg.tripStyle !== selectedStyle) return false;
      if (pkg.daysCount > maxDays) return false;
      if (pkg.startingPrice > maxBudget) return false;
      if (pkg.rating < minRating) return false;
      return true;
    });

    if (sortBy === 'price-asc') result.sort((a, b) => a.startingPrice - b.startingPrice);
    else if (sortBy === 'price-desc') result.sort((a, b) => b.startingPrice - a.startingPrice);
    else if (sortBy === 'rating') result.sort((a, b) => b.rating - a.rating);
    return result;
  }, [packages, searchQuery, selectedDestination, selectedStyle, maxDays, maxBudget, minRating, sortBy]);

  const filterPanel = (
    <aside className="rounded-3xl bg-white border border-[#1E2022]/10 shadow-sm p-6 space-y-7">
      <div className="flex items-center justify-between pb-4 border-b border-[#1E2022]/8">
        <h2 className="text-sm font-extrabold uppercase tracking-wider text-[#1E2022]">Refine Selection</h2>
        <button
          type="button"
          onClick={resetFilters}
          className="text-xs font-semibold text-[#C2571A] hover:underline cursor-pointer"
        >
          Clear All
        </button>
      </div>

      {/* Destination */}
      <div>
        <label htmlFor="filter-destination" className="block text-sm font-semibold text-[#1E2022] mb-2">
          Destination
        </label>
        <select
          id="filter-destination"
          value={selectedDestination}
          onChange={(e) => setSelectedDestination(e.target.value)}
          className="w-full text-sm text-[#1E2022] bg-white px-3 py-2.5 rounded-xl border border-[#1E2022]/20 focus:outline-none focus:border-[#1E2022] cursor-pointer"
        >
          <option value="all">All Destinations</option>
          {destinationsList.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
      </div>

      {/* Duration */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label htmlFor="filter-duration" className="text-sm font-semibold text-[#1E2022]">
            Duration
          </label>
          <span className="text-xs font-bold text-[#C2571A]">
            {bounds.minDays} – {maxDays} Days
          </span>
        </div>
        <input
          id="filter-duration"
          type="range"
          min={bounds.minDays}
          max={bounds.maxDays}
          step={1}
          value={maxDays}
          onChange={(e) => setMaxDays(Number(e.target.value))}
          className="w-full accent-[#1E2022] cursor-pointer"
        />
      </div>

      {/* Budget */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label htmlFor="filter-budget" className="text-sm font-semibold text-[#1E2022]">
            Max Budget per Person
          </label>
          <span className="text-xs font-bold text-[#C2571A]">{formatINR(maxBudget)}</span>
        </div>
        <input
          id="filter-budget"
          type="range"
          min={bounds.minPrice}
          max={bounds.maxPrice}
          step={5000}
          value={maxBudget}
          onChange={(e) => setMaxBudget(Number(e.target.value))}
          className="w-full accent-[#1E2022] cursor-pointer"
        />
        <div className="flex justify-between text-[11px] text-[#9CA3AF] mt-1">
          <span>{formatINR(bounds.minPrice)}</span>
          <span>{formatINR(bounds.maxPrice)}+</span>
        </div>
      </div>

      {/* Travel style */}
      <div>
        <span className="block text-sm font-semibold text-[#1E2022] mb-2">Travel Style</span>
        <div className="flex flex-wrap gap-2">
          {stylesList.map((style) => {
            const on = selectedStyle === style;
            return (
              <button
                key={style}
                type="button"
                aria-pressed={on}
                onClick={() => setSelectedStyle(on ? 'all' : style)}
                className={`px-3.5 py-1.5 rounded-full text-sm transition-colors cursor-pointer ${
                  on ? 'bg-[#1E2022] text-white' : 'bg-[#FAF8F5] text-[#555A60] hover:bg-[#EFEBE4]'
                }`}
              >
                {style}
              </button>
            );
          })}
        </div>
      </div>

      {/* Guest rating */}
      <div>
        <span className="block text-sm font-semibold text-[#1E2022] mb-2">Guest Rating</span>
        <div className="grid grid-cols-3 gap-2">
          {RATING_OPTIONS.map((r) => {
            const on = minRating === r.value;
            return (
              <button
                key={r.value}
                type="button"
                aria-pressed={on}
                onClick={() => setMinRating(r.value)}
                className={`py-2.5 rounded-xl border text-sm font-medium leading-tight transition-colors cursor-pointer ${
                  on
                    ? 'border-[#1E2022] bg-[#F6EDE6] text-[#1E2022]'
                    : 'border-[#1E2022]/15 text-[#555A60] hover:border-[#1E2022]/40'
                }`}
              >
                {r.label}
              </button>
            );
          })}
        </div>
      </div>
    </aside>
  );

  return (
    <div className="pt-28 pb-20 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <span className="text-xs font-bold uppercase tracking-wider text-[#C2571A]">Curated Escapes</span>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#1E2022] mt-1">
            Find your next trip
          </h1>
        </div>

        {/* Search + Filters toggle (toggle only on small screens) */}
        <div className="flex items-center gap-3 mb-8">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#9CA3AF] absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by destination, mountain, yacht, rail experience, or activity..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-3.5 text-sm rounded-2xl bg-white border border-[#1E2022]/12 shadow-sm focus:outline-none focus:border-[#1E2022] text-[#1E2022] placeholder:text-[#9CA3AF]"
            />
          </div>
          <button
            type="button"
            onClick={() => setFiltersOpen((o) => !o)}
            aria-expanded={filtersOpen}
            className="lg:hidden inline-flex items-center gap-2 px-5 py-3.5 rounded-2xl bg-white border border-[#1E2022]/12 shadow-sm text-sm font-semibold text-[#1E2022] cursor-pointer"
          >
            {filtersOpen ? <X className="w-4 h-4" /> : <SlidersHorizontal className="w-4 h-4" />}
            Filters
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left: refine selection */}
          <div
            className={`lg:col-span-4 xl:col-span-3 lg:sticky lg:top-24 ${
              filtersOpen ? 'block' : 'hidden lg:block'
            }`}
          >
            {filterPanel}
          </div>

          {/* Right: results */}
          <div className="lg:col-span-8 xl:col-span-9">
            <div className="flex items-center justify-between gap-3 mb-5">
              <p className="text-sm text-[#555A60]">
                Showing <strong className="text-[#1E2022]">{filteredAndSortedPackages.length}</strong>{' '}
                curated tour experiences
              </p>
              <select
                aria-label="Sort packages by"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                className="text-xs font-semibold text-[#1E2022] bg-white px-3 py-2 rounded-xl border border-[#1E2022]/15 focus:outline-none cursor-pointer"
              >
                <option value="recommended">Recommended</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="rating">Highest Rated</option>
              </select>
            </div>

            {filteredAndSortedPackages.length > 0 ? (
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                {filteredAndSortedPackages.map((pkg) => (
                  <TourCard
                    key={pkg.id}
                    pkg={pkg}
                    isFavorite={favorites.includes(pkg.id)}
                    onToggleFavorite={onToggleFavorite}
                    onSelect={onSelectPackage}
                    layout="grid"
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-16 bg-white rounded-3xl border border-[#1E2022]/8 p-8">
                <h3 className="text-lg font-bold text-[#1E2022]">No journeys found</h3>
                <p className="text-sm text-[#6B7280] mt-1 mb-4">
                  Try adjusting your filters to explore other destinations.
                </p>
                <button
                  onClick={resetFilters}
                  className="px-5 py-2.5 rounded-full bg-[#1E2022] text-white text-xs font-semibold hover:bg-[#C2571A] transition-colors cursor-pointer"
                >
                  Clear All Filters
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
