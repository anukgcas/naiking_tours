import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { Bookmark } from 'lucide-react';

/** A bookmark that fills in with a springy pop and a small burst of sparks when it becomes saved. */
export const AnimatedBookmark: React.FC<{ saved: boolean; className?: string }> = ({ saved, className = 'w-4 h-4' }) => {
  const reduced = useReducedMotion();
  const [burst, setBurst] = useState(0);
  const first = useRef(true);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    if (saved) setBurst((n) => n + 1);
  }, [saved]);

  return (
    <span className="relative inline-flex items-center justify-center">
      <motion.span
        key={saved ? 'on' : 'off'}
        className="inline-flex"
        initial={reduced || first.current ? false : saved ? { scale: 0.4, rotate: -18 } : { scale: 1 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 520, damping: 14 }}
      >
        <Bookmark className={`${className} transition-colors duration-200`} fill={saved ? 'currentColor' : 'none'} />
      </motion.span>

      {/* sparks */}
      {!reduced && burst > 0 && (
        <span key={burst} aria-hidden="true" className="pointer-events-none absolute inset-0">
          {Array.from({ length: 7 }).map((_, i) => {
            const angle = (i / 7) * Math.PI * 2 - Math.PI / 2;
            return (
              <motion.span
                key={i}
                className="absolute left-1/2 top-1/2 w-1 h-1 -ml-0.5 -mt-0.5 rounded-full bg-[#F7931E]"
                initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
                animate={{ x: Math.cos(angle) * 15, y: Math.sin(angle) * 15, opacity: 0, scale: 0.3 }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
              />
            );
          })}
        </span>
      )}
    </span>
  );
};

interface SaveTripButtonProps {
  isSaved: boolean;
  onClick?: () => void;
  /** Hide the label on small screens (icon only). */
  compactOnMobile?: boolean;
  /** Short wording for tight spots (e.g. the sticky bar). */
  short?: boolean;
  tabIndex?: number;
  className?: string;
}

/**
 * "Save package" button. Tapping it fills the bookmark, turns the button navy, and the label slides to "Saved"
 * with a quick pulse ring, so it is obvious the click registered.
 */
export const SaveTripButton: React.FC<SaveTripButtonProps> = ({
  isSaved,
  onClick,
  compactOnMobile = false,
  short = false,
  tabIndex,
  className = '',
}) => {
  const reduced = useReducedMotion();
  const [pulse, setPulse] = useState(0);
  const first = useRef(true);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    setPulse((n) => n + 1);
  }, [isSaved]);

  const label = isSaved ? 'Saved' : short ? 'Save for later' : 'Save package';

  return (
    <motion.button
      type="button"
      onClick={onClick}
      aria-pressed={isSaved}
      tabIndex={tabIndex}
      whileTap={reduced ? undefined : { scale: 0.93 }}
      className={`relative inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full border text-xs font-semibold cursor-pointer transition-colors duration-300 ${
        isSaved
          ? 'bg-[#C2571A] border-[#C2571A] text-white shadow-[0_8px_18px_-10px_rgba(194,87,26,0.65)]'
          : 'bg-white border-[#1E2022]/12 text-[#1E2022] hover:border-[#C2571A] hover:text-[#C2571A]'
      } ${className}`}
      title={isSaved ? 'Saved. Click again to remove it from Saved.' : 'Save this package to My Trips and finish it later'}
    >
      {/* ring that expands when the state changes */}
      {!reduced && pulse > 0 && (
        <motion.span
          key={pulse}
          aria-hidden="true"
          className="absolute inset-0 rounded-full border-2 border-[#C2571A]/50 pointer-events-none"
          initial={{ opacity: 0.7, scale: 1 }}
          animate={{ opacity: 0, scale: 1.35 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        />
      )}
      <span className={isSaved ? "text-white" : "text-[#C2571A]"}>
        <AnimatedBookmark saved={isSaved} className="w-3.5 h-3.5" />
      </span>
      <span className={`overflow-hidden ${compactOnMobile ? 'hidden sm:inline' : ''}`}>
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={label}
            className="inline-block"
            initial={reduced ? false : { y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={reduced ? undefined : { y: -10, opacity: 0 }}
            transition={{ duration: 0.18 }}
          >
            {label}
          </motion.span>
        </AnimatePresence>
      </span>
    </motion.button>
  );
};
