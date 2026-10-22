import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { Plane } from 'lucide-react';

interface CraftingOverlayProps {
  destination: string;
  /** Called once the animation has played, when the planner page should open. */
  onDone: () => void;
}

const DURATION_MS = 2900;
const STEPS = [
  'Picking experiences you will love',
  'Matching stays and transfers',
  'Plotting your route',
  'Polishing the day-by-day plan',
];

/** Full-screen "crafting your itinerary" moment shown between the home planner and the plan page. */
export const CraftingOverlay: React.FC<CraftingOverlayProps> = ({ destination, onDone }) => {
  const [progress, setProgress] = useState(0);
  // keep the latest callback without restarting the animation when the parent re-renders
  const doneRef = useRef(onDone);
  doneRef.current = onDone;

  useEffect(() => {
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / DURATION_MS);
      setProgress(Math.round((1 - Math.pow(1 - t, 2.2)) * 100));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    const done = setTimeout(() => doneRef.current(), DURATION_MS);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(done);
    };
  }, []);

  const step = Math.min(STEPS.length - 1, Math.floor((progress / 100) * STEPS.length));

  return (
    <motion.div
      className="fixed inset-0 z-[90] flex items-center justify-center px-6 bg-[#F6F8FA]/90 backdrop-blur-xl"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.35 }}
      role="status"
      aria-live="polite"
      aria-label={`Crafting your ${destination} itinerary`}
    >
      <div className="w-full max-w-md text-center">
        {/* Flight path */}
        <div className="relative mx-auto h-28 w-full max-w-sm">
          <svg viewBox="0 0 320 112" className="absolute inset-0 w-full h-full overflow-visible" aria-hidden="true">
            <defs>
              <linearGradient id="craftTrail" x1="0" y1="1" x2="1" y2="0">
                <stop offset="0" stopColor="#0E7C86" stopOpacity="0" />
                <stop offset="1" stopColor="#1D7BA6" />
              </linearGradient>
            </defs>
            <motion.path
              d="M 8 100 Q 120 -10 312 24"
              fill="none"
              stroke="url(#craftTrail)"
              strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray="2 9"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: DURATION_MS / 1000 - 0.3, ease: 'easeInOut' }}
            />
          </svg>
          <motion.div
            className="absolute left-0 top-0 text-[#0B4A82]"
            style={{ offsetPath: "path('M 8 100 Q 120 -10 312 24')", offsetRotate: 'auto' }}
            initial={{ offsetDistance: '0%' }}
            animate={{ offsetDistance: '100%' }}
            transition={{ duration: DURATION_MS / 1000 - 0.3, ease: 'easeInOut' }}
          >
            <Plane className="w-7 h-7 -translate-x-1/2 -translate-y-1/2" fill="currentColor" />
          </motion.div>
        </div>

        <h2 className="mt-2 text-xl sm:text-2xl font-semibold text-[#16222E]">
          Crafting your <span className="text-[#0B4A82]">{destination}</span> itinerary
        </h2>
        <p key={step} className="mt-2 h-5 text-[15px] text-[#6B7280] animate-in fade-in duration-300">
          {STEPS[step]}
        </p>

        <div className="mt-6 mx-auto w-56 sm:w-64">
          <div className="h-[3px] rounded-full bg-[#16222E]/10 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#1D7BA6] via-[#0E7C86] to-[#0B4A82]"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="mt-2 text-[10px] font-semibold uppercase tracking-[0.28em] text-[#6B7280] tabular-nums">
            {progress}%
          </div>
        </div>
      </div>
    </motion.div>
  );
};
