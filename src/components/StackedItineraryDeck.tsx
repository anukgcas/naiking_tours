import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Utensils, Bed, Sparkles, Sun, Sunset, Moon, ArrowUpRight } from 'lucide-react';
import { ItineraryDay } from '../types';

interface StackedItineraryDeckProps {
  days: ItineraryDay[];
}

export const StackedItineraryDeck: React.FC<StackedItineraryDeckProps> = ({ days }) => {
  const [activeDayIndex, setActiveDayIndex] = useState(0);

  return (
    <div className="w-full select-none">
      {/* Editorial Section Introduction */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-5 gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#C2571A]" />
            <h4 className="text-base sm:text-lg font-bold text-[#1E2022] tracking-tight">
              Tactile Daily Itinerary
            </h4>
          </div>
          <p className="text-xs text-[#6B7280] mt-0.5">
            Samsung lock-screen stacked deck interaction. Tap any card below to spring it to the foreground.
          </p>
        </div>

        {/* Tactile Day Indicators / Quick Deck Selector */}
        <div className="flex items-center gap-1.5 p-1 bg-[#1E2022]/4 rounded-xl border border-[#1E2022]/6 shrink-0 overflow-x-auto">
          {days.map((day, idx) => (
            <button
              key={day.dayNumber}
              type="button"
              onClick={() => setActiveDayIndex(idx)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeDayIndex === idx
                  ? 'bg-[#1E2022] text-white shadow-xs scale-102'
                  : 'text-[#6B7280] hover:text-[#1E2022] hover:bg-black/5'
              }`}
            >
              DAY 0{day.dayNumber}
            </button>
          ))}
        </div>
      </div>

      {/* Samsung Lockscreen Inspired Stacked Cards Deck */}
      <div className="relative min-h-[580px] sm:min-h-[620px] w-full pt-1 pb-10">
        {days.map((day, index) => {
          const isActive = index === activeDayIndex;
          const order = index - activeDayIndex;
          const isBehind = order > 0;
          const isAhead = order < 0;

          let zIndex = 30;
          let translateY = 0;
          let scale = 1;
          let opacity = 1;

          if (isActive) {
            zIndex = 30;
            translateY = 0;
            scale = 1;
            opacity = 1;
          } else if (isBehind) {
            zIndex = 30 - order * 4;
            translateY = 440 + (order - 1) * 44;
            scale = Math.max(0.88, 1 - order * 0.035);
            opacity = 0.96;
          } else if (isAhead) {
            const aheadDiff = Math.abs(order);
            zIndex = 30 - aheadDiff * 4;
            translateY = -(aheadDiff * 14);
            scale = Math.max(0.88, 1 - aheadDiff * 0.035);
            opacity = 0.65;
          }

          return (
            <motion.div
              key={day.dayNumber}
              onClick={() => setActiveDayIndex(index)}
              layout
              initial={false}
              animate={{
                y: translateY,
                scale: scale,
                opacity: opacity,
                zIndex: zIndex,
              }}
              transition={{
                type: 'spring',
                stiffness: 340,
                damping: 32,
                mass: 0.75,
              }}
              className={`absolute left-0 right-0 rounded-3xl transition-all cursor-pointer ${
                isActive
                  ? 'bg-white border-2 border-[#1E2022]/15 shadow-2xl p-5 sm:p-7 ring-1 ring-black/5'
                  : 'bg-[#FCFBF8] border border-[#1E2022]/12 shadow-lg p-4 sm:p-5 hover:border-[#C2571A]/40 hover:bg-white'
              }`}
              style={{
                top: 0,
                transformOrigin: 'top center',
              }}
            >
              {/* Card Header Strip (Always visible even when stacked) */}
              <div className="flex items-center justify-between pb-3 border-b border-[#1E2022]/8">
                <div className="flex items-center gap-3">
                  <span
                    className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold tracking-wider ${
                      isActive
                        ? 'bg-[#C2571A] text-white shadow-2xs'
                        : 'bg-[#1E2022]/10 text-[#1E2022]'
                    }`}
                  >
                    DAY 0{day.dayNumber}
                  </span>
                  <span className="text-xs font-semibold uppercase tracking-wider text-[#6B7280]">
                    {day.theme}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {!isActive && (
                    <span className="text-xs font-semibold text-[#C2571A] flex items-center gap-0.5">
                      <span>Bring to front</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </span>
                  )}
                  {isActive && (
                    <span className="text-[11px] font-semibold text-[#9CA3AF] uppercase tracking-wider">
                      Active Day
                    </span>
                  )}
                </div>
              </div>

              {/* Title & Subtitle */}
              <div className="mt-3">
                <h5 className="text-base sm:text-lg font-bold text-[#1E2022]">
                  {day.title}
                </h5>
                <p className="text-xs sm:text-sm text-[#6B7280] mt-0.5">
                  {day.subtitle}
                </p>
              </div>

              {/* FULL Day Details: Only visible when active card is at front */}
              <AnimatePresence>
                {isActive && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2, delay: 0.03 }}
                    className="mt-5 space-y-3.5 text-xs sm:text-sm text-[#374151]"
                  >
                    {/* Morning */}
                    <div className="flex items-start gap-3 p-3 sm:p-3.5 rounded-2xl bg-[#FAF8F5] border border-black/5">
                      <div className="w-7 h-7 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0 mt-0.5">
                        <Sun className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="font-bold text-[#1E2022] block text-[11px] uppercase tracking-wider mb-0.5">
                          Morning Ritual
                        </span>
                        <p className="leading-relaxed text-[#4B5563] text-xs sm:text-sm">
                          {day.morning}
                        </p>
                      </div>
                    </div>

                    {/* Afternoon */}
                    <div className="flex items-start gap-3 p-3 sm:p-3.5 rounded-2xl bg-[#FAF8F5] border border-black/5">
                      <div className="w-7 h-7 rounded-xl bg-orange-500/10 text-orange-600 flex items-center justify-center shrink-0 mt-0.5">
                        <Sunset className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="font-bold text-[#1E2022] block text-[11px] uppercase tracking-wider mb-0.5">
                          Afternoon Excursion
                        </span>
                        <p className="leading-relaxed text-[#4B5563] text-xs sm:text-sm">
                          {day.afternoon}
                        </p>
                      </div>
                    </div>

                    {/* Evening */}
                    <div className="flex items-start gap-3 p-3 sm:p-3.5 rounded-2xl bg-[#FAF8F5] border border-black/5">
                      <div className="w-7 h-7 rounded-xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center shrink-0 mt-0.5">
                        <Moon className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="font-bold text-[#1E2022] block text-[11px] uppercase tracking-wider mb-0.5">
                          Evening Sanctuary
                        </span>
                        <p className="leading-relaxed text-[#4B5563] text-xs sm:text-sm">
                          {day.evening}
                        </p>
                      </div>
                    </div>

                    {/* Day Footer Meta: Meals & Stay & Curated Highlight */}
                    <div className="pt-2.5 border-t border-[#1E2022]/6 grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                      <div className="flex items-center gap-2 text-[#555A60]">
                        <Utensils className="w-3.5 h-3.5 text-[#C2571A]" />
                        <span>
                          <strong>Meals:</strong> {day.mealsIncluded.join(', ')}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-[#555A60]">
                        <Bed className="w-3.5 h-3.5 text-[#C2571A]" />
                        <span className="truncate">
                          <strong>Stay:</strong> {day.stay}
                        </span>
                      </div>
                    </div>

                    {/* Highlight Ribbon */}
                    <div className="p-2.5 rounded-xl bg-[#C2571A]/8 border border-[#C2571A]/15 flex items-center gap-2 text-xs text-[#C2571A] font-medium">
                      <Sparkles className="w-3.5 h-3.5 shrink-0" />
                      <span>
                        <strong>Key Moment:</strong> {day.highlight}
                      </span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};
