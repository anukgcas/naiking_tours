import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { NLogo } from './NLogo';

interface LoaderProps {
  onComplete: () => void;
}

const EASE = [0.76, 0, 0.24, 1] as const;
const SHOW_MS = 3300; // logo build + progress
const EXIT_MS = 900; // curtain lift

export const Loader: React.FC<LoaderProps> = ({ onComplete }) => {
  const [leaving, setLeaving] = useState(false);
  const [progress, setProgress] = useState(0);
  const [logoSize, setLogoSize] = useState(72);

  useEffect(() => {
    const fit = () => setLogoSize(Math.min(64, Math.max(30, Math.floor(window.innerWidth / 13))));
    fit();
    window.addEventListener('resize', fit);
    return () => window.removeEventListener('resize', fit);
  }, []);

  useEffect(() => {
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / SHOW_MS);
      setProgress(Math.round((1 - Math.pow(1 - t, 3)) * 100));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    const leave = setTimeout(() => setLeaving(true), SHOW_MS);
    const done = setTimeout(onComplete, SHOW_MS + EXIT_MS);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(leave);
      clearTimeout(done);
    };
  }, [onComplete]);

  return (
    <div
      className="fixed inset-0 z-[100] select-none overflow-hidden"
      style={{ pointerEvents: leaving ? 'none' : 'auto' }}
      role="status"
      aria-label="Loading Naikings Tours & Travels"
    >
      {/* Two curtain halves that part to reveal the site */}
      <motion.div
        className="absolute inset-x-0 top-0 h-1/2 bg-[#FAF8F5]"
        animate={{ y: leaving ? '-100%' : '0%' }}
        transition={{ duration: EXIT_MS / 1000, ease: EASE }}
      />
      <motion.div
        className="absolute inset-x-0 bottom-0 h-1/2 bg-[#FAF8F5]"
        animate={{ y: leaving ? '100%' : '0%' }}
        transition={{ duration: EXIT_MS / 1000, ease: EASE }}
      />

      {/* Logo + progress */}
      <motion.div
        className="relative z-10 h-full flex flex-col items-center justify-center px-6"
        animate={{ opacity: leaving ? 0 : 1, y: leaving ? -24 : 0 }}
        transition={{ duration: 0.45, ease: 'easeIn' }}
      >
        <NLogo fontSize={logoSize} animated delay={0.25} />

        <div className="mt-12 w-56 sm:w-64">
          <div className="h-[3px] rounded-full bg-[#1E2022]/8 overflow-hidden">
            <div
              className="h-full rounded-full"
              style={{
                width: `${progress}%`,
                background: '#1E2022',
              }}
            />
          </div>
          <div className="mt-3 flex items-center justify-between text-[10px] font-semibold uppercase tracking-[0.28em] text-[#6B7280]">
            <span>Preparing your journey</span>
            <span className="tabular-nums text-[#1E2022]">{progress}%</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
