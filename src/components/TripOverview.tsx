import React, { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  ArrowLeft,
  Bed,
  Calendar,
  Car,
  CheckCircle2,
  ChevronDown,
  Clock,
  MapPin,
  Moon,
  Sparkles,
  Ship,
  Sun,
  Sunrise,
  Users,
  Printer,
  Share2,
} from 'lucide-react';
import { Activity, DaySlot, PlanState, TripBooking, TripDraft } from '../types';
import {
  CATEGORY_STYLES,
  TIER_LABEL,
  VEHICLE_INFO,
  arrivalSummary,
  defaultArrival,
  defaultDeparture,
  recommendedVehicle,
  tripVehicle,
  vehicleOptions,
  departureSummary,
  cityOfActivity,
  cityForDay,
  computeCosts,
  dayDate,
  formatDate,
  formatINR,
  getDestination,
  planInsights,
  plannedActivities,
  tripDays,
} from '../data/planner';
import { StepIndicator } from './StepIndicator';
import { TourPattern } from './TourPattern';

const LazyPrintableItinerary = React.lazy(() =>
  import('./PrintableItinerary').then((m) => ({ default: m.PrintableItinerary }))
);

const LazyShareItineraryModal = React.lazy(() =>
  import('./ShareItineraryModal').then((m) => ({ default: m.ShareItineraryModal }))
);

export interface ContactDetails {
  name: string;
  phone: string;
  email: string;
}

interface TripOverviewProps {
  draft: TripDraft;
  plan: PlanState;
  onEditPlan: () => void;
  /** Saves a change made on this page (e.g. the chosen vehicle) back to the plan. */
  onPlanChange: (plan: PlanState) => void;
  onConfirm: (contact: ContactDetails) => TripBooking;
  onViewTrips: () => void;
  onPlanAnother: () => void;
  onShowToast?: (msg: string) => void;
}

const SLOT_ICON: Record<DaySlot, React.ReactNode> = {
  Morning: <Sunrise className="w-3.5 h-3.5" />,
  Afternoon: <Sun className="w-3.5 h-3.5" />,
  Evening: <Moon className="w-3.5 h-3.5" />,
};

const PRICE_ROWS: { key: 'stay' | 'transfers' | 'activities' | 'service'; label: string }[] = [
  { key: 'stay', label: 'Boutique stay' },
  { key: 'transfers', label: 'Private transfers' },
  { key: 'activities', label: 'Experiences' },
  { key: 'service', label: 'Concierge service (5%)' },
];

const SLOT_ORDER: DaySlot[] = ['Morning', 'Afternoon', 'Evening'];

/** Activity thumbnail: uses the activity's own image when the data has one, else a category-tinted tile. */
const ActivityThumb: React.FC<{ activity: Activity }> = ({ activity }) => {
  const [failed, setFailed] = useState(false);
  const style = CATEGORY_STYLES[activity.category];
  if (activity.image && !failed) {
    return (
      <img
        src={activity.image}
        alt={activity.name}
        referrerPolicy="no-referrer"
        loading="lazy"
        onError={() => setFailed(true)}
        className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl object-cover shrink-0"
      />
    );
  }
  return (
    <div
      aria-hidden
      className={`w-16 h-16 sm:w-20 sm:h-20 rounded-xl shrink-0 flex items-center justify-center ${style.bg}`}
    >
      <span className={`w-3 h-3 rounded-full ${style.dot}`} />
    </div>
  );
};

interface DayCardProps {
  index: number;
  date: string;
  items: Activity[];
  cityName?: string;
  destId: string;
  destName: string;
  coverImage: string;
  open: boolean;
  onToggle: () => void;
  onAdd: () => void;
}

