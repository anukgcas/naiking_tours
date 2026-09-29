import React from 'react';
import { Heart, Star, Clock, MapPin, ArrowRight } from 'lucide-react';
import { TourPackage } from '../types';

interface TourCardProps {
  pkg: TourPackage;
  isFavorite: boolean;
  onToggleFavorite: (pkg: TourPackage) => void;
  onSelect: (pkg: TourPackage) => void;
  layout?: 'horizontal' | 'grid';
}

export const TourCard: React.FC<TourCardProps> = ({
  pkg,
  isFavorite,
  onToggleFavorite,
  onSelect,
}) => {
  return (
    <div
      onClick={() => onSelect(pkg)}
      className="group bg-white rounded-3xl overflow-hidden border border-[#1E2022]/8 shadow-xs hover:shadow-xl transition-all duration-300 hover:-translate-y-1 flex flex-col md:flex-row cursor-pointer"
    >
      {/* Destination Image Area */}
      <div className="relative md:w-5/12 aspect-[4/3] md:aspect-auto overflow-hidden bg-[#E5E1D8]">
        <img
          src={pkg.featuredImage}
          alt={pkg.name}
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-106"
        />

        {/* Gradient Scrim */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent md:hidden" />

        {/* Badge: Popular / Best Seller / Signature / Limited */}
        {pkg.badge && (
          <div className="absolute top-4 left-4 z-10">
            <span
              className={`text-[11px] font-bold tracking-wider uppercase px-3 py-1 rounded-full shadow-xs ${
                pkg.badge === 'Best Seller'
                  ? 'bg-[#C2571A] text-white'
                  : pkg.badge === 'Popular'
                  ? 'bg-[#1E2022] text-white'
                  : 'bg-white/90 backdrop-blur-md text-[#1E2022]'
              }`}
            >
              {pkg.badge}
            </span>
          </div>
        )}

        {/* Wishlist Heart Toggle */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite(pkg);
          }}
          className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full bg-white/90 backdrop-blur-md hover:bg-white flex items-center justify-center transition-all duration-200 shadow-sm active:scale-90"
          aria-label={isFavorite ? 'Remove from favorites' : 'Save to favorites'}
        >
          <Heart
            className={`w-4 h-4 transition-colors ${
              isFavorite ? 'fill-[#C2571A] text-[#C2571A]' : 'text-[#1E2022] hover:text-[#C2571A]'
            }`}
          />
        </button>

        {/* Location chip on image for mobile */}
        <div className="absolute bottom-3 left-4 flex items-center gap-1.5 text-xs text-white/95 font-medium md:hidden">
          <MapPin className="w-3.5 h-3.5 text-[#C2571A]" />
          <span>
            {pkg.destination}, {pkg.country}
          </span>
        </div>
      </div>

      {/* Details Content Area */}
      <div className="p-5 sm:p-6 md:w-7/12 flex flex-col justify-between">
        <div>
          {/* Top row: Destination + Duration + Rating */}
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[#6B7280] mb-2.5">
            <div className="hidden md:flex items-center gap-1 font-medium text-[#1E2022]">
              <MapPin className="w-3.5 h-3.5 text-[#C2571A]" />
              <span>
                {pkg.destination}, {pkg.country}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1 text-[#6B7280]">
                <Clock className="w-3.5 h-3.5" />
                {pkg.duration}
              </span>
              <span aria-hidden="true">·</span>
              <div className="flex items-center gap-1 text-[#1E2022] font-semibold">
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                <span>{pkg.rating}</span>
                <span className="text-xs text-[#9CA3AF] font-normal">
                  ({pkg.reviewCount})
                </span>
              </div>
            </div>
          </div>

          {/* Package Name */}
          <h3 className="text-lg sm:text-xl font-bold text-[#1E2022] group-hover:text-[#C2571A] transition-colors leading-snug">
            {pkg.name}
          </h3>

          {/* Short Highlight */}
          <p className="mt-2 text-xs sm:text-sm text-[#555A60] line-clamp-2 leading-relaxed">
            {pkg.shortHighlight}
          </p>
        </div>

        {/* Bottom row: Starting Price + View Details CTA */}
        <div className="mt-5 pt-4 border-t border-[#1E2022]/6 flex items-center justify-between">
          <div>
            <span className="text-[11px] uppercase tracking-wider text-[#9CA3AF] block font-medium">
              Starting from
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-base sm:text-lg font-bold text-[#1E2022]">
                ₹{pkg.startingPrice.toLocaleString('en-IN')}
              </span>
              <span className="text-xs text-[#6B7280]">/ person</span>
              {pkg.originalPrice && (
                <span className="text-xs text-[#9CA3AF] line-through ml-1">
                  ₹{pkg.originalPrice.toLocaleString('en-IN')}
                </span>
              )}
            </div>
          </div>

          <div className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-[#1E2022] group-hover:text-[#C2571A] transition-colors">
            <span>View Details</span>
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </div>
        </div>
      </div>
    </div>
  );
};
