import React from 'react';
import { BedDouble, Car, Check, CheckCircle2, Clock, MapPin, Plane, Ship, UserRound } from 'lucide-react';
import { ArrivalMode, DepartureDetails, PlanState, TripDraft } from '../types';
import {
  arrivalPointLabel,
  defaultDeparture,
  getDestination,
  getHotels,
  vehicleOptions,
} from '../data/planner';
import { clock12, inputClass, labelClass } from './Day1Arrival';
import { ChoiceCard, LogisticsCard, LogisticsRecap, LogisticsSection, Segmented } from './LogisticsUi';

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
    departure.mode === 'airport' ? arrivalPointLabel(dest.id) : departure.address.trim() || 'your address';

  return (
    <LogisticsCard
      accent="amber"
      className="mt-5"
      icon={byWater ? <Ship className="w-5 h-5" /> : <Car className="w-5 h-5" />}
      tag="Last day · Departure"
      title="Departure, pickup & drop"
      subtitle="Choose when we collect you and where you are dropped on your last day."
    >
      <LogisticsSection accent="amber" n={1} title="Drop location">
        <Segmented value={departure.mode} onChange={(mode) => update({ mode })} options={MODES} label="Drop location" />

        {departure.mode === 'airport' && (
          <p className="mt-3 text-[14px] text-[#4B4F55] inline-flex items-center gap-1.5">
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
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#E5501A] pointer-events-none" />
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
      </LogisticsSection>

      <LogisticsSection accent="amber" n={2} title="Pick up from">
        <div role="radiogroup" aria-label="Pick up from" className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {hotels.map((h) => {
            const on = departure.pickupHotelId === h.id;
            return (
              <ChoiceCard key={h.id} on={on} accent="amber" onClick={() => update({ pickupHotelId: h.id })}>
                <div className="flex items-start gap-2.5">
                  <span className="mt-0.5 w-7 h-7 rounded-lg bg-[#E5501A]/10 text-[#C2571A] flex items-center justify-center shrink-0">
                    <BedDouble className="w-4 h-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="text-[15px] font-semibold text-[#14213D] leading-snug">{h.name}</div>
                    <div className="mt-0.5 inline-flex items-center gap-1 text-[12px] text-[#4B4F55]">
                      <MapPin className="w-3 h-3" /> {h.area}
                    </div>
                  </div>
                  {on && <Check className="w-4 h-4 text-[#E5501A] shrink-0" strokeWidth={3} />}
                </div>
              </ChoiceCard>
            );
          })}

          <ChoiceCard on={departure.pickupHotelId === 'other'} accent="amber" onClick={() => update({ pickupHotelId: 'other' })}>
            <div className="flex items-start gap-2.5">
              <span className="mt-0.5 w-7 h-7 rounded-lg bg-[#14213D]/[0.06] text-[#6B7280] flex items-center justify-center shrink-0">
                <BedDouble className="w-4 h-4" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="text-[15px] font-semibold text-[#14213D] leading-snug">Somewhere else</div>
                <div className="text-[13px] text-[#6B7280] leading-snug">Your own hotel or another meeting point.</div>
              </div>
              {departure.pickupHotelId === 'other' && <Check className="w-4 h-4 text-[#E5501A] shrink-0" strokeWidth={3} />}
            </div>
          </ChoiceCard>
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
      </LogisticsSection>

      <LogisticsRecap accent="amber" icon={<CheckCircle2 className="w-[18px] h-[18px]" />}>
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
      </LogisticsRecap>
    </LogisticsCard>
  );
};
