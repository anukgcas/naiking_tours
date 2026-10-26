import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { ArrowUp } from 'lucide-react';

interface ScrollToTopProps {
  onClick: () => void;
}

/** Floating back-to-top button, bottom right. Pops in with a soft spring once the page has been scrolled a little. */
export const ScrollToTop: React.FC<ScrollToTopProps> = ({ onClick }) => {
  const reduced = useReducedMotion();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const update = () => setVisible(window.scrollY > 600);
    update();
    window.addEventListener('scroll', update, { passive: true });
    return () => window.removeEventListener('scroll', update);
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <motion.button
          type="button"
          onClick={onClick}
          aria-label="Scroll to top"
          initial={reduced ? { opacity: 0 } : { opacity: 0, y: 28, scale: 0.6 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={reduced ? { opacity: 0 } : { opacity: 0, y: 20, scale: 0.7 }}
          transition={reduced ? { duration: 0.15 } : { type: 'spring', stiffness: 320, damping: 15, mass: 0.8 }}
          whileHover={reduced ? undefined : { y: -3, scale: 1.06 }}
          whileTap={reduced ? undefined : { scale: 0.92 }}
          className="group fixed right-4 sm:right-6 lg:right-8 bottom-24 md:bottom-8 z-30 w-11 h-11 rounded-full bg-[#1E2022] text-white shadow-lg flex items-center justify-center cursor-pointer hover:bg-[#C2571A] transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C2571A] focus-visible:ring-offset-2"
        >
          <motion.span
            className="flex"
            animate={reduced ? undefined : { y: [0, -2.5, 0] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
          >
            <ArrowUp className="w-5 h-5" />
          </motion.span>
        </motion.button>
      )}
    </AnimatePresence>
  );
};
