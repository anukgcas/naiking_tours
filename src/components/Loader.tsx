import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { NLogo } from './NLogo';

interface LoaderProps {
  onComplete: () => void;
}

export const Loader: React.FC<LoaderProps> = ({ onComplete }) => {
  const [stage, setStage] = useState<'logo' | 'text' | 'exit'>('logo');

  useEffect(() => {
    // Stage 1: Logo enters & scales gently
    const timer1 = setTimeout(() => {
      setStage('text');
    }, 600);

    // Stage 2: Reveal wordmark
    const timer2 = setTimeout(() => {
      setStage('exit');
    }, 1500);

    // Stage 3: Smooth complete transition
    const timer3 = setTimeout(() => {
      onComplete();
    }, 2000);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, [onComplete]);

  return (
    <AnimatePresence>
      <motion.div
        key="global-loader"
        initial={{ opacity: 1 }}
        exit={{ opacity: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } }}
        className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#FAF8F5] select-none pointer-events-none"
      >
        <div className="flex flex-col items-center text-center">
          {/* Centered N Logo with subtle scale and soft shadow */}
          <motion.div
            initial={{ scale: 0.85, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
            className="mb-4"
          >
            <NLogo size="xl" />
          </motion.div>

          {/* Wordmark with smooth fade and quiet letter-spacing */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{
              opacity: stage === 'text' || stage === 'exit' ? 1 : 0,
              y: stage === 'text' || stage === 'exit' ? 0 : 8,
            }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col items-center"
          >
            <h1 className="text-xl md:text-2xl font-semibold tracking-[0.2em] text-[#1E2022] uppercase">
              Naiking Tours
            </h1>
            <p className="mt-1 text-xs tracking-[0.3em] uppercase text-[#6B7280]">
              Quiet Luxury Journeys
            </p>
          </motion.div>

          {/* Subtle thin progress line */}
          <motion.div
            className="w-16 h-[2px] bg-[#E05A47]/30 mt-6 rounded-full overflow-hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <motion.div
              className="h-full bg-[#E05A47]"
              initial={{ x: '-100%' }}
              animate={{ x: '100%' }}
              transition={{ repeat: Infinity, duration: 1.2, ease: 'easeInOut' }}
            />
          </motion.div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
