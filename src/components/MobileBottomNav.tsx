import React from 'react';
import { Home, Sparkles, Briefcase, Info } from 'lucide-react';

interface MobileBottomNavProps {
  currentTab: 'home' | 'plan' | 'why';
  onNavigate: (tab: 'home' | 'plan' | 'why') => void;
  onOpenMyTrips: () => void;
  bookedTripsCount: number;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  currentTab,
  onNavigate,
  onOpenMyTrips,
  bookedTripsCount,
}) => {
  const tabClass = (active: boolean) =>
    `flex flex-col items-center gap-1 text-[11px] font-medium py-1 px-2 transition-colors cursor-pointer ${
      active ? 'text-[#C2571A]' : 'text-[#6B7280]'
    }`;

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-[#1E2022]/10 px-3 py-2 pb-safe shadow-lg">
      <div className="flex items-center justify-around">
        <button onClick={() => onNavigate('home')} className={tabClass(currentTab === 'home')}>
          <Home className="w-4 h-4" />
          <span>Home</span>
        </button>

        <button onClick={() => onNavigate('plan')} className={tabClass(currentTab === 'plan')}>
          <Sparkles className="w-4 h-4" />
          <span>Plan</span>
        </button>

        <button onClick={onOpenMyTrips} className={`relative ${tabClass(false)}`}>
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

        <button onClick={() => onNavigate('why')} className={tabClass(currentTab === 'why')}>
          <Info className="w-4 h-4" />
          <span>Why Us</span>
        </button>
      </div>
    </nav>
  );
};
