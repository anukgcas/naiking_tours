import React from 'react';
import { CalendarCheck, LayoutGrid, MapPin, Sparkles } from 'lucide-react';

const STEPS = [
  {
    icon: <MapPin className="w-5 h-5" />,
    title: 'Tell us the basics',
    body: 'Choose your destination, travel dates and how many are travelling.',
  },
  {
    icon: <LayoutGrid className="w-5 h-5" />,
    title: 'Build your days',
    body: 'Drag places and experiences onto Day 1, Day 2, Day 3 — a simple board, entirely your call.',
  },
  {
    icon: <Sparkles className="w-5 h-5" />,
    title: 'Let AI fill the gaps',
    body: 'Get suggestions that balance pace and variety — or ask for fresh ideas for any day.',
  },
  {
    icon: <CalendarCheck className="w-5 h-5" />,
    title: 'Review & book',
    body: 'Your package and price are built from your choices. Send it to a concierge to confirm.',
  },
];

export const HowItWorks: React.FC = () => (
  <section className="py-12 lg:py-16">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#1E2022]">Your trip, built your way</h2>
      <p className="mt-1 text-sm sm:text-base text-[#6B7280]">No fixed packages. Four steps from idea to itinerary.</p>
      <ol className="mt-8 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {STEPS.map((s, i) => (
          <li key={s.title} className="p-5 rounded-2xl bg-white border border-[#1E2022]/8">
            <div className="flex items-center justify-between">
              <span className="w-10 h-10 rounded-xl bg-[#C2571A]/10 text-[#C2571A] flex items-center justify-center">
                {s.icon}
              </span>
              <span className="text-xs font-bold text-[#9CA3AF]">0{i + 1}</span>
            </div>
            <h3 className="mt-4 text-base font-bold text-[#1E2022]">{s.title}</h3>
            <p className="mt-1 text-sm text-[#6B7280] leading-relaxed">{s.body}</p>
          </li>
        ))}
      </ol>
    </div>
  </section>
);
