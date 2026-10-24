import React, { useEffect, useState } from 'react';
import { NLogo } from './NLogo';

interface HeaderProps {
  /** null = no link is current (e.g. scrolled through the middle sections of the home page) */
  activeTab: 'home' | 'plan' | 'why' | null;
  onNavigate: (tab: 'home' | 'plan' | 'why') => void;
  onOpenMyTrips: () => void;
  onOpenSavedPackages?: () => void;
  onOpenPlanner?: () => void;
  bookedTripsCount: number;
  savedPackagesCount?: number;
  hasActivePlan?: boolean;
  onExploreDestinations?: () => void;
  onBrowsePackages?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onNavigate,
  onOpenMyTrips,
  onOpenSavedPackages,
  bookedTripsCount,
  savedPackagesCount = 0,
  onExploreDestinations,
  onBrowsePackages,
}) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isNarrow, setIsNarrow] = useState(false);

  // Transparent over hero photo at top of home page
  const overHero = !isScrolled && activeTab === 'home';
  const linkIdle = overHero
    ? 'text-white/90 hover:text-white drop-shadow-sm'
    : 'text-[#4B5563] hover:text-[#16222E]';
  const linkActive = overHero ? 'text-white font-bold drop-shadow-sm' : 'text-[#16222E] font-bold';

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 639px)');
    const update = () => setIsNarrow(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header className="fixed top-0 left-0 right-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-3 lg:pt-4">
        {/* Floating rounded pill navbar */}
        <div
          className={`relative flex items-center justify-between h-[64px] lg:h-[76px] px-5 lg:px-8 rounded-full border backdrop-blur-md transition-all duration-500 ease-in-out ${
            overHero
              ? 'bg-white/0 border-white/0 shadow-none'
              : 'bg-white/98 border-[#16222E]/10 shadow-[0_4px_20px_-4px_rgba(22,34,46,0.08)]'
          }`}
        >
          {/* Left: Brand Logo */}
          <button
            type="button"
            onClick={() => onNavigate('home')}
            className="flex items-center gap-3 group cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0B4A82] rounded-lg transition-transform active:scale-98"
            aria-label="Naikings Tours & Travels Home"
          >
            <span
              className={`block origin-left transition-transform duration-500 ease-out ${
                !isNarrow && isScrolled ? 'scale-[0.857]' : 'scale-100'
              }`}
            >
              <NLogo
                fontSize={isNarrow ? 19 : 28}
                variant={overHero ? 'light' : 'dark'}
                className="transition-all duration-300 group-hover:scale-[1.03]"
              />
            </span>
          </button>

          {/* Center: Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-6 lg:gap-8" aria-label="Main navigation">
            <button
              type="button"
              onClick={() => onNavigate('home')}
              className={`text-[15px] font-medium transition-colors duration-200 relative py-1 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0B4A82] rounded-sm ${
                activeTab === 'home' ? linkActive : linkIdle
              }`}
            >
              Home
              <span
                aria-hidden="true"
                className={`absolute bottom-0 left-0 right-0 h-[2px] rounded-full origin-left transition-transform duration-300 ease-out motion-reduce:transition-none ${
                  activeTab === 'home' ? 'scale-x-100' : 'scale-x-0'
                } ${overHero ? 'bg-white' : 'bg-[#0B4A82]'}`}
              />
            </button>

            {onExploreDestinations && (
              <button
                type="button"
                onClick={onExploreDestinations}
                className={`text-[15px] font-medium ${linkIdle} transition-colors duration-200 py-1 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0B4A82] rounded-sm`}
              >
                Destinations
              </button>
            )}

            {onBrowsePackages && (
              <button
                type="button"
                onClick={onBrowsePackages}
                className={`text-[15px] font-medium ${linkIdle} transition-colors duration-200 py-1 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0B4A82] rounded-sm`}
              >
                Packages
              </button>
            )}

            {onOpenSavedPackages && (
              <button
                type="button"
                onClick={onOpenSavedPackages}
                className={`text-[15px] font-medium ${linkIdle} transition-colors duration-200 relative py-1 flex items-center gap-1.5 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0B4A82] rounded-sm`}
                title="View saved travel packages"
              >
                Saved
                {savedPackagesCount > 0 && (
                  <span
                    className={`inline-flex items-center justify-center w-5 h-5 text-[11px] font-bold rounded-full ${
                      overHero ? 'bg-white text-[#16222E]' : 'bg-[#0B4A82] text-white'
                    }`}
                  >
                    {savedPackagesCount}
                  </span>
                )}
              </button>
            )}

            <button
              type="button"
              onClick={onOpenMyTrips}
              className={`text-[15px] font-medium ${linkIdle} transition-colors duration-200 relative py-1 flex items-center gap-1.5 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0B4A82] rounded-sm`}
            >
              My Trips
              {bookedTripsCount > 0 && (
                <span
                  className={`inline-flex items-center justify-center w-5 h-5 text-[11px] font-bold rounded-full ${
                    overHero ? 'bg-white text-[#16222E]' : 'bg-[#16222E] text-white'
                  }`}
                >
                  {bookedTripsCount}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => onNavigate('why')}
              className={`text-[15px] font-medium transition-colors duration-200 relative py-1 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0B4A82] rounded-sm ${
                activeTab === 'why' ? linkActive : linkIdle
              }`}
            >
              Why Naiking
              <span
                aria-hidden="true"
                className={`absolute bottom-0 left-0 right-0 h-[2px] rounded-full origin-left transition-transform duration-300 ease-out motion-reduce:transition-none ${
                  activeTab === 'why' ? 'scale-x-100' : 'scale-x-0'
                } ${overHero ? 'bg-white' : 'bg-[#0B4A82]'}`}
              />
            </button>
          </nav>
        </div>
      </div>
    </header>
  );
};
