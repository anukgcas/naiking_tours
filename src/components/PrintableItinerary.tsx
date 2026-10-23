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

interface PrintableItineraryProps {
  draft: TripDraft;
  plan: PlanState;
}

export const PrintableItinerary: React.FC<PrintableItineraryProps> = ({ draft, plan }) => {
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

  const exportDate = new Date().toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  return (
    <div id="printable-itinerary" className="printable-itinerary bg-white text-[#16222E] p-6 max-w-4xl mx-auto print:p-0 print:max-w-none">
      {/* Brand Header */}
      <div className="border-b-2 border-[#16222E] pb-4 mb-6 flex justify-between items-start">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-2xl tracking-tight text-[#16222E]">
              NAIKINGS <span className="text-[#0B4A82]">TOURS</span>
            </span>
          </div>
          <p className="text-xs font-semibold text-[#4B4F55] uppercase tracking-widest mt-0.5">
            Bespoke Luxury & Private Journeys
          </p>
        </div>
        <div className="text-right text-xs text-[#6B7280]">
          <p className="font-semibold text-[#16222E]">Naikings Concierge Desk</p>
          <p>concierge@naikingtours.com</p>
          <p>+91 98765 43210</p>
          <p className="mt-1 text-[11px] text-[#9CA3AF]">Exported on {exportDate}</p>
        </div>
      </div>

      {/* Itinerary Title & High-level Summary */}
      <div className="mb-6">
        <div className="inline-block px-2.5 py-0.5 rounded bg-[#EEF4F8] text-[#0B4A82] text-[11px] font-bold uppercase tracking-wider mb-1.5">
          {curatedPkg ? 'Curated Signature Journey' : 'Tailor-Made Itinerary'}
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-[#16222E]">{title}</h1>
        <p className="text-sm text-[#4B4F55] mt-1">
          {dest?.name}, {dest?.country} · {days} Days / {nights} Nights · {guests} Guest{guests > 1 ? 's' : ''} ({draft.adults} Adults{draft.children > 0 ? `, ${draft.children} Children` : ''})
        </p>
      </div>

      {/* Overview Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-[#F6F8FA] border border-[#16222E]/10 rounded-xl mb-6 text-xs">
        <div>
          <span className="text-[#6B7280] block font-medium">Travel Dates</span>
          <span className="font-bold text-[#16222E]">{formatDate(draft.checkIn)} – {formatDate(draft.checkOut)}</span>
        </div>
        <div>
          <span className="text-[#6B7280] block font-medium">Accommodation</span>
          <span className="font-bold text-[#16222E]">{costs.rooms} Room{costs.rooms > 1 ? 's' : ''} · {tier} Tier</span>
        </div>
        <div>
          <span className="text-[#6B7280] block font-medium">Private Transport</span>
          <span className="font-bold text-[#16222E]">{vehicle}</span>
        </div>
        <div>
          <span className="text-[#6B7280] block font-medium">Scheduled Experiences</span>
          <span className="font-bold text-[#16222E]">{totalStops} Planned Stop{totalStops === 1 ? '' : 's'}</span>
        </div>
      </div>

      {/* Transport & Logistics Highlights */}
      <div className="mb-6 p-3.5 border border-[#16222E]/10 rounded-xl bg-white text-xs">
        <h2 className="font-bold text-[#16222E] text-xs uppercase tracking-wider mb-2">Transport & Arrival Logistics</h2>
        <div className="grid sm:grid-cols-2 gap-2 text-[#4B4F55]">
          <div>
            <span className="font-semibold text-[#16222E]">Day 1 Arrival: </span>
            {arrivalSummary(draft, plan)}
          </div>
          <div>
            <span className="font-semibold text-[#16222E]">Day {days} Departure: </span>
            {departureSummary(draft, plan)}
          </div>
        </div>
      </div>

      {/* Day by Day Breakdown */}
      <div className="mb-6">
        <h2 className="font-bold text-base text-[#16222E] border-b border-[#16222E]/10 pb-2 mb-4">
          Day-by-Day Itinerary Schedule
        </h2>

        {planned.length === 0 || totalStops === 0 ? (
          <div className="p-4 rounded-xl border border-dashed border-[#16222E]/20 text-center text-sm text-[#6B7280]">
            No activities have been scheduled yet. This customized itinerary currently includes your boutique stay and private chauffeured transfers.
          </div>
        ) : (
          <div className="space-y-4">
            {planned.map((items, idx) => {
              const dayCity = cityForDay(draft, idx);
              const dateStr = dayDate(draft.checkIn, idx);
              return (
                <div
                  key={idx}
                  className="border border-[#16222E]/12 rounded-xl p-3.5 bg-white print-avoid-break"
                >
                  <div className="flex justify-between items-baseline mb-2 pb-1.5 border-b border-[#16222E]/8">
                    <span className="font-bold text-sm text-[#16222E]">
                      Day {idx + 1}
                      {dayCity ? ` — ${dayCity.name}` : ''}
                    </span>
                    <span className="text-xs font-medium text-[#6B7280]">{dateStr}</span>
                  </div>

                  {items.length === 0 ? (
                    <p className="text-xs text-[#6B7280] italic py-1">
                      Free day for relaxation, leisure, and exploring at your own pace.
                    </p>
                  ) : (
                    <ul className="space-y-2 mt-2">
                      {items.map((act) => (
                        <li key={act.id} className="flex items-start gap-2 text-xs">
                          <span className="px-1.5 py-0.5 rounded bg-[#EEF4F8] text-[#0B4A82] text-[10px] font-bold shrink-0 mt-0.5">
                            {act.slot}
                          </span>
                          <div className="flex-1 min-w-0">
                            <span className="font-bold text-[#16222E]">{act.name}</span>
                            <span className="text-[#6B7280] ml-2 font-medium">
                              ({act.hours}h · {act.category})
                            </span>
                            {act.description && (
                              <p className="text-[#6B7280] text-[11px] mt-0.5 leading-snug">
                                {act.description}
                              </p>
                            )}
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Cost Breakdown */}
      <div className="mb-6 p-4 rounded-xl border border-[#16222E]/12 bg-[#F6F8FA] print-avoid-break">
        <h2 className="font-bold text-sm text-[#16222E] uppercase tracking-wider mb-2">
          Estimated Itinerary Cost Breakdown
        </h2>
        <div className="space-y-1.5 text-xs text-[#4B4F55]">
          <div className="flex justify-between">
            <span>Boutique Accommodation ({costs.rooms} Room{costs.rooms > 1 ? 's' : ''}, {nights} Nights, {tier} Tier)</span>
            <span className="font-semibold text-[#16222E]">{formatINR(costs.stay)}</span>
          </div>
          <div className="flex justify-between">
            <span>Private Chauffeured Transfers ({days} Days, {vehicle})</span>
            <span className="font-semibold text-[#16222E]">{formatINR(costs.transfers)}</span>
          </div>
          <div className="flex justify-between">
            <span>Curated Experiences & Admissions ({totalStops} Activity Stops)</span>
            <span className="font-semibold text-[#16222E]">{formatINR(costs.activities)}</span>
          </div>
          <div className="flex justify-between">
            <span>Concierge Coordination & On-Ground Support (5%)</span>
            <span className="font-semibold text-[#16222E]">{formatINR(costs.service)}</span>
          </div>
          <div className="border-t border-[#16222E]/10 pt-2 flex justify-between items-baseline text-sm">
            <span className="font-extrabold text-[#16222E]">Total Estimated Price</span>
            <span className="font-extrabold text-lg text-[#16222E]">{formatINR(costs.total)}</span>
          </div>
          <div className="text-[11px] text-[#6B7280] text-right">
            Approx. {formatINR(costs.perPerson)} per guest ({guests} guest{guests > 1 ? 's' : ''})
          </div>
        </div>

        <div className="mt-3 pt-2.5 border-t border-[#16222E]/8 text-[10px] text-[#6B7280] leading-relaxed">
          <p className="font-bold text-[#16222E] uppercase">Price Disclosure:</p>
          <p>
            All prices are estimates in INR calculated according to current catalogue rates. Final prices, flight bookings, and reservations are confirmed by our concierge team upon availability check. No booking is confirmed until formal deposit receipt.
          </p>
        </div>
      </div>

      {/* Footer / Notes */}
      <div className="border-t border-[#16222E]/10 pt-3 text-center text-[10px] text-[#9CA3AF]">
        <p>Naikings Tours & Travels Pvt. Ltd. · Bespoke Itineraries & Private Chauffeurs</p>
        <p className="mt-0.5">To modify or book this itinerary, share this document with concierge@naikingtours.com or call +91 98765 43210.</p>
      </div>
    </div>
  );
};
