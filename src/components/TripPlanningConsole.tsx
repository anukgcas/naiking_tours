import React, { useState, useRef, useEffect } from 'react';
import {
  MapPin,
  Calendar,
  CalendarCheck,
  Users,
  ArrowRight,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Check,
  Plus,
  Minus,
  Sparkles,
  BedDouble,
} from 'lucide-react';
import { TravellerType, TripDraft } from '../types';
import {
  addDaysISO,
  todayISO,
  formatDate,
  nightsBetween,
  MAX_TRIP_DAYS,
} from '../data/planner';
import { useTrip } from '../context/TripContext';

interface TripPlanningConsoleProps {
  onStartPlanning?: (draftPatch: Partial<TripDraft>, initialStep?: number) => void;
  onExploreDestination?: (destName: string) => void;
  onCraftItinerary?: () => void;
  /** Open with the current trip already filled in, e.g. when editing an existing plan. */
  prefill?: boolean;
}

const DESTINATION_OPTIONS = [
  { id: 'bali', name: 'Bali', country: 'Indonesia', tag: 'Tropical & Cultural', image: '/images/hero_bali_luxury_1790674276055.jpg' },
  { id: 'maldives', name: 'Maldives', country: 'Indian Ocean', tag: 'Overwater Sanctuary', image: '/images/dest_maldives_1790674294175.jpg' },
  { id: 'dubai', name: 'Dubai', country: 'UAE', tag: 'Skyline & Desert Oasis', image: '/images/dest_dubai_1790674315094.jpg' },
  { id: 'manali', name: 'Manali', country: 'Himachal, India', tag: 'Alpine Cedar & Peaks', image: '/images/dest_manali_1790674332732.jpg' },
  { id: 'goa', name: 'Goa', country: 'India', tag: 'Heritage & Coast', image: '/images/dest_goa_1790674366139.jpg' },
  { id: 'singapore', name: 'Singapore', country: 'Southeast Asia', tag: 'Skyline & Michelin Cuisine', image: '/images/dest_singapore_1790674346843.jpg' },
];

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const DAY_LABELS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

// Guest categories: adults 12+, children 6-12, infants under 6, rooms 0-10
const MAX_ADULTS = 12;
const MAX_CHILDREN = 8;
const MAX_INFANTS = 4;
const MAX_ROOMS = 10;

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

// Shared glass styling
const FIELD_IDLE =
  'bg-white/75 backdrop-blur-md border-[#1E2022]/15 shadow-2xs hover:bg-white/95 hover:border-[#C2571A]/40';
const FIELD_OPEN = 'bg-white border-[#C2571A] shadow-[0_0_0_3px_rgba(194,87,26,0.18)]';
const POPOVER =
  'absolute top-[92px] bg-white/95 backdrop-blur-2xl backdrop-saturate-150 border border-white/70 ring-1 ring-inset ring-white/40 rounded-2xl p-4 shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-150';
const STEP_BTN =
  'w-7 h-7 rounded-full bg-[#1E2022]/6 hover:bg-[#1E2022]/8 disabled:opacity-30 flex items-center justify-center cursor-pointer';

type Popup = 'dest' | 'start' | 'end' | 'guests' | null;
type PickKey = 'dest' | 'start' | 'end' | 'guests';

// ---------- calendar ----------

interface CalendarProps {
  month: number;
  year: number;
  onMonthChange: (month: number, year: number) => void;
  /** Earliest month that can be navigated to (ISO date inside it). */
  minIso: string;
  isDisabled: (iso: string) => boolean;
  selectedIso: string | null;
  /** Optional highlighted span (exclusive) shown behind the selected day. */
  rangeFrom?: string | null;
  rangeTo?: string | null;
  onSelect: (iso: string) => void;
  footer?: React.ReactNode;
}

