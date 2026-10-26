import React from 'react';

/**
 * Soft travel-themed background art for the home page sections: dotted flight routes, map contours and a
 * compass with scattered pins. Purely decorative, drawn in faint orange and teal so it never fights the text.
 */

type Variant = 'routes' | 'topo' | 'compass';

const ORANGE = '#F26B2A';
const TEAL = '#1F9EA3';

const PLANE = 'M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z';
const PIN = 'M12 22s7-5.2 7-12a7 7 0 1 0-14 0c0 6.8 7 12 7 12z';

const Plane: React.FC<{ x: number; y: number; r: number; s?: number; color?: string }> = ({ x, y, r, s = 1.3, color = ORANGE }) => (
  <g transform={`translate(${x} ${y}) rotate(${r}) scale(${s}) translate(-12 -12)`}>
    <path d={PLANE} fill={color} fillOpacity="0.5" />
  </g>
);

const Pin: React.FC<{ x: number; y: number; s?: number; color?: string }> = ({ x, y, s = 1.1, color = TEAL }) => (
  <g transform={`translate(${x} ${y}) scale(${s}) translate(-12 -22)`}>
    <path d={PIN} fill={color} fillOpacity="0.4" />
    <circle cx="12" cy="10" r="2.6" fill="#fff" fillOpacity="0.9" />
  </g>
);

const Routes: React.FC = () => (
  <>
    <g fill="none" strokeLinecap="round" strokeDasharray="2 9" strokeWidth="2.2">
      <path d="M-20 470 C 180 330, 330 520, 560 300 S 900 120, 1240 210" stroke={ORANGE} strokeOpacity="0.45" />
      <path d="M-20 130 C 220 40, 380 220, 640 120 S 1000 330, 1240 420" stroke={TEAL} strokeOpacity="0.4" />
      <path d="M200 620 C 340 520, 520 600, 700 520 S 1020 440, 1240 560" stroke={ORANGE} strokeOpacity="0.3" />
    </g>
    <Plane x={560} y={300} r={-38} />
    <Plane x={640} y={120} r={25} s={1.1} color={TEAL} />
    <Plane x={1000} y={146} r={-12} s={1} />
    <Pin x={90} y={410} />
    <Pin x={880} y={178} color={ORANGE} />
    <Pin x={1140} y={436} />
    <Pin x={330} y={106} s={0.9} color={ORANGE} />
    {[[120, 70], [440, 560], [760, 60], [980, 560], [1160, 110], [60, 560]].map(([x, y]) => (
      <g key={`${x}-${y}`} stroke={TEAL} strokeOpacity="0.35" strokeWidth="2" strokeLinecap="round">
        <path d={`M${x - 6} ${y}h12M${x} ${y - 6}v12`} />
      </g>
    ))}
  </>
);

const Topo: React.FC = () => (
  <g fill="none" stroke={TEAL} strokeOpacity="0.22" strokeWidth="1.6">
    {Array.from({ length: 11 }).map((_, i) => (
      <ellipse key={`a${i}`} cx="190" cy="150" rx={50 + i * 34} ry={30 + i * 22} transform={`rotate(${-18 + i * 2} 190 150)`} />
    ))}
    {Array.from({ length: 9 }).map((_, i) => (
      <ellipse key={`b${i}`} cx="1040" cy="470" rx={44 + i * 36} ry={26 + i * 24} transform={`rotate(${22 - i * 2} 1040 470)`} stroke={ORANGE} strokeOpacity="0.2" />
    ))}
    <path d="M300 560 C 420 470, 520 590, 640 500" stroke={ORANGE} strokeOpacity="0.4" strokeDasharray="2 9" strokeLinecap="round" strokeWidth="2.2" />
    <Pin x={640} y={500} s={1} color={ORANGE} />
    <Pin x={190} y={150} s={1} />
  </g>
);

const Compass: React.FC = () => (
  <>
    <g transform="translate(1010 300)" fill="none" stroke={ORANGE} strokeOpacity="0.28" strokeWidth="2">
      <circle r="190" />
      <circle r="150" strokeDasharray="3 10" strokeLinecap="round" />
      <circle r="60" />
      <path d="M0 -215 L18 -30 L0 0 L-18 -30 Z M0 215 L18 30 L0 0 L-18 30 Z M-215 0 L-30 -18 L0 0 L-30 18 Z M215 0 L30 -18 L0 0 L30 18 Z" fill={ORANGE} fillOpacity="0.1" />
      <path d="M-134 -134 L134 134 M134 -134 L-134 134" strokeOpacity="0.5" strokeDasharray="2 9" strokeLinecap="round" />
    </g>
    <g fill="none" strokeLinecap="round" strokeDasharray="2 9" strokeWidth="2.2">
      <path d="M-20 520 C 160 440, 300 540, 470 440" stroke={TEAL} strokeOpacity="0.4" />
    </g>
    <Plane x={300} y={500} r={-22} color={TEAL} />
    <Pin x={470} y={440} color={ORANGE} />
    <Pin x={120} y={140} />
    <Pin x={640} y={90} s={0.9} color={ORANGE} />
    {[[260, 70], [560, 560], [820, 70], [60, 330]].map(([x, y]) => (
      <g key={`${x}-${y}`} stroke={TEAL} strokeOpacity="0.35" strokeWidth="2" strokeLinecap="round">
        <path d={`M${x - 6} ${y}h12M${x} ${y - 6}v12`} />
      </g>
    ))}
  </>
);

export const TourPattern: React.FC<{ variant: Variant; className?: string; /** 0 to 1: how visible the lines are. */ strength?: number }> = ({
  variant,
  className = '',
  strength = 0.45,
}) => (
  <svg
    aria-hidden="true"
    viewBox="0 0 1200 640"
    preserveAspectRatio="xMidYMid slice"
    style={{ opacity: strength }}
    className={`pointer-events-none absolute inset-0 w-full h-full [mask-image:linear-gradient(to_bottom,transparent,black_14%,black_86%,transparent)] ${className}`}
  >
    {variant === 'routes' && <Routes />}
    {variant === 'topo' && <Topo />}
    {variant === 'compass' && <Compass />}
  </svg>
);
