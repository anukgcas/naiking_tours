import React from 'react';
import { BedDouble, Car, Check, Clock, MapPin, Plane, Ship, UserRound } from 'lucide-react';
import { ArrivalDetails, ArrivalMode, PlanState, TripDraft } from '../types';
import {
  TIER_LABEL,
  arrivalPointLabel,
  defaultArrival,
  formatINR,
  getDestination,
  getHotels,
  vehicleOptions,
} from '../data/planner';

interface Day1ArrivalProps {
  draft: TripDraft;
  plan: PlanState;
  onPlanChange: (plan: PlanState) => void;
  /** Picking a hotel from another stay style moves the trip to that style so pricing stays in step. */
  onStayTierChange: (tier: TripDraft['stayTier']) => void;
}

const MODES: { id: ArrivalMode; label: string; icon: React.ReactNode }[] = [
  { id: 'airport', label: 'Airport pickup', icon: <Plane className="w-4 h-4" /> },
  { id: 'address', label: 'Other address', icon: <MapPin className="w-4 h-4" /> },
  { id: 'self', label: "I'll reach on my own", icon: <UserRound className="w-4 h-4" /> },
];

export const inputClass =
  'w-full h-10 px-3 rounded-xl bg-white border border-[#1E2022]/15 text-[15px] text-[#1E2022] placeholder:text-[#9CA3AF] focus:outline-none focus:border-[#14213D] focus:ring-2 focus:ring-[#14213D]/15 transition';

export const labelClass = 'block mb-1.5 text-[12px] font-bold uppercase tracking-wider text-[#6B7280]';

export const clock12 = (hhmm: string) => {
  const [h, m] = hhmm.split(':').map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return hhmm;
  return `${h % 12 === 0 ? 12 : h % 12}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`;
};

