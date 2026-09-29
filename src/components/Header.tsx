import React, { useEffect, useState } from 'react';
import { Heart, Sparkles, Menu, X } from 'lucide-react';
import { NLogo } from './NLogo';

interface HeaderProps {
  activeTab: 'home' | 'packages' | 'why';
  onNavigate: (tab: 'home' | 'packages' | 'why') => void;
  onOpenFavorites: () => void;
  onOpenMyTrips: () => void;
  onOpenPlanner: () => void;
  favoritesCount: number;
  bookedTripsCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onNavigate,
  onOpenFavorites,
  onOpenMyTrips,
  onOpenPlanner,
  favoritesCount,
  bookedTripsCount,
}) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${
        isScrolled
          ? 'bg-[#FAF8F5]/90 backdrop-blur-md border-b border-[#1E2022]/8 shadow-xs py-3'
          : 'bg-transparent py-5 md:py-6'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          {/* Left: [N logo] Naiking Tours */}
          <button
            onClick={() => onNavigate('home')}
            className="flex items-center gap-3 group focus:outline-none focus-visible:ring-2 focus-visible:ring-[#E05A47] rounded-lg transition-transform active:scale-98"
          >
            <NLogo size="md" />
            <div className="text-left">
              <span className="text-lg font-semibold tracking-tight text-[#1E2022] group-hover:text-[#E05A47] transition-colors whitespace-nowrap">
                Naiking Tours
              </span>
            </div>
          </button>

          {/* Center: Clean typography navigation links */}
          <nav className="hidden md:flex items-center gap-8">
            <button
              onClick={() => onNavigate('home')}
              className={`text-sm font-medium tracking-wide transition-colors relative py-1 ${
                activeTab === 'home'
                  ? 'text-[#1E2022]'
                  : 'text-[#6B7280] hover:text-[#1E2022]'
              }`}
            >
              Home
              {activeTab === 'home' && (
                <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#E05A47] rounded-full" />
              )}
            </button>

            <button
              onClick={() => onNavigate('packages')}
              className={`text-sm font-medium tracking-wide transition-colors relative py-1 ${
                activeTab === 'packages'
                  ? 'text-[#1E2022]'
                  : 'text-[#6B7280] hover:text-[#1E2022]'
              }`}
            >
              Tours & Packages
              {activeTab === 'packages' && (
                <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#E05A47] rounded-full" />
              )}
            </button>

            <button
              onClick={onOpenMyTrips}
              className="text-sm font-medium tracking-wide text-[#6B7280] hover:text-[#1E2022] transition-colors relative py-1 flex items-center gap-1.5"
            >
              My Trips
              {bookedTripsCount > 0 && (
                <span className="inline-flex items-center justify-center w-4 h-4 text-[10px] font-bold rounded-full bg-[#1E2022] text-white">
                  {bookedTripsCount}
                </span>
              )}
            </button>

            <button
              onClick={() => onNavigate('why')}
              className={`text-sm font-medium tracking-wide transition-colors relative py-1 ${
                activeTab === 'why'
                  ? 'text-[#1E2022]'
                  : 'text-[#6B7280] hover:text-[#1E2022]'
              }`}
            >
              Why Naiking
              {activeTab === 'why' && (
                <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#E05A47] rounded-full" />
              )}
            </button>
          </nav>

          {/* Right: Favorite icon + Plan a Trip CTA */}
          <div className="flex items-center gap-3">
            {/* Favorite Icon */}
            <button
              onClick={onOpenFavorites}
              className="relative p-2.5 rounded-full text-[#1E2022] hover:bg-[#1E2022]/5 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#E05A47]"
              aria-label={`View favorites (${favoritesCount})`}
            >
              <Heart
                className={`w-5 h-5 transition-transform duration-200 active:scale-90 ${
                  favoritesCount > 0
                    ? 'fill-[#E05A47] text-[#E05A47]'
                    : 'text-[#1E2022]'
                }`}
              />
              {favoritesCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 text-[10px] font-semibold bg-[#E05A47] text-white rounded-full flex items-center justify-center">
                  {favoritesCount}
                </span>
              )}
            </button>

            {/* Plan a Trip Primary CTA */}
            <button
              onClick={onOpenPlanner}
              className="inline-flex items-center gap-2 px-4 py-2 sm:px-5 sm:py-2.5 rounded-full text-xs sm:text-sm font-semibold text-white bg-[#1E2022] hover:bg-[#E05A47] transition-all duration-300 shadow-xs active:scale-98 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#FAF8F5]/80" />
              <span>Plan a Trip</span>
            </button>

            {/* Mobile Menu Toggle Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 text-[#1E2022] rounded-lg hover:bg-black/5"
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden mt-3 p-4 bg-white rounded-2xl border border-[#1E2022]/10 shadow-lg flex flex-col gap-3">
            <button
              onClick={() => {
                onNavigate('home');
                setIsMobileMenuOpen(false);
              }}
              className="text-left text-sm font-medium py-2 px-3 rounded-lg hover:bg-[#FAF8F5]"
            >
              Home
            </button>
            <button
              onClick={() => {
                onNavigate('packages');
                setIsMobileMenuOpen(false);
              }}
              className="text-left text-sm font-medium py-2 px-3 rounded-lg hover:bg-[#FAF8F5]"
            >
              Tours & Packages
            </button>
            <button
              onClick={() => {
                onOpenMyTrips();
                setIsMobileMenuOpen(false);
              }}
              className="text-left text-sm font-medium py-2 px-3 rounded-lg hover:bg-[#FAF8F5] flex items-center justify-between"
            >
              <span>My Trips</span>
              {bookedTripsCount > 0 && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-[#1E2022] text-white">
                  {bookedTripsCount}
                </span>
              )}
            </button>
            <button
              onClick={() => {
                onNavigate('why');
                setIsMobileMenuOpen(false);
              }}
              className="text-left text-sm font-medium py-2 px-3 rounded-lg hover:bg-[#FAF8F5]"
            >
              Why Naiking
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
