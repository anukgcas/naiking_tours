import React, { useState } from 'react';
import { ArrowRight, Mail, Check } from 'lucide-react';
import { NLogo } from './NLogo';

interface FooterProps {
  onNavigate: (tab: 'home' | 'packages' | 'why') => void;
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
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 lg:gap-12 pb-12 border-b border-white/10">
          {/* Brand Col */}
          <div className="md:col-span-4 space-y-4">
            <div className="flex items-center gap-3">
              <NLogo size="md" variant="light" />
              <span className="text-xl font-bold tracking-tight text-white">
                Naiking Tours
              </span>
            </div>
            <p className="text-xs sm:text-sm text-gray-400 max-w-sm leading-relaxed">
              Quiet luxury travel agency specializing in private boutique retreats, bespoke
              itineraries, and chauffeured expeditions across the globe.
            </p>
            <div className="pt-2 text-xs text-gray-500">
              <span>Licensed Luxury Tour Operator · IATA Accredited</span>
            </div>
          </div>

          {/* Quick Links */}
          <div className="md:col-span-2 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-widest text-white/90">
              Navigation
            </h4>
            <ul className="space-y-2 text-xs text-gray-400">
              <li>
                <button
                  onClick={() => onNavigate('home')}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Home
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('packages')}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Tours & Packages
                </button>
              </li>
              <li>
                <button
                  onClick={onOpenMyTrips}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  My Trips
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('why')}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Why Naiking
                </button>
              </li>
              <li>
                <button
                  onClick={onOpenPlanner}
                  className="hover:text-[#E05A47] transition-colors cursor-pointer"
                >
                  Plan a Trip
                </button>
              </li>
            </ul>
          </div>

          {/* Destinations */}
          <div className="md:col-span-2 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-widest text-white/90">
              Destinations
            </h4>
            <ul className="space-y-2 text-xs text-gray-400">
              <li>
                <span className="hover:text-white transition-colors">Bali, Indonesia</span>
              </li>
              <li>
                <span className="hover:text-white transition-colors">Dubai, UAE</span>
              </li>
              <li>
                <span className="hover:text-white transition-colors">Maldives Atolls</span>
              </li>
              <li>
                <span className="hover:text-white transition-colors">Goa Heritage</span>
              </li>
              <li>
                <span className="hover:text-white transition-colors">Manali Alpine</span>
              </li>
              <li>
                <span className="hover:text-white transition-colors">Singapore City</span>
              </li>
            </ul>
          </div>

          {/* Seasonal Journal Dispatch */}
          <div className="md:col-span-4 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-widest text-white/90">
              The Unhurried Dispatch
            </h4>
            <p className="text-xs text-gray-400 leading-relaxed">
              Curated seasonal escapes, private villa openings, and quiet travel essays. Never spam.
            </p>

            <form onSubmit={handleSubscribe} className="relative mt-2">
              <input
                type="email"
                required
                placeholder="Enter your private email..."
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2.5 pr-12 text-xs rounded-xl bg-white/10 border border-white/15 text-white placeholder-gray-500 focus:outline-none focus:border-[#E05A47]"
              />
              <button
                type="submit"
                className="absolute right-1.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg bg-[#E05A47] hover:bg-[#c94937] text-white flex items-center justify-center transition-colors cursor-pointer"
                aria-label="Subscribe to newsletter"
              >
                {subscribed ? <Check className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
              </button>
            </form>
            {subscribed && (
              <p className="text-[11px] text-emerald-400">
                ✓ Thank you. You are subscribed to the seasonal dispatch.
              </p>
            )}
          </div>
        </div>

        {/* Bottom copyright row */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-gray-500 gap-4">
          <p>© {new Date().getFullYear()} Naiking Tours Inc. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <span className="hover:text-gray-400 transition-colors cursor-pointer">
              Privacy Protocol
            </span>
            <span className="hover:text-gray-400 transition-colors cursor-pointer">
              Terms of Booking
            </span>
            <span className="hover:text-gray-400 transition-colors cursor-pointer">
              Concierge Contact
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};
