import React from 'react';
import { ShieldCheck, Compass, Sparkles, Clock, Check } from 'lucide-react';

export const WhyNaiking: React.FC = () => {
  const pillars = [
    {
      icon: <Sparkles className="w-5 h-5 text-[#E05A47]" />,
      title: 'Boutique Sanctuaries Only',
      desc: 'We decline 92% of standard hotels. Every stay is an architectural sanctuary with private terraces, high-thread linens, and attentive hospitality.',
    },
    {
      icon: <Clock className="w-5 h-5 text-[#E05A47]" />,
      title: 'Unhurried Pacing',
      desc: 'Travel should restore rather than fatigue. Our itineraries leave generous room for lingering over morning espresso, sunset swims, and artisan conversations.',
    },
    {
      icon: <Compass className="w-5 h-5 text-[#E05A47]" />,
      title: 'Private Chauffeurs & Guides',
      desc: 'No shared crowded coaches. Move between sacred temples and desert dunes in private executive SUVs with licensed local culture historians.',
    },
    {
      icon: <ShieldCheck className="w-5 h-5 text-[#E05A47]" />,
      title: 'Absolute Price Transparency',
      desc: 'What you see is what you pay. Airport VIP passes, private transit, daily breakfasts, and verified entry fees are fully upfront with zero surprise markups.',
    },
  ];

  return (
    <section id="why-naiking" className="py-16 lg:py-24 bg-white border-y border-[#1E2022]/6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="max-w-2xl mb-12 lg:mb-16">
          <span className="text-xs font-bold uppercase tracking-wider text-[#E05A47]">
            The Naiking Distinction
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#1E2022] mt-2 text-balance">
            Designed for travellers who value serenity over speed.
          </h2>
          <p className="mt-3 text-sm sm:text-base text-[#6B7280] leading-relaxed">
            Mass tourism optimizes for headcount. We optimize for memory, privacy, and
            impeccable local connection.
          </p>
        </div>

        {/* 4 Pillars Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {pillars.map((pillar, i) => (
            <div
              key={i}
              className="p-6 rounded-3xl bg-[#FAF8F5] border border-[#1E2022]/8 flex flex-col justify-between hover:border-[#1E2022]/20 transition-all duration-300"
            >
              <div>
                <div className="w-10 h-10 rounded-2xl bg-white border border-black/5 flex items-center justify-center mb-4 shadow-2xs">
                  {pillar.icon}
                </div>
                <h3 className="text-base font-bold text-[#1E2022] mb-2">
                  {pillar.title}
                </h3>
                <p className="text-xs sm:text-sm text-[#555A60] leading-relaxed">
                  {pillar.desc}
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-[#1E2022]/6 flex items-center gap-1.5 text-xs text-[#E05A47] font-semibold">
                <Check className="w-3.5 h-3.5" />
                <span>Naiking Standard</span>
              </div>
            </div>
          ))}
        </div>

        {/* Testimonial Callout */}
        <div className="mt-12 p-8 rounded-3xl bg-[#FAF8F5] border border-[#1E2022]/8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="max-w-2xl">
            <p className="text-base sm:text-lg italic text-[#1E2022] font-medium leading-relaxed">
              “Our Bali villa retreat was seamless from touchdown. Having our private chauffeur
              waiting without queues and the morning rice terrace visit before sunrise transformed the
              entire journey.”
            </p>
            <div className="mt-3 flex items-center gap-2 text-xs text-[#6B7280]">
              <span className="font-bold text-[#1E2022]">Devika & Rohan Mehta</span>
              <span>·</span>
              <span>Bali Escape, September 2026</span>
            </div>
          </div>

          <div className="shrink-0 flex flex-col sm:flex-row items-center gap-4 text-xs font-semibold text-[#1E2022]">
            <div className="text-center px-4 py-2 rounded-xl bg-white border border-black/5">
              <span className="block text-xl font-bold text-[#E05A47]">4.9 / 5</span>
              <span className="text-[11px] text-[#6B7280]">Guest Rating</span>
            </div>
            <div className="text-center px-4 py-2 rounded-xl bg-white border border-black/5">
              <span className="block text-xl font-bold text-[#1E2022]">100%</span>
              <span className="text-[11px] text-[#6B7280]">Private Vehicles</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