const CalendarGrid: React.FC<CalendarProps> = ({
  month,
  year,
  onMonthChange,
  minIso,
  isDisabled,
  selectedIso,
  rangeFrom,
  rangeTo,
  onSelect,
  footer,
}) => {
  const minDate = new Date(minIso + 'T00:00:00');
  const atMin = year < minDate.getFullYear() || (year === minDate.getFullYear() && month <= minDate.getMonth());
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDow = new Date(year, month, 1).getDay();

  const prev = () => {
    if (atMin) return;
    if (month === 0) onMonthChange(11, year - 1);
    else onMonthChange(month - 1, year);
  };
  const next = () => {
    if (month === 11) onMonthChange(0, year + 1);
    else onMonthChange(month + 1, year);
  };

  return (
    <>
      <div className="flex items-center justify-between mb-3">
        <button
          type="button"
          onClick={prev}
          disabled={atMin}
          className="p-1 rounded-lg hover:bg-[#1E2022]/8 disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer"
          aria-label="Previous month"
        >
          <ChevronLeft className="w-4 h-4 text-[#1E2022]" />
        </button>
        <span className="text-sm font-bold text-[#1E2022]">
          {MONTH_NAMES[month]} {year}
        </span>
        <button
          type="button"
          onClick={next}
          className="p-1 rounded-lg hover:bg-[#1E2022]/8 cursor-pointer"
          aria-label="Next month"
        >
          <ChevronRight className="w-4 h-4 text-[#1E2022]" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center mb-1">
        {DAY_LABELS.map((d) => (
          <span key={d} className="text-[10px] font-semibold text-[#6B7280]">
            {d}
          </span>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1 text-center">
        {Array.from({ length: firstDow }).map((_, i) => (
          <div key={`empty-${i}`} className="h-8" />
        ))}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const iso = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const disabled = isDisabled(iso);
          const selected = selectedIso === iso;
          const inRange = !!rangeFrom && !!rangeTo && iso > rangeFrom && iso < rangeTo;
          return (
            <button
              key={day}
              type="button"
              disabled={disabled}
              onClick={() => onSelect(iso)}
              className={`h-8 w-8 mx-auto rounded-full text-xs font-medium flex items-center justify-center transition-colors cursor-pointer ${
                selected
                  ? 'bg-[#C2571A] text-white font-bold shadow-sm'
                  : disabled
                  ? 'text-[#1E2022]/25 cursor-not-allowed'
                  : inRange
                  ? 'bg-[#1F9EA3]/15 text-[#1E2022]'
                  : 'text-[#1E2022] hover:bg-[#1E2022]/8'
              }`}
            >
              {day}
            </button>
          );
        })}
      </div>
      {footer}
    </>
  );
};

const monthOf = (iso: string) => {
  const d = new Date(iso + 'T00:00:00');
  return { month: d.getMonth(), year: d.getFullYear() };
};

// ---------- console ----------

