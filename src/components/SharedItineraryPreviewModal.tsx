import React, { useMemo } from 'react';
import { PlanState, TripDraft } from '../types';
import {
  TIER_LABEL,
  arrivalSummary,
  cityForDay,
  computeCosts,
  dayDate,
  departureSummary,
  formatDate,
  formatINR,
  getDestination,
  plannedActivities,
  tripDays,
  tripVehicle,
} from '../data/planner';
import { CURATED_PACKAGES } from './CuratedPackages';
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  Clock,
  ExternalLink,
  MapPin,
  Printer,
  Sparkles,
  Users,
  X,
  Bed,
  Car,
} from 'lucide-react';

interface SharedItineraryPreviewModalProps {
  isOpen: boolean;
  draft: TripDraft | null;
  plan: PlanState | null;
  errorMessage?: string | null;
  onContinuePlanning: (draft: TripDraft, plan: PlanState) => void;
  onPrint: () => void;
  onDismiss: () => void;
}

export const SharedItineraryPreviewModal: React.FC<SharedItineraryPreviewModalProps> = ({
  isOpen,
  draft,
  plan,
  errorMessage,
  onContinuePlanning,
  onPrint,
  onDismiss,
}) => {
  if (!isOpen) return null;

  if (errorMessage || !draft || !plan) {
    return (
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="shared-error-title"
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
      >
        <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl border border-[#16222E]/10 p-6 text-center">
          <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h2 id="shared-error-title" className="text-lg font-bold text-[#16222E]">
            Unable to Load Shared Itinerary
          </h2>
          <p className="text-xs text-[#6B7280] mt-2 leading-relaxed">
            {errorMessage || 'The shared itinerary link is incomplete or malformed.'}
          </p>
          <p className="text-[11px] text-[#9CA3AF] mt-2">
            Your current active trip and saved trips remain completely safe and untouched.
          </p>
          <div className="mt-6 flex justify-center">
            <button
              type="button"
              onClick={onDismiss}
              className="px-5 py-2.5 rounded-full bg-[#16222E] text-white text-xs font-semibold hover:bg-[#0B4A82] transition cursor-pointer"
            >
              Continue to Naikings Tours
            </button>
          </div>
        </div>
      </div>
    );
  }

  const dest = getDestination(draft.destinationId);
  const days = tripDays(draft);
  const nights = Math.max(1, days - 1);
  const guests = draft.adults + draft.children;
  const tier = TIER_LABEL[draft.stayTier];
  const vehicle = tripVehicle(draft, plan);

  const curatedPkg = draft.packageId
    ? CURATED_PACKAGES.find((p) => p.id === draft.packageId)
    : null;

  const title = curatedPkg
    ? `${curatedPkg.name} (Customized)`
    : `${days}-Day ${dest?.name || 'Custom'} Journey`;

  const planned = useMemo(() => plannedActivities(plan), [plan]);
  const costs = useMemo(() => computeCosts(draft, plan), [draft, plan]);
  const totalStops = planned.reduce((acc, d) => acc + d.length, 0);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="shared-preview-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-3xl rounded-2xl bg-white shadow-2xl border border-[#16222E]/10 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Banner Alert: Non-destructive Preview Notice */}
        <div className="bg-[#0B4A82] text-white px-4 py-2.5 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#8CC7C4] shrink-0" />
            <span className="font-medium">
              Shared Itinerary Preview — This trip was shared with you. Your personal active trip is untouched.
            </span>
          </div>
          <button
            type="button"
            onClick={onDismiss}
            aria-label="Dismiss preview"
            className="text-white/80 hover:text-white p-1 rounded transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Header details */}
        <div className="p-5 border-b border-[#16222E]/8 bg-[#F6F8FA]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#0B4A82]">
                {curatedPkg ? 'Curated Signature Experience' : `${dest?.name} Tailor-Made`}
              </span>
              <h2 id="shared-preview-title" className="text-xl font-extrabold text-[#16222E] mt-0.5">
                {title}
              </h2>
              <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1 text-xs text-[#6B7280]">
                <span className="inline-flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" /> {formatDate(draft.checkIn)} – {formatDate(draft.checkOut)} ({days} Days / {nights} Nights)
                </span>
                <span className="inline-flex items-center gap-1">
                  <Users className="w-3.5 h-3.5" /> {guests} Guest{guests > 1 ? 's' : ''} ({draft.adults} Adults{draft.children > 0 ? `, ${draft.children} Children` : ''})
                </span>
                <span className="inline-flex items-center gap-1">
                  <Bed className="w-3.5 h-3.5" /> {costs.rooms} Room{costs.rooms > 1 ? 's' : ''} · {tier}
                </span>
                <span className="inline-flex items-center gap-1">
                  <Car className="w-3.5 h-3.5" /> {vehicle}
                </span>
              </div>
            </div>

            <div className="text-right shrink-0">
              <span className="text-[11px] text-[#6B7280] block font-medium">Estimated Package Total</span>
              <span className="text-2xl font-extrabold text-[#16222E]">{formatINR(costs.total)}</span>
              <span className="text-[11px] text-[#6B7280] block">
                Approx. {formatINR(costs.perPerson)} / guest
              </span>
            </div>
          </div>
        </div>

        {/* Scrollable Day-by-day Itinerary */}
        <div className="p-5 overflow-y-auto space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-[#16222E]">
              Scheduled Experiences ({totalStops} stops across {days} days)
            </h3>
            <span className="text-xs text-[#6B7280]">
              {arrivalSummary(draft, plan)}
            </span>
          </div>

          <div className="space-y-3">
            {planned.map((items, idx) => {
              const dayCity = cityForDay(draft, idx);
              const dateStr = dayDate(draft.checkIn, idx);
              return (
                <div key={idx} className="p-3.5 rounded-xl border border-[#16222E]/8 bg-[#F6F8FA]/60">
                  <div className="flex items-baseline justify-between mb-2">
                    <span className="text-xs font-bold text-[#16222E]">
                      Day {idx + 1}
                      {dayCity ? ` — ${dayCity.name}` : ''}
                    </span>
                    <span className="text-[11px] font-medium text-[#6B7280]">{dateStr}</span>
                  </div>

                  {items.length === 0 ? (
                    <p className="text-xs text-[#6B7280] italic">
                      Free day for relaxation and leisure at resort.
                    </p>
                  ) : (
                    <ul className="space-y-1.5">
                      {items.map((act) => (
                        <li key={act.id} className="text-xs flex items-baseline justify-between gap-2">
                          <div className="flex items-baseline gap-2">
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-white border border-[#16222E]/10 text-[#0B4A82]">
                              {act.slot}
                            </span>
                            <span className="font-semibold text-[#16222E]">{act.name}</span>
                            <span className="text-[11px] text-[#6B7280]">({act.hours}h · {act.category})</span>
                          </div>
                          <span className="text-[11px] text-[#4B4F55]">
                            {act.cost === 0 ? 'Included' : `${formatINR(act.cost)} pp`}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              );
            })}
          </div>

          {/* Pricing Disclaimer */}
          <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200/60 text-[11px] text-amber-900 leading-relaxed">
            <span className="font-bold">Price & Booking Transparency: </span>
            Prices displayed are real-time recalculations based on current catalogue rates for {guests} guests.
            All itineraries are subject to seasonal room and experience availability.
          </div>
        </div>

        {/* Modal Action Footer */}
        <div className="p-4 bg-[#F6F8FA] border-t border-[#16222E]/8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <button
            type="button"
            onClick={onPrint}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-[#16222E]/15 text-xs font-semibold text-[#16222E] hover:bg-white transition cursor-pointer w-full sm:w-auto justify-center"
          >
            <Printer className="w-3.5 h-3.5" /> Print / Save as PDF
          </button>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onDismiss}
              className="px-4 py-2 rounded-full text-xs font-semibold text-[#4B4F55] hover:text-[#16222E] hover:bg-white transition cursor-pointer"
            >
              Keep My Current Trip
            </button>
            <button
              type="button"
              onClick={() => onContinuePlanning(draft, plan)}
              className="px-5 py-2 rounded-full bg-[#16222E] hover:bg-[#0B4A82] text-white text-xs font-semibold shadow-sm transition cursor-pointer flex items-center gap-1.5"
            >
              <ExternalLink className="w-3.5 h-3.5" /> Continue Planning This Itinerary
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
