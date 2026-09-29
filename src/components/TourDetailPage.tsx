import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Heart,
  Share2,
  Star,
  Clock,
  MapPin,
  Calendar,
  Users,
  CheckCircle2,
  XCircle,
  Building,
  Car,
  ShieldCheck,
  Sparkles,
  Compass,
  Check,
  SunMedium,
  Coffee,
  Camera,
  MessageCircle,
  Plane,
} from 'lucide-react';
import { TourPackage } from '../types';
import { StackedItineraryDeck } from './StackedItineraryDeck';

interface TourDetailPageProps {
  pkg: TourPackage;
  isFavorite: boolean;
  onToggleFavorite: (pkg: TourPackage) => void;
  onBack: () => void;
  onBookTrip: (bookingData: {
    pkg: TourPackage;
    startDate: string;
    endDate: string;
    adults: number;
    children: number;
    totalPrice: number;
  }) => void;
  onSelectOtherPackage: (pkg: TourPackage) => void;
  allPackages: TourPackage[];
}

interface ConciergeAddon {
  id: string;
  name: string;
  description: string;
  pricePerPerson: number;
}

const CONCIERGE_ADDONS: ConciergeAddon[] = [
  {
    id: 'vip-airport',
    name: 'VIP Fast-Track & Lounge Arrival',
    description: 'Bypass queues with tarmac escort and private baggage handling',
    pricePerPerson: 3500,
  },
  {
    id: 'floating-breakfast',
    name: 'Floating Champagne Breakfast',
    description: 'Served on a handcrafted teak tray in your private plunge pool',
    pricePerPerson: 4200,
  },
  {
    id: 'drone-portrait',
    name: 'Bespoke Drone & Camera Session',
    description: '60 minutes with an editorial travel photographer for private memories',
    pricePerPerson: 5500,
  },
];

