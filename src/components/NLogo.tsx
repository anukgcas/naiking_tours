import React from 'react';
import { motion } from 'motion/react';

/**
 * Naikings Tours & Travels — vector rebuild of the brand logo so it can be
 * animated (letters rise in, crown drops, flag unfurls and keeps waving).
 * Everything is sized in `em`, so `fontSize` (px) scales the whole lockup.
 */

interface NLogoProps {
  /** Rendered font-size in px – the lockup scales with it. */
  fontSize?: number;
  /** Legacy presets, mapped onto fontSize. */
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  variant?: 'dark' | 'light';
  /** Play the entrance animation (letters, crown, flag). */
  animated?: boolean;
  /** Seconds before the entrance animation starts. */
  delay?: number;
  showTagline?: boolean;
  className?: string;
}

const SIZE_MAP = { sm: 20, md: 26, lg: 40, xl: 64, '2xl': 96 };

const EASE = [0.16, 1, 0.3, 1] as const;

type Glyph = 'N' | 'A' | 'I' | 'K' | 'G' | 'S' | 'FLAG';
const GLYPHS: { g: Glyph; crown?: boolean }[] = [
  { g: 'N' },
  { g: 'A' },
  { g: 'I', crown: true },
  { g: 'K' },
  { g: 'FLAG' },
  { g: 'N' },
  { g: 'G' },
  { g: 'S' },
];

const gradientText: React.CSSProperties = {
  backgroundImage: 'linear-gradient(180deg, #F0AE45 0%, #E2842A 48%, #C2571A 100%)',
  WebkitBackgroundClip: 'text',
  backgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  color: 'transparent',
};

const Crown: React.FC<{ animated: boolean; delay: number }> = ({ animated, delay }) => (
  <motion.svg
    viewBox="0 0 40 26"
    aria-hidden="true"
    className="absolute left-1/2 -translate-x-1/2 overflow-visible"
    style={{ width: '0.42em', top: '-0.34em' }}
    initial={animated ? { y: -18, opacity: 0, rotate: -12 } : false}
    animate={{ y: 0, opacity: 1, rotate: 0 }}
    transition={{ delay, duration: 0.8, ease: [0.34, 1.56, 0.64, 1] }}
  >
    <defs>
      <linearGradient id="crownGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#F0AE45" />
        <stop offset="1" stopColor="#CF6A22" />
      </linearGradient>
    </defs>
    <path
      d="M3 22 L1 6 L11 13 L20 1 L29 13 L39 6 L37 22 Z"
      fill="url(#crownGrad)"
    />
    <rect x="3" y="22" width="34" height="3.4" rx="1.2" fill="#C2571A" />
    <circle cx="1.5" cy="5.5" r="2.2" fill="#F0AE45" />
    <circle cx="20" cy="1.6" r="2.2" fill="#F0AE45" />
    <circle cx="38.5" cy="5.5" r="2.2" fill="#F0AE45" />
  </motion.svg>
);

/** The "I" that doubles as a flag-pole carrying the Maratha bhagwa flag. */
const FlagGlyph: React.FC<{ animated: boolean; delay: number }> = ({ animated, delay }) => (
  <span className="relative inline-block" style={{ width: '0.34em', height: '1em' }}>
    <svg
      viewBox="0 0 34 100"
      aria-hidden="true"
      className="absolute left-0 overflow-visible"
      style={{ width: '0.34em', height: '1em', bottom: 0 }}
    >
      <defs>
        <linearGradient id="poleGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#E2842A" />
          <stop offset="1" stopColor="#C2571A" />
        </linearGradient>
        <linearGradient id="flagGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#FFB02E" />
          <stop offset="1" stopColor="#C2571A" />
        </linearGradient>
      </defs>
      {/* pole grows upward */}
      <motion.rect
        x="6"
        y="2"
        width="4.6"
        height="98"
        rx="1.6"
        fill="url(#poleGrad)"
        style={{ originY: 1, transformBox: 'fill-box' }}
        initial={animated ? { scaleY: 0 } : false}
        animate={{ scaleY: 1 }}
        transition={{ delay, duration: 0.7, ease: EASE }}
      />
      {/* flag unfurls from the pole, then flutters forever */}
      <motion.g
        style={{ transformBox: 'fill-box', transformOrigin: '0% 50%' }}
        initial={animated ? { scaleX: 0, opacity: 0 } : false}
        animate={{ scaleX: 1, opacity: 1 }}
        transition={{ delay: delay + 0.55, duration: 0.7, ease: EASE }}
      >
        <g className="nk-flag-wave">
          <path d="M10.6 4 C 18 0, 24 8, 34 3 L 27 14 L 34 26 C 24 31, 18 21, 10.6 26 Z" fill="url(#flagGrad)" />
        </g>
      </motion.g>
      {/* warrior silhouette guarding the pole */}
      <motion.g
        fill="#C2571A"
        initial={animated ? { opacity: 0, y: 6 } : false}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: delay + 0.9, duration: 0.6, ease: EASE }}
      >
        <circle cx="21" cy="36" r="2.6" />
        <path d="M17 41 L25 41 L26 56 L22 56 L21 49 L20 56 L16 56 Z" />
      </motion.g>
    </svg>
  </span>
);

export const NLogo: React.FC<NLogoProps> = ({
  fontSize,
  size = 'md',
  variant = 'dark',
  animated = false,
  delay = 0,
  showTagline = true,
  className = '',
}) => {
  const fs = fontSize ?? SIZE_MAP[size];
  const taglineColor = variant === 'light' ? 'rgba(255,255,255,0.85)' : '#4B4F55';

  return (
    <div
      className={`inline-flex flex-col items-center select-none ${className}`}
      style={{ fontSize: fs, paddingTop: '0.34em' }}
      role="img"
      aria-label="Naikings Tours & Travels"
    >
      <div
        className="flex items-end leading-none"
        style={{
          fontFamily: "'Cinzel', 'Times New Roman', serif",
          fontWeight: 800,
          fontSize: '1em',
          letterSpacing: '0.01em',
        }}
      >
        {GLYPHS.map((item, i) => {
          if (item.g === 'FLAG') {
            return <FlagGlyph key={i} animated={animated} delay={delay + i * 0.07} />;
          }
          return (
            <span key={i} className="relative inline-block overflow-visible">
              <motion.span
                className="inline-block"
                style={{ ...gradientText, lineHeight: 1 }}
                initial={animated ? { y: '0.6em', opacity: 0, filter: 'blur(6px)' } : false}
                animate={{ y: 0, opacity: 1, filter: 'blur(0px)' }}
                transition={{ delay: delay + i * 0.07, duration: 0.75, ease: EASE }}
              >
                {item.g}
              </motion.span>
              {item.crown && <Crown animated={animated} delay={delay + 0.55} />}
            </span>
          );
        })}
      </div>

      {showTagline && (
        <motion.span
          className="uppercase whitespace-nowrap"
          style={{
            fontFamily: 'Jost, sans-serif',
            fontWeight: 600,
            fontSize: '0.27em',
            letterSpacing: '0.34em',
            marginTop: '0.32em',
            marginRight: '-0.34em',
            color: taglineColor,
          }}
          initial={animated ? { opacity: 0, letterSpacing: '0.7em' } : false}
          animate={{ opacity: 1, letterSpacing: '0.34em' }}
          transition={{ delay: delay + 0.9, duration: 0.9, ease: EASE }}
        >
          Tours &amp; Travels
        </motion.span>
      )}
    </div>
  );
};
