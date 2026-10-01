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
  Sun,
  Sunrise,
  Users,
} from 'lucide-react';
import { Activity, DaySlot, PlanState, TripBooking, TripDraft } from '../types';
import {
  CATEGORY_STYLES,
  TIER_LABEL,
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

export interface ContactDetails {
  name: string;
  phone: string;
  email: string;
}

interface TripOverviewProps {
  draft: TripDraft;
  plan: PlanState;
  onEditPlan: () => void;
  onConfirm: (contact: ContactDetails) => TripBooking;
  onViewTrips: () => void;
  onPlanAnother: () => void;
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
        <span className="shrink-0 w-9 h-9 rounded-full bg-[#C2571A] text-white flex items-center justify-center text-sm font-extrabold">
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
                    <span className="w-5 h-5 rounded-full bg-[#C2571A] flex items-center justify-center text-[10px] font-extrabold">
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
                  <button type="button" onClick={onAdd} className="font-semibold text-[#C2571A] hover:underline cursor-pointer">
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
                    <span aria-hidden className="absolute left-[5px] top-3 bottom-3 w-px bg-[#1E2022]/12" />
                    {items.map((a) => {
                      const city = cityOfActivity(destId, a.id);
                      const style = CATEGORY_STYLES[a.category];
                      return (
                        <li key={a.id} className="relative">
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

export const TripOverview: React.FC<TripOverviewProps> = ({
  draft,
  plan,
  onEditPlan,
  onConfirm,
  onViewTrips,
  onPlanAnother,
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
      <section className="pt-28 lg:pt-32 pb-24">
        <div className="max-w-xl mx-auto px-4 text-center">
          <StepIndicator current={4} />
          <div className="mt-10 mx-auto w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center">
            <CheckCircle2 className="w-9 h-9 text-emerald-600" />
          </div>
          <h1 className="mt-6 text-3xl font-extrabold tracking-tight text-[#1E2022]">Your trip request is in</h1>
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
              className="px-6 py-3 rounded-full bg-[#1E2022] hover:bg-[#C2571A] text-white text-sm font-semibold cursor-pointer transition-colors"
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
    <section className="pt-24 lg:pt-28 pb-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <StepIndicator current={2} />
          <button
            type="button"
            onClick={onEditPlan}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#6B7280] hover:text-[#1E2022] cursor-pointer self-start lg:self-auto"
          >
            <ArrowLeft className="w-4 h-4" /> Edit itinerary
          </button>
        </div>

        {/* Banner */}
        <div className="mt-5 relative rounded-3xl overflow-hidden h-56 sm:h-64 bg-[#1E2022]">
          <img src={dest.image} alt={dest.name} referrerPolicy="no-referrer" className="absolute inset-0 w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-8 text-white">
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/75">Your custom package</p>
            <h1 className="mt-1 text-2xl sm:text-4xl font-extrabold tracking-tight">
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
            <h2 className="text-xl font-extrabold text-[#1E2022]">Your day-by-day plan</h2>

            <div className="mt-4 grid sm:grid-cols-2 gap-3">
              <div className="p-4 rounded-2xl bg-white border border-[#1E2022]/8 flex gap-3">
                <Bed className="w-5 h-5 text-[#C2571A] shrink-0 mt-0.5" />
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
                <Car className="w-5 h-5 text-[#C2571A] shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-bold text-[#1E2022]">Private transfers, every day</p>
                  <p className="text-xs text-[#6B7280] mt-0.5">Chauffeured pickups between your stay and each experience.</p>
                </div>
              </div>
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

            <div className="mt-6 p-5 rounded-2xl bg-[#1E2022] text-white">
              <div className="flex items-center gap-2 text-sm font-bold">
                <Sparkles className="w-4 h-4 text-[#F28A55]" /> AI review of your plan
              </div>
              <ul className="mt-2 space-y-1.5 text-xs text-white/80 list-disc pl-4">
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

            </div>

            <form onSubmit={handleSubmit} noValidate className="p-5 rounded-2xl bg-white border border-[#1E2022]/10 shadow-sm space-y-3">
              <h2 className="text-sm font-extrabold text-[#1E2022]">Proceed to book</h2>
              <p className="text-xs text-[#6B7280]">No payment now. A concierge confirms availability first.</p>

              <div>
                <label htmlFor="ov-name" className="text-xs font-semibold text-[#1E2022]">Lead traveller</label>
                <input
                  id="ov-name"
                  value={contact.name}
                  onChange={(e) => setContact({ ...contact, name: e.target.value })}
                  autoComplete="name"
                  className={inputClass(errors.name)}
                />
                {errors.name && <p className="mt-1 text-[11px] text-rose-600">{errors.name}</p>}
              </div>
              <div>
                <label htmlFor="ov-phone" className="text-xs font-semibold text-[#1E2022]">Phone</label>
                <input
                  id="ov-phone"
                  type="tel"
                  value={contact.phone}
                  onChange={(e) => setContact({ ...contact, phone: e.target.value })}
                  autoComplete="tel"
                  className={inputClass(errors.phone)}
                />
                {errors.phone && <p className="mt-1 text-[11px] text-rose-600">{errors.phone}</p>}
              </div>
              <div>
                <label htmlFor="ov-email" className="text-xs font-semibold text-[#1E2022]">Email</label>
                <input
                  id="ov-email"
                  type="email"
                  value={contact.email}
                  onChange={(e) => setContact({ ...contact, email: e.target.value })}
                  autoComplete="email"
                  className={inputClass(errors.email)}
                />
                {errors.email && <p className="mt-1 text-[11px] text-rose-600">{errors.email}</p>}
              </div>

              <button
                type="submit"
                disabled={totalStops === 0}
                className="w-full py-3 rounded-full bg-[#1E2022] hover:bg-[#C2571A] text-white text-sm font-semibold disabled:opacity-40 transition-colors cursor-pointer"
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
  );
};
