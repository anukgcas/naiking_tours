import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { Plane, Sparkles } from 'lucide-react';

interface CraftingOverlayProps {
  destination: string;
  /** Destination photo shown in the centre of the rings. */
  image?: string;
  /** Called once the animation has played, when the planner page should open. */
  onDone: () => void;
}

const DURATION_MS = 2800;
const MESSAGES = [
  'Setting up your destination…',
  'Laying out your days…',
  'Getting your planner ready…',
];
const brandGrad = 'bg-gradient-to-r from-[#F7931E] via-[#E5501A] to-[#C2571A]';

/** Soft drifting colour behind the loader, same look as the trip builder's "Building your trip" screen. */
const Aurora: React.FC<{ reduced: boolean | null }> = ({ reduced }) => (
  <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
    <motion.div
      className="absolute -top-24 -left-24 w-[26rem] h-[26rem] rounded-full bg-[#FFC94D]/25 blur-3xl"
      animate={reduced ? undefined : { x: [0, 60, 0], y: [0, 40, 0] }}
      transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
    />
    <motion.div
      className="absolute top-40 -right-24 w-[28rem] h-[28rem] rounded-full bg-[#1F9EA3]/10 blur-3xl"
      animate={reduced ? undefined : { x: [0, -70, 0], y: [0, 60, 0] }}
      transition={{ duration: 17, repeat: Infinity, ease: 'easeInOut' }}
    />
  </div>
);

/** Full-screen "crafting your itinerary" moment shown between the home planner and the plan page. */
export const CraftingOverlay: React.FC<CraftingOverlayProps> = ({ destination, image, onDone }) => {
  const reduced = useReducedMotion();
  const [msg, setMsg] = useState(0);
  // keep the latest callback without restarting the animation when the parent re-renders
  const doneRef = useRef(onDone);
  doneRef.current = onDone;

  useEffect(() => {
    const step = DURATION_MS / MESSAGES.length;
    const timers = MESSAGES.slice(1).map((_, i) => setTimeout(() => setMsg(i + 1), step * (i + 1)));
    const done = setTimeout(() => doneRef.current(), DURATION_MS);
    return () => {
      timers.forEach(clearTimeout);
      clearTimeout(done);
    };
  }, []);

  return (
    <motion.div
      className="fixed inset-0 z-[90] flex items-center justify-center px-6 bg-[#FAF8F5]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.35 }}
      role="status"
      aria-live="polite"
      aria-label={`Crafting your ${destination} itinerary`}
    >
      <Aurora reduced={reduced} />
      <div className="relative text-center max-w-md">
        <div className="relative mx-auto w-40 h-40 flex items-center justify-center">
          {[0, 1, 2].map((i) => (
            <motion.span
              key={i}
              className="absolute inset-0 rounded-full border-2 border-[#F7931E]/50"
              initial={{ scale: 0.6, opacity: 0.7 }}
              animate={{ scale: 1.7, opacity: 0 }}
              transition={{ duration: 2.4, repeat: Infinity, delay: i * 0.8, ease: 'easeOut' }}
            />
          ))}
          <motion.span
            className="absolute inset-0 rounded-full"
            style={{
              background: 'conic-gradient(from 0deg, #FFC94D, #E5501A, transparent 70%)',
              mask: 'radial-gradient(circle, transparent 62%, black 64%)',
              WebkitMask: 'radial-gradient(circle, transparent 62%, black 64%)',
            }}
            animate={{ rotate: 360 }}
            transition={{ duration: 1.6, repeat: Infinity, ease: 'linear' }}
          />
          {image ? (
            <motion.img
              src={image}
              alt=""
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="relative w-28 h-28 rounded-full object-cover border-4 border-white shadow-2xl"
            />
          ) : (
            <Sparkles className="relative w-10 h-10 text-[#C2571A]" />
          )}
          <motion.span
            className="absolute -top-1 -right-1 w-10 h-10 rounded-full bg-white shadow-lg flex items-center justify-center text-[#C2571A]"
            animate={reduced ? undefined : { y: [0, -6, 0], rotate: [0, 12, 0] }}
            transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
          >
            <Plane className="w-5 h-5" />
          </motion.span>
        </div>

        <h2 className="mt-6 text-3xl font-extrabold tracking-tight text-[#1E2022]">
          Crafting your <span className="text-[#C2571A]">{destination}</span> trip
        </h2>
        <AnimatePresence mode="wait">
          <motion.p
            key={msg}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="mt-2 text-sm text-[#6B7280]"
          >
            {MESSAGES[msg]}
          </motion.p>
        </AnimatePresence>
        <div className="mt-6 mx-auto w-56 h-1.5 rounded-full bg-[#1E2022]/8 overflow-hidden">
          <motion.div
            className={`h-full rounded-full ${brandGrad}`}
            initial={{ width: '4%' }}
            animate={{ width: '100%' }}
            transition={{ duration: DURATION_MS / 1000 - 0.2, ease: 'easeInOut' }}
          />
        </div>
      </div>
    </motion.div>
  );
};
