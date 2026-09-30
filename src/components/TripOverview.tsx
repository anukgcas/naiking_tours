import React, { useMemo, useState } from 'react';
import {
  ArrowLeft,
  Bed,
  Calendar,
  Car,
  CheckCircle2,
  Clock,
  Moon,
  Sparkles,
  Sun,
  Sunrise,
  Users,
} from 'lucide-react';
import { DaySlot, PlanState, TripBooking, TripDraft } from '../types';
import {
  CATEGORY_STYLES,
  TIER_LABEL,
  budgetTier,
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
  const tier = TIER_LABEL[budgetTier(draft.budgetPerPerson)];

  const planned = useMemo(() => plannedActivities(plan), [plan]);
  const costs = useMemo(() => computeCosts(draft, plan), [draft, plan]);
  const insights = useMemo(() => planInsights(draft, plan), [draft, plan]);
  const totalStops = planned.reduce((n, d) => n + d.length, 0);
  const overBudget = costs.total > costs.budgetTotal;

  const [contact, setContact] = useState<ContactDetails>({ name: '', phone: '', email: '' });
  const [errors, setErrors] = useState<Partial<Record<keyof ContactDetails, string>>>({});
  const [confirmed, setConfirmed] = useState<TripBooking | null>(null);

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
                    {tier} tier boutique stay in {dest.name}, matched to your budget.
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

            <ol className="mt-6 space-y-5">
              {planned.map((items, i) => (
                <li key={i} className="rounded-2xl bg-white border border-[#1E2022]/8 overflow-hidden">
                  <div className="px-5 py-3 bg-[#1E2022]/[0.03] border-b border-[#1E2022]/8 flex items-center justify-between">
                    <h3 className="text-sm font-extrabold text-[#1E2022]">Day {i + 1}</h3>
                    <span className="text-xs text-[#6B7280]">{dayDate(draft.checkIn, i)}</span>
                  </div>
                  {items.length === 0 ? (
                    <p className="px-5 py-5 text-sm text-[#6B7280]">
                      Free day — unwind at your stay, or{' '}
                      <button type="button" onClick={onEditPlan} className="font-semibold text-[#C2571A] hover:underline cursor-pointer">
                        add something
                      </button>
                      .
                    </p>
                  ) : (
                    <ul className="divide-y divide-[#1E2022]/6">
                      {items.map((a) => (
                        <li key={a.id} className="px-5 py-3.5 flex gap-4">
                          <div className="w-24 shrink-0 pt-0.5 text-xs font-semibold text-[#6B7280] flex items-start gap-1.5">
                            {SLOT_ICON[a.slot]} {a.slot}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-[#1E2022]">{a.name}</p>
                            <p className="mt-0.5 text-xs text-[#6B7280]">{a.description}</p>
                            <div className="mt-1.5 flex flex-wrap items-center gap-2 text-[11px] text-[#6B7280]">
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-bold ${CATEGORY_STYLES[a.category].bg} ${CATEGORY_STYLES[a.category].text}`}>
                                {a.category}
                              </span>
                              <span className="inline-flex items-center gap-1">
                                <Clock className="w-3 h-3" /> {a.hours}h
                              </span>
                              <span>{a.cost === 0 ? 'Free' : `${formatINR(a.cost)} pp`}</span>
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
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
              <p
                className={`mt-3 px-3 py-2 rounded-lg text-xs font-semibold ${
                  overBudget ? 'bg-rose-50 text-rose-700' : 'bg-emerald-50 text-emerald-700'
                }`}
              >
                {overBudget
                  ? `${formatINR(costs.total - costs.budgetTotal)} over your budget of ${formatINR(costs.budgetTotal)}`
                  : `${formatINR(costs.budgetTotal - costs.total)} under your budget of ${formatINR(costs.budgetTotal)}`}
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
