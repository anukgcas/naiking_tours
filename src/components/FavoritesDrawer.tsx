import React from 'react';
import { X, Heart, Trash2, ArrowRight } from 'lucide-react';
import { TourPackage } from '../types';

interface FavoritesDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  favoriteIds: string[];
  packages: TourPackage[];
  onRemoveFavorite: (pkg: TourPackage) => void;
  onSelectPackage: (pkg: TourPackage) => void;
  onExplorePackages: () => void;
}

export const FavoritesDrawer: React.FC<FavoritesDrawerProps> = ({
  isOpen,
  onClose,
  favoriteIds,
  packages,
  onRemoveFavorite,
  onSelectPackage,
  onExplorePackages,
}) => {
  if (!isOpen) return null;

  const savedPackages = packages.filter((p) => favoriteIds.includes(p.id));

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/50 backdrop-blur-xs flex justify-end animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-[#FAF8F5] h-full shadow-2xl flex flex-col border-l border-[#1E2022]/10 animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="px-6 py-5 border-b border-[#1E2022]/8 flex items-center justify-between bg-white">
          <div className="flex items-center gap-2">
            <Heart className="w-5 h-5 fill-[#C2571A] text-[#C2571A]" />
            <div>
              <h3 className="text-lg font-bold text-[#1E2022]">Saved Wishlist</h3>
              <p className="text-xs text-[#6B7280]">
                {savedPackages.length} package{savedPackages.length === 1 ? '' : 's'} saved for later
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-black/5 text-[#1E2022] transition-colors cursor-pointer"
            aria-label="Close Favorites"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {savedPackages.length > 0 ? (
            savedPackages.map((pkg) => (
              <div
                key={pkg.id}
                className="bg-white rounded-2xl p-4 border border-[#1E2022]/8 shadow-xs flex flex-col justify-between space-y-3 hover:shadow-md transition-shadow"
              >
                <div className="flex gap-3">
                  <div className="w-20 h-20 rounded-xl overflow-hidden bg-gray-100 shrink-0">
                    <img
                      src={pkg.featuredImage}
                      alt={pkg.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-[10px] font-bold text-[#C2571A] uppercase tracking-wider block">
                      {pkg.destination}
                    </span>
                    <h4 className="text-sm font-bold text-[#1E2022] truncate">
                      {pkg.name}
                    </h4>
                    <p className="text-xs text-[#6B7280] mt-0.5">
                      {pkg.duration} · {pkg.rating} ★
                    </p>
                    <div className="mt-1">
                      <span className="text-xs font-bold text-[#1E2022]">
                        ₹{pkg.startingPrice.toLocaleString('en-IN')}
                      </span>
                      <span className="text-[11px] text-[#6B7280]">/person</span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-2 border-t border-[#1E2022]/6 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => onRemoveFavorite(pkg)}
                    className="inline-flex items-center gap-1 text-xs text-[#9CA3AF] hover:text-red-600 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Remove</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      onSelectPackage(pkg);
                      onClose();
                    }}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-[#1E2022] hover:text-[#C2571A] transition-colors cursor-pointer"
                  >
                    <span>View Details</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-16 px-4 bg-white rounded-2xl border border-[#1E2022]/8">
              <Heart className="w-10 h-10 text-[#D1D5DB] mx-auto mb-3" />
              <h4 className="text-sm font-bold text-[#1E2022]">No saved favorites</h4>
              <p className="text-xs text-[#6B7280] mt-1 mb-4">
                Click the heart icon on any tour package to save it to your private wishlist.
              </p>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onExplorePackages();
                }}
                className="px-4 py-2 rounded-full bg-[#1E2022] text-white text-xs font-semibold hover:bg-[#C2571A] transition-colors cursor-pointer"
              >
                Discover Tour Packages
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
