import React from 'react';
import { Home, Compass, Heart, Briefcase, User } from 'lucide-react';

interface MobileBottomNavProps {
  currentTab: 'home' | 'packages' | 'why';
  onNavigate: (tab: 'home' | 'packages' | 'why') => void;
  onOpenFavorites: () => void;
  onOpenMyTrips: () => void;
  onOpenPlanner: () => void;
  favoritesCount: number;
  bookedTripsCount: number;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  currentTab,
  onNavigate,
  onOpenFavorites,
  onOpenMyTrips,
  onOpenPlanner,
  favoritesCount,
  bookedTripsCount,
}) => {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-[#1E2022]/10 px-3 py-2 pb-safe shadow-lg">
      <div className="flex items-center justify-around">
        {/* Home */}
        <button
          onClick={() => onNavigate('home')}
          className={`flex flex-col items-center gap-1 text-[11px] font-medium py-1 px-2 transition-colors cursor-pointer ${
            currentTab === 'home' ? 'text-[#C2571A]' : 'text-[#6B7280]'
          }`}
        >
          <Home className="w-4 h-4" />
          <span>Home</span>
        </button>

        {/* Explore */}
        <button
          onClick={() => onNavigate('packages')}
          className={`flex flex-col items-center gap-1 text-[11px] font-medium py-1 px-2 transition-colors cursor-pointer ${
            currentTab === 'packages' ? 'text-[#C2571A]' : 'text-[#6B7280]'
          }`}
        >
          <Compass className="w-4 h-4" />
          <span>Explore</span>
        </button>

        {/* Favorites */}
        <button
          onClick={onOpenFavorites}
          className="relative flex flex-col items-center gap-1 text-[11px] font-medium text-[#6B7280] py-1 px-2 transition-colors cursor-pointer"
        >
          <div className="relative">
            <Heart
              className={`w-4 h-4 ${
                favoritesCount > 0 ? 'fill-[#C2571A] text-[#C2571A]' : 'text-[#6B7280]'
              }`}
            />
            {favoritesCount > 0 && (
              <span className="absolute -top-1 -right-2 w-3.5 h-3.5 bg-[#C2571A] text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                {favoritesCount}
              </span>
            )}
          </div>
          <span>Favorites</span>
        </button>

        {/* My Trips */}
        <button
          onClick={onOpenMyTrips}
          className="relative flex flex-col items-center gap-1 text-[11px] font-medium text-[#6B7280] py-1 px-2 transition-colors cursor-pointer"
        >
          <div className="relative">
            <Briefcase className="w-4 h-4" />
            {bookedTripsCount > 0 && (
              <span className="absolute -top-1 -right-2 w-3.5 h-3.5 bg-[#1E2022] text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                {bookedTripsCount}
              </span>
            )}
          </div>
          <span>My Trips</span>
        </button>

        {/* Profile / Plan */}
        <button
          onClick={onOpenPlanner}
          className="flex flex-col items-center gap-1 text-[11px] font-medium text-[#6B7280] py-1 px-2 transition-colors cursor-pointer"
        >
          <User className="w-4 h-4" />
          <span>Plan</span>
        </button>
      </div>
    </nav>
  );
};
