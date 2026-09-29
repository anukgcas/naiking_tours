import React, { useState } from 'react';
import {
  X,
  Sparkles,
  Calendar,
  Users,
  Compass,
  Palmtree,
  Mountain,
  Crown,
  Heart,
  Trees,
  Landmark,
  Check,
} from 'lucide-react';
import { TripStyle, TripBooking } from '../types';

interface PlanTripModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTripBuilt: (trip: TripBooking) => void;
}

const TRIP_STYLES: { id: TripStyle; label: string; icon: React.ReactNode; desc: string }[] = [
  { id: 'Beach', label: 'Beach', icon: <Palmtree className="w-4 h-4" />, desc: 'Turquoise lagoons & quiet shores' },
  { id: 'Adventure', label: 'Adventure', icon: <Mountain className="w-4 h-4" />, desc: 'Alpine trails & high expeditions' },
  { id: 'Luxury', label: 'Luxury', icon: <Crown className="w-4 h-4" />, desc: '5-star boutique & private butlers' },
  { id: 'Family', label: 'Family', icon: <Users className="w-4 h-4" />, desc: 'Spacious villas & tailored pace' },
  { id: 'Romantic', label: 'Romantic', icon: <Heart className="w-4 h-4" />, desc: 'Secluded retreats & candlelit dining' },
  { id: 'Nature', label: 'Nature', icon: <Trees className="w-4 h-4" />, desc: 'Rainforests & mountain valleys' },
  { id: 'Culture', label: 'Culture', icon: <Landmark className="w-4 h-4" />, desc: 'Heritage estates & artisan crafts' },
];

