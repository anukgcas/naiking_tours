import React from 'react';
import { X, Bookmark, ArrowRight, Trash2, Clock, Sparkles, MessageSquare, Calendar, Users } from 'lucide-react';
import { TripBooking } from '../types';
import { CuratedPackage } from './CuratedPackages';
import { formatINR } from '../data/planner';
import { useFocusTrap } from '../hooks/useFocusTrap';

interface SavedPackagesDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  savedPackages: CuratedPackage[];
  /** Packages the traveller customised and saved from the planner. */
  savedTrips?: TripBooking[];
  onResumeTrip?: (trip: TripBooking) => void;
  onRemoveTrip?: (tripId: string) => void;
  onRemovePackage: (packageId: string) => void;
  onSelectPackage: (pkg: CuratedPackage) => void;
  onEnquirePackage: (pkg: CuratedPackage) => void;
  onExplorePackages: () => void;
}

export const SavedPackagesDrawer: React.FC<SavedPackagesDrawerProps> = ({
  isOpen,
  onClose,
  savedPackages,
  savedTrips = [],
  onResumeTrip,
  onRemoveTrip,
  onRemovePackage,
  onSelectPackage,
  onEnquirePackage,
  onExplorePackages,
}) => {
  const containerRef = useFocusTrap<HTMLDivElement>({
    isOpen,
    onClose,
  });

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 overflow-hidden bg-black/40 backdrop-blur-xs flex justify-end animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="saved-packages-title"
      onClick={onClose}
    >
      <div
        ref={containerRef}
        className="w-full sm:max-w-md bg-white h-full shadow-2xl flex flex-col border-l border-[#1E2022]/10 animate-in slide-in-from-right duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 sm:px-7 pt-7 pb-6 border-b border-[#1E2022]/8 flex items-start justify-between gap-4 bg-white">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#C2571A]/10 text-[#C2571A] text-xs font-semibold mb-1">
              <Bookmark className="w-3 h-3 fill-current" />
              <span>Saved For Later</span>
            </div>
            <h3 id="saved-packages-title" className="text-2xl font-semibold tracking-tight text-[#1E2022]">
              Saved Packages
            </h3>
            <p className="mt-1 text-[14px] text-[#6B7280] font-medium">
              Your customised packages and bookmarked journeys
            </p>
          </div>
          <button
            onClick={onClose}
            className="min-w-[44px] min-h-[44px] flex items-center justify-center -mr-2 rounded-full hover:bg-[#1E2022]/5 text-[#6B7280] hover:text-[#1E2022] focus-visible:ring-2 focus-visible:ring-[#C2571A] focus-visible:outline-none transition-colors duration-200 cursor-pointer"
            aria-label="Close Saved Packages"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content list */}
        <div className="flex-1 overflow-y-auto px-5 sm:px-7 pt-4 pb-6 space-y-4">
          {savedTrips.length > 0 && (
            <>
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#6B7280]">Your customised packages</p>
              {savedTrips.map((trip) => (
                <div
                  key={trip.id}
                  className="group bg-white rounded-2xl p-4 sm:p-5 border border-[#14213D]/10 shadow-xs hover:border-[#14213D]/20 transition-all duration-200"
                >
                  <div className="flex gap-4">
                    <div className="relative w-24 h-24 rounded-xl overflow-hidden bg-slate-100 shrink-0">
                      <img src={trip.image} alt={trip.destination} className="w-full h-full object-cover" />
                      <span className="absolute bottom-1.5 left-1.5 px-1.5 py-0.5 rounded-md bg-[#14213D]/80 text-white text-[9px] font-semibold">
                        Your plan
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-[11px] font-semibold text-[#14213D]/70">{trip.destination}</span>
                        <button
                          type="button"
                          onClick={() => onRemoveTrip?.(trip.id)}
                          className="min-w-[44px] min-h-[44px] flex items-center justify-center -mr-2 -my-3 rounded-lg text-[#9CA3AF] hover:text-rose-600 hover:bg-rose-50 cursor-pointer"
                          title="Remove from saved"
                          aria-label={`Remove ${trip.packageName} from saved`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <h4 className="text-base font-semibold leading-snug text-[#1E2022] line-clamp-2">{trip.packageName}</h4>
                      <div className="mt-1.5 text-sm font-bold text-[#1E2022]">
                        {formatINR(trip.totalPrice)} <span className="text-[10px] font-medium text-[#6B7280]">total</span>
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center justify-between gap-3 text-xs text-[#555A60]">
                    <span className="inline-flex items-center gap-1.5 min-w-0">
                      <Calendar className="w-3.5 h-3.5 text-[#9CA3AF] shrink-0" />
                      <span className="truncate">{trip.startDate} – {trip.endDate}</span>
                    </span>
                    <span className="inline-flex items-center gap-1.5 shrink-0">
                      <Users className="w-3.5 h-3.5 text-[#9CA3AF]" />
                      {trip.travellers.adults}A{trip.travellers.children > 0 ? ` · ${trip.travellers.children}C` : ''}
                    </span>
                  </div>
                  <div className="mt-4 pt-3 border-t border-[#1E2022]/6 flex items-center justify-between gap-2">
                    <span className="text-[11px] text-[#6B7280]">Saved draft, not sent yet</span>
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onResumeTrip?.(trip);
                      }}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#14213D] hover:bg-[#1B2C52] text-white text-xs font-semibold transition-colors cursor-pointer"
                    >
                      <span>Resume planning</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
              {savedPackages.length > 0 && (
                <p className="pt-2 text-[11px] font-bold uppercase tracking-[0.14em] text-[#6B7280]">Bookmarked journeys</p>
              )}
            </>
          )}
          {savedPackages.length > 0 ? (
            savedPackages.map((pkg) => (
              <div
                key={pkg.id}
                className="group bg-white rounded-2xl p-4 sm:p-5 border border-[#1E2022]/8 shadow-xs hover:border-[#1E2022]/15 transition-all duration-200 flex flex-col justify-between"
              >
                <div>
                  {/* Top: Image & Header info */}
                  <div className="flex gap-4">
                    <div className="relative w-24 h-24 rounded-xl overflow-hidden bg-slate-100 shrink-0">
                      <img
                        src={pkg.image}
                        alt={pkg.name}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                      <span className="absolute bottom-1.5 left-1.5 px-1.5 py-0.5 rounded-md bg-black/60 backdrop-blur-xs text-white text-[9px] font-semibold">
                        {pkg.category}
                      </span>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#6B7280]">
                          <Clock className="w-3 h-3 text-[#C2571A]" />
                          <span>{pkg.duration}</span>
                        </span>

                        <button
                          type="button"
                          onClick={() => onRemovePackage(pkg.id)}
                          className="min-w-[44px] min-h-[44px] flex items-center justify-center -mr-2 -my-2 rounded-lg text-[#9CA3AF] hover:text-rose-600 hover:bg-rose-50 focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:outline-none transition-colors cursor-pointer"
                          title="Remove from saved"
                          aria-label={`Remove ${pkg.name} from saved packages`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <h4 className="mt-1 text-base font-semibold leading-snug text-[#1E2022] line-clamp-2">
                        {pkg.name}
                      </h4>

                      <div className="mt-1">
                        <span className="text-xs text-[#6B7280]">From </span>
                        <span className="text-sm font-bold text-[#1E2022]">
                          {formatINR(pkg.pricePerPerson)}
                        </span>
                        <span className="text-[10px] text-[#6B7280]"> / person</span>
                      </div>
                    </div>
                  </div>

                  {/* Tagline */}
                  <p className="mt-3 text-xs text-[#6B7280] line-clamp-2 leading-relaxed">
                    {pkg.tagline}
                  </p>

                  {/* Inclusions */}
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {pkg.inclusions.slice(0, 2).map((inc) => (
                      <span
                        key={inc}
                        className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-[#FAF8F5] text-[#1E2022]/80 border border-[#1E2022]/6"
                      >
                        {inc}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Actions row */}
                <div className="mt-4 pt-3 border-t border-[#1E2022]/6 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onEnquirePackage(pkg);
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#1E2022]/15 text-[#1E2022] text-xs font-medium hover:bg-[#FAF8F5] transition-colors cursor-pointer"
                  >
                    <MessageSquare className="w-3.5 h-3.5 text-[#C2571A]" />
                    <span>Enquire</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onSelectPackage(pkg);
                    }}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#1E2022] hover:bg-[#C2571A] text-white text-xs font-semibold transition-colors cursor-pointer"
                  >
                    <span>Customise</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          ) : savedTrips.length === 0 ? (
            <div className="text-center py-12 px-4 bg-white rounded-2xl border border-[#1E2022]/8">
              <div className="w-12 h-12 rounded-full bg-[#C2571A]/10 text-[#C2571A] flex items-center justify-center mx-auto mb-3">
                <Bookmark className="w-6 h-6" />
              </div>
              <h4 className="text-base font-semibold text-[#1E2022]">
                Nothing saved yet
              </h4>
              <p className="text-xs text-[#6B7280] mt-1.5 mb-5 max-w-xs mx-auto leading-relaxed">
                Click the bookmark on any curated package, or use Save package in the planner, to keep it here. Review or customize it whenever you're ready.
              </p>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onExplorePackages();
                }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#1E2022] text-white text-xs font-semibold hover:bg-[#C2571A] transition-colors cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Explore Curated Packages</span>
              </button>
            </div>
          ) : null}
        </div>

        {/* Concierge Support Footnote */}
        <div className="px-5 sm:px-7 py-5 bg-white border-t border-[#1E2022]/8 text-center text-xs text-[#6B7280]">
          <span>Need custom arrangements?</span>{' '}
          <a
            href="mailto:concierge@naikingtours.com"
            className="whitespace-nowrap text-[#C2571A] font-medium hover:underline"
          >
            Contact Private Concierge
          </a>
        </div>
      </div>
    </div>
  );
};
