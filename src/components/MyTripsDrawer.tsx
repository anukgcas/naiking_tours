import React, { useState } from 'react';
import { X, Calendar, Users, CheckCircle, Clock, ChevronRight, Compass } from 'lucide-react';
import { TripBooking, TourPackage } from '../types';

interface MyTripsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  trips: TripBooking[];
  packages: TourPackage[];
  onSelectPackage: (pkg: TourPackage) => void;
  onExplorePackages: () => void;
}

export const MyTripsDrawer: React.FC<MyTripsDrawerProps> = ({
  isOpen,
  onClose,
  trips,
  packages,
  onSelectPackage,
  onExplorePackages,
}) => {
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');

  if (!isOpen) return null;

  const upcomingTrips = trips.filter(
    (t) => t.status === 'Confirmed' || t.status === 'Preparing'
  );
  const pastTrips = trips.filter((t) => t.status === 'Completed');

  const currentList = activeTab === 'upcoming' ? upcomingTrips : pastTrips;

  const handleViewItinerary = (trip: TripBooking) => {
    const matchedPkg = packages.find((p) => p.id === trip.packageId || p.destination.toLowerCase() === trip.destination.toLowerCase());
    if (matchedPkg) {
      onSelectPackage(matchedPkg);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/50 backdrop-blur-xs flex justify-end animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-[#FAF8F5] h-full shadow-2xl flex flex-col border-l border-[#1E2022]/10 animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="px-6 py-5 border-b border-[#1E2022]/8 flex items-center justify-between bg-white">
          <div>
            <h3 className="text-lg font-bold text-[#1E2022]">My Trips</h3>
            <p className="text-xs text-[#6B7280]">
              Your booked journeys and concierge itineraries.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-black/5 text-[#1E2022] transition-colors cursor-pointer"
            aria-label="Close My Trips"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Segmented Tab Controls */}
        <div className="p-4 bg-white/50 border-b border-[#1E2022]/6">
          <div className="flex p-1 bg-[#1E2022]/4 rounded-xl border border-black/5">
            <button
              onClick={() => setActiveTab('upcoming')}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                activeTab === 'upcoming'
                  ? 'bg-white text-[#1E2022] shadow-xs'
                  : 'text-[#6B7280] hover:text-[#1E2022]'
              }`}
            >
              <span>Upcoming</span>
              <span className="w-4 h-4 text-[10px] rounded-full bg-[#1E2022]/10 flex items-center justify-center">
                {upcomingTrips.length}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('past')}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                activeTab === 'past'
                  ? 'bg-white text-[#1E2022] shadow-xs'
                  : 'text-[#6B7280] hover:text-[#1E2022]'
              }`}
            >
              <span>Past Trips</span>
              <span className="w-4 h-4 text-[10px] rounded-full bg-[#1E2022]/10 flex items-center justify-center">
                {pastTrips.length}
              </span>
            </button>
          </div>
        </div>

        {/* Trips List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {currentList.length > 0 ? (
            currentList.map((trip) => (
              <div
                key={trip.id}
                className="bg-white rounded-2xl p-4 border border-[#1E2022]/8 shadow-xs space-y-3 hover:shadow-md transition-shadow"
              >
                {/* Trip Card Top: Image + Destination & Status */}
                <div className="flex gap-3">
                  <div className="w-20 h-20 rounded-xl overflow-hidden bg-gray-100 shrink-0">
                    <img
                      src={trip.image}
                      alt={trip.destination}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span className="text-[10px] font-mono uppercase text-[#9CA3AF]">
                        ID: {trip.id}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          trip.status === 'Confirmed'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : trip.status === 'Preparing'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {trip.status}
                      </span>
                    </div>

                    <h4 className="text-sm font-bold text-[#1E2022] truncate">
                      {trip.packageName}
                    </h4>

                    <p className="text-xs text-[#E05A47] font-semibold mt-0.5">
                      {trip.destination}
                    </p>
                  </div>
                </div>

                {/* Dates & Guests */}
                <div className="pt-2 border-t border-[#1E2022]/6 grid grid-cols-2 gap-2 text-xs text-[#555A60]">
                  <div className="flex items-center gap-1.5 truncate">
                    <Calendar className="w-3.5 h-3.5 text-[#6B7280] shrink-0" />
                    <span className="truncate">
                      {trip.startDate} – {trip.endDate}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 justify-end">
                    <Users className="w-3.5 h-3.5 text-[#6B7280] shrink-0" />
                    <span>
                      {trip.travellers.adults}A {trip.travellers.children > 0 ? `· ${trip.travellers.children}C` : ''}
                    </span>
                  </div>
                </div>

                {/* View Itinerary CTA */}
                <div className="pt-2 flex items-center justify-between">
                  <span className="text-xs font-bold text-[#1E2022]">
                    ₹{trip.totalPrice.toLocaleString('en-IN')}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleViewItinerary(trip)}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-[#1E2022] hover:text-[#E05A47] transition-colors cursor-pointer"
                  >
                    <span>View Itinerary</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12 px-4 bg-white rounded-2xl border border-[#1E2022]/8">
              <Compass className="w-10 h-10 text-[#9CA3AF] mx-auto mb-3" />
              <h4 className="text-sm font-bold text-[#1E2022]">
                No {activeTab} trips found
              </h4>
              <p className="text-xs text-[#6B7280] mt-1 mb-4">
                Explore our signature packages and reserve your next sanctuary.
              </p>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onExplorePackages();
                }}
                className="px-4 py-2 rounded-full bg-[#1E2022] text-white text-xs font-semibold hover:bg-[#E05A47] transition-colors cursor-pointer"
              >
                Browse Tour Packages
              </button>
            </div>
          )}
        </div>

        {/* Concierge Support Footnote */}
        <div className="p-4 bg-white border-t border-[#1E2022]/8 text-center text-xs text-[#6B7280]">
          <span>Need custom itinerary revisions?</span>{' '}
          <a
            href="mailto:concierge@naikingtours.com"
            className="text-[#E05A47] font-semibold hover:underline"
          >
            Contact Private Concierge
          </a>
        </div>
      </div>
    </div>
  );
};