export const TourDetailPage: React.FC<TourDetailPageProps> = ({
  pkg,
  isFavorite,
  onToggleFavorite,
  onBack,
  onBookTrip,
  onSelectOtherPackage,
  allPackages,
}) => {
  const [activeImage, setActiveImage] = useState(pkg.featuredImage);
  const [startDate, setStartDate] = useState('2026-10-25');
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);
  const [selectedAddons, setSelectedAddons] = useState<string[]>([]);
  const [isReserved, setIsReserved] = useState(false);
  const [copyToast, setCopyToast] = useState(false);

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setActiveImage(pkg.featuredImage);
  }, [pkg]);

  // Calculate return date
  const calculateEndDate = (start: string, days: number) => {
    const d = new Date(start);
    d.setDate(d.getDate() + days);
    return d.toISOString().split('T')[0];
  };

  const calculatedEndDate = calculateEndDate(startDate, pkg.daysCount);

  // Addon price calculation
  const addonsTotal = selectedAddons.reduce((acc, addonId) => {
    const found = CONCIERGE_ADDONS.find((a) => a.id === addonId);
    return acc + (found ? found.pricePerPerson * adults : 0);
  }, 0);

  const basePrice = pkg.startingPrice * adults + pkg.startingPrice * 0.5 * children;
  const grandTotalPrice = basePrice + addonsTotal;

  const toggleAddon = (id: string) => {
    setSelectedAddons((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleConfirmReservation = () => {
    onBookTrip({
      pkg,
      startDate,
      endDate: calculatedEndDate,
      adults,
      children,
      totalPrice: grandTotalPrice,
    });
    setIsReserved(true);
    setTimeout(() => {
      setIsReserved(false);
    }, 4000);
  };

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopyToast(true);
      setTimeout(() => setCopyToast(false), 2500);
    }
  };

  const otherPackages = allPackages
    .filter((p) => p.id !== pkg.id)
    .slice(0, 2);

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#1E2022] pb-24">
      {/* 1. Sticky Navigation & Breadcrumb Header */}
      <div className="sticky top-0 z-40 bg-[#FAF8F5]/95 backdrop-blur-md border-b border-[#1E2022]/8 px-4 sm:px-6 lg:px-8 py-3.5 transition-all">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Back button & Breadcrumb */}
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white hover:bg-black/5 border border-[#1E2022]/10 text-xs font-semibold text-[#1E2022] transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Journeys</span>
            </button>
            <div className="hidden sm:flex items-center gap-1.5 text-xs text-[#6B7280]">
              <span>Journeys</span>
              <span>/</span>
              <span className="text-[#1E2022] font-semibold">{pkg.destination}</span>
              <span>/</span>
              <span className="text-[#C2571A] font-medium truncate max-w-xs">{pkg.name}</span>
            </div>
          </div>

          {/* Quick Actions & Sticky Price */}
          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-baseline gap-1.5 mr-2">
              <span className="text-xs text-[#6B7280]">From</span>
              <span className="text-base font-bold text-[#1E2022]">
                ₹{pkg.startingPrice.toLocaleString('en-IN')}
              </span>
              <span className="text-xs text-[#6B7280]">/ person</span>
            </div>

            <button
              onClick={handleShare}
              className="p-2 rounded-full bg-white border border-[#1E2022]/10 hover:bg-[#FAF8F5] text-[#1E2022] transition-colors cursor-pointer relative"
              title="Share journey link"
            >
              <Share2 className="w-4 h-4" />
              {copyToast && (
                <span className="absolute -bottom-8 right-0 bg-[#1E2022] text-white text-[10px] px-2 py-0.5 rounded shadow whitespace-nowrap">
                  Link copied!
                </span>
              )}
            </button>

            <button
              onClick={() => onToggleFavorite(pkg)}
              className="p-2 rounded-full bg-white border border-[#1E2022]/10 hover:bg-[#FAF8F5] transition-colors cursor-pointer"
              title={isFavorite ? 'Remove from wishlist' : 'Save to wishlist'}
            >
              <Heart
                className={`w-4 h-4 ${
                  isFavorite ? 'fill-[#C2571A] text-[#C2571A]' : 'text-[#1E2022]'
                }`}
              />
            </button>

            <a
              href="#booking-card"
              className="px-4 py-2 rounded-full bg-[#1E2022] hover:bg-[#C2571A] text-white text-xs font-semibold transition-all shadow-xs"
            >
              Reserve Departure
            </a>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8 space-y-8">
        {/* 2. Editorial Hero Header & High-Res Gallery Showcase */}
        <div>
          {/* Badge & Title */}
          <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[#C2571A] bg-[#C2571A]/10 px-3 py-1 rounded-full border border-[#C2571A]/20">
                {pkg.destination}, {pkg.country}
              </span>
              {pkg.badge && (
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#1E2022] text-white">
                  {pkg.badge}
                </span>
              )}
              <span className="text-xs text-[#6B7280]">· {pkg.duration}</span>
            </div>

            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-[#1E2022]/8 shadow-2xs">
              <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
              <span className="text-sm font-bold text-[#1E2022]">{pkg.rating}</span>
              <span className="text-xs text-[#6B7280]">({pkg.reviewCount} quiet reviews)</span>
            </div>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-[#1E2022] leading-tight">
            {pkg.name}
          </h1>

          <p className="mt-3 text-base sm:text-lg text-[#555A60] max-w-3xl leading-relaxed">
            {pkg.description}
          </p>
        </div>

        {/* Gallery Showcase with Large View & Thumbnails */}
        <div className="space-y-3">
          <div className="relative aspect-[16/9] md:aspect-[21/9] rounded-3xl overflow-hidden shadow-xl border border-black/5 bg-[#ECE8E1]">
            <img
              src={activeImage}
              alt={pkg.name}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover transition-all duration-700"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />

            {/* Destination Sensory Tag */}
            <div className="absolute bottom-4 left-4 right-4 sm:bottom-6 sm:left-6 sm:right-6 flex flex-wrap items-center justify-between text-white gap-3">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5 text-xs sm:text-sm bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/15">
                  <SunMedium className="w-3.5 h-3.5 text-amber-300" />
                  <span>Optimal Dry Season: Oct – Apr</span>
                </div>
                <div className="hidden sm:flex items-center gap-1.5 text-xs sm:text-sm bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/15">
                  <Compass className="w-3.5 h-3.5 text-[#C2571A]" />
                  <span>Private Chauffeur Included</span>
                </div>
              </div>

              <div className="text-right">
                <span className="text-xs uppercase tracking-wider text-white/80 block">
                  Private Sanctuary Experience
                </span>
                <span className="text-sm sm:text-base font-semibold">100% Bespoke Pacing</span>
              </div>
            </div>
          </div>

          {/* Thumbnails Row */}
          <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-none">
            {pkg.gallery.map((img, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setActiveImage(img)}
                className={`relative flex-none w-24 h-16 sm:w-28 sm:h-20 rounded-2xl overflow-hidden border-2 transition-all cursor-pointer ${
                  activeImage === img
                    ? 'border-[#C2571A] scale-102 shadow-md'
                    : 'border-transparent opacity-60 hover:opacity-100'
                }`}
              >
                <img
                  src={img}
                  alt={`View ${idx + 1}`}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        </div>

        {/* 3. Main Split Layout: Left Content (7.5 cols) & Right Sticky Concierge Reservation (4.5 cols) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          {/* Left Column (7.5 cols) */}
          <div className="lg:col-span-8 space-y-10">
            {/* Highlights Grid */}
            <div className="p-6 sm:p-8 rounded-3xl bg-white border border-[#1E2022]/8 shadow-xs space-y-6">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-[#C2571A]">
                  The Signature Essence
                </span>
                <h3 className="text-xl sm:text-2xl font-bold text-[#1E2022] mt-1">
                  What makes this journey unforgettable
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-[#FAF8F5] border border-black/5 flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-[#C2571A]/10 text-[#C2571A] flex items-center justify-center shrink-0 mt-0.5">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-[#1E2022]">Unhurried Private Moments</h4>
                    <p className="text-xs text-[#555A60] mt-1 leading-relaxed">
                      Visit sacred monuments and natural terraces at dawn, well before public crowds
                      and coach tours arrive.
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-[#FAF8F5] border border-black/5 flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-[#C2571A]/10 text-[#C2571A] flex items-center justify-center shrink-0 mt-0.5">
                    <Coffee className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-[#1E2022]">Artisan Dining Privileges</h4>
                    <p className="text-xs text-[#555A60] mt-1 leading-relaxed">
                      Candlelit table reservations, chef tasting menus, and farm-to-table breakfast
                      spreads prepared daily.
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-[#FAF8F5] border border-black/5 flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-[#C2571A]/10 text-[#C2571A] flex items-center justify-center shrink-0 mt-0.5">
                    <Camera className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-[#1E2022]">Scenic Secret Vantage Points</h4>
                    <p className="text-xs text-[#555A60] mt-1 leading-relaxed">
                      Handpicked viewpoints known only to local elders and private naturalists for
                      unobstructed panoramas.
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-[#FAF8F5] border border-black/5 flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-[#C2571A]/10 text-[#C2571A] flex items-center justify-center shrink-0 mt-0.5">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-[#1E2022]">Personal Concierge On-Call</h4>
                    <p className="text-xs text-[#555A60] mt-1 leading-relaxed">
                      Seamless WhatsApp concierge for fluid itinerary changes, dinner shifts, or
                      special anniversary requests.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* THE INNOVATIVE SAMSUNG LOCK-SCREEN STACKED ITINERARY DECK */}
            <div className="p-6 sm:p-8 rounded-3xl bg-white border border-[#1E2022]/8 shadow-xs">
              <div className="mb-6">
                <span className="text-xs font-bold uppercase tracking-wider text-[#C2571A]">
                  Tactile Deck Architecture
                </span>
                <h3 className="text-2xl font-bold text-[#1E2022] mt-1">
                  Daily Itinerary Deck
                </h3>
                <p className="text-xs sm:text-sm text-[#6B7280] mt-1">
                  Inspired by Samsung lock-screen layered cards. Click any day to spring it to the
                  front with complete rituals, locations, and secret spot recommendations.
                </p>
              </div>

              <StackedItineraryDeck days={pkg.itinerary} />
            </div>

            {/* Accommodation & Private Fleet Showcase */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Hotel / Resort */}
              <div className="p-6 rounded-3xl bg-white border border-[#1E2022]/8 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-2xl bg-[#FAF8F5] border border-black/5 flex items-center justify-center text-[#C2571A]">
                      <Building className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-base font-bold text-[#1E2022]">{pkg.hotel.name}</h4>
                      <span className="text-xs font-semibold text-[#C2571A]">
                        {pkg.hotel.tier}
                      </span>
                    </div>
                  </div>
                  <p className="text-xs sm:text-sm text-[#555A60] leading-relaxed mb-4">
                    {pkg.hotel.description}
                  </p>
                </div>

                <div className="pt-3 border-t border-[#1E2022]/6">
                  <span className="text-[11px] font-bold text-[#9CA3AF] uppercase tracking-wider block mb-2">
                    Sanctuary Amenities
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {pkg.hotel.amenities.map((item, idx) => (
                      <span
                        key={idx}
                        className="text-xs text-[#1E2022] bg-[#FAF8F5] px-2.5 py-1 rounded-lg border border-black/5"
                      >
                        ✓ {item}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Private Transport */}
              <div className="p-6 rounded-3xl bg-white border border-[#1E2022]/8 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-2xl bg-[#FAF8F5] border border-black/5 flex items-center justify-center text-[#C2571A]">
                      <Car className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-base font-bold text-[#1E2022]">{pkg.transport.type}</h4>
                      <span className="text-xs font-semibold text-emerald-700">
                        Dedicated Chauffeur & Sanitized Fleet
                      </span>
                    </div>
                  </div>
                  <p className="text-xs sm:text-sm text-[#555A60] leading-relaxed mb-4">
                    {pkg.transport.details}
                  </p>
                </div>

                <div className="pt-3 border-t border-[#1E2022]/6 space-y-2 text-xs text-[#555A60]">
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600" />
                    <span>Complimentary high-speed on-board Wi-Fi & chilled bottles</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600" />
                    <span>English-speaking certified local guide with cultural mastery</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Inclusions & Exclusions */}
            <div className="p-6 sm:p-8 rounded-3xl bg-white border border-[#1E2022]/8 shadow-xs">
              <h3 className="text-lg font-bold text-[#1E2022] mb-6">
                Inclusions & Transparency Guarantee
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">
                      Included with Your Booking
                    </span>
                  </div>
                  <ul className="space-y-2.5 text-xs sm:text-sm text-[#374151]">
                    {pkg.inclusions.map((inc, i) => (
                      <li key={i} className="flex items-start gap-2.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-2 shrink-0" />
                        <span>{inc}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <XCircle className="w-4 h-4 text-[#9CA3AF]" />
                    <span className="text-xs font-bold uppercase tracking-wider text-[#6B7280]">
                      Excluded (Transparent Notes)
                    </span>
                  </div>
                  <ul className="space-y-2.5 text-xs sm:text-sm text-[#6B7280]">
                    {pkg.exclusions.map((exc, i) => (
                      <li key={i} className="flex items-start gap-2.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-gray-400 mt-2 shrink-0" />
                        <span>{exc}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* Verified Traveler Reflection Note */}
            <div className="p-6 rounded-3xl bg-[#FAF8F5] border border-[#1E2022]/8 flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-[#1E2022] text-white flex items-center justify-center font-serif font-bold text-sm shrink-0">
                N
              </div>
              <div>
                <div className="flex items-center gap-1.5 text-amber-500 mb-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 fill-current" />
                  ))}
                </div>
                <p className="text-xs sm:text-sm italic text-[#1E2022] leading-relaxed">
                  “The private itinerary was effortlessly arranged. Waking up to the Petanu river mist
                  without feeling rushed made this one of our favorite trips of the decade.”
                </p>
                <span className="text-xs text-[#6B7280] mt-2 block">
                  — Priya & Siddharth K., Traveler Review (Traveled September 2026)
                </span>
              </div>
            </div>
          </div>

          {/* Right Column (4.5 cols): Sticky Concierge Reservation Panel */}
          <div className="lg:col-span-4 lg:sticky lg:top-20 space-y-6" id="booking-card">
            <div className="p-6 sm:p-7 rounded-3xl bg-white border border-[#1E2022]/10 shadow-xl space-y-6">
              {/* Header Price Tier */}
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#9CA3AF] block">
                  Private Curated Journey
                </span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-3xl font-bold text-[#1E2022]">
                    ₹{pkg.startingPrice.toLocaleString('en-IN')}
                  </span>
                  <span className="text-xs text-[#6B7280]">/ adult guest</span>
                </div>
                {pkg.originalPrice && (
                  <span className="text-xs text-[#9CA3AF] line-through">
                    Regular: ₹{pkg.originalPrice.toLocaleString('en-IN')}
                  </span>
                )}
              </div>

              {/* Date & Guests Configurator */}
              <div className="space-y-3 pt-3 border-t border-[#1E2022]/8 text-xs">
                {/* Departure Date */}
                <div className="p-3 rounded-2xl bg-[#FAF8F5] border border-black/5">
                  <label
                    htmlFor="departure-date"
                    className="block text-[#6B7280] font-medium mb-1"
                  >
                    Select Departure Date
                  </label>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-[#C2571A]" />
                    <input
                      id="departure-date"
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="bg-transparent font-semibold text-[#1E2022] focus:outline-none w-full cursor-pointer"
                    />
                  </div>
                  <span className="text-[10px] text-[#9CA3AF] mt-1 block">
                    Concludes on {calculatedEndDate} ({pkg.duration})
                  </span>
                </div>

                {/* Adults Counter */}
                <div className="p-3 rounded-2xl bg-[#FAF8F5] border border-black/5 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-[#1E2022] block">Adult Guests</span>
                    <span className="text-[10px] text-[#6B7280]">Age 12+</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <button
                      type="button"
                      disabled={adults <= 1}
                      onClick={() => setAdults((a) => Math.max(1, a - 1))}
                      className="w-7 h-7 rounded-lg bg-white border border-gray-300 text-xs font-bold disabled:opacity-40"
                    >
                      -
                    </button>
                    <span className="w-4 text-center font-bold text-sm">{adults}</span>
                    <button
                      type="button"
                      onClick={() => setAdults((a) => a + 1)}
                      className="w-7 h-7 rounded-lg bg-white border border-gray-300 text-xs font-bold"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Children Counter */}
                <div className="p-3 rounded-2xl bg-[#FAF8F5] border border-black/5 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-[#1E2022] block">Children</span>
                    <span className="text-[10px] text-[#6B7280]">Age 0–11 (50% tariff)</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <button
                      type="button"
                      disabled={children <= 0}
                      onClick={() => setChildren((c) => Math.max(0, c - 1))}
                      className="w-7 h-7 rounded-lg bg-white border border-gray-300 text-xs font-bold disabled:opacity-40"
                    >
                      -
                    </button>
                    <span className="w-4 text-center font-bold text-sm">{children}</span>
                    <button
                      type="button"
                      onClick={() => setChildren((c) => c + 1)}
                      className="w-7 h-7 rounded-lg bg-white border border-gray-300 text-xs font-bold"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>

              {/* Bespoke Concierge Add-ons */}
              <div className="pt-3 border-t border-[#1E2022]/8 space-y-2">
                <span className="text-[11px] font-bold text-[#9CA3AF] uppercase tracking-wider block">
                  Optional Concierge Enhancements
                </span>
                {CONCIERGE_ADDONS.map((addon) => {
                  const isChecked = selectedAddons.includes(addon.id);
                  return (
                    <label
                      key={addon.id}
                      className={`p-3 rounded-xl border flex items-start gap-2.5 cursor-pointer transition-all ${
                        isChecked
                          ? 'bg-[#C2571A]/5 border-[#C2571A]'
                          : 'bg-[#FAF8F5] border-black/5 hover:bg-white'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleAddon(addon.id)}
                        className="mt-1 accent-[#C2571A] cursor-pointer"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-[#1E2022] truncate">
                            {addon.name}
                          </span>
                          <span className="text-xs font-semibold text-[#C2571A]">
                            +₹{addon.pricePerPerson.toLocaleString('en-IN')}
                          </span>
                        </div>
                        <p className="text-[10px] text-[#6B7280] line-clamp-1 mt-0.5">
                          {addon.description}
                        </p>
                      </div>
                    </label>
                  );
                })}
              </div>

              {/* Live Cost Breakdown */}
              <div className="pt-3 border-t border-[#1E2022]/8 space-y-1.5 text-xs text-[#555A60]">
                <div className="flex justify-between">
                  <span>
                    Base Tour ({adults} Adults{children > 0 ? `, ${children} Children` : ''})
                  </span>
                  <span>₹{basePrice.toLocaleString('en-IN')}</span>
                </div>
                {addonsTotal > 0 && (
                  <div className="flex justify-between text-[#C2571A]">
                    <span>Concierge Enhancements</span>
                    <span>+₹{addonsTotal.toLocaleString('en-IN')}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-base text-[#1E2022] pt-2 border-t border-black/5">
                  <span>Total Estimated Investment:</span>
                  <span className="text-[#C2571A]">
                    ₹{grandTotalPrice.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              {/* Reservation Confirmation Button */}
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={handleConfirmReservation}
                  className="w-full py-3.5 rounded-full bg-[#1E2022] hover:bg-[#C2571A] text-white font-semibold text-sm transition-all duration-300 shadow-md active:scale-98 cursor-pointer flex items-center justify-center gap-2"
                >
                  {isReserved ? (
                    <span className="flex items-center gap-1.5">
                      <Check className="w-4 h-4 text-emerald-400" />
                      <span>✓ Reserved to My Trips!</span>
                    </span>
                  ) : (
                    <>
                      <span>Reserve This Private Journey</span>
                      <span>→</span>
                    </>
                  )}
                </button>

                <div className="text-center space-y-1">
                  <p className="text-[11px] text-[#6B7280]">
                    🔒 No payment required today. A travel designer holds your room dates for 48 hours.
                  </p>
                </div>
              </div>

              {/* Concierge Direct Reassurance */}
              <div className="pt-4 border-t border-[#1E2022]/8 flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-[#FAF8F5] border border-black/5 flex items-center justify-center text-[#C2571A] shrink-0">
                  <MessageCircle className="w-4 h-4" />
                </div>
                <div className="text-xs">
                  <span className="font-bold text-[#1E2022] block">
                    Have questions or custom dates?
                  </span>
                  <a
                    href="mailto:concierge@naikingtours.com"
                    className="text-[#C2571A] font-semibold hover:underline"
                  >
                    Chat with Destination Concierge
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 4. Other Recommended Journeys */}
        {otherPackages.length > 0 && (
          <div className="pt-12 border-t border-[#1E2022]/8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-[#C2571A]">
                  Curated Pairings
                </span>
                <h3 className="text-xl font-bold text-[#1E2022] mt-0.5">
                  Other Journeys You May Appreciate
                </h3>
              </div>
              <button
                onClick={onBack}
                className="text-xs font-semibold text-[#1E2022] hover:text-[#C2571A] transition-colors"
              >
                View All Escapes →
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {otherPackages.map((otherPkg) => (
                <div
                  key={otherPkg.id}
                  onClick={() => onSelectOtherPackage(otherPkg)}
                  className="group bg-white rounded-2xl overflow-hidden border border-[#1E2022]/8 shadow-xs hover:shadow-lg transition-all duration-300 p-4 flex gap-4 cursor-pointer"
                >
                  <div className="w-28 h-24 rounded-xl overflow-hidden bg-gray-100 shrink-0">
                    <img
                      src={otherPkg.featuredImage}
                      alt={otherPkg.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#C2571A] block">
                        {otherPkg.destination} · {otherPkg.duration}
                      </span>
                      <h4 className="text-sm font-bold text-[#1E2022] group-hover:text-[#C2571A] transition-colors truncate mt-0.5">
                        {otherPkg.name}
                      </h4>
                      <p className="text-xs text-[#6B7280] line-clamp-1 mt-1">
                        {otherPkg.shortHighlight}
                      </p>
                    </div>
                    <div className="flex items-center justify-between text-xs font-bold text-[#1E2022] mt-2">
                      <span>From ₹{otherPkg.startingPrice.toLocaleString('en-IN')}</span>
                      <span className="text-[#C2571A] group-hover:translate-x-1 transition-transform">
                        Explore →
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