const DayCard: React.FC<DayCardProps> = ({
  index,
  date,
  items,
  cityName,
  destId,
  destName,
  coverImage,
  open,
  onToggle,
  onAdd,
}) => {
  const [coverFailed, setCoverFailed] = useState(false);
  const slots = SLOT_ORDER.filter((sl) => items.some((a) => a.slot === sl));
  const slotRange =
    slots.length === 0 ? '' : slots.length === 1 ? slots[0] : `${slots[0]} – ${slots[slots.length - 1]}`;
  const fullDay = slots.length === SLOT_ORDER.length;
  const stops = `${items.length} stop${items.length === 1 ? '' : 's'}`;
  const chip =
    'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#FAF8F5] border border-[#1E2022]/8 text-[11px] font-medium text-[#4B4F55]';

  return (
    <li className="rounded-2xl bg-white border border-[#1E2022]/8 shadow-xs overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        aria-controls={`ov-day-${index}`}
        className="w-full flex items-start gap-3 px-4 sm:px-5 py-4 text-left cursor-pointer"
      >
        <span className="shrink-0 w-9 h-9 rounded-full bg-[#14213D] text-white flex items-center justify-center text-sm font-extrabold">
          {index + 1}
        </span>
        <span className="flex-1 min-w-0">
          <span className="block text-sm sm:text-base font-bold text-[#1E2022]">
            Day {index + 1}
            {cityName ? ` — ${cityName}` : ''}
          </span>
          <span className="mt-2 flex flex-wrap gap-1.5">
            <span className={chip}>
              <Calendar className="w-3 h-3" /> {date}
            </span>
            {slotRange && (
              <span className={chip}>
                <Clock className="w-3 h-3" /> {slotRange}
              </span>
            )}
            {fullDay && <span className={chip}>Full Day</span>}
            <span className={chip}>
              <MapPin className="w-3 h-3" /> {stops}
            </span>
          </span>
        </span>
        <ChevronDown
          aria-hidden
          className={`mt-2 w-4 h-4 shrink-0 text-[#6B7280] transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            id={`ov-day-${index}`}
            key="panel"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="overflow-hidden"
          >
            <div className="px-4 sm:px-5 pb-5 pt-4 border-t border-[#1E2022]/8">
              {/* Cover */}
              <div className="relative h-40 sm:h-52 rounded-2xl overflow-hidden bg-gradient-to-br from-[#1E2022] to-[#4B4F55]">
                {coverImage && !coverFailed && (
                  <img
                    src={coverImage}
                    alt={`${destName} — day ${index + 1}`}
                    referrerPolicy="no-referrer"
                    loading="lazy"
                    onError={() => setCoverFailed(true)}
                    style={{ objectPosition: `${(index * 37) % 100}% 50%` }}
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-transparent" />
                <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between gap-2 text-white">
                  <span className="inline-flex items-center gap-2 text-sm font-bold">
                    <span className="w-5 h-5 rounded-full bg-[#14213D] flex items-center justify-center text-[10px] font-extrabold">
                      {index + 1}
                    </span>
                    Day {index + 1} Highlights
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-white/20 border border-white/30 backdrop-blur-sm text-[11px] font-semibold">
                    {items.length} {items.length === 1 ? 'Activity' : 'Activities'}
                  </span>
                </div>
              </div>

              {/* Activities */}
              {items.length === 0 ? (
                <p className="mt-4 text-sm text-[#6B7280]">
                  Free day — unwind at your stay, or{' '}
                  <button type="button" onClick={onAdd} className="font-semibold text-[#14213D] hover:underline cursor-pointer">
                    add something
                  </button>
                  .
                </p>
              ) : (
                <>
                  <h4 className="mt-5 flex items-center gap-1.5 text-sm font-semibold text-[#1E2022]">
                    <Clock className="w-3.5 h-3.5 text-[#9CA3AF]" /> Activities ({items.length})
                  </h4>
                  <ul className="relative mt-3 pl-6 space-y-3">
                    {items.map((a, idx) => {
                      const isFirst = idx === 0;
                      const isLast = idx === items.length - 1;
                      const isSingle = items.length <= 1;
                      const city = cityOfActivity(destId, a.id);
                      const style = CATEGORY_STYLES[a.category];
                      return (
                        <li key={a.id} className="relative">
                          {!isSingle && (
                            <span
                              aria-hidden
                              className={`absolute -left-[19px] w-px bg-[#1E2022]/12 ${
                                isFirst
                                  ? 'top-[29px] -bottom-3'
                                  : isLast
                                  ? 'top-0 h-[29px]'
                                  : 'top-0 -bottom-3'
                              }`}
                            />
                          )}
                          <span aria-hidden className="absolute -left-6 top-6 w-[11px] h-[11px] rounded-full bg-[#1E2022]/15 ring-2 ring-white" />
                          <div className="flex gap-3 sm:gap-4 p-3 rounded-2xl bg-[#FAF8F5]/70 border border-[#1E2022]/8">
                            <ActivityThumb activity={a} />
                            <div className="flex-1 min-w-0">
                              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                                <p className="text-sm font-bold text-[#1E2022]">{a.name}</p>
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white border border-[#1E2022]/10 text-[11px] font-semibold text-[#4B4F55]">
                                  <Clock className="w-3 h-3" /> {a.hours}h
                                </span>
                              </div>
                              {a.description && <p className="mt-1 text-xs text-[#6B7280]">{a.description}</p>}
                              <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-[#6B7280]">
                                {city && (
                                  <span className="inline-flex items-center gap-1">
                                    <MapPin className="w-3 h-3" /> {city.name}
                                  </span>
                                )}
                                <span className="inline-flex items-center gap-1">
                                  {SLOT_ICON[a.slot]} {a.slot}
                                </span>
                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full font-bold ${style.bg} ${style.text}`}>
                                  {a.category}
                                </span>
                                <span>{a.cost === 0 ? 'Free' : `${formatINR(a.cost)} pp`}</span>
                              </div>
                            </div>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </li>
  );
};

