import React, { useState } from 'react';
import {
  X,
  Heart,
  Star,
  Clock,
  MapPin,
  CheckCircle2,
  XCircle,
  Building,
  Car,
  ShieldCheck,
  Calendar,
  Users,
} from 'lucide-react';
import { TourPackage } from '../types';
import { StackedItineraryDeck } from './StackedItineraryDeck';

interface TourDetailsModalProps {
  pkg: TourPackage | null;
  isOpen: boolean;
  onClose: () => void;
  isFavorite: boolean;
  onToggleFavorite: (pkg: TourPackage) => void;
  onBookTrip: (bookingData: {
    pkg: TourPackage;
    startDate: string;
    endDate: string;
    adults: number;
    children: number;
    totalPrice: number;
  }) => void;
}

export const TourDetailsModal: React.FC<TourDetailsModalProps> = ({
  pkg,
  isOpen,
  onClose,
  isFavorite,
  onToggleFavorite,
  onBookTrip,
}) => {
  if (!isOpen || !pkg) return null;

  const [activeImage, setActiveImage] = useState(pkg.featuredImage);
  const [isBookingStep, setIsBookingStep] = useState(false);
  const [bookingAdults, setBookingAdults] = useState(2);
  const [bookingChildren, setBookingChildren] = useState(0);
  const [startDate, setStartDate] = useState('2026-11-10');
  const [bookingSuccess, setBookingSuccess] = useState(false);

  const calculateEndDate = (start: string, days: number) => {
    const d = new Date(start);
    d.setDate(d.getDate() + days);
    return d.toISOString().split('T')[0];
  };

  const calculatedEndDate = calculateEndDate(startDate, pkg.daysCount);
  const totalPrice = pkg.startingPrice * bookingAdults + pkg.startingPrice * 0.5 * bookingChildren;

  const handleConfirmBooking = () => {
    onBookTrip({
      pkg,
      startDate,
      endDate: calculatedEndDate,
      adults: bookingAdults,
      children: bookingChildren,
      totalPrice,
    });
    setBookingSuccess(true);
    setTimeout(() => {
      setBookingSuccess(false);
      setIsBookingStep(false);
      onClose();
    }, 1800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 overflow-y-auto bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl bg-[#FAF8F5] rounded-3xl shadow-2xl border border-white/20 overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Top Sticky Bar: Close & Wishlist */}
        <div className="sticky top-0 z-40 bg-[#FAF8F5]/90 backdrop-blur-md px-6 py-4 border-b border-[#1E2022]/8 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[#E05A47]">
              {pkg.destination}
            </span>
            <span className="text-xs text-[#9CA3AF]">·</span>
            <span className="text-xs text-[#6B7280]">{pkg.duration}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onToggleFavorite(pkg)}
              className="p-2 rounded-full hover:bg-black/5 text-[#1E2022] transition-colors cursor-pointer"
              aria-label="Toggle favorite"
            >
              <Heart
                className={`w-5 h-5 ${
                  isFavorite ? 'fill-[#E05A47] text-[#E05A47]' : 'text-[#1E2022]'
                }`}
              />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-black/5 text-[#1E2022] transition-colors cursor-pointer"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="overflow-y-auto p-6 sm:p-8 space-y-8 flex-1">
          {/* Image Gallery */}
          <div className="space-y-3">
            <div className="relative aspect-[16/9] rounded-2xl overflow-hidden bg-[#ECE8E1] border border-black/5">
              <img
                src={activeImage}
                alt={pkg.name}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover transition-all duration-300"
              />
              {pkg.badge && (
                <div className="absolute top-4 left-4">
                  <span className="text-xs font-bold tracking-wider uppercase px-3 py-1 rounded-full bg-[#1E2022] text-white shadow-xs">
                    {pkg.badge}
                  </span>
                </div>
              )}
            </div>

            {/* Thumbnail Row */}
            <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-none">
              {pkg.gallery.map((img, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setActiveImage(img)}
                  className={`relative flex-none w-20 h-14 rounded-xl overflow-hidden border-2 transition-all cursor-pointer ${
                    activeImage === img ? 'border-[#E05A47] scale-102' : 'border-transparent opacity-70 hover:opacity-100'
                  }`}
                >
                  <img
                    src={img}
                    alt=""
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Title & Core Metadata */}
          <div>
            <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
              <h2 className="text-2xl sm:text-3xl font-bold text-[#1E2022] tracking-tight">
                {pkg.name}
              </h2>
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200/50">
                <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                <span className="text-sm font-bold text-amber-900">{pkg.rating}</span>
                <span className="text-xs text-amber-700">({pkg.reviewCount} reviews)</span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-xs sm:text-sm text-[#6B7280]">
              <span className="flex items-center gap-1">
                <MapPin className="w-4 h-4 text-[#E05A47]" />
                {pkg.destination}, {pkg.country}
              </span>
              <span>·</span>
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4 text-[#6B7280]" />
                {pkg.duration}
              </span>
              <span>·</span>
              <span className="text-[#1E2022] font-medium">Boutique Private Tour</span>
            </div>

            <p className="mt-4 text-sm sm:text-base text-[#4B5563] leading-relaxed">
              {pkg.description}
            </p>
          </div>

          {/* Boutique Stay & Transport Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Hotel */}
            <div className="p-5 rounded-2xl bg-white border border-[#1E2022]/8 shadow-xs">
              <div className="flex items-center gap-2.5 mb-2">
                <div className="w-8 h-8 rounded-xl bg-[#FAF8F5] border border-black/5 flex items-center justify-center text-[#1E2022]">
                  <Building className="w-4 h-4 text-[#E05A47]" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-[#1E2022]">{pkg.hotel.name}</h4>
                  <span className="text-[11px] text-[#6B7280]">{pkg.hotel.tier}</span>
                </div>
              </div>
              <p className="text-xs text-[#555A60] leading-relaxed mb-3">
                {pkg.hotel.description}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {pkg.hotel.amenities.map((item, idx) => (
                  <span
                    key={idx}
                    className="text-[11px] text-[#6B7280] bg-[#FAF8F5] px-2 py-0.5 rounded-md border border-black/5"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>

            {/* Transport */}
            <div className="p-5 rounded-2xl bg-white border border-[#1E2022]/8 shadow-xs">
              <div className="flex items-center gap-2.5 mb-2">
                <div className="w-8 h-8 rounded-xl bg-[#FAF8F5] border border-black/5 flex items-center justify-center text-[#1E2022]">
                  <Car className="w-4 h-4 text-[#E05A47]" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-[#1E2022]">{pkg.transport.type}</h4>
                  <span className="text-[11px] text-[#6B7280]">Dedicated Concierge Chauffeur</span>
                </div>
              </div>
              <p className="text-xs text-[#555A60] leading-relaxed mb-3">
                {pkg.transport.details}
              </p>
              <div className="flex items-center gap-2 text-xs text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-100">
                <ShieldCheck className="w-4 h-4" />
                <span>Verified Private Chauffeur & Sanitized Fleet</span>
              </div>
            </div>
          </div>

          {/* THE STACKED ITINERARY DECK (Samsung Lockscreen inspired) */}
          <div className="pt-2">
            <StackedItineraryDeck days={pkg.itinerary} />
          </div>

          {/* Inclusions & Exclusions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-[#1E2022]/8">
            <div>
              <h4 className="text-sm font-bold text-[#1E2022] mb-3 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>What is Included</span>
              </h4>
              <ul className="space-y-2 text-xs text-[#4B5563]">
                {pkg.inclusions.map((inc, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                    <span>{inc}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="text-sm font-bold text-[#1E2022] mb-3 flex items-center gap-2">
                <XCircle className="w-4 h-4 text-[#9CA3AF]" />
                <span>What is Excluded</span>
              </h4>
              <ul className="space-y-2 text-xs text-[#6B7280]">
                {pkg.exclusions.map((exc, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-gray-400 mt-1.5 shrink-0" />
                    <span>{exc}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Booking Confirmation Dialog (Inside Modal when Book This Trip is clicked) */}
          {isBookingStep && (
            <div className="p-6 rounded-2xl bg-white border-2 border-[#E05A47]/30 shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-base font-bold text-[#1E2022]">
                    Reserve Your Private Departure
                  </h4>
                  <p className="text-xs text-[#6B7280]">
                    Select dates and travellers. No upfront payment required to hold reservations.
                  </p>
                </div>
                <button
                  onClick={() => setIsBookingStep(false)}
                  className="text-xs text-[#6B7280] hover:text-[#1E2022]"
                >
                  Cancel
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                {/* Start Date */}
                <div className="p-3 rounded-xl bg-[#FAF8F5] border border-black/5">
                  <label
                    htmlFor="booking-start-date"
                    className="block text-[#6B7280] font-medium mb-1"
                  >
                    Departure Date
                  </label>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-[#E05A47]" />
                    <input
                      id="booking-start-date"
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="bg-transparent font-semibold text-[#1E2022] focus:outline-none w-full"
                    />
                  </div>
                </div>

                {/* Adults */}
                <div className="p-3 rounded-xl bg-[#FAF8F5] border border-black/5">
                  <span className="block text-[#6B7280] font-medium mb-1">
                    Adult Guests (12+)
                  </span>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-[#E05A47]" />
                      <span className="font-semibold text-[#1E2022]">{bookingAdults}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        disabled={bookingAdults <= 1}
                        onClick={() => setBookingAdults((a) => Math.max(1, a - 1))}
                        className="w-6 h-6 rounded-md bg-white border border-gray-300 text-xs flex items-center justify-center disabled:opacity-40"
                      >
                        -
                      </button>
                      <button
                        type="button"
                        onClick={() => setBookingAdults((a) => a + 1)}
                        className="w-6 h-6 rounded-md bg-white border border-gray-300 text-xs flex items-center justify-center"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>

                {/* Children */}
                <div className="p-3 rounded-xl bg-[#FAF8F5] border border-black/5">
                  <span className="block text-[#6B7280] font-medium mb-1">
                    Children (0-11)
                  </span>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-[#6B7280]" />
                      <span className="font-semibold text-[#1E2022]">{bookingChildren}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        disabled={bookingChildren <= 0}
                        onClick={() => setBookingChildren((c) => Math.max(0, c - 1))}
                        className="w-6 h-6 rounded-md bg-white border border-gray-300 text-xs flex items-center justify-center disabled:opacity-40"
                      >
                        -
                      </button>
                      <button
                        type="button"
                        onClick={() => setBookingChildren((c) => c + 1)}
                        className="w-6 h-6 rounded-md bg-white border border-gray-300 text-xs flex items-center justify-center"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Total Calculation & Confirm */}
              <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <span className="text-xs text-[#6B7280]">Total Trip Estimation:</span>
                  <div className="text-lg font-bold text-[#1E2022]">
                    ₹{totalPrice.toLocaleString('en-IN')}{' '}
                    <span className="text-xs font-normal text-[#6B7280]">
                      ({bookingAdults} Adults{bookingChildren > 0 ? `, ${bookingChildren} Children` : ''})
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleConfirmBooking}
                  className="px-6 py-3 rounded-xl bg-[#E05A47] hover:bg-[#c94937] text-white font-semibold text-xs sm:text-sm tracking-wide shadow-md active:scale-98 transition-all cursor-pointer"
                >
                  {bookingSuccess ? '✓ Trip Reserved to My Trips!' : 'Confirm Reservation →'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Sticky Bottom Action Bar */}
        <div className="sticky bottom-0 z-40 bg-white/95 backdrop-blur-md px-6 py-4 border-t border-[#1E2022]/8 flex items-center justify-between shadow-lg">
          <div>
            <span className="text-[11px] uppercase tracking-wider text-[#9CA3AF] block font-medium">
              Investment from
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl sm:text-2xl font-bold text-[#1E2022]">
                ₹{pkg.startingPrice.toLocaleString('en-IN')}
              </span>
              <span className="text-xs text-[#6B7280]">/ person</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {!isBookingStep && (
              <button
                type="button"
                onClick={() => setIsBookingStep(true)}
                className="px-6 py-3 rounded-full bg-[#1E2022] hover:bg-[#E05A47] text-white font-semibold text-xs sm:text-sm transition-all duration-300 shadow-sm active:scale-98 cursor-pointer"
              >
                Book This Trip →
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
