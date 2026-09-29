import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Heart,
  Share2,
  Star,
  Clock,
  MapPin,
  Calendar,
  CheckCircle2,
  XCircle,
  Building,
  Car,
  ShieldCheck,
  Check,
  MessageCircle,
  Utensils,
  Camera,
  Plane,
  BadgePercent,
  X,
  ChevronLeft,
  ChevronRight,
  Images,
} from 'lucide-react';
import { TourPackage } from '../types';
import { ItineraryStack } from './ItineraryStack';
import { ITINERARY_PLANS } from '../data/itineraryStops';

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

const SECTIONS = [
  { id: 'overview', label: 'Overview' },
  { id: 'itinerary', label: 'Day-wise Itinerary' },
  { id: 'stay', label: 'Stay & Transfers' },
  { id: 'inclusions', label: 'Inclusions & Exclusions' },
  { id: 'policies', label: 'Policies' },
];

const card = 'rounded-3xl bg-white border border-[#1E2022]/8 shadow-xs';

export const TourDetailPage: React.FC<TourDetailPageProps> = ({
  pkg,
  isFavorite,
  onToggleFavorite,
  onBack,
  onBookTrip,
  onSelectOtherPackage,
  allPackages,
}) => {
  const [startDate, setStartDate] = useState('2026-10-25');
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);
  const [selectedAddons, setSelectedAddons] = useState<string[]>([]);
  const [isReserved, setIsReserved] = useState(false);
  const [copyToast, setCopyToast] = useState(false);
  const [lightbox, setLightbox] = useState<number | null>(null);
  const [activeSection, setActiveSection] = useState('overview');

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setLightbox(null);
    setActiveSection('overview');
  }, [pkg]);

  // Scroll-spy for the section tabs
  useEffect(() => {
    const els = SECTIONS.map((s) => document.getElementById(s.id)).filter(
      (e): e is HTMLElement => Boolean(e)
    );
    const obs = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActiveSection(visible[0].target.id);
      },
      { rootMargin: '-130px 0px -60% 0px', threshold: 0 }
    );
    els.forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, [pkg]);

  // Lightbox keyboard controls
  useEffect(() => {
    if (lightbox === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightbox(null);
      if (e.key === 'ArrowRight') setLightbox((i) => (i === null ? i : (i + 1) % pkg.gallery.length));
      if (e.key === 'ArrowLeft') setLightbox((i) => (i === null ? i : (i - 1 + pkg.gallery.length) % pkg.gallery.length));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [lightbox, pkg.gallery.length]);

  const goToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      const y = el.getBoundingClientRect().top + window.scrollY - 128;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  const calculateEndDate = (start: string, days: number) => {
    const d = new Date(start);
    d.setDate(d.getDate() + days);
    return d.toISOString().split('T')[0];
  };
  const calculatedEndDate = calculateEndDate(startDate, pkg.daysCount);

  const addonsTotal = selectedAddons.reduce((acc, addonId) => {
    const found = CONCIERGE_ADDONS.find((a) => a.id === addonId);
    return acc + (found ? found.pricePerPerson * adults : 0);
  }, 0);
  const basePrice = pkg.startingPrice * adults + pkg.startingPrice * 0.5 * children;
  const grandTotalPrice = basePrice + addonsTotal;
  const savings = pkg.originalPrice ? pkg.originalPrice - pkg.startingPrice : 0;
  const emi = Math.round(grandTotalPrice / 6 / 10) * 10;

  const toggleAddon = (id: string) =>
    setSelectedAddons((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));

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
    setTimeout(() => setIsReserved(false), 4000);
  };

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopyToast(true);
      setTimeout(() => setCopyToast(false), 2500);
    }
  };

  const otherPackages = allPackages.filter((p) => p.id !== pkg.id).slice(0, 2);
  const plans = ITINERARY_PLANS[pkg.id];
  const totalStops = plans ? plans.reduce((n, d) => n + d.stops.length, 0) : pkg.itinerary.length * 3;
  const gallery = pkg.gallery.length ? pkg.gallery : [pkg.featuredImage];

  const quickFacts = [
    { icon: Clock, label: 'Duration', value: pkg.duration },
    { icon: Building, label: 'Stay', value: pkg.hotel.tier },
    { icon: Car, label: 'Transfers', value: pkg.transport.type },
    { icon: Utensils, label: 'Meals', value: 'As per itinerary' },
    { icon: Camera, label: 'Sightseeing', value: `${totalStops} planned stops` },
  ];

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#1E2022] pb-24 pt-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb + actions */}
        <div className="flex items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={onBack}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white hover:bg-black/5 border border-[#1E2022]/10 text-xs font-semibold cursor-pointer shrink-0"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back
            </button>
            <div className="hidden sm:flex items-center gap-1.5 text-xs text-[#6B7280] min-w-0">
              <span>Holidays</span>
              <span>/</span>
              <span>{pkg.destination}</span>
              <span>/</span>
              <span className="text-[#1E2022] font-semibold truncate">{pkg.name}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleShare}
              className="relative p-2 rounded-full bg-white border border-[#1E2022]/10 hover:bg-[#FAF8F5] cursor-pointer"
              title="Share"
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
              className="p-2 rounded-full bg-white border border-[#1E2022]/10 hover:bg-[#FAF8F5] cursor-pointer"
              title={isFavorite ? 'Remove from wishlist' : 'Save to wishlist'}
            >
              <Heart className={`w-4 h-4 ${isFavorite ? 'fill-[#C2571A] text-[#C2571A]' : ''}`} />
            </button>
          </div>
        </div>

        {/* Title block */}
        <div className="mb-5">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            {pkg.badge && (
              <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-[#1E2022] text-white">
                {pkg.badge}
              </span>
            )}
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#555A60]">
              <MapPin className="w-3.5 h-3.5 text-[#C2571A]" />
              {pkg.destination}, {pkg.country}
            </span>
            <span className="text-xs text-[#6B7280]">· {pkg.duration}</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight leading-tight">{pkg.name}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-3 text-sm">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#1E2022] text-white font-bold text-xs">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              {pkg.rating}
            </span>
            <span className="text-[#6B7280]">{pkg.reviewCount} guest reviews</span>
            <span className="text-[#6B7280]">· {pkg.tripStyle} escape</span>
          </div>
        </div>

        {/* Gallery mosaic */}
        <div className="relative grid grid-cols-4 grid-rows-2 gap-2 sm:gap-3 h-[260px] sm:h-[380px] lg:h-[430px] rounded-3xl overflow-hidden">
          <button
            type="button"
            onClick={() => setLightbox(0)}
            className="col-span-4 sm:col-span-2 row-span-2 relative group cursor-pointer"
          >
            <img
              src={gallery[0]}
              alt={pkg.name}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
          </button>
          {[1, 2, 3, 4].map((n) => {
            const src = gallery[n % gallery.length];
            return (
              <button
                key={n}
                type="button"
                onClick={() => setLightbox(n % gallery.length)}
                className="hidden sm:block col-span-1 relative group cursor-pointer overflow-hidden"
              >
                <img
                  src={src}
                  alt={`${pkg.name} view ${n + 1}`}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
              </button>
            );
          })}
          <button
            type="button"
            onClick={() => setLightbox(0)}
            className="absolute bottom-3 right-3 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-white/95 text-xs font-bold shadow-md cursor-pointer hover:bg-white"
          >
            <Images className="w-4 h-4" />
            View all photos
          </button>
        </div>

        {/* Section tabs */}
        <div className="sticky top-[68px] z-30 mt-6 -mx-4 sm:mx-0 px-4 sm:px-0 bg-[#FAF8F5]/95 backdrop-blur border-b border-[#1E2022]/10">
          <nav className="flex gap-1 overflow-x-auto scrollbar-none" aria-label="Package sections">
            {SECTIONS.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => goToSection(s.id)}
                className={`relative px-4 py-3.5 text-sm font-semibold whitespace-nowrap cursor-pointer transition-colors ${
                  activeSection === s.id ? 'text-[#1E2022]' : 'text-[#6B7280] hover:text-[#1E2022]'
                }`}
              >
                {s.label}
                {activeSection === s.id && (
                  <span className="absolute left-3 right-3 bottom-0 h-[3px] rounded-full bg-[#C2571A]" />
                )}
              </button>
            ))}
          </nav>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start mt-8">
          {/* LEFT — content sections */}
          <div className="lg:col-span-8 space-y-8">
            {/* Overview */}
            <section id="overview" className={`${card} p-6 sm:p-8`}>
              <h2 className="text-xl font-bold">Package overview</h2>
              <p className="mt-3 text-sm sm:text-base text-[#555A60] leading-relaxed">{pkg.description}</p>
              <div className="mt-6 grid grid-cols-2 sm:grid-cols-5 gap-3">
                {quickFacts.map(({ icon: Icon, label, value }) => (
                  <div key={label} className="rounded-2xl bg-[#FAF8F5] border border-black/5 p-3.5">
                    <Icon className="w-5 h-5 text-[#C2571A]" />
                    <span className="block mt-2 text-[11px] uppercase tracking-wider text-[#9CA3AF] font-semibold">
                      {label}
                    </span>
                    <span className="block mt-0.5 text-xs font-bold leading-snug">{value}</span>
                  </div>
                ))}
              </div>
              <div className="mt-6 pt-5 border-t border-[#1E2022]/8">
                <span className="text-xs font-bold uppercase tracking-wider text-[#9CA3AF]">Trip highlights</span>
                <ul className="mt-3 grid sm:grid-cols-2 gap-x-6 gap-y-2.5">
                  {pkg.itinerary.map((d) => (
                    <li key={d.dayNumber} className="flex items-start gap-2 text-sm text-[#374151]">
                      <Check className="w-4 h-4 text-[#C2571A] mt-0.5 shrink-0" />
                      <span>{d.highlight}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </section>

            {/* Itinerary */}
            <section id="itinerary" className={`${card} p-6 sm:p-8`}>
              <div className="flex flex-wrap items-end justify-between gap-2 mb-6">
                <div>
                  <h2 className="text-xl font-bold">Day-wise itinerary</h2>
                  <p className="text-xs text-[#6B7280] mt-1">
                    {pkg.daysCount} days · {totalStops} stops — hover or tap a day to see its plan
                  </p>
                </div>
              </div>
              <ItineraryStack days={pkg.itinerary} plans={plans} />
            </section>

            {/* Stay & transfers */}
            <section id="stay" className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className={`${card} p-6 flex flex-col justify-between`}>
                <div>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-2xl bg-[#FAF8F5] border border-black/5 flex items-center justify-center text-[#C2571A]">
                      <Building className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold">{pkg.hotel.name}</h3>
                      <span className="text-xs font-semibold text-[#C2571A]">{pkg.hotel.tier}</span>
                    </div>
                  </div>
                  <p className="text-sm text-[#555A60] leading-relaxed mb-4">{pkg.hotel.description}</p>
                </div>
                <div className="pt-3 border-t border-[#1E2022]/6 flex flex-wrap gap-2">
                  {pkg.hotel.amenities.map((item) => (
                    <span key={item} className="text-xs bg-[#FAF8F5] px-2.5 py-1 rounded-lg border border-black/5">
                      ✓ {item}
                    </span>
                  ))}
                </div>
              </div>

              <div className={`${card} p-6 flex flex-col justify-between`}>
                <div>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-2xl bg-[#FAF8F5] border border-black/5 flex items-center justify-center text-[#C2571A]">
                      <Car className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold">{pkg.transport.type}</h3>
                      <span className="text-xs font-semibold text-emerald-700">Private · Chauffeur driven</span>
                    </div>
                  </div>
                  <p className="text-sm text-[#555A60] leading-relaxed mb-4">{pkg.transport.details}</p>
                </div>
                <div className="pt-3 border-t border-[#1E2022]/6 space-y-2 text-xs text-[#555A60]">
                  <div className="flex items-center gap-2">
                    <Plane className="w-4 h-4 text-[#C2571A]" />
                    <span>Airport pickup and drop included</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600" />
                    <span>English-speaking certified local guide</span>
                  </div>
                </div>
              </div>
            </section>

            {/* Inclusions */}
            <section id="inclusions" className={`${card} p-6 sm:p-8`}>
              <h2 className="text-xl font-bold mb-6">Inclusions &amp; exclusions</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">Included</span>
                  </div>
                  <ul className="space-y-2.5 text-sm text-[#374151]">
                    {pkg.inclusions.map((inc) => (
                      <li key={inc} className="flex items-start gap-2.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-2 shrink-0" />
                        <span>{inc}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <XCircle className="w-4 h-4 text-[#9CA3AF]" />
                    <span className="text-xs font-bold uppercase tracking-wider text-[#6B7280]">Not included</span>
                  </div>
                  <ul className="space-y-2.5 text-sm text-[#6B7280]">
                    {pkg.exclusions.map((exc) => (
                      <li key={exc} className="flex items-start gap-2.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-gray-400 mt-2 shrink-0" />
                        <span>{exc}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </section>

            {/* Policies */}
            <section id="policies" className={`${card} p-6 sm:p-8`}>
              <h2 className="text-xl font-bold mb-5">Booking &amp; cancellation policy</h2>
              {/* NOTE: sample terms — replace with your actual policy */}
              <div className="space-y-3">
                {[
                  ['30+ days before departure', 'Free cancellation', 'text-emerald-700 bg-emerald-50'],
                  ['15 – 29 days before departure', '50% of package cost refunded', 'text-amber-700 bg-amber-50'],
                  ['Less than 15 days', 'Non-refundable', 'text-red-700 bg-red-50'],
                ].map(([when, what, tone]) => (
                  <div key={when} className="flex items-center justify-between gap-3 rounded-2xl border border-[#1E2022]/8 px-4 py-3">
                    <span className="text-sm font-semibold">{when}</span>
                    <span className={`text-xs font-bold px-3 py-1 rounded-full ${tone}`}>{what}</span>
                  </div>
                ))}
              </div>
              <ul className="mt-5 space-y-2 text-sm text-[#555A60] list-disc pl-5">
                <li>Reserve with no payment today; your travel designer holds dates for 48 hours.</li>
                <li>25% confirms the booking; the balance is due 15 days before departure.</li>
                <li>Itinerary timings may shift with weather, flights and local closures.</li>
              </ul>
            </section>
          </div>

          {/* RIGHT — sticky booking card */}
          <aside className="lg:col-span-4 lg:sticky lg:top-40 space-y-4" id="booking-card">
            <div className="p-6 rounded-3xl bg-white border border-[#1E2022]/10 shadow-xl space-y-5">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#9CA3AF]">Starting from</span>
                  {savings > 0 && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                      <BadgePercent className="w-3 h-3" />
                      Save ₹{savings.toLocaleString('en-IN')}
                    </span>
                  )}
                </div>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-3xl font-extrabold">₹{pkg.startingPrice.toLocaleString('en-IN')}</span>
                  {pkg.originalPrice && (
                    <span className="text-sm text-[#9CA3AF] line-through">
                      ₹{pkg.originalPrice.toLocaleString('en-IN')}
                    </span>
                  )}
                </div>
                <span className="text-xs text-[#6B7280]">per adult · twin sharing · taxes included</span>
              </div>

              <div className="space-y-3 text-xs">
                <div className="p-3 rounded-2xl border border-[#1E2022]/12 bg-white">
                  <label htmlFor="departure-date" className="block text-[#6B7280] font-medium mb-1">
                    Departure date
                  </label>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-[#C2571A]" />
                    <input
                      id="departure-date"
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="bg-transparent font-semibold focus:outline-none w-full cursor-pointer"
                    />
                  </div>
                  <span className="text-[10px] text-[#9CA3AF] mt-1 block">
                    Returns {calculatedEndDate} · {pkg.duration}
                  </span>
                </div>

                {[
                  { label: 'Adults', sub: 'Age 12+', value: adults, set: setAdults, min: 1 },
                  { label: 'Children', sub: 'Age 0–11 · 50% tariff', value: children, set: setChildren, min: 0 },
                ].map((row) => (
                  <div key={row.label} className="p-3 rounded-2xl border border-[#1E2022]/12 bg-white flex items-center justify-between">
                    <div>
                      <span className="font-bold block">{row.label}</span>
                      <span className="text-[10px] text-[#6B7280]">{row.sub}</span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <button
                        type="button"
                        disabled={row.value <= row.min}
                        onClick={() => row.set((v) => Math.max(row.min, v - 1))}
                        className="w-7 h-7 rounded-lg border border-gray-300 font-bold disabled:opacity-40 cursor-pointer"
                        aria-label={`Decrease ${row.label}`}
                      >
                        -
                      </button>
                      <span className="w-4 text-center font-bold text-sm">{row.value}</span>
                      <button
                        type="button"
                        onClick={() => row.set((v) => v + 1)}
                        className="w-7 h-7 rounded-lg border border-gray-300 font-bold cursor-pointer"
                        aria-label={`Increase ${row.label}`}
                      >
                        +
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-1 space-y-2">
                <span className="text-[11px] font-bold text-[#9CA3AF] uppercase tracking-wider block">
                  Optional add-ons
                </span>
                {CONCIERGE_ADDONS.map((addon) => {
                  const on = selectedAddons.includes(addon.id);
                  return (
                    <label
                      key={addon.id}
                      className={`p-3 rounded-xl border flex items-start gap-2.5 cursor-pointer transition-colors ${
                        on ? 'bg-[#C2571A]/5 border-[#C2571A]' : 'bg-white border-[#1E2022]/12 hover:border-[#1E2022]/30'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={on}
                        onChange={() => toggleAddon(addon.id)}
                        className="mt-1 accent-[#C2571A] cursor-pointer"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-bold truncate">{addon.name}</span>
                          <span className="text-xs font-semibold text-[#C2571A] whitespace-nowrap">
                            +₹{addon.pricePerPerson.toLocaleString('en-IN')}
                          </span>
                        </div>
                        <p className="text-[10px] text-[#6B7280] line-clamp-1 mt-0.5">{addon.description}</p>
                      </div>
                    </label>
                  );
                })}
              </div>

              <div className="pt-3 border-t border-[#1E2022]/8 space-y-1.5 text-xs text-[#555A60]">
                <div className="flex justify-between">
                  <span>
                    Package ({adults} adult{adults > 1 ? 's' : ''}
                    {children > 0 ? `, ${children} child${children > 1 ? 'ren' : ''}` : ''})
                  </span>
                  <span>₹{basePrice.toLocaleString('en-IN')}</span>
                </div>
                {addonsTotal > 0 && (
                  <div className="flex justify-between text-[#C2571A]">
                    <span>Add-ons</span>
                    <span>+₹{addonsTotal.toLocaleString('en-IN')}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-base text-[#1E2022] pt-2 border-t border-black/5">
                  <span>Total</span>
                  <span>₹{grandTotalPrice.toLocaleString('en-IN')}</span>
                </div>
                <p className="text-[11px] text-[#6B7280]">Or from ₹{emi.toLocaleString('en-IN')}/month on 6-month EMI</p>
              </div>

              <button
                type="button"
                onClick={handleConfirmReservation}
                className="w-full py-3.5 rounded-xl bg-[#1E2022] hover:bg-[#C2571A] text-white font-semibold text-sm transition-colors shadow-md cursor-pointer flex items-center justify-center gap-2"
              >
                {isReserved ? (
                  <span className="flex items-center gap-1.5">
                    <Check className="w-4 h-4 text-emerald-400" />
                    Reserved to My Trips!
                  </span>
                ) : (
                  <>Reserve this journey →</>
                )}
              </button>
              <p className="text-[11px] text-center text-[#6B7280] flex items-center justify-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5" />
                No payment today · dates held for 48 hours
              </p>

              <div className="pt-4 border-t border-[#1E2022]/8 flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-[#FAF8F5] border border-black/5 flex items-center justify-center text-[#C2571A] shrink-0">
                  <MessageCircle className="w-4 h-4" />
                </div>
                <div className="text-xs">
                  <span className="font-bold block">Need custom dates or changes?</span>
                  <a href="mailto:concierge@naikingtours.com" className="text-[#C2571A] font-semibold hover:underline">
                    Talk to a travel designer
                  </a>
                </div>
              </div>
            </div>
          </aside>
        </div>

        {/* Other journeys */}
        {otherPackages.length > 0 && (
          <div className="pt-12 mt-12 border-t border-[#1E2022]/8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold">Similar holidays you may like</h3>
              <button onClick={onBack} className="text-xs font-semibold hover:text-[#C2571A] transition-colors cursor-pointer">
                View all →
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {otherPackages.map((o) => (
                <div
                  key={o.id}
                  onClick={() => onSelectOtherPackage(o)}
                  className="group bg-white rounded-2xl overflow-hidden border border-[#1E2022]/8 shadow-xs hover:shadow-lg transition-shadow p-4 flex gap-4 cursor-pointer"
                >
                  <div className="w-28 h-24 rounded-xl overflow-hidden bg-gray-100 shrink-0">
                    <img
                      src={o.featuredImage}
                      alt={o.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#C2571A] block">
                        {o.destination} · {o.duration}
                      </span>
                      <h4 className="text-sm font-bold group-hover:text-[#C2571A] transition-colors truncate mt-0.5">
                        {o.name}
                      </h4>
                      <p className="text-xs text-[#6B7280] line-clamp-1 mt-1">{o.shortHighlight}</p>
                    </div>
                    <div className="flex items-center justify-between text-xs font-bold mt-2">
                      <span>From ₹{o.startingPrice.toLocaleString('en-IN')}</span>
                      <span className="text-[#C2571A]">View →</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Mobile sticky reserve bar */}
      <div className="lg:hidden fixed bottom-16 left-0 right-0 z-30 px-4">
        <div className="flex items-center justify-between gap-3 rounded-2xl bg-white border border-[#1E2022]/12 shadow-2xl px-4 py-3">
          <div>
            <span className="text-[10px] uppercase tracking-wider text-[#9CA3AF] font-bold block">From</span>
            <span className="text-lg font-extrabold">₹{pkg.startingPrice.toLocaleString('en-IN')}</span>
          </div>
          <a
            href="#booking-card"
            className="px-5 py-2.5 rounded-xl bg-[#1E2022] text-white text-sm font-semibold"
          >
            Reserve
          </a>
        </div>
      </div>

      {/* Lightbox */}
      {lightbox !== null && (
        <div
          className="fixed inset-0 z-[90] bg-black/90 flex items-center justify-center p-4"
          onClick={() => setLightbox(null)}
          role="dialog"
          aria-modal="true"
          aria-label="Photo gallery"
        >
          <button
            type="button"
            className="absolute top-5 right-5 w-10 h-10 rounded-full bg-white/15 text-white flex items-center justify-center hover:bg-white/25 cursor-pointer"
            onClick={() => setLightbox(null)}
            aria-label="Close gallery"
          >
            <X className="w-5 h-5" />
          </button>
          {gallery.length > 1 && (
            <>
              <button
                type="button"
                className="absolute left-4 w-10 h-10 rounded-full bg-white/15 text-white flex items-center justify-center hover:bg-white/25 cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  setLightbox((lightbox - 1 + gallery.length) % gallery.length);
                }}
                aria-label="Previous photo"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                type="button"
                className="absolute right-4 w-10 h-10 rounded-full bg-white/15 text-white flex items-center justify-center hover:bg-white/25 cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  setLightbox((lightbox + 1) % gallery.length);
                }}
                aria-label="Next photo"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </>
          )}
          <img
            src={gallery[lightbox]}
            alt={`${pkg.name} photo ${lightbox + 1}`}
            referrerPolicy="no-referrer"
            className="max-h-[85vh] max-w-full rounded-2xl object-contain"
            onClick={(e) => e.stopPropagation()}
          />
          <span className="absolute bottom-5 text-xs text-white/80">
            {lightbox + 1} / {gallery.length}
          </span>
        </div>
      )}
    </div>
  );
};
