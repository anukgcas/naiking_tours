import React, { useEffect, useState, useCallback, useRef } from 'react';
import { motion } from 'motion/react';
import { NLogo } from './NLogo';

interface LoaderProps {
  onComplete: () => void;
}

const EASE = [0.76, 0, 0.24, 1] as const;
const SHOW_MS = 750; // brief, elegant brand intro
const EXIT_MS = 400; // smooth curtain lift

export const Loader: React.FC<LoaderProps> = ({ onComplete }) => {
  const [leaving, setLeaving] = useState(false);
  const [progress, setProgress] = useState(0);
  const [logoSize, setLogoSize] = useState(60);
  const completedRef = useRef(false);

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

  // Main loader progression & exit
  useEffect(() => {
    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion) {
      finish();
      return;
    }

    let rafId = 0;
    let leaveTimeout = 0;
    let doneTimeout = 0;

    const start = performance.now();

    const tick = (now: number) => {
      const elapsed = now - start;
      const t = Math.min(1, elapsed / SHOW_MS);
      // Smooth ease-out progress curve
      setProgress(Math.round((1 - Math.pow(1 - t, 3)) * 100));

      if (t < 1) {
        rafId = requestAnimationFrame(tick);
      }
    };

    rafId = requestAnimationFrame(tick);

    leaveTimeout = window.setTimeout(() => {
      setLeaving(true);
    }, SHOW_MS);

    doneTimeout = window.setTimeout(() => {
      finish();
    }, SHOW_MS + EXIT_MS);

    // Fast-dismiss on key or click so users are never blocked
    const handleDismiss = (e: KeyboardEvent | MouseEvent) => {
      if ('key' in e && e.key !== 'Escape' && e.key !== 'Enter' && e.key !== ' ') return;
      window.clearTimeout(leaveTimeout);
      window.clearTimeout(doneTimeout);
      setLeaving(true);
      doneTimeout = window.setTimeout(finish, 180);
    };

    window.addEventListener('keydown', handleDismiss);
    window.addEventListener('click', handleDismiss);

    return () => {
      cancelAnimationFrame(rafId);
      window.clearTimeout(leaveTimeout);
      window.clearTimeout(doneTimeout);
      window.removeEventListener('keydown', handleDismiss);
      window.removeEventListener('click', handleDismiss);
    };
  }, [finish]);

  return (
    <div
      className="fixed inset-0 z-[100] select-none overflow-hidden"
      style={{ pointerEvents: leaving ? 'none' : 'auto' }}
      role="status"
      aria-label="Loading Westack"
    >
      {/* Two curtain halves that part to reveal the site */}
      <motion.div
        className="absolute inset-x-0 top-0 h-1/2 bg-[#F6F8FA]"
        animate={{ y: leaving ? '-100%' : '0%' }}
        transition={{ duration: EXIT_MS / 1000, ease: EASE }}
      />
      <motion.div
        className="absolute inset-x-0 bottom-0 h-1/2 bg-[#F6F8FA]"
        animate={{ y: leaving ? '100%' : '0%' }}
        transition={{ duration: EXIT_MS / 1000, ease: EASE }}
      />

      {/* Logo + progress */}
      <motion.div
        className="relative z-10 h-full flex flex-col items-center justify-center px-6"
        animate={{ opacity: leaving ? 0 : 1, y: leaving ? -24 : 0 }}
        transition={{ duration: 0.35, ease: 'easeIn' }}
      >
        <NLogo fontSize={logoSize} animated delay={0.1} />

        <div className="mt-12 w-56 sm:w-64">
          <div className="h-[3px] rounded-full bg-[#16222E]/8 overflow-hidden">
            <div
              className="h-full rounded-full transition-[width] duration-75"
              style={{
                width: `${progress}%`,
                background: '#16222E',
              }}
            />
          </div>
          <div className="mt-3 flex items-center justify-between text-[10px] font-semibold uppercase tracking-[0.28em] text-[#6B7280]">
            <span>Preparing your journey</span>
            <span className="tabular-nums text-[#16222E]">{progress}%</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
