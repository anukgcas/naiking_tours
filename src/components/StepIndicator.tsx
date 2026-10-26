import React from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { Check } from 'lucide-react';

const STEPS = ['Trip details', 'Plan itinerary', 'Review package', 'Confirm'];

interface StepIndicatorProps {
  /** 0-based index of the current step. */
  current: number;
}

const STAGGER = 0.09;

/**
 * A soft glass progress pill. On arrival the steps slide in one after another, the lines between finished
 * steps draw themselves, ticks pop in and the current step grows into place with a gentle pulse.
 */
export const StepIndicator: React.FC<StepIndicatorProps> = ({ current }) => {
  const reduced = useReducedMotion();

  return (
    <motion.ol
      className="inline-flex max-w-full items-center gap-0.5 p-1.5 rounded-full bg-white/75 backdrop-blur-xl border border-white/80 shadow-[0_10px_30px_-22px_rgba(30,32,34,0.4)]"
      aria-label="Trip planning progress"
      initial={reduced ? false : { opacity: 0, y: -10, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
    >
      {STEPS.map((label, i) => {
        const done = i < current;
        const active = i === current;
        const delay = reduced ? 0 : 0.15 + i * STAGGER;
        return (
          <motion.li
            key={label}
            className="flex items-center gap-0.5"
            aria-current={active ? 'step' : undefined}
            initial={reduced ? false : { opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          >
            <motion.span
              className={`relative flex items-center gap-2 h-9 rounded-full text-[13px] font-semibold ${
                active
                  ? 'pl-1.5 pr-4 bg-[#14213D] text-white shadow-[0_8px_18px_-12px_rgba(20,33,61,0.6)]'
                  : done
                  ? 'pl-1.5 pr-3 text-[#14213D]'
                  : 'pl-1.5 pr-3 text-[#6B7280]'
              }`}
              initial={reduced || !active ? false : { scale: 0.85 }}
              animate={{ scale: 1 }}
              transition={{ delay: delay + 0.1, type: 'spring', stiffness: 260, damping: 16 }}
              whileHover={reduced ? undefined : { y: -1 }}
            >
              <span
                className={`relative w-6 h-6 rounded-full flex items-center justify-center text-[12px] shrink-0 ${
                  active ? 'bg-white/25 text-white' : done ? 'bg-[#14213D]/10 text-[#14213D]' : 'bg-[#14213D]/[0.06] text-[#6B7280]'
                }`}
              >
                {/* a soft ring that keeps pulsing on the current step */}
                {active && !reduced && (
                  <motion.span
                    aria-hidden="true"
                    className="absolute inset-0 rounded-full border border-white/70"
                    initial={{ scale: 1, opacity: 0.7 }}
                    animate={{ scale: 1.9, opacity: 0 }}
                    transition={{ duration: 1.8, repeat: Infinity, ease: 'easeOut', delay: delay + 0.5 }}
                  />
                )}
                {done ? (
                  <motion.span
                    className="flex"
                    initial={reduced ? false : { scale: 0, rotate: -45 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ delay: delay + 0.2, type: 'spring', stiffness: 420, damping: 14 }}
                  >
                    <Check className="w-3.5 h-3.5" strokeWidth={3} />
                  </motion.span>
                ) : (
                  i + 1
                )}
              </span>
              <span className={active ? '' : 'hidden md:inline'}>{label}</span>
            </motion.span>

            {i < STEPS.length - 1 && (
              <span className="relative w-2 sm:w-4 h-px bg-[#14213D]/12 overflow-hidden">
                {i < current && (
                  <motion.span
                    aria-hidden="true"
                    className="absolute inset-0 bg-[#14213D]/45 origin-left"
                    initial={reduced ? false : { scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ delay: delay + 0.25, duration: 0.4, ease: 'easeOut' }}
                  />
                )}
              </span>
            )}
          </motion.li>
        );
      })}
    </motion.ol>
  );
};