export const TripPlanningConsole: React.FC<TripPlanningConsoleProps> = ({
  onStartPlanning,
  onCraftItinerary,
  prefill = false,
}) => {
  const today = todayISO();
  const {
    destinationId: selectedDestId,
    durationNights,
    departureDate,
    rooms,
    adults,
    children,
    interests,
    stayTier,
    setDestinationId,
    setDurationNights,
    setDepartureDate,
    setGuests,
    craftItinerary,
  } = useTrip();

  // The console opens blank: a field only shows a value once the visitor has chosen it
  // (the trip context still holds sensible defaults underneath).
  const [picked, setPicked] = useState<Record<PickKey, boolean>>({
    dest: prefill,
    start: prefill,
    end: prefill,
    guests: prefill,
  });
  const markPicked = (key: PickKey) => setPicked((p) => (p[key] ? p : { ...p, [key]: true }));
  const unpick = (key: PickKey) => setPicked((p) => (p[key] ? { ...p, [key]: false } : p));

  // The party starts at zero so the visitor adds exactly who is travelling. It is pushed to the trip once there is
  // at least one adult. Infants (under 6) travel free and don't change the plan, so they are tracked here only.
  const [party, setParty] = useState({
    adults: prefill ? adults : 0,
    children: prefill ? children : 0,
    infants: 0,
    rooms: prefill ? rooms : 0,
  });

  const [validationError, setValidationError] = useState<string | null>(null);
  const [activePopup, setActivePopup] = useState<Popup>(null);

  const endDate = addDaysISO(departureDate, durationNights);

  // Calendar month/year for the start and end pickers
  const [startCal, setStartCal] = useState(() => monthOf(departureDate));
  const [endCal, setEndCal] = useState(() => monthOf(endDate));

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

  const pickDest = (id: string) => {
    markPicked('dest');
    setDestinationId(id);
  };

  const endFits = (startIso: string, endIso: string) => {
    const nights = nightsBetween(startIso, endIso);
    return nights >= 1 && nights + 1 <= MAX_TRIP_DAYS;
  };

  const pickStart = (iso: string) => {
    if (iso < today) return;
    markPicked('start');
    setDepartureDate(iso);
    // Keep a chosen end date if it still fits the new start; otherwise ask for it again.
    if (picked.end && endFits(iso, endDate)) {
      setDurationNights(nightsBetween(iso, endDate));
      setActivePopup(null);
      return;
    }
    unpick('end');
    setEndCal(monthOf(addDaysISO(iso, 1)));
    setActivePopup('end');
  };

  const pickEnd = (iso: string) => {
    if (!endFits(departureDate, iso)) return;
    markPicked('end');
    setDurationNights(nightsBetween(departureDate, iso));
    setActivePopup(null);
  };

  const changeGuests = (nextAdults: number, nextChildren: number, nextInfants: number) => {
    const a = Math.min(MAX_ADULTS, Math.max(0, nextAdults));
    const c = Math.min(MAX_CHILDREN, Math.max(0, nextChildren));
    const i = Math.min(MAX_INFANTS, Math.max(0, nextInfants));
    setParty((p) => ({ ...p, adults: a, children: c, infants: i }));
    if (a >= 1 || party.rooms > 0) {
      markPicked('guests');
    } else {
      unpick('guests');
    }
    setGuests(party.rooms, a, c);
  };

  const changeRooms = (nextRooms: number) => {
    const r = Math.min(MAX_ROOMS, Math.max(0, nextRooms));
    setParty((p) => ({ ...p, rooms: r }));
    if (r > 0 || party.adults >= 1) {
      markPicked('guests');
    } else {
      unpick('guests');
    }
    setGuests(r, party.adults, party.children);
  };

  const guestSummary =
    party.adults > 0 || party.children > 0 || party.infants > 0
      ? [
          plural(party.adults, 'Adult', 'Adults'),
          party.children > 0 ? plural(party.children, 'Child', 'Children') : null,
          party.infants > 0 ? plural(party.infants, 'Infant', 'Infants') : null,
        ]
          .filter(Boolean)
          .join(', ')
      : 'No guests selected';

  const handleLaunchPlanning = () => {
    const missing: { popup: Exclude<Popup, null>; label: string }[] = [];
    if (!picked.dest) missing.push({ popup: 'dest', label: 'destination' });
    if (!picked.start) missing.push({ popup: 'start', label: 'trip start date' });
    if (!picked.end) missing.push({ popup: 'end', label: 'trip end date' });
    if (!picked.guests || (party.adults < 1 && party.rooms < 1)) {
      missing.push({ popup: 'guests', label: 'guests & rooms' });
    } else if (party.adults < 1) {
      missing.push({ popup: 'guests', label: 'guests (at least one adult)' });
    } else if (party.rooms < 1) {
      missing.push({ popup: 'guests', label: 'rooms (at least one room)' });
    }
    if (missing.length > 0) {
      setValidationError(
        `Please choose your ${missing.map((m) => m.label).join(', ').replace(/, ([^,]*)$/, ' and $1')} to continue.`,
      );
      setActivePopup(missing[0].popup);
      setTimeout(() => setValidationError(null), 4000);
      return;
    }

    const res = craftItinerary(undefined, { keepPlan: prefill });
    if (!res.success) {
      setValidationError(res.error || 'Please check your trip details.');
      setTimeout(() => setValidationError(null), 4000);
      return;
    }
    setValidationError(null);
    if (onCraftItinerary) {
      onCraftItinerary();
    } else if (onStartPlanning) {
      const travellerType: TravellerType =
        party.adults === 1 && party.children === 0
          ? 'solo'
          : party.adults === 2 && party.children === 0 && party.rooms === 1
          ? 'couple'
          : party.children > 0
          ? 'family'
          : 'friends';

      onStartPlanning(
        {
          destinationId: selectedDestId,
          aiDestination: false,
          travellerType,
          adults: party.adults,
          children: party.children,
          rooms: party.rooms,
          checkIn: departureDate,
          checkOut: endDate,
          interests,
          stayTier,
          aiPlan: false,
        },
        3,
      );
    }
  };

  const fieldClass = (popup: Exclude<Popup, null>) =>
    `w-full text-left p-3 rounded-2xl border transition-all duration-200 cursor-pointer flex flex-col justify-between h-[84px] ${
      activePopup === popup ? FIELD_OPEN : FIELD_IDLE
    }`;

  const fieldLabel = (text: string, popup: Exclude<Popup, null>) => (
    <span className="text-[11px] font-bold uppercase tracking-wider text-[#C2571A] flex items-center justify-between">
      <span>{text}</span>
      <ChevronDown className={`w-3.5 h-3.5 text-[#C2571A] transition-transform ${activePopup === popup ? 'rotate-180' : ''}`} />
    </span>
  );

  const hint = (text: string) => <span className="text-[#374151] font-medium">{text}</span>;

  const toggle = (popup: Exclude<Popup, null>) => setActivePopup(activePopup === popup ? null : popup);

  return (
    <div ref={containerRef} className="relative w-full max-w-6xl mx-auto z-30" aria-label="Holiday planning console">
      <div className="bg-gradient-to-br from-white/95 via-white/88 to-white/78 backdrop-blur-2xl backdrop-saturate-150 border border-white/90 ring-1 ring-[#1E2022]/10 rounded-3xl p-4 sm:p-6 shadow-[0_28px_60px_-16px_rgba(14,24,34,0.5),0_0_0_1px_rgba(255,255,255,0.85)_inset] text-[#1E2022]">
        {/* Top Header Label */}
        <div className="flex items-center justify-between pb-3.5 mb-4 border-b border-[#1E2022]/10">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#1F9EA3] animate-pulse" />
            <span className="text-xs sm:text-sm font-bold tracking-wider text-[#C2571A] uppercase">
              Holiday Packages & Customiser
            </span>
          </div>
          <span className="text-xs text-[#4B5563] font-medium hidden sm:inline">Directly seeds your bespoke itinerary</span>
        </div>

        {/* 4 fields: destination, start date, end date, guests & rooms */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
          {/* FIELD 1: DESTINATION */}
          <div className="relative">
            <button
              type="button"
              onClick={() => toggle('dest')}
              aria-expanded={activePopup === 'dest'}
              aria-haspopup="dialog"
              className={fieldClass('dest')}
            >
              {fieldLabel('Destination', 'dest')}
              <div className="flex items-center gap-2 mt-1 truncate">
                <MapPin className="w-4 h-4 text-[#16878C] shrink-0" />
                <div className="min-w-0 truncate">
                  <div className="text-sm font-semibold truncate leading-tight">
                    {picked.dest ? selectedDest.name : hint('Where to?')}
                  </div>
                  <div className="text-[11px] text-[#4B5563] truncate leading-tight">
                    {picked.dest ? selectedDest.country : 'Choose a destination'}
                  </div>
                </div>
              </div>
            </button>

            {activePopup === 'dest' && (
              <div className={`${POPOVER} left-0 w-full sm:w-[320px] !p-3`}>
                <p className="text-[11px] font-bold uppercase tracking-wider text-[#16878C] px-2 py-1">
                  Select Destination
                </p>
                <div className="space-y-1 mt-1 max-h-[260px] overflow-y-auto">
                  {DESTINATION_OPTIONS.map((dest) => {
                    const on = picked.dest && selectedDestId === dest.id;
                    return (
                      <button
                        key={dest.id}
                        type="button"
                        onClick={() => {
                          pickDest(dest.id);
                          if (picked.start) {
                            setActivePopup(null);
                          } else {
                            setStartCal(monthOf(departureDate));
                            setActivePopup('start');
                          }
                        }}
                        className={`w-full flex items-center gap-3 p-2 rounded-xl text-left transition-colors cursor-pointer ${
                          on ? 'bg-[#C2571A]/10 font-medium' : 'text-[#3A3D42] hover:bg-[#1E2022]/8 hover:text-[#1E2022]'
                        }`}
                      >
                        <img src={dest.image} alt="" className="w-9 h-9 rounded-lg object-cover shrink-0" />
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-semibold truncate">{dest.name}</div>
                          <div className="text-[11px] text-[#6B7280] truncate">
                            {dest.country} • {dest.tag}
                          </div>
                        </div>
                        {on && <Check className="w-4 h-4 text-[#16878C] shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* FIELD 2: TRIP START DATE */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                if (activePopup !== 'start') setStartCal(monthOf(departureDate));
                toggle('start');
              }}
              aria-expanded={activePopup === 'start'}
              aria-haspopup="dialog"
              className={fieldClass('start')}
            >
              {fieldLabel('Trip Start Date', 'start')}
              <div className="flex items-center gap-2 mt-1 truncate">
                <Calendar className="w-4 h-4 text-[#16878C] shrink-0" />
                <div className="min-w-0 truncate">
                  <div className="text-sm font-semibold truncate leading-tight">
                    {picked.start ? formatDate(departureDate) : hint('Select date')}
                  </div>
                  <div className="text-[11px] text-[#4B5563] truncate leading-tight">
                    {picked.start ? 'Departure' : 'When do you leave?'}
                  </div>
                </div>
              </div>
            </button>

            {activePopup === 'start' && (
              <div className={`${POPOVER} left-0 w-full sm:w-[330px]`}>
                <CalendarGrid
                  month={startCal.month}
                  year={startCal.year}
                  onMonthChange={(month, year) => setStartCal({ month, year })}
                  minIso={today}
                  isDisabled={(iso) => iso < today}
                  selectedIso={picked.start ? departureDate : null}
                  onSelect={pickStart}
                  footer={
                    <div className="mt-3 pt-3 border-t border-[#1E2022]/10">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-[#4B5563] mb-1.5">
                        Quick select
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
                            onClick={() => {
                              const iso = addDaysISO(today, s.days);
                              setStartCal(monthOf(iso));
                              pickStart(iso);
                            }}
                            className="flex-1 py-1 px-2 rounded-lg bg-white/60 hover:bg-[#1E2022]/8 border border-[#1E2022]/10 text-[11px] font-medium text-[#3A3D42] transition-colors cursor-pointer"
                          >
                            {s.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  }
                />
              </div>
            )}
          </div>

          {/* FIELD 3: TRIP END DATE */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                if (activePopup !== 'end') setEndCal(monthOf(picked.end ? endDate : addDaysISO(departureDate, 1)));
                toggle('end');
              }}
              aria-expanded={activePopup === 'end'}
              aria-haspopup="dialog"
              className={fieldClass('end')}
            >
              {fieldLabel('Trip End Date', 'end')}
              <div className="flex items-center gap-2 mt-1 truncate">
                <CalendarCheck className="w-4 h-4 text-[#16878C] shrink-0" />
                <div className="min-w-0 truncate">
                  <div className="text-sm font-semibold truncate leading-tight">
                    {picked.end ? formatDate(endDate) : hint('Select date')}
                  </div>
                  <div className="text-[11px] text-[#4B5563] truncate leading-tight">
                    {picked.end ? plural(durationNights, 'night', 'nights') : 'When do you return?'}
                  </div>
                </div>
              </div>
            </button>

            {activePopup === 'end' && (
              <div className={`${POPOVER} left-0 sm:left-auto sm:right-0 w-full sm:w-[330px]`}>
                {!picked.start && (
                  <p className="mb-2 text-[11px] text-[#16878C] font-medium">
                    Tip: choose your start date first, then your return.
                  </p>
                )}
                <CalendarGrid
                  month={endCal.month}
                  year={endCal.year}
                  onMonthChange={(month, year) => setEndCal({ month, year })}
                  minIso={addDaysISO(departureDate, 1)}
                  isDisabled={(iso) => !endFits(departureDate, iso)}
                  selectedIso={picked.end ? endDate : null}
                  rangeFrom={picked.start ? departureDate : null}
                  rangeTo={picked.end ? endDate : null}
                  onSelect={pickEnd}
                  footer={
                    <p className="mt-3 pt-3 border-t border-[#1E2022]/10 text-[10px] text-[#4B5563]">
                      We plan up to {MAX_TRIP_DAYS} days per trip.
                    </p>
                  }
                />
              </div>
            )}
          </div>

          {/* FIELD 4: GUESTS & ROOMS */}
          <div className="relative">
            <button
              type="button"
              onClick={() => toggle('guests')}
              aria-expanded={activePopup === 'guests'}
              aria-haspopup="dialog"
              className={fieldClass('guests')}
            >
              {fieldLabel('Guests & Rooms', 'guests')}
              <div className="flex items-center gap-2 mt-1 truncate">
                <Users className="w-4 h-4 text-[#16878C] shrink-0" />
                <div className="min-w-0 truncate">
                  <div className="text-sm font-semibold truncate leading-tight">
                    {picked.guests ? guestSummary : hint("Who's travelling?")}
                  </div>
                  <div className="text-[11px] text-[#4B5563] truncate leading-tight">
                    {picked.guests ? plural(party.rooms, 'Room', 'Rooms') : 'Select guests & rooms'}
                  </div>
                </div>
              </div>
            </button>

            {activePopup === 'guests' && (
              <div className={`${POPOVER} right-0 w-full sm:w-[340px]`}>
                <p className="text-[11px] font-bold uppercase tracking-wider text-[#16878C] mb-3">Guests</p>

                <div className="space-y-3.5">
                  {[
                    { key: 'adults', label: 'Adults', sub: 'Age 12 and above', value: party.adults, min: party.children > 0 || party.infants > 0 ? 1 : 0, max: MAX_ADULTS },
                    { key: 'children', label: 'Children', sub: 'Age 6 to 12', value: party.children, min: 0, max: MAX_CHILDREN },
                    { key: 'infants', label: 'Infants', sub: 'Below 6 years', value: party.infants, min: 0, max: MAX_INFANTS },
                    { key: 'rooms', label: 'Rooms', sub: 'Accommodation rooms', value: party.rooms, min: 0, max: MAX_ROOMS },
                  ].map((row) => {
                    const apply = (delta: number) => {
                      const v = row.value + delta;
                      if (row.key === 'rooms') return changeRooms(v);
                      changeGuests(
                        row.key === 'adults' ? v : party.adults,
                        row.key === 'children' ? v : party.children,
                        row.key === 'infants' ? v : party.infants,
                      );
                    };
                    return (
                      <div key={row.key} className="flex items-center justify-between">
                        <div>
                          <div className="text-xs font-semibold">{row.label}</div>
                          <div className="text-[10px] text-[#6B7280]">{row.sub}</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => apply(-1)}
                            disabled={row.value <= row.min}
                            className={STEP_BTN}
                            aria-label={`Decrease ${row.label.toLowerCase()}`}
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="w-6 text-center text-sm font-bold">{row.value}</span>
                          <button
                            type="button"
                            onClick={() => apply(1)}
                            disabled={row.value >= row.max}
                            className={STEP_BTN}
                            aria-label={`Increase ${row.label.toLowerCase()}`}
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <p className="mt-4 flex items-start gap-2 text-[10px] text-[#6B7280] leading-snug">
                  <BedDouble className="w-3.5 h-3.5 text-[#16878C] shrink-0" />
                  <span>
                    Select the number of rooms needed for your accommodation. Infants stay free.
                  </span>
                </p>

                <div className="mt-4 pt-3 border-t border-[#1E2022]/10 text-right">
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
          <div className="mt-3 px-4 py-2.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs sm:text-sm font-medium animate-in fade-in duration-200">
            {validationError}
          </div>
        )}

        {/* Bottom Action Bar */}
        <div className="mt-4 pt-4 border-t border-[#1E2022]/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Quick Destination Pills */}
          <div className="flex items-center gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden py-1">
            <span className="text-xs text-[#1E2022] font-bold shrink-0 hidden md:inline">Popular:</span>
            {DESTINATION_OPTIONS.slice(0, 4).map((d) => (
              <button
                key={d.id}
                type="button"
                onClick={() => pickDest(d.id)}
                className={`text-xs px-3 py-1 rounded-full border transition-all shrink-0 cursor-pointer ${
                  picked.dest && selectedDestId === d.id
                    ? 'bg-[#C2571A]/10 border-[#C2571A] text-[#C2571A] font-bold shadow-2xs'
                    : 'bg-white/80 border-[#1E2022]/15 text-[#1E2022] font-semibold hover:bg-white hover:border-[#C2571A] shadow-2xs'
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
            className="group relative inline-flex items-center justify-center gap-2.5 px-6 sm:px-8 py-3.5 rounded-full bg-gradient-to-r from-[#C2571A] via-[#E5501A] to-[#F7931E] text-white font-bold text-sm sm:text-base shadow-[0_12px_28px_-6px_rgba(194,87,26,0.55)] hover:brightness-110 active:scale-[0.98] transition-all duration-200 cursor-pointer shrink-0"
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