export const PlanTripModal: React.FC<PlanTripModalProps> = ({
  isOpen,
  onClose,
  onTripBuilt,
}) => {
  if (!isOpen) return null;

  const [destination, setDestination] = useState('Bali, Indonesia');
  const [checkIn, setCheckIn] = useState('2026-11-20');
  const [checkOut, setCheckOut] = useState('2026-11-25');
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);
  const [budgetPerPerson, setBudgetPerPerson] = useState(35000);
  const [tripStyle, setTripStyle] = useState<TripStyle>('Romantic');
  const [isSuccess, setIsSuccess] = useState(false);

  // Calculate day difference
  const calculateDays = () => {
    const d1 = new Date(checkIn);
    const d2 = new Date(checkOut);
    const diffTime = Math.abs(d2.getTime() - d1.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(1, diffDays);
  };

  const daysCount = calculateDays();
  const nightsCount = Math.max(1, daysCount - 1);
  const totalEstimatedBudget = budgetPerPerson * adults + budgetPerPerson * 0.5 * children;

  const handleBuildTrip = (e: React.FormEvent) => {
    e.preventDefault();

    const newTrip: TripBooking = {
      id: `NT-${Math.floor(1000 + Math.random() * 9000)}`,
      destination: destination.split(',')[0].trim(),
      packageName: `Custom ${tripStyle} Journey in ${destination.split(',')[0].trim()}`,
      startDate: new Date(checkIn).toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      }),
      endDate: new Date(checkOut).toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      }),
      travellers: {
        adults,
        children,
      },
      totalPrice: totalEstimatedBudget,
      status: 'Preparing',
      bookingDate: 'Today',
      image: '/images/hero_bali_luxury_1790674276055.jpg',
      tripStyle,
    };

    setIsSuccess(true);
    setTimeout(() => {
      onTripBuilt(newTrip);
      setIsSuccess(false);
      onClose();
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl bg-[#FAF8F5] rounded-3xl shadow-2xl border border-white/20 overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 bg-white border-b border-[#1E2022]/8 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#C2571A]/10 flex items-center justify-center text-[#C2571A]">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#1E2022]">Bespoke Trip Planner</h2>
              <p className="text-xs text-[#6B7280]">
                Design your private customized travel itinerary with concierge pricing.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-black/5 text-[#1E2022] transition-colors cursor-pointer"
            aria-label="Close trip planner"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleBuildTrip} className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* Destination */}
          <div>
            <label
              htmlFor="planner-destination"
              className="block text-xs font-bold text-[#1E2022] uppercase tracking-wider mb-1.5"
            >
              Destination
            </label>
            <div className="relative">
              <Compass className="w-4 h-4 text-[#C2571A] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <select
                id="planner-destination"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 text-sm font-semibold rounded-xl bg-white border border-[#1E2022]/10 focus:outline-none focus:ring-2 focus:ring-[#C2571A]/30 text-[#1E2022]"
              >
                <option value="Bali, Indonesia">Bali, Indonesia</option>
                <option value="Dubai, UAE">Dubai, UAE</option>
                <option value="Maldives, Atolls">Maldives</option>
                <option value="Goa, India">Goa, India</option>
                <option value="Manali, Himachal">Manali, Himachal</option>
                <option value="Singapore">Singapore</option>
                <option value="Kyoto, Japan">Kyoto, Japan</option>
                <option value="Amalfi Coast, Italy">Amalfi Coast, Italy</option>
              </select>
            </div>
          </div>

          {/* Dates & Travellers */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Check-in */}
            <div>
              <label
                htmlFor="planner-checkin"
                className="block text-xs font-bold text-[#1E2022] uppercase tracking-wider mb-1.5"
              >
                Check-in
              </label>
              <div className="relative">
                <Calendar className="w-4 h-4 text-[#6B7280] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  id="planner-checkin"
                  type="date"
                  value={checkIn}
                  onChange={(e) => setCheckIn(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 text-xs sm:text-sm font-semibold rounded-xl bg-white border border-[#1E2022]/10 focus:outline-none text-[#1E2022]"
                />
              </div>
            </div>

            {/* Check-out */}
            <div>
              <label
                htmlFor="planner-checkout"
                className="block text-xs font-bold text-[#1E2022] uppercase tracking-wider mb-1.5"
              >
                Check-out
              </label>
              <div className="relative">
                <Calendar className="w-4 h-4 text-[#6B7280] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  id="planner-checkout"
                  type="date"
                  value={checkOut}
                  onChange={(e) => setCheckOut(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 text-xs sm:text-sm font-semibold rounded-xl bg-white border border-[#1E2022]/10 focus:outline-none text-[#1E2022]"
                />
              </div>
            </div>

            {/* Travellers */}
            <div>
              <span className="block text-xs font-bold text-[#1E2022] uppercase tracking-wider mb-1.5">
                Travellers
              </span>
              <div className="flex items-center gap-2 p-1.5 bg-white rounded-xl border border-[#1E2022]/10">
                <div className="flex-1 flex items-center justify-between px-2">
                  <span className="text-xs text-[#6B7280]">{adults}A, {children}C</span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      disabled={adults <= 1}
                      onClick={() => setAdults((a) => Math.max(1, a - 1))}
                      className="w-6 h-6 rounded bg-[#FAF8F5] text-xs font-bold disabled:opacity-40"
                    >
                      -
                    </button>
                    <button
                      type="button"
                      onClick={() => setAdults((a) => a + 1)}
                      className="w-6 h-6 rounded bg-[#FAF8F5] text-xs font-bold"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Trip Styles Selection */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-[#1E2022] uppercase tracking-wider">
                Select Trip Style
              </span>
              <span className="text-xs text-[#C2571A] font-semibold">{tripStyle}</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {TRIP_STYLES.map((style) => (
                <button
                  key={style.id}
                  type="button"
                  onClick={() => setTripStyle(style.id)}
                  className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                    tripStyle === style.id
                      ? 'bg-white border-[#C2571A] shadow-sm ring-1 ring-[#C2571A]'
                      : 'bg-white/60 border-black/5 hover:bg-white hover:border-[#1E2022]/15'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                        tripStyle === style.id
                          ? 'bg-[#C2571A] text-white'
                          : 'bg-[#1E2022]/5 text-[#1E2022]'
                      }`}
                    >
                      {style.icon}
                    </div>
                    {tripStyle === style.id && (
                      <Check className="w-3.5 h-3.5 text-[#C2571A]" />
                    )}
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-[#1E2022]">{style.label}</h5>
                    <p className="text-[10px] text-[#6B7280] line-clamp-1">{style.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Budget Range Slider */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-bold text-[#1E2022] uppercase tracking-wider">
                Target Budget Per Guest
              </span>
              <span className="text-sm font-bold text-[#1E2022]">
                ₹{budgetPerPerson.toLocaleString('en-IN')}
              </span>
            </div>
            <input
              type="range"
              min="15000"
              max="150000"
              step="5000"
              value={budgetPerPerson}
              onChange={(e) => setBudgetPerPerson(Number(e.target.value))}
              className="w-full accent-[#C2571A] cursor-pointer"
            />
            <div className="flex justify-between text-[11px] text-[#9CA3AF] mt-1">
              <span>₹15,000 (Comfort)</span>
              <span>₹75,000 (Signature)</span>
              <span>₹1,50,000+ (Ultra Luxury)</span>
            </div>
          </div>

          {/* Clean Trip Summary & Estimated Budget Box */}
          <div className="p-4 rounded-2xl bg-white border border-[#1E2022]/8 space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#9CA3AF] block">
              Trip Proposal Summary
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <div>
                <span className="text-[#6B7280] block">Destination</span>
                <span className="font-semibold text-[#1E2022]">{destination.split(',')[0]}</span>
              </div>
              <div>
                <span className="text-[#6B7280] block">Pacing</span>
                <span className="font-semibold text-[#1E2022]">
                  {daysCount} Days / {nightsCount} Nights
                </span>
              </div>
              <div>
                <span className="text-[#6B7280] block">Atmosphere</span>
                <span className="font-semibold text-[#1E2022]">{tripStyle}</span>
              </div>
              <div>
                <span className="text-[#6B7280] block">Estimated Total</span>
                <span className="font-bold text-[#C2571A]">
                  ₹{totalEstimatedBudget.toLocaleString('en-IN')}
                </span>
              </div>
            </div>
          </div>

          {/* Primary CTA */}
          <button
            type="submit"
            className="w-full py-3.5 rounded-full bg-[#1E2022] hover:bg-[#C2571A] text-white font-semibold text-sm transition-all duration-300 shadow-md active:scale-98 cursor-pointer flex items-center justify-center gap-2"
          >
            {isSuccess ? (
              <span>✓ Itinerary Created! Adding to My Trips...</span>
            ) : (
              <>
                <span>Build My Trip</span>
                <span>→</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
