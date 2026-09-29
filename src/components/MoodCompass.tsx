import React, { useState } from 'react';
import { Palmtree, Mountain, Crown, Sunset, Landmark, ArrowRight, Sparkles } from 'lucide-react';
import { TourPackage } from '../types';

interface MoodCompassProps {
  packages: TourPackage[];
  onSelectPackage: (pkg: TourPackage) => void;
}

interface CadenceOption {
  id: string;
  title: string;
  tagline: string;
  icon: React.ReactNode;
  bgGradient: string;
  packageId: string;
  sensory: string;
}

const CADENCES: CadenceOption[] = [
  {
    id: 'azure',
    title: 'Azure Calm',
    tagline: 'Turquoise silence & overwater bungalow mornings',
    icon: <Palmtree className="w-4 h-4" />,
    bgGradient: 'from-cyan-900/80 to-blue-950/90',
    packageId: 'maldives-water-villa',
    sensory: 'Warm sea breeze · Zero engine noise',
  },
  {
    id: 'verdant',
    title: 'Verdant Seclusion',
    tagline: 'Deep rainforest ravine, river mist & ancient shrines',
    icon: <Sparkles className="w-4 h-4" />,
    bgGradient: 'from-emerald-950/85 to-stone-900/90',
    packageId: 'bali-escape',
    sensory: 'Morning rain on jungle canopy · Incense notes',
  },
  {
    id: 'alpine',
    title: 'Alpine Solitude',
    tagline: 'Cedar-scented mountain chalets & wood fireplaces',
    icon: <Mountain className="w-4 h-4" />,
    bgGradient: 'from-stone-900/85 to-slate-900/90',
    packageId: 'manali-alpine-serenity',
    sensory: 'Crisp glacial air · Roaring stone hearth',
  },
  {
    id: 'mirage',
    title: 'Desert Mirage',
    tagline: 'Sunset dunes, starlit camps & avant-garde architecture',
    icon: <Sunset className="w-4 h-4" />,
    bgGradient: 'from-amber-950/85 to-stone-900/90',
    packageId: 'dubai-glamour',
    sensory: 'Silken desert sand · Saffron & oud fragrance',
  },
  {
    id: 'heritage',
    title: 'Heritage Quietude',
    tagline: 'Portuguese colonial verandas & slow spice gardens',
    icon: <Landmark className="w-4 h-4" />,
    bgGradient: 'from-orange-950/85 to-stone-900/90',
    packageId: 'goa-coastal-charm',
    sensory: 'Salt breeze through palm groves · Konkani feast',
  },
];

export const MoodCompass: React.FC<MoodCompassProps> = ({
  packages,
  onSelectPackage,
}) => {
  const [activeCadenceId, setActiveCadenceId] = useState<string>('verdant');

  const activeCadence =
    CADENCES.find((c) => c.id === activeCadenceId) || CADENCES[1];
  const matchedPackage =
    packages.find((p) => p.id === activeCadence.packageId) || packages[0];

  return (
    <section className="py-14 sm:py-20 bg-[#FAF8F5] relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="max-w-2xl mb-8 sm:mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#1E2022]/5 text-xs font-semibold text-[#1E2022] mb-3">
            <Sparkles className="w-3.5 h-3.5 text-[#E05A47]" />
            <span>Interactive Travel Cadence</span>
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-[#1E2022]">
            What rhythm is your mind craving?
          </h2>
          <p className="mt-2 text-sm sm:text-base text-[#6B7280]">
            Select your preferred sensory atmosphere to reveal the curated retreat engineered for it.
          </p>
        </div>

        {/* Interactive Cadence Tabs */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-8">
          {CADENCES.map((cadence) => {
            const isSelected = cadence.id === activeCadenceId;
            return (
              <button
                key={cadence.id}
                type="button"
                onClick={() => setActiveCadenceId(cadence.id)}
                className={`p-3.5 sm:p-4 rounded-2xl border text-left transition-all duration-300 cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? 'bg-white border-[#E05A47] shadow-lg scale-102 ring-1 ring-[#E05A47]'
                    : 'bg-white/60 border-black/5 hover:bg-white hover:border-[#1E2022]/15'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div
                    className={`w-7 h-7 rounded-xl flex items-center justify-center transition-colors ${
                      isSelected
                        ? 'bg-[#E05A47] text-white'
                        : 'bg-[#1E2022]/5 text-[#1E2022]'
                    }`}
                  >
                    {cadence.icon}
                  </div>
                  {isSelected && (
                    <span className="w-2 h-2 rounded-full bg-[#E05A47] animate-pulse" />
                  )}
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-[#1E2022]">
                    {cadence.title}
                  </h4>
                  <p className="text-[11px] text-[#6B7280] line-clamp-1 mt-0.5">
                    {cadence.sensory}
                  </p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Featured Dynamic Result Spotlight */}
        <div className="bg-white rounded-3xl overflow-hidden border border-[#1E2022]/8 shadow-xl transition-all duration-500">
          <div className="grid grid-cols-1 lg:grid-cols-12 items-center">
            {/* Visual Side */}
            <div className="lg:col-span-7 relative h-72 sm:h-96 lg:h-[420px] overflow-hidden bg-[#ECE8E1]">
              <img
                src={matchedPackage.featuredImage}
                alt={matchedPackage.name}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover transition-transform duration-1000 ease-out hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

              <div className="absolute top-5 left-5">
                <span className="text-xs font-bold uppercase tracking-wider text-white px-3 py-1 rounded-full bg-black/40 backdrop-blur-md border border-white/20">
                  {matchedPackage.destination} · {activeCadence.title}
                </span>
              </div>

              <div className="absolute bottom-5 left-5 right-5 text-white">
                <p className="text-xs uppercase tracking-widest text-white/80">
                  Sensory Signature
                </p>
                <p className="text-base sm:text-lg font-medium">{activeCadence.sensory}</p>
              </div>
            </div>

            {/* Content Side */}
            <div className="lg:col-span-5 p-6 sm:p-8 lg:p-10 flex flex-col justify-between space-y-6">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-[#E05A47]">
                  Curated Match
                </span>
                <h3 className="text-2xl sm:text-3xl font-bold text-[#1E2022] mt-1 leading-snug">
                  {matchedPackage.name}
                </h3>
                <p className="mt-2 text-xs sm:text-sm text-[#555A60] leading-relaxed">
                  {matchedPackage.description}
                </p>

                {/* Highlight Pills */}
                <div className="mt-4 pt-4 border-t border-[#1E2022]/6 space-y-2 text-xs text-[#1E2022]">
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#E05A47]" />
                    <span>
                      <strong>Stay:</strong> {matchedPackage.hotel.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#E05A47]" />
                    <span>
                      <strong>Pacing:</strong> {matchedPackage.duration}
                    </span>
                  </div>
                </div>
              </div>

              {/* Price & View Full Dedicated Page CTA */}
              <div className="pt-4 border-t border-[#1E2022]/8 flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-[#9CA3AF] uppercase tracking-wider block">
                    Starting from
                  </span>
                  <span className="text-xl sm:text-2xl font-bold text-[#1E2022]">
                    ₹{matchedPackage.startingPrice.toLocaleString('en-IN')}
                  </span>
                  <span className="text-xs text-[#6B7280]"> / person</span>
                </div>

                <button
                  type="button"
                  onClick={() => onSelectPackage(matchedPackage)}
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-full bg-[#1E2022] hover:bg-[#E05A47] text-white text-xs sm:text-sm font-semibold transition-all duration-300 shadow-md active:scale-98 cursor-pointer"
                >
                  <span>View Full Journey Page</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
