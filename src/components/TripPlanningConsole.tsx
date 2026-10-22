import React, { useState, useRef, useEffect } from 'react';
import {
  MapPin,
  Calendar,
  Users,
  SlidersHorizontal,
  ArrowRight,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Check,
  Plus,
  Minus,
  Sparkles,
  Palmtree,
  Camera,
  Landmark,
  Mountain,
  UtensilsCrossed,
  Flower2,
  Clock,
  BedDouble,
  RotateCcw,
} from 'lucide-react';
import { ActivityCategory, TravellerType, TripDraft } from '../types';
import {
  addDaysISO,
  todayISO,
  formatDate,
} from '../data/planner';
import { useTrip } from '../context/TripContext';

interface TripPlanningConsoleProps {
  onStartPlanning?: (draftPatch: Partial<TripDraft>, initialStep?: number) => void;
  onExploreDestination?: (destName: string) => void;
  onCraftItinerary?: () => void;
}

const DESTINATION_OPTIONS = [
  { id: 'bali', name: 'Bali', country: 'Indonesia', tag: 'Tropical & Cultural', image: '/images/hero_bali_luxury_1790674276055.jpg' },
  { id: 'maldives', name: 'Maldives', country: 'Indian Ocean', tag: 'Overwater Sanctuary', image: '/images/dest_maldives_1790674294175.jpg' },
  { id: 'dubai', name: 'Dubai', country: 'UAE', tag: 'Skyline & Desert Oasis', image: '/images/dest_dubai_1790674315094.jpg' },
  { id: 'manali', name: 'Manali', country: 'Himachal, India', tag: 'Alpine Cedar & Peaks', image: '/images/dest_manali_1790674332732.jpg' },
  { id: 'goa', name: 'Goa', country: 'India', tag: 'Heritage & Coast', image: '/images/dest_goa_1790674366139.jpg' },
  { id: 'singapore', name: 'Singapore', country: 'Southeast Asia', tag: 'Skyline & Michelin Cuisine', image: '/images/dest_singapore_1790674346843.jpg' },
];

const NIGHT_PRESETS = [
  { nights: 3, label: '3 Nights', sub: 'Quick Escape' },
  { nights: 5, label: '5 Nights', sub: 'Signature' },
  { nights: 7, label: '7 Nights', sub: 'Grand Journey' },
  { nights: 10, label: '10 Nights', sub: 'Immersive' },
];

const TIMING_PRESETS = [
  { label: 'Upcoming Month', hint: 'Best seasonal weather' },
  { label: 'Festive Season', hint: 'Special culinary & cultural events' },
  { label: 'Serene Shoulder Season', hint: 'Unhurried and quieter sanctuaries' },
];

const INTEREST_OPTIONS: { id: ActivityCategory; label: string; icon: React.ReactNode }[] = [
  { id: 'Leisure', label: 'Beach & Chill', icon: <Palmtree className="w-3.5 h-3.5" /> },
  { id: 'Sightseeing', label: 'Iconic Sights', icon: <Camera className="w-3.5 h-3.5" /> },
  { id: 'Culture', label: 'Heritage & Art', icon: <Landmark className="w-3.5 h-3.5" /> },
  { id: 'Adventure', label: 'Outdoor Thrills', icon: <Mountain className="w-3.5 h-3.5" /> },
  { id: 'Food', label: 'Gourmet Dining', icon: <UtensilsCrossed className="w-3.5 h-3.5" /> },
  { id: 'Wellness', label: 'Spa & Wellness', icon: <Flower2 className="w-3.5 h-3.5" /> },
];

const STAY_TIER_OPTIONS: { tier: 0 | 1 | 2; label: string; desc: string }[] = [
  { tier: 0, label: 'Comfort', desc: 'Curated 4★ boutique stays' },
  { tier: 1, label: 'Signature', desc: '5★ luxury villas & beach resorts' },
  { tier: 2, label: 'Ultra Luxury', desc: 'Private pool pavilions & butler service' },
];

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const DAY_LABELS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

