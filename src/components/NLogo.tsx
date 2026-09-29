import React from 'react';

interface NLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'dark' | 'light';
  className?: string;
}

export const NLogo: React.FC<NLogoProps> = ({
  size = 'md',
  variant = 'dark',
  className = '',
}) => {
  const sizeMap = {
    sm: 'w-7 h-7 text-xs',
    md: 'w-9 h-9 text-sm',
    lg: 'w-12 h-12 text-base',
    xl: 'w-16 h-16 text-xl',
  };

  const isLight = variant === 'light';

  return (
    <div
      className={`relative inline-flex items-center justify-center rounded-xl font-bold tracking-wider select-none transition-all duration-300 ${
        sizeMap[size]
      } ${
        isLight
          ? 'bg-white/10 text-white border border-white/20 shadow-sm'
          : 'bg-[#1E2022] text-[#FAF8F5] shadow-xs'
      } ${className}`}
      aria-label="Naiking Tours Logo"
    >
      {/* Refined N Monogram with subtle coral geometric cut */}
      <span className="font-serif tracking-tighter text-[1.15em] font-semibold text-white flex items-center justify-center leading-none">
        N
      </span>
      {/* Tiny subtle coral dot accent in corner representing destination pin */}
      <span
        className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-[#E05A47]"
        aria-hidden="true"
      />
    </div>
  );
};
