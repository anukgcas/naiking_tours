import React, { useEffect, useState, useCallback, useRef } from 'react';
import { motion } from 'motion/react';
import { NLogo } from './NLogo';

interface LoaderProps {
  onComplete: () => void;
}

const EASE = [0.76, 0, 0.24, 1] as const;
// The logo animation (wipe-in, plane flight, light sweep) runs for about 3.5s, so the splash stays up until it ends.
const SHOW_MS = 3800;
const EXIT_MS = 500; // curtain lift
const REDUCED_SHOW_MS = 1200; // static logo for people who ask for less motion
const LOGO_FILES = [
  '/images/westack_logo.png',
  '/images/westack_logo_noplane.png',
  '/images/westack_plane.png',
];

export const Loader: React.FC<LoaderProps> = ({ onComplete }) => {
  const [leaving, setLeaving] = useState(false);
  const [progress, setProgress] = useState(0);
  const [logoSize, setLogoSize] = useState(60);
  // The animation and the timers only start once the logo images are in, so nothing plays against empty frames
  const [ready, setReady] = useState(false);
  const completedRef = useRef(false);

  const prefersReducedMotion =
    typeof window !== 'undefined' &&
    !!window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const finish = useCallback(() => {
    if (completedRef.current) return;
    completedRef.current = true;
    onComplete();
  }, [onComplete]);

  // Responsive logo size
  useEffect(() => {
    const fit = () => setLogoSize(Math.min(60, Math.max(28, Math.floor(window.innerWidth / 14))));
    fit();
    window.addEventListener('resize', fit);
    return () => window.removeEventListener('resize', fit);
  }, []);

  // Preload the logo layers (give up waiting after 2.5s so a slow network never traps the splash)
  useEffect(() => {
    let cancelled = false;
    const loads = LOGO_FILES.map(
      (src) =>
        new Promise<void>((resolve) => {
          const img = new Image();
          img.onload = img.onerror = () => resolve();
          img.src = src;
        }),
    );
    const timeout = new Promise<void>((resolve) => window.setTimeout(resolve, 2500));
    Promise.race([Promise.all(loads), timeout]).then(() => {
      if (!cancelled) setReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // Main loader progression & exit
  useEffect(() => {
    if (!ready) return;

    const showMs = prefersReducedMotion ? REDUCED_SHOW_MS : SHOW_MS;
    let rafId = 0;
    const start = performance.now();

    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / showMs);
      setProgress(Math.round((1 - Math.pow(1 - t, 2)) * 100));
      if (t < 1) rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);

    const leaveTimeout = window.setTimeout(() => setLeaving(true), showMs);
    const doneTimeout = window.setTimeout(finish, showMs + EXIT_MS);

    return () => {
      cancelAnimationFrame(rafId);
      window.clearTimeout(leaveTimeout);
      window.clearTimeout(doneTimeout);
    };
  }, [ready, prefersReducedMotion, finish]);

  return (
    <div
      className="fixed inset-0 z-[100] select-none overflow-hidden"
      style={{ pointerEvents: leaving ? 'none' : 'auto' }}
      role="status"
      aria-label="Loading Westack"
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
        transition={{ duration: 0.35, ease: 'easeIn' }}
      >
        {ready && <NLogo fontSize={logoSize} animated={!prefersReducedMotion} delay={0.1} />}
        {!ready && <div style={{ height: logoSize * 1.6 }} aria-hidden="true" />}

        <div className="mt-12 w-56 sm:w-64">
          <div className="h-[3px] rounded-full bg-[#1E2022]/8 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#C2571A] to-[#F7931E] transition-[width] duration-75"
              style={{ width: `${progress}%` }}
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
