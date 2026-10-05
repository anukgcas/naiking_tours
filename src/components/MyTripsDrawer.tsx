import React, { useState } from 'react';
import { X, Calendar, Users, ChevronDown, Compass } from 'lucide-react';
import { TripBooking } from '../types';

interface MyTripsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  trips: TripBooking[];
  onPlanTrip: () => void;
}

export const MyTripsDrawer: React.FC<MyTripsDrawerProps> = ({
  isOpen,
  onClose,
  trips,
  onPlanTrip,
}) => {
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (!isOpen) return null;

  const upcomingTrips = trips.filter(
    (t) => t.status === 'Confirmed' || t.status === 'Preparing'
  );
  const pastTrips = trips.filter((t) => t.status === 'Completed');

  const currentList = activeTab === 'upcoming' ? upcomingTrips : pastTrips;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/40 backdrop-blur-xs flex justify-end animate-in fade-in duration-200">
      <div className="w-full sm:max-w-md bg-white h-full shadow-2xl flex flex-col border-l border-[#1E2022]/10 animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="px-5 sm:px-7 pt-7 pb-6 border-b border-[#1E2022]/8 flex items-start justify-between gap-4 bg-white">
          <div>
            <h3 className="text-2xl font-semibold tracking-tight text-[#1E2022]">My Trips</h3>
            <p className="mt-1 text-[14px] text-[#6B7280] font-medium">
              Your custom journeys and concierge itineraries
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 -mr-2 rounded-full hover:bg-[#1E2022]/5 text-[#6B7280] hover:text-[#1E2022] transition-colors duration-200 cursor-pointer"
            aria-label="Close My Trips"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Segmented Tab Controls */}
        <div className="px-5 sm:px-7 py-4 ">
          <div className="flex p-1 bg-[#F5F5F5]/60 rounded-xl border border-[#1E2022]/8">
            <button
              onClick={() => setActiveTab('upcoming')}
              className={`flex-1 py-2 text-[14px] font-medium rounded-lg transition-[background-color,color,box-shadow] duration-300 motion-reduce:transition-none cursor-pointer flex items-center justify-center gap-1.5 ${
                activeTab === 'upcoming'
                  ? 'bg-white text-[#1E2022] shadow-xs'
                  : 'text-[#6B7280] hover:text-[#1E2022]'
              }`}
            >
              <span>Upcoming</span>
              <span className="min-w-4 h-4 px-1 text-[10px] rounded-full bg-[#1E2022]/8 flex items-center justify-center">
                {upcomingTrips.length}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('past')}
              className={`flex-1 py-2 text-[14px] font-medium rounded-lg transition-[background-color,color,box-shadow] duration-300 motion-reduce:transition-none cursor-pointer flex items-center justify-center gap-1.5 ${
                activeTab === 'past'
                  ? 'bg-white text-[#1E2022] shadow-xs'
                  : 'text-[#6B7280] hover:text-[#1E2022]'
              }`}
            >
              <span>Past Trips</span>
              <span className="min-w-4 h-4 px-1 text-[10px] rounded-full bg-[#1E2022]/8 flex items-center justify-center">
                {pastTrips.length}
              </span>
            </button>
          </div>
        </div>

        {/* Trips List */}
        <div className="flex-1 overflow-y-auto px-5 sm:px-7 pt-2 pb-6 space-y-5">
          {currentList.length > 0 ? (
            currentList.map((trip) => (
              <div
                key={trip.id}
                className="group bg-white rounded-2xl p-5 border border-[#1E2022]/8 shadow-xs space-y-4"
              >
                {/* Trip Card Top: Image + Title, Destination & Status */}
                <div className="flex gap-4">
                  <div className="w-24 h-24 rounded-xl overflow-hidden bg-gray-100 shrink-0">
                    <img
                      src={trip.image}
                      alt={trip.destination}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="block text-[10px] font-mono uppercase tracking-wide text-[#9CA3AF]">
                      ID: {trip.id}
                    </span>

                    <h4 className="mt-1 text-base font-semibold leading-snug text-[#1E2022] line-clamp-2">
                      {trip.packageName}
                    </h4>

                    <div className="mt-1.5 flex flex-wrap items-center gap-x-2.5 gap-y-1">
                      <span className="text-xs text-[#C2571A] font-medium">
                        {trip.destination}
                      </span>
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                          trip.status === 'Confirmed'
                            ? 'bg-emerald-50 text-emerald-700'
                            : trip.status === 'Preparing'
                            ? 'bg-amber-50 text-amber-700'
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {trip.status}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Dates & Guests */}
                <div className="pt-4 border-t border-[#1E2022]/6 flex items-center justify-between gap-3 text-xs text-[#555A60]">
                  <div className="flex items-center gap-2 min-w-0">
                    <Calendar className="w-3.5 h-3.5 text-[#9CA3AF] shrink-0" />
                    <span className="truncate">
                      {trip.startDate} – {trip.endDate}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <Users className="w-3.5 h-3.5 text-[#9CA3AF] shrink-0" />
                    <span>
                      {trip.travellers.adults}A {trip.travellers.children > 0 ? `· ${trip.travellers.children}C` : ''}
                    </span>
                  </div>
                </div>

                {/* Price + itinerary toggle (custom trips only) */}
                <div className="flex items-center justify-between">
                  <span className="text-lg font-semibold tracking-tight text-[#1E2022]">
                    ₹{trip.totalPrice.toLocaleString('en-IN')}
                  </span>
                  {trip.itinerary && (
                    <button
                      type="button"
                      onClick={() => setExpandedId(expandedId === trip.id ? null : trip.id)}
                      aria-expanded={expandedId === trip.id}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-[#1E2022] hover:text-[#C2571A] transition-colors cursor-pointer"
                    >
                      <span>{expandedId === trip.id ? 'Hide Itinerary' : 'View Itinerary'}</span>
                      <ChevronDown
                        className={`w-3.5 h-3.5 transition-transform ${expandedId === trip.id ? 'rotate-180' : ''}`}
                      />
                    </button>
                  )}
                </div>

                {trip.itinerary && expandedId === trip.id && (
                  <ol className="pt-3 border-t border-[#1E2022]/6 space-y-3">
                    {trip.itinerary.map((d) => (
                      <li key={d.day}>
                        <p className="text-[11px] font-bold uppercase tracking-wider text-[#C2571A]">Day {d.day}</p>
                        {d.items.length === 0 ? (
                          <p className="text-xs text-[#9CA3AF]">Free day</p>
                        ) : (
                          <ul className="mt-1 space-y-1">
                            {d.items.map((it) => (
                              <li key={it.name} className="text-xs text-[#555A60] flex gap-2">
                                <span className="w-16 shrink-0 text-[#9CA3AF]">{it.slot}</span>
                                <span>{it.name}</span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </li>
                    ))}
                  </ol>
                )}
              </div>
            ))
          ) : (
            <div className="text-center py-12 px-4 bg-white rounded-2xl border border-[#1E2022]/8">
              <Compass className="w-10 h-10 text-[#9CA3AF] mx-auto mb-3" />
              <h4 className="text-sm font-bold text-[#1E2022]">
                No {activeTab} trips found
              </h4>
              <p className="text-xs text-[#6B7280] mt-1 mb-4">
                Design your own journey, day by day, and send it to a concierge.
              </p>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onPlanTrip();
                }}
                className="px-4 py-2 rounded-full bg-[#1E2022] text-white text-xs font-semibold hover:bg-[#C2571A] transition-colors cursor-pointer"
              >
                Plan a Trip
              </button>
            </div>
          )}
        </div>

        {/* Concierge Support Footnote */}
        <div className="px-5 sm:px-7 py-6 bg-white border-t border-[#1E2022]/8 text-center text-[14px] text-[#6B7280]">
          <span>Need custom itinerary revisions?</span>{' '}
          <a
            href="mailto:concierge@naikingtours.com"
            className="whitespace-nowrap text-[#C2571A] font-medium  decoration-transparent hover:decoration-[#C2571A] transition-[text-decoration-color] duration-300"
          >
            Contact Private Concierge
          </a>
        </div>
      </div>
    </div>
  );
};
