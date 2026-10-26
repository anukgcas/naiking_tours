import React from 'react';
import { BedDouble, Check, Clock, MapPin, Plane, Ship, UserRound, Car } from 'lucide-react';
import { ArrivalMode, DepartureDetails, PlanState, TripDraft } from '../types';
import {
  arrivalPointLabel,
  defaultDeparture,
  getDestination,
  getHotels,
  vehicleOptions,
} from '../data/planner';
import { clock12, inputClass, labelClass } from './Day1Arrival';

interface LastDayDepartureProps {
  draft: TripDraft;
  plan: PlanState;
  onPlanChange: (plan: PlanState) => void;
}

const MODES: { id: ArrivalMode; label: string; icon: React.ReactNode }[] = [
  { id: 'airport', label: 'Drop at airport', icon: <Plane className="w-4 h-4" /> },
  { id: 'address', label: 'Other address', icon: <MapPin className="w-4 h-4" /> },
  { id: 'self', label: "I'll leave on my own", icon: <UserRound className="w-4 h-4" /> },
];

/** Last-day card on the planner: pickup from the hotel and where the group is dropped. */
export const LastDayDeparture: React.FC<LastDayDepartureProps> = ({ draft, plan, onPlanChange }) => {
  const dest = getDestination(draft.destinationId);
  if (!dest) return null;

  const hotels = getHotels(dest.id);
  const departure: DepartureDetails = plan.departure ?? defaultDeparture(draft, plan);
  const vehicles = vehicleOptions(dest.id);
  const byWater = dest.id === 'maldives';
  const update = (patch: Partial<DepartureDetails>) =>
    onPlanChange({ ...plan, departure: { ...departure, ...patch } });

  const hotel = hotels.find((h) => h.id === departure.pickupHotelId);
  const pickupName = hotel ? hotel.name : departure.otherPickup.trim() || 'your hotel';
  const dropLabel =
    departure.mode === 'airport'
      ? arrivalPointLabel(dest.id)
      : departure.address.trim() || 'your address';

  return (
    <div className="mt-4 rounded-2xl border border-[#C2571A]/20 bg-gradient-to-br from-[#FFF6EC] to-white p-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="w-8 h-8 rounded-xl bg-[#C2571A] text-white flex items-center justify-center">
          {byWater ? <Ship className="w-4 h-4" /> : <Car className="w-4 h-4" />}
        </span>
        <div className="min-w-0">
          <h4 className="text-[16px] font-semibold text-[#1E2022]">Departure, pickup & drop</h4>
          <p className="text-[13px] text-[#6B7280]">
            Choose when we collect you and where you are dropped on your last day.
          </p>
        </div>
      </div>

      {/* Drop location */}
      <div className="mt-4">
        <span className={labelClass}>Drop location</span>
        <div role="radiogroup" aria-label="Drop location" className="flex flex-wrap gap-2">
          {MODES.map((m) => {
            const on = departure.mode === m.id;
            return (
              <button
                key={m.id}
                type="button"
                role="radio"
                aria-checked={on}
                onClick={() => update({ mode: m.id })}
                className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-full border text-[14px] font-semibold transition-colors cursor-pointer ${
                  on
                    ? 'bg-[#C2571A] border-[#C2571A] text-white'
                    : 'bg-white border-[#1E2022]/15 text-[#4B4F55] hover:border-[#C2571A]/50 hover:text-[#1E2022]'
                }`}
              >
                {m.icon}
                {m.label}
              </button>
            );
          })}
        </div>

        {departure.mode === 'airport' && (
          <p className="mt-2 text-[14px] text-[#4B4F55] inline-flex items-center gap-1.5">
            <Plane className="w-3.5 h-3.5 text-[#E5501A]" /> {arrivalPointLabel(dest.id)}
          </p>
        )}

        {departure.mode === 'address' && (
          <div className="mt-3">
            <label className={labelClass} htmlFor="departure-address">
              Drop address
            </label>
            <input
              id="departure-address"
              type="text"
              value={departure.address}
              onChange={(e) => update({ address: e.target.value })}
              placeholder="Terminal, station, hotel or street address"
              className={inputClass}
            />
          </div>
        )}

        {departure.mode !== 'self' && (
          <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className={labelClass} htmlFor="departure-time">
                Pickup time
              </label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B7280] pointer-events-none" />
                <input
                  id="departure-time"
                  type="time"
                  value={departure.time}
                  onChange={(e) => update({ time: e.target.value })}
                  className={`${inputClass} pl-9`}
                />
              </div>
            </div>
            <div>
              <label className={labelClass} htmlFor="departure-flight">
                Flight / train no. <span className="normal-case font-medium text-[#9CA3AF]">(optional)</span>
              </label>
              <input
                id="departure-flight"
                type="text"
                value={departure.flightNo}
                onChange={(e) => update({ flightNo: e.target.value })}
                placeholder="e.g. AI 382"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass} htmlFor="departure-vehicle">
                {byWater ? 'Transfer by' : 'Vehicle'}
              </label>
              <select
                id="departure-vehicle"
                value={departure.vehicle}
                onChange={(e) => update({ vehicle: e.target.value })}
                className={inputClass}
              >
                {(vehicles.includes(departure.vehicle) ? vehicles : [...vehicles, departure.vehicle]).map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Pickup place */}
      <div className="mt-5">
        <span className={labelClass}>Pick up from</span>
        <div role="radiogroup" aria-label="Pick up from" className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {hotels.map((h) => {
            const on = departure.pickupHotelId === h.id;
            return (
              <button
                key={h.id}
                type="button"
                role="radio"
                aria-checked={on}
                onClick={() => update({ pickupHotelId: h.id })}
                className={`text-left rounded-xl border p-3 transition-all cursor-pointer ${
                  on
                    ? 'bg-white border-[#C2571A] shadow-[0_0_0_3px_rgba(194,87,26,0.12)]'
                    : 'bg-white/70 border-[#1E2022]/12 hover:border-[#C2571A]/50 hover:bg-white'
                }`}
              >
                <div className="flex items-start gap-2">
                  <BedDouble className="w-4 h-4 mt-0.5 text-[#E5501A] shrink-0" />
                  <div className="min-w-0 flex-1">
                    <div className="text-[15px] font-semibold text-[#1E2022] leading-snug">{h.name}</div>
                    <div className="mt-0.5 inline-flex items-center gap-1 text-[12px] text-[#4B4F55]">
                      <MapPin className="w-3 h-3" /> {h.area}
                    </div>
                  </div>
                  {on && <Check className="w-4 h-4 text-[#C2571A] shrink-0" />}
                </div>
              </button>
            );
          })}

          <button
            type="button"
            role="radio"
            aria-checked={departure.pickupHotelId === 'other'}
            onClick={() => update({ pickupHotelId: 'other' })}
            className={`text-left rounded-xl border p-3 transition-all cursor-pointer ${
              departure.pickupHotelId === 'other'
                ? 'bg-white border-[#C2571A] shadow-[0_0_0_3px_rgba(194,87,26,0.12)]'
                : 'bg-white/70 border-[#1E2022]/12 hover:border-[#C2571A]/50 hover:bg-white'
            }`}
          >
            <div className="flex items-start gap-2">
              <BedDouble className="w-4 h-4 mt-0.5 text-[#6B7280] shrink-0" />
              <div className="min-w-0 flex-1">
                <div className="text-[15px] font-semibold text-[#1E2022] leading-snug">Somewhere else</div>
                <div className="text-[13px] text-[#6B7280] leading-snug">Your own hotel or another meeting point.</div>
              </div>
              {departure.pickupHotelId === 'other' && <Check className="w-4 h-4 text-[#C2571A] shrink-0" />}
            </div>
          </button>
        </div>

        {departure.pickupHotelId === 'other' && (
          <div className="mt-3">
            <label className={labelClass} htmlFor="departure-other-pickup">
              Pickup place
            </label>
            <input
              id="departure-other-pickup"
              type="text"
              value={departure.otherPickup}
              onChange={(e) => update({ otherPickup: e.target.value })}
              placeholder="Hotel or villa name, and area"
              className={inputClass}
            />
          </div>
        )}
      </div>

      {/* Plain-language recap */}
      <p className="mt-4 rounded-xl bg-white border border-[#1E2022]/10 px-3 py-2.5 text-[14px] text-[#1E2022] leading-snug">
        {departure.mode === 'self' ? (
          <>
            You make your own way from <strong>{pickupName}</strong>; no transfer is booked for the last day.
          </>
        ) : (
          <>
            <strong>{clock12(departure.time)}</strong> · {departure.vehicle} pickup from <strong>{pickupName}</strong>, drop
            at <strong>{dropLabel}</strong>.
          </>
        )}
      </p>
    </div>
  );
};
