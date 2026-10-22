import React from 'react';
import { motion } from 'motion/react';

/**
 * Westack — Tour Customization CRM brand logo.
 * Static use renders public/images/westack_logo.png (transparent PNG, no backing).
 * `animated` splits it into two stacked layers — the lockup without the plane,
 * and the plane alone — so the mark can wipe in and the plane can fly into the W.
 * The lockup scales with `fontSize` (px), same contract as before.
 */

interface NLogoProps {
  /** Rendered font-size in px – the lockup scales with it. */
  fontSize?: number;
  /** Legacy presets, mapped onto fontSize. */
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  /** `light` is for dark backgrounds: the logo is rendered as a single-colour white mark. */
  variant?: 'dark' | 'light';
  /** Play the entrance animation (mark wipes in, plane flies in). */
  animated?: boolean;
  /** Seconds before the entrance animation starts. */
  delay?: number;
  /** Kept for API compatibility; the tagline is part of the logo artwork. */
  showTagline?: boolean;
  className?: string;
}

const SIZE_MAP = { sm: 20, md: 26, lg: 40, xl: 64, '2xl': 96 };

const LOGO_ALT = 'Westack — Tour Customization CRM';
const ASPECT = 1367 / 377; // width / height of the cropped artwork
// Centre of the plane inside the artwork, used as its rotate/scale origin.
const PLANE_ORIGIN = '32.2% 11.4%';

export const NLogo: React.FC<NLogoProps> = ({
  fontSize,
  size = 'md',
  variant: _variant = 'dark',
  animated = false,
  delay = 0,
  className = '',
}) => {
  const fs = fontSize ?? SIZE_MAP[size];
  const height = fs * 1.6;
  const filter = undefined; // always the original full-colour artwork; `variant` is kept only for API compatibility

  if (!animated) {
    return (
      <span className={`inline-flex items-center select-none ${className}`}>
        <img
          src="/images/westack_logo.png"
          alt={LOGO_ALT}
          draggable={false}
          style={{ height, width: 'auto', filter }}
        />
      </span>
    );
  }

  return (
    <span
      role="img"
      aria-label={LOGO_ALT}
      className={`relative inline-block select-none ${className}`}
      style={{ height, width: height * ASPECT, filter }}
    >
      {/* Flight path: draws behind the plane, then fades away */}
      <svg
        aria-hidden="true"
        viewBox="0 0 1367 377"
        className="absolute inset-0 w-full h-full overflow-visible pointer-events-none"
      >
        <defs>
          <linearGradient id="nlTrail" x1="0" y1="1" x2="1" y2="0">
            <stop offset="0" stopColor="#0E7C86" stopOpacity="0" />
            <stop offset="1" stopColor="#1D7BA6" stopOpacity="0.9" />
          </linearGradient>
        </defs>
        <motion.path
          d="M 3 495 Q 249 224 440 43"
          fill="none"
          stroke="url(#nlTrail)"
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray="2 14"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: [0, 1, 1], opacity: [0, 1, 0] }}
          transition={{ delay: delay + 0.8, duration: 1.8, ease: 'easeOut', times: [0, 0.65, 1] }}
        />
      </svg>
      {/* Everything but the plane: wipes in left to right */}
      <motion.img
        src="/images/westack_logo_noplane.png"
        alt=""
        draggable={false}
        className="absolute inset-0 w-full h-full"
        initial={{ clipPath: 'inset(0 100% 0 0)', opacity: 0 }}
        animate={{ clipPath: 'inset(0 0% 0 0)', opacity: 1 }}
        transition={{
          clipPath: { delay, duration: 1.5, ease: [0.65, 0, 0.35, 1] },
          opacity: { delay, duration: 0.4 },
        }}
      />
      {/* The plane: swoops up from the lower left and settles above the W */}
      <motion.img
        src="/images/westack_plane.png"
        alt=""
        draggable={false}
        className="absolute inset-0 w-full h-full"
        style={{ transformOrigin: PLANE_ORIGIN }}
        initial={{ x: '-32%', y: '120%', scale: 0.5, opacity: 0 }}
        animate={{
          x: ['-32%', '-14%', '0%'],
          y: ['120%', '48%', '0%'],
          scale: [0.5, 0.85, 1],
          opacity: [0, 1, 1],
        }}
        transition={{ delay: delay + 0.8, duration: 1.2, ease: 'easeOut', times: [0, 0.55, 1] }}
      />
      {/* Light sweep across the artwork once the plane has landed */}
      <motion.span
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            'linear-gradient(105deg, transparent 35%, rgba(255,255,255,0.85) 50%, transparent 65%)',
          backgroundSize: '250% 100%',
          backgroundRepeat: 'no-repeat',
          WebkitMaskImage: 'url(/images/westack_logo_noplane.png)',
          maskImage: 'url(/images/westack_logo_noplane.png)',
          WebkitMaskSize: '100% 100%',
          maskSize: '100% 100%',
        }}
        initial={{ backgroundPositionX: '130%', opacity: 0 }}
        animate={{ backgroundPositionX: ['130%', '-30%'], opacity: [0, 1, 1, 0] }}
        transition={{ delay: delay + 2.2, duration: 1.1, ease: 'easeInOut' }}
      />
    </span>
  );
};
