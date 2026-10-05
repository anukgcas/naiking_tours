import React, { useState } from 'react';
import { ArrowRight, Mail, Check } from 'lucide-react';
import { NLogo } from './NLogo';

interface FooterProps {
  onNavigate: (tab: 'home' | 'plan' | 'why') => void;
  onOpenPlanner: () => void;
  onOpenMyTrips: () => void;
}

export const Footer: React.FC<FooterProps> = ({
  onNavigate,
  onOpenPlanner,
  onOpenMyTrips,
}) => {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setSubscribed(true);
      setEmail('');
      setTimeout(() => setSubscribed(false), 3000);
    }
  };

  return (
    <footer className="bg-[#1E2022] text-[#FAF8F5] pt-16 pb-24 md:pb-16 border-t border-black/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 lg:gap-12 pb-10 border-b border-white/10">
          {/* Brand Col */}
          <div className="md:col-span-4 space-y-3">
            <NLogo size="lg" variant="light" animated />
            <p className="text-[16px] text-[#A39E96] max-w-sm leading-[1.75]">
              Quiet luxury travel agency specializing in private boutique retreats, bespoke
              itineraries, and chauffeured expeditions across the globe
            </p>
            <div className="pt-2 text-[15px] text-[#7C766E]">
              <span>Licensed Luxury Tour Operator - IATA Accredited</span>
            </div>
          </div>

          {/* Quick Links */}
          <div className="md:col-span-2 space-y-4">
            <h4 className="text-[17px] font-medium text-[#F3EEE6]">
              Navigation
            </h4>
            <ul className="space-y-2.5 text-[15px] text-[#A39E96]">
              <li>
                <button
                  onClick={() => onNavigate('home')}
                  className="inline-block hover:text-[#F3EEE6] hover:translate-x-0.5 motion-reduce:hover:translate-x-0 transition duration-200 ease-out cursor-pointer"
                >
                  Home
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('plan')}
                  className="inline-block hover:text-[#F3EEE6] hover:translate-x-0.5 motion-reduce:hover:translate-x-0 transition duration-200 ease-out cursor-pointer"
                >
                  Customise Your Trip
                </button>
              </li>
              <li>
                <button
                  onClick={onOpenMyTrips}
                  className="inline-block hover:text-[#F3EEE6] hover:translate-x-0.5 motion-reduce:hover:translate-x-0 transition duration-200 ease-out cursor-pointer"
                >
                  My Trips
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('why')}
                  className="inline-block hover:text-[#F3EEE6] hover:translate-x-0.5 motion-reduce:hover:translate-x-0 transition duration-200 ease-out cursor-pointer"
                >
                  Why Naiking
                </button>
              </li>
              <li>
                <button
                  onClick={onOpenPlanner}
                  className="inline-block hover:text-[#C2571A] hover:translate-x-0.5 motion-reduce:hover:translate-x-0 transition duration-200 ease-out cursor-pointer"
                >
                  Plan a Trip
                </button>
              </li>
            </ul>
          </div>

          {/* Destinations */}
          <div className="md:col-span-2 space-y-4">
            <h4 className="text-[17px] font-medium  text-[#F3EEE6]">
              Destinations
            </h4>
            <ul className="space-y-2.5 text-[15px] text-[#A39E96]">
              <li>
                <span className="inline-block hover:text-[#F3EEE6] transition-colors duration-200 ease-out cursor-pointer">Bali, Indonesia</span>
              </li>
              <li>
                <span className="inline-block hover:text-[#F3EEE6] transition-colors duration-200 ease-out cursor-pointer">Dubai, UAE</span>
              </li>
              <li>
                <span className="inline-block hover:text-[#F3EEE6] transition-colors duration-200 ease-out cursor-pointer">Maldives Atolls</span>
              </li>
              <li>
                <span className="inline-block hover:text-[#F3EEE6] transition-colors duration-200 ease-out cursor-pointer">Goa Heritage</span>
              </li>
              <li>
                <span className="inline-block hover:text-[#F3EEE6] transition-colors duration-200 ease-out cursor-pointer">Manali Alpine</span>
              </li>
              <li>
                <span className="inline-block hover:text-[#F3EEE6] transition-colors duration-200 ease-out cursor-pointer">Singapore City</span>
              </li>
            </ul>
          </div>

          {/* Seasonal Journal Dispatch */}
          <div className="md:col-span-4 space-y-4">
            <h4 className="text-[17px] font-medium text-[#F3EEE6]">
              The Unhurried Dispatch
            </h4>
            <p className="text-[16px] text-[#A39E96] leading-[1.75] max-w-xs">
              Curated seasonal escapes, private villa openings, and quiet travel essays. Never spam
            </p>

            <form onSubmit={handleSubscribe} className="relative mt-2">
              <input
                type="email"
                required
                placeholder="Enter your email..."
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 pr-14 text-[16px] rounded-xl bg-white/[0.04] border border-white/12 text-[#F3EEE6] placeholder-[#7C766E] focus:outline-none focus:border-[#C2571A]"
              />
              <button
                type="submit"
                className="group absolute right-1.5 top-1/2 -translate-y-1/2 w-9 h-9 rounded-lg bg-[#C2571A] hover:bg-[#D4642A] text-white flex items-center justify-center transition-colors duration-200 ease-out cursor-pointer"
                aria-label="Subscribe to newsletter"
              >
                {subscribed ? <Check className="w-4 h-4" /> : <ArrowRight className="w-4 h-4 transition-transform duration-200 ease-out group-hover:translate-x-1 motion-reduce:group-hover:translate-x-0" />}
              </button>
            </form>
            {subscribed && (
              <p className="text-[15px] text-[#F3EEE6]">
                ✓ Thank you. You are subscribed to the seasonal dispatch.
              </p>
            )}
          </div>
        </div>

        {/* Bottom copyright row */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-[15px] text-[#8A847C] gap-4">
          <p>© {new Date().getFullYear()} Naiking Tours Inc. All rights reserved</p>
          <div className="flex items-center gap-6">
            <span className="hover:text-[#F3EEE6] transition-colors duration-200 ease-out cursor-pointer">
              Privacy Protocol
            </span>
            <span className="hover:text-[#F3EEE6] transition-colors duration-200 ease-out cursor-pointer">
              Terms of Booking
            </span>
            <span className="text-[#F3EEE6  ] hover:text-[#ffffff] transition-colors duration-200 ease-out cursor-pointer">
              Concierge Contact
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};
