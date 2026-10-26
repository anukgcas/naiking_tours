import React from 'react';

/**
 * Small building blocks for the Day 1 arrival and last-day departure cards, so the three layers of the card
 * (the card itself, its numbered sections, and the choices inside) each read as a different level.
 */

type Accent = 'teal' | 'amber';

const ACCENT: Record<Accent, { border: string; wash: string; tile: string; chip: string; num: string; title: string; recap: string }> = {
  teal: {
    border: 'border-[#1F9EA3]/25 border-l-[#1F9EA3]',
    wash: 'from-[#EEF8F8] via-white to-white',
    tile: 'bg-[#1F9EA3] shadow-[0_8px_16px_-8px_rgba(31,158,163,0.7)]',
    chip: 'bg-[#1F9EA3]/10 text-[#16878C]',
    num: 'bg-[#1F9EA3]/12 text-[#16878C]',
    title: 'text-[#16878C]',
    recap: 'bg-[#1F9EA3]/[0.08] border-[#1F9EA3]/25',
  },
  amber: {
    border: 'border-[#E5501A]/25 border-l-[#E5501A]',
    wash: 'from-[#FFF4EC] via-white to-white',
    tile: 'bg-[#E5501A] shadow-[0_8px_16px_-8px_rgba(229,80,26,0.7)]',
    chip: 'bg-[#E5501A]/10 text-[#C2571A]',
    num: 'bg-[#E5501A]/12 text-[#C2571A]',
    title: 'text-[#C2571A]',
    recap: 'bg-[#E5501A]/[0.07] border-[#E5501A]/25',
  },
};

export const LogisticsCard: React.FC<{
  accent: Accent;
  icon: React.ReactNode;
  tag: string;
  title: string;
  subtitle: string;
  children: React.ReactNode;
  className?: string;
}> = ({ accent, icon, tag, title, subtitle, children, className = '' }) => {
  const a = ACCENT[accent];
  return (
    <div className={`rounded-2xl border border-l-[5px] bg-gradient-to-br p-4 sm:p-5 ${a.border} ${a.wash} ${className}`}>
      <div className="flex items-start gap-3">
        <span className={`w-11 h-11 rounded-xl text-white flex items-center justify-center shrink-0 ${a.tile}`}>{icon}</span>
        <div className="min-w-0 flex-1">
          <span className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-[0.12em] ${a.chip}`}>
            {tag}
          </span>
          <h4 className="mt-1 text-[18px] font-bold leading-tight text-[#14213D]">{title}</h4>
          <p className="text-[13px] text-[#6B7280]">{subtitle}</p>
        </div>
      </div>
      <div className="mt-4 space-y-3">{children}</div>
    </div>
  );
};

/** A numbered white panel inside the card, e.g. "1 Pickup" and "2 Drop at hotel". */
export const LogisticsSection: React.FC<{
  accent: Accent;
  n: number;
  title: string;
  children: React.ReactNode;
}> = ({ accent, n, title, children }) => {
  const a = ACCENT[accent];
  return (
    <section className="rounded-xl bg-white border border-[#14213D]/[0.08] shadow-[0_6px_18px_-16px_rgba(30,32,34,0.35)] p-3.5 sm:p-4">
      <div className="flex items-center gap-2.5 mb-3">
        <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[12px] font-bold ${a.num}`}>{n}</span>
        <h5 className={`text-[12px] font-bold uppercase tracking-[0.14em] ${a.title}`}>{title}</h5>
      </div>
      {children}
    </section>
  );
};

/** Pill-shaped segmented control: the chosen option is a raised white segment on a grey track. */
export function Segmented<T extends string>({
  value,
  onChange,
  options,
  label,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { id: T; label: string; icon: React.ReactNode }[];
  label: string;
}) {
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className="inline-flex flex-wrap max-w-full p-1 gap-1 rounded-2xl sm:rounded-full bg-[#14213D]/[0.06]"
    >
      {options.map((o) => {
        const on = o.id === value;
        return (
          <button
            key={o.id}
            type="button"
            role="radio"
            aria-checked={on}
            onClick={() => onChange(o.id)}
            className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-full text-[14px] font-semibold transition-all duration-200 cursor-pointer ${
              on
                ? 'bg-white text-[#14213D] shadow-[0_4px_12px_-6px_rgba(20,33,61,0.45)]'
                : 'text-[#5B6475] hover:text-[#14213D]'
            }`}
          >
            <span className={on ? 'text-[#1F9EA3]' : ''}>{o.icon}</span>
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

/** One-line summary strip at the bottom of the card. */
export const LogisticsRecap: React.FC<{ accent: Accent; icon: React.ReactNode; children: React.ReactNode }> = ({
  accent,
  icon,
  children,
}) => (
  <p className={`flex items-start gap-2.5 rounded-xl border px-3.5 py-3 text-[14px] text-[#14213D] leading-snug ${ACCENT[accent].recap}`}>
    <span className={`mt-0.5 shrink-0 ${ACCENT[accent].title}`}>{icon}</span>
    <span>{children}</span>
  </p>
);

/** Hotel / pickup-place choice card. */
export const ChoiceCard: React.FC<{
  on: boolean;
  accent: Accent;
  onClick: () => void;
  children: React.ReactNode;
}> = ({ on, accent, onClick, children }) => (
  <button
    type="button"
    role="radio"
    aria-checked={on}
    onClick={onClick}
    className={`text-left rounded-xl border p-3 transition-all duration-200 cursor-pointer ${
      on
        ? accent === 'teal'
          ? 'bg-[#1F9EA3]/[0.07] border-[#1F9EA3] shadow-[0_0_0_3px_rgba(31,158,163,0.14)]'
          : 'bg-[#E5501A]/[0.06] border-[#E5501A] shadow-[0_0_0_3px_rgba(229,80,26,0.14)]'
        : 'bg-white border-[#14213D]/12 hover:border-[#14213D]/35'
    }`}
  >
    {children}
  </button>
);
