import React, { useRef } from 'react';
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { SignatureDestination } from '../types';

interface SignatureDestinationsProps {
  destinations: SignatureDestination[];
  onSelectDestination: (destName: string) => void;
  onViewAllPackages: () => void;
}

export const SignatureDestinations: React.FC<SignatureDestinationsProps> = ({
  destinations,
  onSelectDestination,
  onViewAllPackages,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const offset = direction === 'left' ? -340 : 340;
      scrollRef.current.scrollBy({ left: offset, behavior: 'smooth' });
    }
  };

  return (
    <section className="py-12 lg:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header Block: Left Title & Small Subtext, Right "View All Packages →" */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#1E2022]">
              Signature Destinations
            </h2>
            <p className="mt-1 text-sm sm:text-base text-[#6B7280]">
              Places worth putting on your calendar.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Scroll Navigation Buttons for Desktop */}
            <div className="hidden md:flex items-center gap-2 mr-2">
              <button
                onClick={() => scroll('left')}
                className="w-9 h-9 rounded-full border border-[#1E2022]/10 bg-white hover:bg-[#FAF8F5] flex items-center justify-center text-[#1E2022] transition-colors shadow-2xs"
                aria-label="Scroll destinations left"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => scroll('right')}
                className="w-9 h-9 rounded-full border border-[#1E2022]/10 bg-white hover:bg-[#FAF8F5] flex items-center justify-center text-[#1E2022] transition-colors shadow-2xs"
                aria-label="Scroll destinations right"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <button
              onClick={onViewAllPackages}
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#1E2022] hover:text-[#E05A47] transition-colors group cursor-pointer"
            >
              <span>View All Packages</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </button>
          </div>
        </div>

        {/* Horizontal Scrolling Destination Card Row */}
        <div
          ref={scrollRef}
          className="flex gap-5 overflow-x-auto pb-4 pt-1 scroll-smooth snap-x snap-mandatory scrollbar-none no-scrollbar"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {destinations.map((dest) => (
            <div
              key={dest.id}
              onClick={() => onSelectDestination(dest.name)}
              className="group relative flex-none w-[260px] sm:w-[300px] h-[380px] sm:h-[420px] rounded-3xl overflow-hidden cursor-pointer select-none bg-[#EAE6DF] snap-start border border-black/5 shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl"
            >
              {/* Background Image with subtle zoom on hover */}
              <img
                src={dest.image}
                alt={`${dest.name}, ${dest.country}`}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-108"
              />

              {/* Contrast scrim overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/5 transition-opacity duration-300 group-hover:opacity-90" />

              {/* Soft shimmer/light sweep passes across the card on hover */}
              <div className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500 overflow-hidden">
                <div className="absolute -inset-full w-[200%] h-[200%] bg-gradient-to-r from-transparent via-white/15 to-transparent transform -rotate-45 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 ease-in-out" />
              </div>

              {/* Top Tag: Packages Count */}
              <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-10">
                <span className="text-xs font-medium text-white/90 px-3 py-1 rounded-full bg-black/30 backdrop-blur-md border border-white/10">
                  {dest.packageCount} Private Tours
                </span>
                <span className="text-xs font-medium text-white/80">
                  From ₹{dest.startingPrice.toLocaleString('en-IN')}
                </span>
              </div>

              {/* Bottom Content with gentle movement */}
              <div className="absolute bottom-5 left-5 right-5 z-10 transition-transform duration-300">
                <p className="text-xs font-medium uppercase tracking-widest text-[#E05A47] mb-1">
                  {dest.country}
                </p>
                <div className="flex items-center justify-between">
                  <h3 className="text-2xl font-bold text-white transition-transform duration-300 group-hover:translate-x-1">
                    {dest.name}
                  </h3>
                  {/* Arrow appears on hover */}
                  <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </div>
                <p className="mt-2 text-xs text-white/80 line-clamp-1 group-hover:text-white/95 transition-colors">
                  {dest.tagline}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
