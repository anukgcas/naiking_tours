import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence, animate, useInView } from 'motion/react';

/** Counts up to `to` once it scrolls into view. */
export const CountUp: React.FC<{ to: number; suffix?: string; decimals?: number; delay?: number }> = ({
  to,
  suffix = '',
  decimals = 0,
  delay = 0,
}) => {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const [val, setVal] = useState(0);

  useEffect(() => {
    if (!inView) return;
    const controls = animate(0, to, {
      delay,
      duration: 1.8,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => setVal(v),
    });
    return () => controls.stop();
  }, [inView, to, delay]);

  return (
    <span ref={ref} className="tabular-nums">
      {val.toFixed(decimals)}
      {suffix}
    </span>
  );
};

/** Cycles through words with a vertical slide. */
export const RotatingWord: React.FC<{ words: string[]; interval?: number }> = ({
  words,
  interval = 2600,
}) => {
  const [i, setI] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setI((p) => (p + 1) % words.length), interval);
    return () => clearInterval(id);
  }, [words.length, interval]);

  return (
    <span className="relative inline-flex overflow-hidden align-bottom" style={{ height: '1.15em' }}>
      {/* invisible sizer keeps the widest word's width */}
      <span className="invisible" aria-hidden="true">
        {words.reduce((a, b) => (b.length > a.length ? b : a), '')}
      </span>
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={words[i]}
          className="absolute left-0 top-0 text-[#C2571A] whitespace-nowrap"
          initial={{ y: '100%', opacity: 0 }}
          animate={{ y: '0%', opacity: 1 }}
          exit={{ y: '-100%', opacity: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        >
          {words[i]}
        </motion.span>
      </AnimatePresence>
    </span>
  );
};

/** Rotating circular text stamp with a crown in the middle. */
export const SpinBadge: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`w-28 h-28 sm:w-32 sm:h-32 ${className}`} aria-hidden="true">
    <motion.svg
      viewBox="0 0 120 120"
      className="absolute inset-0 w-full h-full"
      animate={{ rotate: 360 }}
      transition={{ repeat: Infinity, duration: 22, ease: 'linear' }}
    >
      <defs>
        <path id="badgeCircle" d="M60 60 m-44 0 a44 44 0 1 1 88 0 a44 44 0 1 1 -88 0" />
      </defs>
      <text fontSize="10" fontWeight="700" fill="#1E2022" fontFamily="Manrope, sans-serif">
        <textPath href="#badgeCircle" textLength="270" lengthAdjust="spacing">NAIKINGS · TOURS &amp; TRAVELS · </textPath>
      </text>
    </motion.svg>
    <div className="absolute inset-[22%] rounded-full bg-gradient-to-br from-[#FFC94D] via-[#F7931E] to-[#E5501A] shadow-lg flex items-center justify-center">
      <svg viewBox="0 0 40 26" className="w-7 h-7 sm:w-8 sm:h-8" fill="white">
        <path d="M3 22 L1 6 L11 13 L20 1 L29 13 L39 6 L37 22 Z" />
        <rect x="3" y="22.5" width="34" height="3" rx="1.2" />
      </svg>
    </div>
  </div>
);

/** Infinite scrolling ribbon of highlights. */
export const Marquee: React.FC<{ items: string[] }> = ({ items }) => {
  const row = [...items, ...items];
  return (
    <div className="relative overflow-hidden border-y border-[#1E2022]/8 bg-white/60 backdrop-blur-sm py-3">
      <div className="flex w-max animate-marquee gap-10 whitespace-nowrap">
        {row.map((t, idx) => (
          <span
            key={idx}
            className="flex items-center gap-10 text-xs font-bold uppercase tracking-[0.28em] text-[#1E2022]/70"
          >
            {t}
            <span className="w-1.5 h-1.5 rotate-45 bg-[#C2571A]" />
          </span>
        ))}
      </div>
      <div className="pointer-events-none absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-[#FAF8F5] to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-[#FAF8F5] to-transparent" />
    </div>
  );
};