export const Day1Arrival: React.FC<Day1ArrivalProps> = ({ draft, plan, onPlanChange, onStayTierChange }) => {
  const dest = getDestination(draft.destinationId);
  if (!dest) return null;

  const hotels = getHotels(dest.id);
  const arrival: ArrivalDetails = plan.arrival ?? defaultArrival(draft);
  const vehicles = vehicleOptions(dest.id);
  const byWater = dest.id === 'maldives';
  const update = (patch: Partial<ArrivalDetails>) => onPlanChange({ ...plan, arrival: { ...arrival, ...patch } });

  const hotel = hotels.find((h) => h.id === arrival.hotelId);
  const hotelName = hotel ? hotel.name : arrival.otherHotel.trim() || 'your own hotel';
  const pickupLabel =
    arrival.mode === 'airport'
      ? arrivalPointLabel(dest.id)
      : arrival.mode === 'address'
        ? arrival.address.trim() || 'your address'
        : 'You arrive on your own';

  const chooseHotel = (id: string) => {
    update({ hotelId: id });
    const picked = hotels.find((h) => h.id === id);
    if (picked && picked.tier !== draft.stayTier) onStayTierChange(picked.tier);
  };

  return (
    <div className="mb-4 rounded-2xl border border-[#14213D]/10 bg-white p-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="w-8 h-8 rounded-xl bg-[#14213D] text-white flex items-center justify-center">
          {byWater ? <Ship className="w-4 h-4" /> : <Car className="w-4 h-4" />}
        </span>
        <div className="min-w-0">
          <h4 className="text-[16px] font-semibold text-[#1E2022]">Arrival, pickup & hotel</h4>
          <p className="text-[13px] text-[#6B7280]">
            Tell us where to meet you and which hotel you are heading to.
          </p>
        </div>
      </div>

      {/* Pickup */}
      <div className="mt-4">
        <span className={labelClass}>Pickup from</span>
        <div role="radiogroup" aria-label="Pickup from" className="flex flex-wrap gap-2">
          {MODES.map((m) => {
            const on = arrival.mode === m.id;
            return (
              <button
                key={m.id}
                type="button"
                role="radio"
                aria-checked={on}
                onClick={() => update({ mode: m.id })}
                className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-full border text-[14px] font-semibold transition-colors cursor-pointer ${
                  on
                    ? 'bg-[#14213D] border-[#14213D] text-white'
                    : 'bg-white border-[#1E2022]/15 text-[#4B4F55] hover:border-[#14213D]/50 hover:text-[#1E2022]'
                }`}
              >
                {m.icon}
                {m.label}
              </button>
            );
          })}
        </div>

        {arrival.mode === 'airport' && (
          <p className="mt-2 text-[14px] text-[#4B4F55] inline-flex items-center gap-1.5">
            <Plane className="w-3.5 h-3.5 text-[#16878C]" /> {arrivalPointLabel(dest.id)}
          </p>
        )}

        {arrival.mode === 'address' && (
          <div className="mt-3">
            <label className={labelClass} htmlFor="arrival-address">
              Pickup address
            </label>
            <input
              id="arrival-address"
              type="text"
              value={arrival.address}
              onChange={(e) => update({ address: e.target.value })}
              placeholder="Terminal, station, villa name or street address"
              className={inputClass}
            />
          </div>
        )}

        {arrival.mode !== 'self' && (
          <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className={labelClass} htmlFor="arrival-time">
                Pickup time
              </label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B7280] pointer-events-none" />
                <input
                  id="arrival-time"
                  type="time"
                  value={arrival.time}
                  onChange={(e) => update({ time: e.target.value })}
                  className={`${inputClass} pl-9`}
                />
              </div>
            </div>
            <div>
              <label className={labelClass} htmlFor="arrival-flight">
                Flight / train no. <span className="normal-case font-medium text-[#9CA3AF]">(optional)</span>
              </label>
              <input
                id="arrival-flight"
                type="text"
                value={arrival.flightNo}
                onChange={(e) => update({ flightNo: e.target.value })}
                placeholder="e.g. AI 381"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass} htmlFor="arrival-vehicle">
                {byWater ? 'Transfer by' : 'Vehicle'}
              </label>
              <select
                id="arrival-vehicle"
                value={arrival.vehicle}
                onChange={(e) => update({ vehicle: e.target.value })}
                className={inputClass}
              >
                {(vehicles.includes(arrival.vehicle) ? vehicles : [...vehicles, arrival.vehicle]).map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Hotel drop */}
      <div className="mt-5">
        <span className={labelClass}>{arrival.mode === 'self' ? 'Your hotel' : 'Drop at hotel'}</span>
        <div role="radiogroup" aria-label="Hotel" className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {hotels.map((h) => {
            const on = arrival.hotelId === h.id;
            return (
              <button
                key={h.id}
                type="button"
                role="radio"
                aria-checked={on}
                onClick={() => chooseHotel(h.id)}
                className={`text-left rounded-xl border p-3 transition-all cursor-pointer ${
                  on
                    ? 'bg-white border-[#14213D] shadow-[0_0_0_3px_rgba(20,33,61,0.12)]'
                    : 'bg-white/70 border-[#1E2022]/12 hover:border-[#14213D]/50 hover:bg-white'
                }`}
              >
                <div className="flex items-start gap-2">
                  <BedDouble className="w-4 h-4 mt-0.5 text-[#16878C] shrink-0" />
                  <div className="min-w-0 flex-1">
                    <div className="text-[15px] font-semibold text-[#1E2022] leading-snug">{h.name}</div>
                    <div className="text-[13px] text-[#6B7280] leading-snug">{h.blurb}</div>
                    <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[12px]">
                      <span className="inline-flex items-center gap-1 text-[#4B4F55]">
                        <MapPin className="w-3 h-3" /> {h.area}
                      </span>
                      <span className="px-1.5 py-0.5 rounded-full bg-[#1F9EA3]/10 text-[#16878C] font-bold">
                        {TIER_LABEL[h.tier]}
                      </span>
                      <span className="text-[#6B7280]">from {formatINR(dest.stayPerNight[h.tier])} / night</span>
                    </div>
                  </div>
                  {on && <Check className="w-4 h-4 text-[#14213D] shrink-0" />}
                </div>
              </button>
            );
          })}

          <button
            type="button"
            role="radio"
            aria-checked={arrival.hotelId === 'other'}
            onClick={() => update({ hotelId: 'other' })}
            className={`text-left rounded-xl border p-3 transition-all cursor-pointer ${
              arrival.hotelId === 'other'
                ? 'bg-white border-[#14213D] shadow-[0_0_0_3px_rgba(20,33,61,0.12)]'
                : 'bg-white/70 border-[#1E2022]/12 hover:border-[#14213D]/50 hover:bg-white'
            }`}
          >
            <div className="flex items-start gap-2">
              <BedDouble className="w-4 h-4 mt-0.5 text-[#6B7280] shrink-0" />
              <div className="min-w-0 flex-1">
                <div className="text-[15px] font-semibold text-[#1E2022] leading-snug">I have my own hotel</div>
                <div className="text-[13px] text-[#6B7280] leading-snug">Already booked? Tell us the name and we will drop you there.</div>
              </div>
              {arrival.hotelId === 'other' && <Check className="w-4 h-4 text-[#14213D] shrink-0" />}
            </div>
          </button>
        </div>

        {arrival.hotelId === 'other' && (
          <div className="mt-3">
            <label className={labelClass} htmlFor="arrival-other-hotel">
              Hotel name
            </label>
            <input
              id="arrival-other-hotel"
              type="text"
              value={arrival.otherHotel}
              onChange={(e) => update({ otherHotel: e.target.value })}
              placeholder="Hotel or villa name, and area"
              className={inputClass}
            />
          </div>
        )}
      </div>

      {/* Plain-language recap */}
      <p className="mt-4 rounded-xl bg-white border border-[#1E2022]/10 px-3 py-2.5 text-[14px] text-[#1E2022] leading-snug">
        {arrival.mode === 'self' ? (
          <>
            You make your own way to <strong>{hotelName}</strong>; we will meet you there on Day 1.
          </>
        ) : (
          <>
            <strong>{clock12(arrival.time)}</strong> · {arrival.vehicle} pickup from <strong>{pickupLabel}</strong>, drop
            at <strong>{hotelName}</strong>.
          </>
        )}
      </p>
    </div>
  );
};
