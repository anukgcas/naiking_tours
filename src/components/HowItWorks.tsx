import React from 'react';
import { ArrowDown, ArrowRight, CalendarCheck, LayoutGrid, MapPin, Sparkles } from 'lucide-react';

const STEPS = [
  {
    icon: <MapPin className="w-5 h-5" />,
    title: 'Tell us the basics',
    body: 'Choose your destination, travel dates and how many are travelling.',
  },
  {
    icon: <LayoutGrid className="w-5 h-5" />,
    title: 'Build your days',
    body: 'Shape each day with places and experiences — entirely your call.',
  },
  {
    icon: <Sparkles className="w-5 h-5" />,
    title: 'Let AI fill the gaps',
    body: 'Get smart suggestions that balance pace and variety or ask for fresh ideas.',
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
      <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-[#1E2022]">Your trip built your way</h2>
      <p className="mt-1 text-sm font-medium sm:text-base text-[#6B7280]">No fixed packages Four steps from idea to itinerary</p>
      <ol className="mt-8 flex flex-col lg:flex-row lg:items-stretch">
        {STEPS.map((s, i) => (
          <React.Fragment key={s.title}>
            {i > 0 && (
              <li
                aria-hidden="true"
                role="presentation"
                className="shrink-0 flex items-center justify-center h-8 lg:h-auto lg:w-8 text-[#9CA3AF]"
              >
                <ArrowDown className="w-4 h-4 lg:hidden" />
                <ArrowRight className="w-4 h-4 hidden lg:block" />
              </li>
            )}
            <li
              tabIndex={0}
              className="group cursor-pointer lg:flex-1 lg:min-w-0 p-5 rounded-2xl bg-white border border-[#1E2022]/5 will-change-transform transition-[transform,background-color,border-color,box-shadow] duration-300 ease-out hover:-translate-y-0.5 hover:bg-[#FFFCF9] hover:border-[#1E2022]/5 hover:shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C2571A] focus-visible:ring-offset-2 motion-reduce:transition-none motion-reduce:hover:translate-y-0"
            >
              <div className="flex items-center justify-between">
                <span className="w-10 h-10 rounded-xl bg-[#C2571A]/10 text-[#C2571A] flex items-center justify-center transition-transform duration-300 ease-out group-hover:scale-[1.04] motion-reduce:transition-none motion-reduce:group-hover:scale-100">
                  {s.icon}
                </span>
                <span className="text-[17px] font-medium text-[#9CA3AF]">0{i + 1}</span>
              </div>
              <h3 className="mt-4 text-[18px] font-semibold text-[#1E2022]">{s.title}</h3>
              <p className="mt-1 text-[16px] text-[#6B7280] leading-relaxed">{s.body}</p>
            </li>
          </React.Fragment>
        ))}
      </ol>
    </div>
  </section>
);
