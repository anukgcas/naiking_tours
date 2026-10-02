import React, { useEffect, useState } from 'react';
import { Sparkles, Menu, X } from 'lucide-react';
import { NLogo } from './NLogo';

interface HeaderProps {
  activeTab: 'home' | 'plan' | 'why';
  onNavigate: (tab: 'home' | 'plan' | 'why') => void;
  onOpenMyTrips: () => void;
  onOpenPlanner: () => void;
  bookedTripsCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onNavigate,
  onOpenMyTrips,
  onOpenPlanner,
  bookedTripsCount,
}) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isNarrow, setIsNarrow] = useState(false);
  // Transparent over the hero photo at the top of the home page, so the links switch to light text there
  const overHero = !isScrolled && activeTab === 'home';
  const linkIdle = overHero ? 'text-white/80 hover:text-white' : 'text-[#6B7280] hover:text-[#1E2022]';
  const linkActive = overHero ? 'text-white' : 'text-[#1E2022]';

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
    <header
      className="fixed top-0 left-0 right-0 z-40"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-3 lg:pt-4">
        {/* Floating rounded pill navbar */}
        <div
          className={`relative flex items-center justify-between h-[64px] lg:h-[76px] px-5 lg:px-8 rounded-full border backdrop-blur-md transition-all duration-700 ease-in-out ${
            overHero
              ? 'bg-white/0 border-white/0 shadow-none'
              : 'bg-white/90 border-white/90 shadow-md'
          }`}
        >
          {/* Left: [N logo] Naiking Tours */}
          <button
            onClick={() => onNavigate('home')}
            className="flex items-center gap-3 group focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C2571A] rounded-lg transition-transform active:scale-98"
          >
            <span
              className={`block origin-left transition-transform duration-500 ease-out ${
                !isNarrow && isScrolled ? 'scale-[0.857]' : 'scale-100'
              }`}
            >
              <NLogo fontSize={isNarrow ? 19 : 28} className="transition-all duration-300 group-hover:scale-[1.03]" />
            </span>
          </button>

          {/* Center: Clean typography navigation links */}
          <nav className="hidden md:flex items-center gap-8">
            <button
              onClick={() => onNavigate('home')}
              className={`text-[15px] font-medium transition-colors duration-500 ease-out relative py-1 ${
                activeTab === 'home' ? linkActive : linkIdle
              }`}
            >
              Home
              {activeTab === 'home' && (
                <span key={String(overHero)} className={`absolute bottom-0 left-0 right-0 h-[2px] rounded-full origin-left animate-underline-draw ${overHero ? 'bg-white' : 'bg-[#C2571A]'}`} />
              )}
            </button>

            <button
              onClick={onOpenMyTrips}
              className={`text-[15px] font-medium ${linkIdle} transition-colors duration-500 ease-out relative py-1 flex items-center gap-1.5`}
            >
              My Trips
              {bookedTripsCount > 0 && (
                <span className={`inline-flex items-center justify-center w-5 h-5 text-[12px] font-bold rounded-full ${overHero ? 'bg-white text-[#1E2022]' : 'bg-[#1E2022] text-white'}`}>
                  {bookedTripsCount}
                </span>
              )}
            </button>

            <button
              onClick={() => onNavigate('why')}
              className={`text-[15px] font-medium transition-colors duration-500 ease-out relative py-1 ${
                activeTab === 'why' ? linkActive : linkIdle
              }`}
            >
              Why Naiking
              {activeTab === 'why' && (
                <span key={String(overHero)} className={`absolute bottom-0 left-0 right-0 h-[2px] rounded-full origin-left animate-underline-draw ${overHero ? 'bg-white' : 'bg-[#C2571A]'}`} />
              )}
            </button>
          </nav>

          {/* Right: Favorite icon + Plan a Trip CTA */}
          <div className="flex items-center gap-3">
            {/* Plan a Trip Primary CTA */}
            <button
              onClick={onOpenPlanner}
              className="inline-flex items-center gap-2 whitespace-nowrap px-4 py-2 sm:px-5 sm:py-2.5 rounded-full text-[15px] sm:text-[15px] font-medium text-white bg-[#1E2022] hover:bg-[#C2571A] transition-all duration-300 shadow-xs active:scale-98 cursor-pointer"
            >
              {/* <Sparkles className="w-3.5 h-3.5 text-[#FAF8F5]/80" /> */}
              <span>Plan a Trip</span>
            </button>

            {/* Mobile Menu Toggle Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className={`md:hidden p-2 rounded-lg hover:bg-black/5 ${overHero ? 'text-white' : 'text-[#1E2022]'}`}
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden mt-2 mb-3 p-4 bg-white rounded-2xl border border-[#1E2022]/10 shadow-lg flex flex-col gap-3">
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