/** Placeholder stored while the traveller has chosen "my own vehicle" but not typed it yet. */
const CUSTOM_VEHICLE = 'Own vehicle';

export const TripOverview: React.FC<TripOverviewProps> = ({
  draft,
  plan,
  onEditPlan,
  onPlanChange,
  onConfirm,
  onViewTrips,
  onPlanAnother,
  onShowToast,
}) => {
  const dest = getDestination(draft.destinationId)!;
  const days = tripDays(draft);
  const nights = days - 1;
  const guests = draft.adults + draft.children;
  const tier = TIER_LABEL[draft.stayTier];

  const planned = useMemo(() => plannedActivities(plan), [plan]);
  const costs = useMemo(() => computeCosts(draft, plan), [draft, plan]);
  const insights = useMemo(() => planInsights(draft, plan), [draft, plan]);
  const totalStops = planned.reduce((n, d) => n + d.length, 0);

  const [contact, setContact] = useState<ContactDetails>({ name: '', phone: '', email: '' });
  const [errors, setErrors] = useState<Partial<Record<keyof ContactDetails, string>>>({});
  const [confirmed, setConfirmed] = useState<TripBooking | null>(null);
  const [openDays, setOpenDays] = useState<Set<number>>(() => new Set([0]));
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  const handlePrint = () => {
    window.print();
  };

  const toggleDay = (i: number) =>
    setOpenDays((prev) => {
      const next = new Set(prev);
      if (!next.delete(i)) next.add(i);
      return next;
    });

  const validate = () => {
    const e: typeof errors = {};
    if (contact.name.trim().length < 2) e.name = 'Enter the lead traveller’s name.';
    if (contact.phone.replace(/\D/g, '').length < 10) e.phone = 'Enter a valid phone number.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact.email)) e.email = 'Enter a valid email address.';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setConfirmed(onConfirm(contact));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (confirmed) {
    return (
      <section className="relative isolate overflow-clip pt-28 lg:pt-32 pb-24 bg-[#FBFAF8]">
        <TourPattern variant="compass" />
        <div className="relative z-10 max-w-xl mx-auto px-4 text-center">
          <StepIndicator current={4} />
          <div className="mt-10 mx-auto w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center">
            <CheckCircle2 className="w-9 h-9 text-emerald-600" />
          </div>
          <h1 className="mt-6 text-3xl sm:text-4xl font-bold tracking-tight text-[#14213D]" style={{ fontFamily: "'Playfair Display', serif" }}>Your trip request is in</h1>
          <p className="mt-3 text-sm text-[#6B7280] leading-relaxed">
            Thank you, {contact.name.split(' ')[0]}. Your {dest.name} itinerary ({days} days, {totalStops} experiences) is
            saved as <span className="font-mono font-semibold text-[#1E2022]">{confirmed.id}</span>. A concierge will
            call you on {contact.phone} and write to {contact.email} within 24 hours to confirm availability and
            payment.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              type="button"
              onClick={onViewTrips}
              className="px-6 py-3 rounded-full bg-gradient-to-r from-[#C2571A] via-[#E5501A] to-[#F7931E] hover:brightness-110 text-white text-sm font-semibold shadow-[0_10px_22px_-12px_rgba(194,87,26,0.6)] cursor-pointer transition-all"
            >
              View in My Trips
            </button>
            <button
              type="button"
              onClick={onPlanAnother}
              className="px-6 py-3 rounded-full border border-[#1E2022]/15 text-sm font-semibold text-[#1E2022] hover:bg-white cursor-pointer"
            >
              Plan another trip
            </button>
          </div>
        </div>
      </section>
    );
  }

  const inputClass = (invalid?: string) =>
    `mt-1 w-full px-3.5 py-2.5 text-sm rounded-xl bg-white border focus:outline-none focus:ring-2 focus:ring-[#1E2022]/10 ${
      invalid ? 'border-rose-400' : 'border-[#1E2022]/12 focus:border-[#1E2022]'
    }`;

  return (
    <>
      <section className="relative isolate overflow-clip pt-24 lg:pt-28 pb-24 print:hidden bg-[#FBFAF8]">
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <StepIndicator current={2} />
            <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
              <button
                type="button"
                onClick={handlePrint}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-white border border-[#1E2022]/12 text-xs font-semibold text-[#1E2022] hover:border-[#14213D] hover:text-[#14213D] shadow-xs transition cursor-pointer"
                title="Print itinerary or save as PDF using browser print dialog"
              >
                <Printer className="w-3.5 h-3.5 text-[#14213D]" />
                <span>Print / Save as PDF</span>
              </button>
              <button
                type="button"
                onClick={() => setIsShareModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-white border border-[#1E2022]/12 text-xs font-semibold text-[#1E2022] hover:border-[#14213D] hover:text-[#14213D] shadow-xs transition cursor-pointer"
                title="Generate a shareable link for travel companions"
              >
                <Share2 className="w-3.5 h-3.5 text-[#14213D]" />
                <span>Share Link</span>
              </button>
              <button
                type="button"
                onClick={onEditPlan}
                className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-[#6B7280] hover:text-[#1E2022] cursor-pointer ml-1"
              >
                <ArrowLeft className="w-4 h-4" /> Edit itinerary
              </button>
            </div>
          </div>

        {/* Banner */}
        <div className="mt-5 relative rounded-[28px] overflow-hidden h-56 sm:h-64 bg-[#14213D] shadow-[0_24px_50px_-30px_rgba(30,32,34,0.5)]">
          <img src={dest.image} alt={dest.name} referrerPolicy="no-referrer" className="absolute inset-0 w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#14213D]/75 via-[#14213D]/15 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-8 text-white">
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/75">Your custom package</p>
            <h1 className="mt-1 text-2xl sm:text-4xl font-bold tracking-tight" style={{ fontFamily: "'Playfair Display', serif" }}>
              {days}-day {dest.name} journey
            </h1>
            <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5 text-xs sm:text-sm text-white/90">
              <span className="inline-flex items-center gap-1.5">
                <Calendar className="w-4 h-4" /> {formatDate(draft.checkIn)} – {formatDate(draft.checkOut)}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Users className="w-4 h-4" /> {draft.adults} adult{draft.adults > 1 ? 's' : ''}
                {draft.children > 0 ? `, ${draft.children} child${draft.children > 1 ? 'ren' : ''}` : ''}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Bed className="w-4 h-4" /> {nights} night{nights > 1 ? 's' : ''} · {tier} stay
              </span>
            </div>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 lg:grid-cols-[1fr_24rem] gap-8 items-start">
          {/* Itinerary */}
          <div>
            <h2 className="text-2xl font-bold text-[#14213D]" style={{ fontFamily: "'Playfair Display', serif" }}>Your day-by-day plan</h2>

            <div className="mt-4 grid sm:grid-cols-2 gap-3">
              <div className="p-4 rounded-2xl bg-white border border-[#1E2022]/8 flex gap-3">
                <Bed className="w-5 h-5 text-[#14213D] shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-bold text-[#1E2022]">
                    {costs.rooms} room{costs.rooms > 1 ? 's' : ''} · {nights} night{nights > 1 ? 's' : ''}
                  </p>
                  <p className="text-xs text-[#6B7280] mt-0.5">
                    {tier} tier boutique stay in {dest.name}, matching the stay style you chose.
                  </p>
                </div>
              </div>
              <div className="p-4 rounded-2xl bg-white border border-[#1E2022]/8 flex gap-3">
                <Car className="w-5 h-5 text-[#14213D] shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-bold text-[#1E2022]">Private transfers, every day</p>
                  <p className="text-xs text-[#6B7280] mt-0.5">Chauffeured pickups between your stay and each experience.</p>
                  <p className="text-xs font-medium text-[#4B5563] mt-1">{arrivalSummary(draft, plan)}</p>
                  <p className="text-xs font-medium text-[#4B5563] mt-1">{departureSummary(draft, plan)}</p>
                </div>
              </div>
            </div>

            {/* Vehicle choice: applies to the Day 1 pickup and the last-day drop, and sets the transfer price */}
            <div className="mt-3 p-4 rounded-2xl bg-white border border-[#1E2022]/8">
              <div className="flex items-center gap-2">
                {dest.id === 'maldives' ? (
                  <Ship className="w-5 h-5 text-[#14213D]" />
                ) : (
                  <Car className="w-5 h-5 text-[#14213D]" />
                )}
                <div>
                  <p className="text-sm font-bold text-[#1E2022]">Choose your vehicle</p>
                  <p className="text-xs text-[#6B7280]">Used for your pickup, drop and every transfer between stops.</p>
                </div>
              </div>
              <div role="radiogroup" aria-label="Vehicle" className="mt-3 grid sm:grid-cols-3 gap-2.5">
                {vehicleOptions(dest.id).map((v) => {
                  const info = VEHICLE_INFO[v];
                  const on = tripVehicle(draft, plan) === v;
                  const best = recommendedVehicle(dest.id, guests) === v;
                  const extra = Math.round(dest.transferPerDay * days * ((info?.factor ?? 1) - 1));
                  return (
                    <button
                      key={v}
                      type="button"
                      role="radio"
                      aria-checked={on}
                      onClick={() =>
                        onPlanChange({
                          ...plan,
                          arrival: { ...(plan.arrival ?? defaultArrival(draft)), vehicle: v },
                          departure: { ...(plan.departure ?? defaultDeparture(draft, plan)), vehicle: v },
                        })
                      }
                      className={`text-left rounded-xl border p-3 transition-all cursor-pointer ${
                        on
                          ? 'border-[#14213D] bg-[#F6F5F3] shadow-[0_0_0_3px_rgba(20,33,61,0.12)]'
                          : 'border-[#1E2022]/12 bg-white hover:border-[#14213D]/50'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-bold text-[#1E2022]">{v}</span>
                        {on && <CheckCircle2 className="w-4 h-4 text-[#14213D]" />}
                      </div>
                      <p className="mt-0.5 text-xs text-[#6B7280] leading-snug">{info?.note}</p>
                      <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[11px] font-semibold">
                        {best && <span className="px-1.5 py-0.5 rounded-full bg-[#1F9EA3]/10 text-[#16878C]">Best for your group</span>}
                        <span className="text-[#4B4F55]">{extra > 0 ? `+${formatINR(extra)}` : 'Base rate'}</span>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Their own choice: any vehicle, in their own words */}
              {(() => {
                const current = tripVehicle(draft, plan);
                const isCustom = !vehicleOptions(dest.id).includes(current);
                const applyVehicle = (v: string) =>
                  onPlanChange({
                    ...plan,
                    arrival: { ...(plan.arrival ?? defaultArrival(draft)), vehicle: v },
                    departure: { ...(plan.departure ?? defaultDeparture(draft, plan)), vehicle: v },
                  });
                return (
                  <div
                    className={`mt-2.5 rounded-xl border p-3 transition-all ${
                      isCustom
                        ? 'border-[#14213D] bg-[#F6F5F3] shadow-[0_0_0_3px_rgba(20,33,61,0.12)]'
                        : 'border-[#1E2022]/12 bg-white'
                    }`}
                  >
                    <button
                      type="button"
                      role="radio"
                      aria-checked={isCustom}
                      onClick={() => !isCustom && applyVehicle(CUSTOM_VEHICLE)}
                      className="w-full flex items-center justify-between gap-2 text-left cursor-pointer"
                    >
                      <span>
                        <span className="block text-sm font-bold text-[#1E2022]">I'll choose my own vehicle</span>
                        <span className="block text-xs text-[#6B7280]">
                          Tell us exactly what you need to travel in, and how many.
                        </span>
                      </span>
                      {isCustom && <CheckCircle2 className="w-4 h-4 text-[#14213D] shrink-0" />}
                    </button>
                    {isCustom && (
                      <div className="mt-3">
                        <label htmlFor="custom-vehicle" className="block mb-1.5 text-[12px] font-bold uppercase tracking-wider text-[#6B7280]">
                          Your vehicle
                        </label>
                        <input
                          id="custom-vehicle"
                          type="text"
                          value={current === CUSTOM_VEHICLE ? '' : current}
                          onChange={(e) => applyVehicle(e.target.value.trim() === '' ? CUSTOM_VEHICLE : e.target.value)}
                          maxLength={80}
                          placeholder="e.g. Innova Crysta, 2 vehicles, child seat needed"
                          className="w-full h-10 px-3 rounded-xl bg-white border border-[#1E2022]/15 text-[15px] text-[#1E2022] placeholder:text-[#9CA3AF] focus:outline-none focus:border-[#14213D] focus:ring-2 focus:ring-[#14213D]/15 transition"
                        />
                        <p className="mt-1.5 text-[12px] text-[#6B7280]">
                          Priced at the base transfer rate for now; we confirm the final amount with you.
                        </p>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>

            <ol className="mt-6 space-y-4">
              {planned.map((items, i) => (
                <DayCard
                  key={i}
                  index={i}
                  date={dayDate(draft.checkIn, i)}
                  items={items}
                  cityName={cityForDay(draft, i)?.name}
                  destId={dest.id}
                  destName={dest.name}
                  coverImage={dest.image}
                  open={openDays.has(i)}
                  onToggle={() => toggleDay(i)}
                  onAdd={onEditPlan}
                />
              ))}
            </ol>

            <div className="ai-card mt-6 p-5 rounded-3xl backdrop-blur-xl shadow-[0_16px_40px_-26px_rgba(91,75,219,0.45)] text-[#14213D]">
              <div className="flex items-center gap-2 text-sm font-bold">
                <Sparkles className="ai-sparkle w-4 h-4 text-[#6D5CF0]" /> <span className="ai-text">AI review of your plan</span> <span className="ai-badge">AI</span>
              </div>
              <ul className="mt-2 space-y-1.5 text-xs text-[#4B5563] list-disc pl-4">
                {insights.map((t) => (
                  <li key={t}>{t}</li>
                ))}
              </ul>
            </div>
          </div>

          {/* Price + confirm */}
          <aside className="lg:sticky lg:top-24 space-y-4">
            <div className="p-5 rounded-2xl bg-white border border-[#1E2022]/10 shadow-sm">
              <h2 className="text-sm font-extrabold text-[#1E2022]">Package price</h2>
              <dl className="mt-3 space-y-2 text-sm">
                {PRICE_ROWS.map((r) => (
                  <div key={r.key} className="flex justify-between">
                    <dt className="text-[#6B7280]">{r.label}</dt>
                    <dd className="font-semibold text-[#1E2022]">{formatINR(costs[r.key])}</dd>
                  </div>
                ))}
              </dl>
              <div className="mt-3 pt-3 border-t border-[#1E2022]/10 flex justify-between items-baseline">
                <span className="text-sm font-bold text-[#1E2022]">Total</span>
                <span className="text-2xl font-extrabold text-[#1E2022]">{formatINR(costs.total)}</span>
              </div>
              <p className="mt-1 text-xs text-[#6B7280]">
                About {formatINR(costs.perPerson)} per guest for {guests} guest{guests > 1 ? 's' : ''}. Flights not included.
              </p>

              <div className="mt-4 pt-3 border-t border-[#1E2022]/8 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={handlePrint}
                  className="inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-[#FAF8F5] hover:bg-[#F6F5F3] text-[#1E2022] hover:text-[#14213D] text-xs font-semibold border border-[#1E2022]/10 transition cursor-pointer"
                  title="Print or save as PDF"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print / PDF</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsShareModalOpen(true)}
                  className="inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-[#FAF8F5] hover:bg-[#F6F5F3] text-[#1E2022] hover:text-[#14213D] text-xs font-semibold border border-[#1E2022]/10 transition cursor-pointer"
                  title="Share with travel companions"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>Share Link</span>
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} noValidate className="p-6 rounded-3xl bg-white/85 backdrop-blur-xl border border-white shadow-[0_18px_44px_-28px_rgba(30,32,34,0.4)] space-y-3">
              <h2 className="text-xl font-bold text-[#14213D]" style={{ fontFamily: "'Playfair Display', serif" }}>Proceed to book</h2>
              <p className="text-xs text-[#6B7280]">No payment now. A concierge confirms availability first.</p>

              <div>
                <label htmlFor="ov-name" className="text-xs font-semibold text-[#1E2022]">Lead traveller</label>
                <input
                  id="ov-name"
                  value={contact.name}
                  onChange={(e) => setContact({ ...contact, name: e.target.value })}
                  autoComplete="name"
                  aria-invalid={errors.name ? 'true' : undefined}
                  aria-describedby={errors.name ? 'ov-name-error' : undefined}
                  className={inputClass(errors.name)}
                />
                {errors.name && <p id="ov-name-error" role="alert" className="mt-1 text-[11px] text-rose-600">{errors.name}</p>}
              </div>
              <div>
                <label htmlFor="ov-phone" className="text-xs font-semibold text-[#1E2022]">Phone</label>
                <input
                  id="ov-phone"
                  type="tel"
                  value={contact.phone}
                  onChange={(e) => setContact({ ...contact, phone: e.target.value })}
                  autoComplete="tel"
                  aria-invalid={errors.phone ? 'true' : undefined}
                  aria-describedby={errors.phone ? 'ov-phone-error' : undefined}
                  className={inputClass(errors.phone)}
                />
                {errors.phone && <p id="ov-phone-error" role="alert" className="mt-1 text-[11px] text-rose-600">{errors.phone}</p>}
              </div>
              <div>
                <label htmlFor="ov-email" className="text-xs font-semibold text-[#1E2022]">Email</label>
                <input
                  id="ov-email"
                  type="email"
                  value={contact.email}
                  onChange={(e) => setContact({ ...contact, email: e.target.value })}
                  autoComplete="email"
                  aria-invalid={errors.email ? 'true' : undefined}
                  aria-describedby={errors.email ? 'ov-email-error' : undefined}
                  className={inputClass(errors.email)}
                />
                {errors.email && <p id="ov-email-error" role="alert" className="mt-1 text-[11px] text-rose-600">{errors.email}</p>}
              </div>

              <button
                type="submit"
                disabled={totalStops === 0}
                className="w-full py-3.5 rounded-full bg-gradient-to-r from-[#C2571A] via-[#E5501A] to-[#F7931E] hover:brightness-110 text-white text-sm font-semibold shadow-[0_12px_26px_-12px_rgba(194,87,26,0.65)] disabled:opacity-40 transition-all cursor-pointer"
              >
                Confirm & request booking
              </button>
              {totalStops === 0 && (
                <p className="text-[11px] text-center text-[#6B7280]">Add at least one experience to continue.</p>
              )}
            </form>
          </aside>
        </div>
      </div>
    </section>

    {isShareModalOpen && (
      <React.Suspense fallback={null}>
        <LazyShareItineraryModal
          draft={draft}
          plan={plan}
          isOpen={isShareModalOpen}
          onClose={() => setIsShareModalOpen(false)}
          onPrint={handlePrint}
          onShowToast={onShowToast}
        />
      </React.Suspense>
    )}

    <div className="hidden print:block">
      <React.Suspense fallback={null}>
        <LazyPrintableItinerary draft={draft} plan={plan} />
      </React.Suspense>
    </div>
  </>
  );
};