export const TripPlanningConsole: React.FC<TripPlanningConsoleProps> = ({
  onStartPlanning,
  onExploreDestination,
  onCraftItinerary,
}) => {
  const today = todayISO();
  const {
    destinationId: selectedDestId,
    durationNights,
    timingPreference,
    departureDate,
    rooms,
    adults,
    children,
    interests: selectedInterests,
    stayTier: selectedStayTier,
    setDestinationId: setSelectedDestId,
    setDurationNights,
    setTimingPreference,
    setDepartureDate,
    setRooms,
    setAdults,
    setChildren,
    setInterests: setSelectedInterests,
    setStayTier: setSelectedStayTier,
    craftItinerary,
  } = useTrip();

  // Calendar month/year navigation state
  const departureDateObj = new Date(departureDate + 'T00:00:00');
  const [calMonth, setCalMonth] = useState<number>(() =>
    isNaN(departureDateObj.getTime()) ? new Date().getMonth() : departureDateObj.getMonth()
  );
  const [calYear, setCalYear] = useState<number>(() =>
    isNaN(departureDateObj.getTime()) ? new Date().getFullYear() : departureDateObj.getFullYear()
  );

  useEffect(() => {
    if (departureDate) {
      const d = new Date(departureDate + 'T00:00:00');
      if (!isNaN(d.getTime())) {
        setCalMonth(d.getMonth());
        setCalYear(d.getFullYear());
      }
    }
  }, [departureDate]);

  const [validationError, setValidationError] = useState<string | null>(null);

  // Active popup: 'dest' | 'duration' | 'departure' | 'guests' | 'filters' | null
  const [activePopup, setActivePopup] = useState<
    'dest' | 'duration' | 'departure' | 'guests' | 'filters' | null
  >(null);

  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click or Escape key
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setActivePopup(null);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setActivePopup(null);
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const selectedDest = DESTINATION_OPTIONS.find((d) => d.id === selectedDestId) || DESTINATION_OPTIONS[0];

  // Calendar helpers
  const todayDateObj = new Date(today + 'T00:00:00');
  const isPastMonth =
    calYear < todayDateObj.getFullYear() ||
    (calYear === todayDateObj.getFullYear() && calMonth <= todayDateObj.getMonth());

  const handlePrevMonth = () => {
    if (isPastMonth) return;
    if (calMonth === 0) {
      setCalMonth(11);
      setCalYear((y) => y - 1);
    } else {
      setCalMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (calMonth === 11) {
      setCalMonth(0);
      setCalYear((y) => y + 1);
    } else {
      setCalMonth((m) => m + 1);
    }
  };

  const daysInCurrentMonth = new Date(calYear, calMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(calYear, calMonth, 1).getDay();

  const handleSelectDate = (day: number) => {
    const mm = String(calMonth + 1).padStart(2, '0');
    const dd = String(day).padStart(2, '0');
    const iso = `${calYear}-${mm}-${dd}`;
    if (iso < today) return;
    setDepartureDate(iso);
    setActivePopup(null);
  };

  const handleSelectDeparturePreset = (daysAhead: number) => {
    const targetIso = addDaysISO(today, daysAhead);
    setDepartureDate(targetIso);
    const d = new Date(targetIso + 'T00:00:00');
    setCalMonth(d.getMonth());
    setCalYear(d.getFullYear());
    setActivePopup(null);
  };


  const toggleInterest = (category: ActivityCategory) => {
    const next = selectedInterests.includes(category)
      ? selectedInterests.filter((c) => c !== category)
      : [...selectedInterests, category];
    setSelectedInterests(next);
  };

  const clearFilters = () => {
    setSelectedInterests([]);
    setSelectedStayTier(1);
  };

  const formatSummaryDate = (iso: string) => {
    try {
      return formatDate(iso);
    } catch {
      return iso;
    }
  };

  // Derive summary strings
  const durationSummary = `${durationNights} Nights`;
  const guestSummary = `${rooms} ${rooms === 1 ? 'Room' : 'Rooms'} · ${adults} ${adults === 1 ? 'Adult' : 'Adults'}${
    children > 0 ? `, ${children} ${children === 1 ? 'Child' : 'Children'}` : ''
  }`;
  
  const filterSummary =
    selectedInterests.length > 0
      ? `${selectedInterests.slice(0, 1).join(', ')}${
          selectedInterests.length > 1 ? ` +${selectedInterests.length - 1}` : ''
        }`
      : selectedStayTier !== 1
      ? STAY_TIER_OPTIONS.find((t) => t.tier === selectedStayTier)?.label || 'Filters'
      : 'Select Filters';

  const handleLaunchPlanning = () => {
    const res = craftItinerary();
    if (!res.success) {
      setValidationError(res.error || 'Please check your trip details.');
      setTimeout(() => setValidationError(null), 4000);
      return;
    }
    setValidationError(null);
    if (onCraftItinerary) {
      onCraftItinerary();
    } else if (onStartPlanning) {
      const checkIn = departureDate || addDaysISO(today, 30);
      const checkOut = addDaysISO(checkIn, durationNights);
      const travellerType: TravellerType =
        adults === 1 && children === 0
          ? 'solo'
          : adults === 2 && children === 0 && rooms === 1
          ? 'couple'
          : children > 0
          ? 'family'
          : 'friends';

      onStartPlanning({
        destinationId: selectedDestId,
        aiDestination: false,
        travellerType,
        adults,
        children,
        rooms,
        checkIn,
        checkOut,
        interests: selectedInterests.length > 0 ? selectedInterests : ['Leisure', 'Sightseeing'],
        stayTier: selectedStayTier,
        aiPlan: true,
      }, 3);
    }
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full max-w-6xl mx-auto z-30"
      aria-label="MakeMyTrip inspired holiday planning console"
    >
      <div className="bg-[#14110F]/85 backdrop-blur-xl border border-white/20 rounded-3xl p-4 sm:p-6 shadow-[0_24px_50px_-16px_rgba(0,0,0,0.7)] text-white">
        {/* Top Header Label */}
        <div className="flex items-center justify-between pb-3.5 mb-4 border-b border-white/10">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#FFB27A] animate-pulse" />
            <span className="text-xs sm:text-sm font-semibold tracking-wider text-[#FFB27A] uppercase">
              Holiday Packages & Customiser
            </span>
          </div>
          <span className="text-xs text-white/60 hidden sm:inline">
            Directly seeds your bespoke itinerary
          </span>
        </div>

        {/* 5 Logical Fields Row (Desktop: 5 columns, Tablet: 2/3 cols, Mobile: stacked) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5 sm:gap-3">
          {/* FIELD 1: DESTINATION */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setActivePopup(activePopup === 'dest' ? null : 'dest')}
              aria-expanded={activePopup === 'dest'}
              aria-haspopup="dialog"
              className={`w-full text-left p-3 rounded-2xl border transition-all duration-200 cursor-pointer flex flex-col justify-between h-[84px] ${
                activePopup === 'dest'
                  ? 'bg-white/20 border-[#FFB27A] shadow-[0_0_15px_rgba(255,178,122,0.2)]'
                  : 'bg-white/10 border-white/15 hover:bg-white/15 hover:border-white/25'
              }`}
            >
              <span className="text-[11px] font-bold uppercase tracking-wider text-white/60 flex items-center justify-between">
                <span>Destination</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${activePopup === 'dest' ? 'rotate-180' : ''}`} />
              </span>
              <div className="flex items-center gap-2 mt-1 truncate">
                <MapPin className="w-4 h-4 text-[#FFB27A] shrink-0" />
                <div className="min-w-0 truncate">
                  <div className="text-sm font-semibold text-white truncate leading-tight">
                    {selectedDest.name}
                  </div>
                  <div className="text-[11px] text-white/60 truncate leading-tight">
                    {selectedDest.country}
                  </div>
                </div>
              </div>
            </button>

            {/* Destination Popover */}
            {activePopup === 'dest' && (
              <div className="absolute top-[92px] left-0 sm:left-auto right-0 sm:w-[320px] bg-[#1E2022] border border-white/20 rounded-2xl p-3 shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-150">
                <p className="text-[11px] font-bold uppercase tracking-wider text-[#FFB27A] px-2 py-1">
                  Select Destination
                </p>
                <div className="space-y-1 mt-1 max-h-[260px] overflow-y-auto">
                  {DESTINATION_OPTIONS.map((dest) => (
                    <button
                      key={dest.id}
                      type="button"
                      onClick={() => {
                        setSelectedDestId(dest.id);
                        setActivePopup(null);
                      }}
                      className={`w-full flex items-center gap-3 p-2 rounded-xl text-left transition-colors cursor-pointer ${
                        selectedDestId === dest.id
                          ? 'bg-white/15 text-white font-medium'
                          : 'text-white/80 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      <img
                        src={dest.image}
                        alt=""
                        className="w-9 h-9 rounded-lg object-cover shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-semibold truncate">{dest.name}</div>
                        <div className="text-[11px] text-white/50 truncate">{dest.country} • {dest.tag}</div>
                      </div>
                      {selectedDestId === dest.id && (
                        <Check className="w-4 h-4 text-[#FFB27A] shrink-0" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* FIELD 2: WHEN & DURATION */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setActivePopup(activePopup === 'duration' ? null : 'duration')}
              aria-expanded={activePopup === 'duration'}
              aria-haspopup="dialog"
              className={`w-full text-left p-3 rounded-2xl border transition-all duration-200 cursor-pointer flex flex-col justify-between h-[84px] ${
                activePopup === 'duration'
                  ? 'bg-white/20 border-[#FFB27A] shadow-[0_0_15px_rgba(255,178,122,0.2)]'
                  : 'bg-white/10 border-white/15 hover:bg-white/15 hover:border-white/25'
              }`}
            >
              <span className="text-[11px] font-bold uppercase tracking-wider text-white/60 flex items-center justify-between">
                <span>When & Duration</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${activePopup === 'duration' ? 'rotate-180' : ''}`} />
              </span>
              <div className="flex items-center gap-2 mt-1 truncate">
                <Clock className="w-4 h-4 text-[#FFB27A] shrink-0" />
                <div className="min-w-0 truncate">
                  <div className="text-sm font-semibold text-white truncate leading-tight">
                    {durationSummary}
                  </div>
                  <div className="text-[11px] text-white/60 truncate leading-tight">
                    {NIGHT_PRESETS.find((p) => p.nights === durationNights)?.sub || timingPreference}
                  </div>
                </div>
              </div>
            </button>

            {/* When & Duration Popover */}
            {activePopup === 'duration' && (
              <div className="absolute top-[92px] left-0 sm:left-auto right-0 sm:w-[320px] bg-[#1E2022] border border-white/20 rounded-2xl p-4 shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-150">
                <p className="text-[11px] font-bold uppercase tracking-wider text-[#FFB27A] mb-2">
                  Trip Duration
                </p>
                <div className="grid grid-cols-2 gap-2 mb-4">
                  {NIGHT_PRESETS.map((p) => (
                    <button
                      key={p.nights}
                      type="button"
                      onClick={() => setDurationNights(p.nights)}
                      className={`p-2 rounded-xl text-left border transition-all cursor-pointer ${
                        durationNights === p.nights
                          ? 'bg-[#C2571A] border-[#C2571A] text-white'
                          : 'bg-white/5 border-white/10 text-white/80 hover:bg-white/10'
                      }`}
                    >
                      <div className="text-xs font-bold">{p.label}</div>
                      <div className="text-[10px] opacity-75">{p.sub}</div>
                    </button>
                  ))}
                </div>

                <div className="pt-3 border-t border-white/10">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-[#FFB27A] mb-2">
                    Timing Preference
                  </p>
                  <div className="space-y-1.5">
                    {TIMING_PRESETS.map((t) => (
                      <button
                        key={t.label}
                        type="button"
                        onClick={() => {
                          setTimingPreference(t.label);
                          setActivePopup(null);
                        }}
                        className={`w-full px-3 py-1.5 rounded-lg text-xs font-medium text-left flex items-center justify-between cursor-pointer ${
                          timingPreference === t.label
                            ? 'bg-white/20 text-white'
                            : 'text-white/70 hover:bg-white/10 hover:text-white'
                        }`}
                      >
                        <div>
                          <div>{t.label}</div>
                          <div className="text-[10px] text-white/50">{t.hint}</div>
                        </div>
                        {timingPreference === t.label && <Check className="w-3.5 h-3.5 text-[#FFB27A]" />}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* FIELD 3: DEPARTURE DATE (New Dedicated Calendar Picker) */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setActivePopup(activePopup === 'departure' ? null : 'departure')}
              aria-expanded={activePopup === 'departure'}
              aria-haspopup="dialog"
              className={`w-full text-left p-3 rounded-2xl border transition-all duration-200 cursor-pointer flex flex-col justify-between h-[84px] ${
                activePopup === 'departure'
                  ? 'bg-white/20 border-[#FFB27A] shadow-[0_0_15px_rgba(255,178,122,0.2)]'
                  : 'bg-white/10 border-white/15 hover:bg-white/15 hover:border-white/25'
              }`}
            >
              <span className="text-[11px] font-bold uppercase tracking-wider text-white/60 flex items-center justify-between">
                <span>Departure Date</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${activePopup === 'departure' ? 'rotate-180' : ''}`} />
              </span>
              <div className="flex items-center gap-2 mt-1 truncate">
                <Calendar className="w-4 h-4 text-[#FFB27A] shrink-0" />
                <div className="min-w-0 truncate">
                  <div className="text-sm font-semibold text-white truncate leading-tight">
                    {formatSummaryDate(departureDate)}
                  </div>
                  <div className="text-[11px] text-white/60 truncate leading-tight">
                    Specific start date
                  </div>
                </div>
              </div>
            </button>

            {/* Departure Date Calendar Popover */}
            {activePopup === 'departure' && (
              <div className="absolute top-[92px] left-0 sm:left-auto right-0 sm:w-[330px] bg-[#1E2022] border border-white/20 rounded-2xl p-4 shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-150">
                {/* Month/Year Header */}
                <div className="flex items-center justify-between mb-3">
                  <button
                    type="button"
                    onClick={handlePrevMonth}
                    disabled={isPastMonth}
                    className="p-1 rounded-lg hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer"
                    aria-label="Previous month"
                  >
                    <ChevronLeft className="w-4 h-4 text-white" />
                  </button>
                  <span className="text-sm font-bold text-white">
                    {MONTH_NAMES[calMonth]} {calYear}
                  </span>
                  <button
                    type="button"
                    onClick={handleNextMonth}
                    className="p-1 rounded-lg hover:bg-white/10 cursor-pointer"
                    aria-label="Next month"
                  >
                    <ChevronRight className="w-4 h-4 text-white" />
                  </button>
                </div>

                {/* Day Labels */}
                <div className="grid grid-cols-7 gap-1 text-center mb-1">
                  {DAY_LABELS.map((d) => (
                    <span key={d} className="text-[10px] font-semibold text-white/50">
                      {d}
                    </span>
                  ))}
                </div>

                {/* Days Grid */}
                <div className="grid grid-cols-7 gap-1 text-center">
                  {/* Empty offset padding for first day */}
                  {Array.from({ length: firstDayOfWeek }).map((_, i) => (
                    <div key={`empty-${i}`} className="h-8" />
                  ))}

                  {Array.from({ length: daysInCurrentMonth }).map((_, i) => {
                    const day = i + 1;
                    const mm = String(calMonth + 1).padStart(2, '0');
                    const dd = String(day).padStart(2, '0');
                    const cellIso = `${calYear}-${mm}-${dd}`;
                    const isPast = cellIso < today;
                    const isSelected = cellIso === departureDate;

                    return (
                      <button
                        key={day}
                        type="button"
                        disabled={isPast}
                        onClick={() => handleSelectDate(day)}
                        className={`h-8 w-8 mx-auto rounded-full text-xs font-medium flex items-center justify-center transition-colors cursor-pointer ${
                          isSelected
                            ? 'bg-[#C2571A] text-white font-bold shadow-sm'
                            : isPast
                            ? 'text-white/20 cursor-not-allowed'
                            : 'text-white/90 hover:bg-white/15'
                        }`}
                      >
                        {day}
                      </button>
                    );
                  })}
                </div>

                {/* Quick Shortcuts */}
                <div className="mt-3 pt-3 border-t border-white/10">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-white/50 mb-1.5">
                    Quick Departure
                  </p>
                  <div className="flex gap-1.5">
                    {[
                      { label: '2 Weeks', days: 14 },
                      { label: '1 Month', days: 30 },
                      { label: '2 Months', days: 60 },
                    ].map((s) => (
                      <button
                        key={s.label}
                        type="button"
                        onClick={() => handleSelectDeparturePreset(s.days)}
                        className="flex-1 py-1 px-2 rounded-lg bg-white/5 hover:bg-white/15 border border-white/10 text-[11px] font-medium text-white/80 transition-colors cursor-pointer"
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* FIELD 4: ROOMS & GUESTS (MakeMyTrip Inspired) */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setActivePopup(activePopup === 'guests' ? null : 'guests')}
              aria-expanded={activePopup === 'guests'}
              aria-haspopup="dialog"
              className={`w-full text-left p-3 rounded-2xl border transition-all duration-200 cursor-pointer flex flex-col justify-between h-[84px] ${
                activePopup === 'guests'
                  ? 'bg-white/20 border-[#FFB27A] shadow-[0_0_15px_rgba(255,178,122,0.2)]'
                  : 'bg-white/10 border-white/15 hover:bg-white/15 hover:border-white/25'
              }`}
            >
              <span className="text-[11px] font-bold uppercase tracking-wider text-white/60 flex items-center justify-between">
                <span>Rooms & Guests</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${activePopup === 'guests' ? 'rotate-180' : ''}`} />
              </span>
              <div className="flex items-center gap-2 mt-1 truncate">
                <Users className="w-4 h-4 text-[#FFB27A] shrink-0" />
                <div className="min-w-0 truncate">
                  <div className="text-sm font-semibold text-white truncate leading-tight">
                    {guestSummary}
                  </div>
                  <div className="text-[11px] text-white/60 truncate leading-tight">
                    Configuration
                  </div>
                </div>
              </div>
            </button>

            {/* Rooms & Guests Popover */}
            {activePopup === 'guests' && (
              <div className="absolute top-[92px] left-0 sm:left-auto right-0 sm:w-[330px] bg-[#1E2022] border border-white/20 rounded-2xl p-4 shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-150">
                <p className="text-[11px] font-bold uppercase tracking-wider text-[#FFB27A] mb-3">
                  Rooms & Guests
                </p>

                {/* Counters: Rooms, Adults, Children */}
                <div className="space-y-3.5">
                  {/* Rooms */}
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs font-semibold text-white">Rooms</div>
                      <div className="text-[10px] text-white/50">Private villas / suites</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setRooms(Math.max(1, rooms - 1))}
                        disabled={rooms <= 1}
                        className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 disabled:opacity-30 flex items-center justify-center cursor-pointer"
                        aria-label="Decrease rooms"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="w-6 text-center text-sm font-bold">{rooms}</span>
                      <button
                        type="button"
                        onClick={() => setRooms(Math.min(6, rooms + 1))}
                        className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center cursor-pointer"
                        aria-label="Increase rooms"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Adults */}
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs font-semibold text-white">Adults</div>
                      <div className="text-[10px] text-white/50">Age 12+</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setAdults(Math.max(1, adults - 1))}
                        disabled={adults <= 1}
                        className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 disabled:opacity-30 flex items-center justify-center cursor-pointer"
                        aria-label="Decrease adults"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="w-6 text-center text-sm font-bold">{adults}</span>
                      <button
                        type="button"
                        onClick={() => setAdults(Math.min(12, adults + 1))}
                        className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center cursor-pointer"
                        aria-label="Increase adults"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Children */}
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs font-semibold text-white">Children</div>
                      <div className="text-[10px] text-white/50">Age 2-11</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setChildren(Math.max(0, children - 1))}
                        disabled={children <= 0}
                        className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 disabled:opacity-30 flex items-center justify-center cursor-pointer"
                        aria-label="Decrease children"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="w-6 text-center text-sm font-bold">{children}</span>
                      <button
                        type="button"
                        onClick={() => setChildren(Math.min(6, children + 1))}
                        className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center cursor-pointer"
                        aria-label="Increase children"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-white/10 text-right">
                  <button
                    type="button"
                    onClick={() => setActivePopup(null)}
                    className="px-4 py-1.5 rounded-full bg-[#C2571A] hover:bg-[#E5501A] text-white text-xs font-semibold cursor-pointer"
                  >
                    Apply
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* FIELD 5: FILTERS (Travel Interests & Stay Tier) */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setActivePopup(activePopup === 'filters' ? null : 'filters')}
              aria-expanded={activePopup === 'filters'}
              aria-haspopup="dialog"
              className={`w-full text-left p-3 rounded-2xl border transition-all duration-200 cursor-pointer flex flex-col justify-between h-[84px] ${
                activePopup === 'filters'
                  ? 'bg-white/20 border-[#FFB27A] shadow-[0_0_15px_rgba(255,178,122,0.2)]'
                  : 'bg-white/10 border-white/15 hover:bg-white/15 hover:border-white/25'
              }`}
            >
              <span className="text-[11px] font-bold uppercase tracking-wider text-white/60 flex items-center justify-between">
                <span>Filters</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${activePopup === 'filters' ? 'rotate-180' : ''}`} />
              </span>
              <div className="flex items-center gap-2 mt-1 truncate">
                <SlidersHorizontal className="w-4 h-4 text-[#FFB27A] shrink-0" />
                <div className="min-w-0 truncate">
                  <div className="text-sm font-semibold text-white truncate leading-tight">
                    {filterSummary}
                  </div>
                  <div className="text-[11px] text-white/60 truncate leading-tight">
                    Vibe & Stay Tier
                  </div>
                </div>
              </div>
            </button>

            {/* Filters Popover */}
            {activePopup === 'filters' && (
              <div className="absolute top-[92px] right-0 sm:w-[340px] bg-[#1E2022] border border-white/20 rounded-2xl p-4 shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-[#FFB27A]">
                    Travel Vibe & Interests
                  </p>
                  {selectedInterests.length > 0 && (
                    <button
                      type="button"
                      onClick={clearFilters}
                      className="text-[11px] text-white/50 hover:text-white flex items-center gap-1 cursor-pointer"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Reset</span>
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2 mb-4">
                  {INTEREST_OPTIONS.map((item) => {
                    const isSelected = selectedInterests.includes(item.id);
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => toggleInterest(item.id)}
                        className={`p-2 rounded-xl text-left border flex items-center gap-2 transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-[#C2571A] border-[#C2571A] text-white font-medium'
                            : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10 hover:text-white'
                        }`}
                      >
                        <span className="shrink-0">{item.icon}</span>
                        <span className="text-xs truncate">{item.label}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Stay Tier Filter */}
                <div className="pt-3 border-t border-white/10">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-[#FFB27A] mb-2">
                    Accommodation Tier
                  </p>
                  <div className="space-y-1.5 mb-3">
                    {STAY_TIER_OPTIONS.map((t) => (
                      <button
                        key={t.tier}
                        type="button"
                        onClick={() => setSelectedStayTier(t.tier)}
                        className={`w-full p-2 rounded-xl text-left border flex items-center justify-between transition-colors cursor-pointer ${
                          selectedStayTier === t.tier
                            ? 'bg-white/15 border-[#FFB27A] text-white'
                            : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10 hover:text-white'
                        }`}
                      >
                        <div>
                          <div className="text-xs font-semibold">{t.label}</div>
                          <div className="text-[10px] text-white/50">{t.desc}</div>
                        </div>
                        {selectedStayTier === t.tier && <Check className="w-3.5 h-3.5 text-[#FFB27A]" />}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-2 border-t border-white/10 text-right">
                  <button
                    type="button"
                    onClick={() => setActivePopup(null)}
                    className="px-4 py-1.5 rounded-full bg-[#C2571A] hover:bg-[#E5501A] text-white text-xs font-semibold cursor-pointer"
                  >
                    Done
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {validationError && (
          <div className="mt-3 px-4 py-2.5 rounded-xl bg-red-500/20 border border-red-500/40 text-red-200 text-xs sm:text-sm font-medium animate-in fade-in duration-200">
            {validationError}
          </div>
        )}

        {/* Bottom Action Bar */}
        <div className="mt-4 pt-4 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Quick Destination Pills */}
          <div className="flex items-center gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden py-1">
            <span className="text-xs text-white/50 shrink-0 hidden md:inline">Popular:</span>
            {DESTINATION_OPTIONS.slice(0, 4).map((d) => (
              <button
                key={d.id}
                type="button"
                onClick={() => setSelectedDestId(d.id)}
                className={`text-xs px-2.5 py-1 rounded-full border transition-colors shrink-0 cursor-pointer ${
                  selectedDestId === d.id
                    ? 'bg-white/20 border-[#FFB27A] text-[#FFB27A]'
                    : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10 hover:text-white'
                }`}
              >
                {d.name}
              </button>
            ))}
          </div>

          {/* Primary CTA Button */}
          <button
            type="button"
            onClick={handleLaunchPlanning}
            className="group relative inline-flex items-center justify-center gap-2.5 px-6 sm:px-8 py-3.5 rounded-full bg-gradient-to-r from-[#F7931E] via-[#E5501A] to-[#C2571A] text-white font-semibold text-sm sm:text-base shadow-[0_10px_25px_-5px_rgba(229,80,26,0.6)] hover:brightness-110 active:scale-[0.98] transition-all duration-200 cursor-pointer shrink-0"
          >
            <Sparkles className="w-4 h-4 text-[#FAF8F5]" />
            <span>Craft My Itinerary</span>
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </button>
        </div>
      </div>
    </div>
  );
};
