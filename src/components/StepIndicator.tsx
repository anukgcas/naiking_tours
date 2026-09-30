import React from 'react';
import { Check } from 'lucide-react';

const STEPS = ['Trip details', 'Plan itinerary', 'Review package', 'Confirm'];

interface StepIndicatorProps {
  /** 0-based index of the current step. */
  current: number;
}

export const StepIndicator: React.FC<StepIndicatorProps> = ({ current }) => (
  <ol className="flex items-center gap-2 sm:gap-3 text-xs font-semibold" aria-label="Trip planning progress">
    {STEPS.map((label, i) => {
      const done = i < current;
      const active = i === current;
      return (
        <li key={label} className="flex items-center gap-2 sm:gap-3" aria-current={active ? 'step' : undefined}>
          <span
            className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] shrink-0 ${
              done
                ? 'bg-[#C2571A] text-white'
                : active
                ? 'bg-[#1E2022] text-white'
                : 'bg-[#1E2022]/8 text-[#6B7280]'
            }`}
          >
            {done ? <Check className="w-3.5 h-3.5" /> : i + 1}
          </span>
          <span className={`hidden sm:inline ${active ? 'text-[#1E2022]' : 'text-[#6B7280]'}`}>{label}</span>
          {i < STEPS.length - 1 && <span className="w-4 sm:w-8 h-px bg-[#1E2022]/15" />}
        </li>
      );
    })}
  </ol>
);
