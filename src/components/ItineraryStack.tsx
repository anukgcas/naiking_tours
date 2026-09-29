import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronDown, Utensils, Bed } from 'lucide-react';
import { ItineraryDay } from '../types';
import { DayPlan } from '../data/itineraryStops';

interface ItineraryStackProps {
  days: ItineraryDay[];
  plans?: DayPlan[];
}

const HOVER_INTENT_MS = 140;
const HOVER_LOCK_MS = 650;

/**
 * Layered day cards: collapsed days peek out behind each other; the active day
 * unfolds into a timeline of stops. Opens on click, or on hover (with a short
 * intent delay + lock so the layout shift can't cause flicker).
 */
export const ItineraryStack: React.FC<ItineraryStackProps> = ({ days, plans }) => {
  const [active, setActive] = useState(0);
  const timer = useRef<number | null>(null);
  const lockUntil = useRef(0);

  useEffect(() => {
    setActive(0);
  }, [days]);

  useEffect(() => () => {
    if (timer.current) window.clearTimeout(timer.current);
  }, []);

  const activate = (i: number) => {
    lockUntil.current = Date.now() + HOVER_LOCK_MS;
    setActive(i);
  };

  const onEnter = (i: number) => {
    if (i === active) return;
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      if (Date.now() >= lockUntil.current) activate(i);
    }, HOVER_INTENT_MS);
  };

  const onLeave = () => {
    if (timer.current) window.clearTimeout(timer.current);
  };

  return (
    <div className="w-full" onMouseLeave={onLeave}>
      {days.map((day, i) => {
        const plan = plans?.[i];
        const label = plan?.label ?? day.theme;
        const places = plan?.places ?? day.subtitle;
        const stops: [string, string][] =
          plan?.stops ?? [
            ['Morning', day.morning],
            ['Afternoon', day.afternoon],
            ['Evening', day.evening],
          ];
        const isActive = i === active;
        const dist = Math.abs(i - active);
        const inset = isActive ? 0 : Math.min(dist, 3) * 14;

        return (
          <motion.section
            key={day.dayNumber}
            animate={{ marginLeft: inset, marginRight: inset }}
            transition={{ type: 'spring', stiffness: 320, damping: 32 }}
            onMouseEnter={() => onEnter(i)}
            className={`relative rounded-3xl border ${i === 0 ? '' : '-mt-4 pt-4'} ${
              isActive
                ? 'bg-white border-[#1E2022]/12 shadow-2xl'
                : 'bg-[#F4EFE7] border-[#1E2022]/8 shadow-md'
            }`}
            style={{ zIndex: isActive ? 50 : 40 - dist, willChange: 'margin' }}
          >
            <button
              type="button"
              onClick={() => activate(i)}
              onFocus={() => setActive(i)}
              aria-expanded={isActive}
              className="w-full flex items-center justify-between gap-3 px-5 sm:px-7 py-4 text-left cursor-pointer"
            >
              <span className="flex items-baseline gap-3 min-w-0">
                <span className="text-xs font-extrabold tracking-[0.18em] text-[#C2571A] whitespace-nowrap">
                  DAY {String(day.dayNumber).padStart(2, '0')}
                </span>
                {!isActive && (
                  <span className="text-sm font-semibold text-[#1E2022] truncate">{label}</span>
                )}
              </span>
              <span className="flex items-center gap-1.5 text-xs text-[#6B7280] whitespace-nowrap">
                {stops.length} stops
                <ChevronDown
                  className={`w-4 h-4 transition-transform duration-300 ${isActive ? 'rotate-180' : ''}`}
                />
              </span>
            </button>

            <AnimatePresence initial={false}>
              {isActive && (
                <motion.div
                  key="body"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                  className="overflow-hidden"
                >
                  <div className="px-5 sm:px-7 pb-7">
                    <h4 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#1E2022]">
                      {label}
                    </h4>
                    <p className="mt-1 text-sm text-[#C2571A] font-medium">{places}</p>
                    <p className="mt-3 text-sm text-[#555A60] leading-relaxed max-w-2xl">{day.title}</p>

                    {/* Timeline */}
                    <ol className="mt-7">
                      {stops.map(([time, title], s) => {
                        const last = s === stops.length - 1;
                        return (
                          <motion.li
                            key={time + title}
                            initial={{ opacity: 0, x: -8 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.12 + s * 0.05, duration: 0.35 }}
                            className="grid grid-cols-[3.75rem_1.5rem_1fr] items-start gap-x-2"
                          >
                            <span className="text-xs text-[#6B7280] tabular-nums pt-1.5">{time}</span>
                            <span className="relative flex justify-center self-stretch">
                              <span
                                className={`relative z-10 mt-2 w-3 h-3 rounded-full ${
                                  last
                                    ? 'bg-white border-2 border-[#C2571A]/40'
                                    : 'bg-[#C2571A] ring-4 ring-[#C2571A]/15'
                                }`}
                              />
                              {!last && (
                                <span className="absolute top-4 bottom-[-0.5rem] w-px bg-[#C2571A]/30" />
                              )}
                            </span>
                            <span className="pb-5 text-base font-semibold text-[#1E2022] leading-snug">
                              {title}
                            </span>
                          </motion.li>
                        );
                      })}
                    </ol>

                    {/* Day meta */}
                    <div className="mt-2 pt-4 border-t border-[#1E2022]/8 flex flex-wrap gap-x-6 gap-y-2 text-xs text-[#555A60]">
                      <span className="inline-flex items-center gap-1.5">
                        <Utensils className="w-3.5 h-3.5 text-[#C2571A]" />
                        <strong className="text-[#1E2022]">Meals:</strong> {day.mealsIncluded.join(', ') || '—'}
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <Bed className="w-3.5 h-3.5 text-[#C2571A]" />
                        <strong className="text-[#1E2022]">Stay:</strong> {day.stay}
                      </span>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.section>
        );
      })}
    </div>
  );
};
