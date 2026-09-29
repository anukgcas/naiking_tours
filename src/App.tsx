import React, { useState } from 'react';
import { Loader } from './components/Loader';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { SignatureDestinations } from './components/SignatureDestinations';
import { PopularPackages } from './components/PopularPackages';
import { StandardVsNaiking } from './components/StandardVsNaiking';
import { TourDetailPage } from './components/TourDetailPage';
import { ToursPage } from './components/ToursPage';
import { MyTripsDrawer } from './components/MyTripsDrawer';
import { FavoritesDrawer } from './components/FavoritesDrawer';
import { PlanTripModal } from './components/PlanTripModal';
import { WhyNaiking } from './components/WhyNaiking';
import { Footer } from './components/Footer';
import { MobileBottomNav } from './components/MobileBottomNav';
import {
  SIGNATURE_DESTINATIONS,
  TOUR_PACKAGES,
  INITIAL_BOOKED_TRIPS,
} from './data/mockData';
import { TourPackage, TripBooking, TripSearchState } from './types';
import { Check } from 'lucide-react';

export default function App() {
  const [showLoader, setShowLoader] = useState(true);
  const [activeTab, setActiveTab] = useState<'home' | 'packages' | 'why' | 'detail'>('home');
  const [previousTab, setPreviousTab] = useState<'home' | 'packages'>('home');
  const [isFavoritesOpen, setIsFavoritesOpen] = useState(false);
  const [isMyTripsOpen, setIsMyTripsOpen] = useState(false);
  const [isPlannerOpen, setIsPlannerOpen] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<TourPackage | null>(null);

  // App Data State
  const [favorites, setFavorites] = useState<string[]>(['bali-escape']);
  const [bookedTrips, setBookedTrips] = useState<TripBooking[]>(INITIAL_BOOKED_TRIPS);
  const [filterDestination, setFilterDestination] = useState<string>('all');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleToggleFavorite = (pkg: TourPackage) => {
    setFavorites((prev) => {
      const exists = prev.includes(pkg.id);
      if (exists) {
        showToast(`Removed "${pkg.name}" from wishlist.`);
        return prev.filter((id) => id !== pkg.id);
      } else {
        showToast(`Saved "${pkg.name}" to wishlist.`);
        return [...prev, pkg.id];
      }
    });
  };

  // Navigate directly to dedicated full-page Tour Detail
  const handleOpenPackageDetail = (pkg: TourPackage) => {
    if (activeTab !== 'detail') {
      setPreviousTab(activeTab === 'packages' ? 'packages' : 'home');
    }
    setSelectedPackage(pkg);
    setActiveTab('detail');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBackFromDetail = () => {
    setActiveTab(previousTab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBookTrip = ({
    pkg,
    startDate,
    endDate,
    adults,
    children,
    totalPrice,
  }: {
    pkg: TourPackage;
    startDate: string;
    endDate: string;
    adults: number;
    children: number;
    totalPrice: number;
  }) => {
    const newBooking: TripBooking = {
      id: `NT-${Math.floor(1000 + Math.random() * 9000)}`,
      packageId: pkg.id,
      destination: pkg.destination,
      packageName: pkg.name,
      startDate: new Date(startDate).toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      }),
      endDate: new Date(endDate).toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      }),
      travellers: { adults, children },
      totalPrice,
      status: 'Confirmed',
      bookingDate: 'Today',
      image: pkg.featuredImage,
      tripStyle: pkg.tripStyle,
    };

    setBookedTrips((prev) => [newBooking, ...prev]);
    showToast(`Reservation Confirmed for ${pkg.name}! Added to My Trips.`);
  };

  const handleTripBuilt = (trip: TripBooking) => {
    setBookedTrips((prev) => [trip, ...prev]);
    showToast(`Your bespoke trip to ${trip.destination} has been planned!`);
    setIsMyTripsOpen(true);
  };

  const handleSearch = (search: TripSearchState) => {
    setFilterDestination(search.destination || 'all');
    setActiveTab('packages');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectDestination = (destName: string) => {
    const matched = TOUR_PACKAGES.find(
      (p) => p.destination.toLowerCase() === destName.toLowerCase()
    );
    if (matched) {
      handleOpenPackageDetail(matched);
    } else {
      setFilterDestination(destName);
      setActiveTab('packages');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleViewAllPackages = () => {
    setFilterDestination('all');
    setActiveTab('packages');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF8F5] text-[#1E2022] font-sans">
      {/* 1. Minimal Startup Loader */}
      {showLoader && <Loader onComplete={() => setShowLoader(false)} />}

      {/* 2. Sticky Transparent/White Navbar */}
      <Header
        activeTab={activeTab === 'detail' ? 'packages' : activeTab}
        onNavigate={(tab) => {
          setActiveTab(tab);
          if (tab === 'why') {
            const el = document.getElementById('why-naiking');
            if (el) el.scrollIntoView({ behavior: 'smooth' });
          } else {
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }
        }}
        onOpenFavorites={() => setIsFavoritesOpen(true)}
        onOpenMyTrips={() => setIsMyTripsOpen(true)}
        onOpenPlanner={() => setIsPlannerOpen(true)}
        favoritesCount={favorites.length}
        bookedTripsCount={bookedTrips.length}
      />

      {/* 3. Main Views (Home / Packages / Dedicated TourDetailPage) */}
      <main className="flex-1">
        {activeTab === 'detail' && selectedPackage ? (
          /* DEDICATED FULL-PAGE TOUR DETAIL PAGE */
          <TourDetailPage
            pkg={selectedPackage}
            isFavorite={favorites.includes(selectedPackage.id)}
            onToggleFavorite={handleToggleFavorite}
            onBack={handleBackFromDetail}
            onBookTrip={handleBookTrip}
            onSelectOtherPackage={(pkg) => handleOpenPackageDetail(pkg)}
            allPackages={TOUR_PACKAGES}
          />
        ) : activeTab === 'home' || activeTab === 'why' ? (
          <>
            {/* Innovative Hero Section with Live Destination Reel & Ambient Audio */}
            <Hero
              onSearch={handleSearch}
              onExploreDestination={handleSelectDestination}
              packagesCount={TOUR_PACKAGES.length}
            />

            {/* Signature Destinations Row with Interactive Zoom & Spotlight */}
            <SignatureDestinations
              destinations={SIGNATURE_DESTINATIONS}
              onSelectDestination={handleSelectDestination}
              onViewAllPackages={handleViewAllPackages}
            />

            {/* Popular Tour Packages */}
            <PopularPackages
              packages={TOUR_PACKAGES}
              favorites={favorites}
              onToggleFavorite={handleToggleFavorite}
              onSelectPackage={handleOpenPackageDetail}
              onViewAllPackages={handleViewAllPackages}
            />

            {/* Mass Tourism vs Naiking Sanctuary Standard Comparison */}
            <StandardVsNaiking />

            {/* Why Naiking Philosophy Section */}
            <WhyNaiking />
          </>
        ) : (
          /* Dedicated Tours & Packages Directory Page */
          <ToursPage
            packages={TOUR_PACKAGES}
            favorites={favorites}
            onToggleFavorite={handleToggleFavorite}
            onSelectPackage={handleOpenPackageDetail}
            initialDestination={filterDestination}
          />
        )}
      </main>

      {/* 4. Quiet Luxury Footer */}
      <Footer
        onNavigate={(tab) => {
          setActiveTab(tab);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onOpenPlanner={() => setIsPlannerOpen(true)}
        onOpenMyTrips={() => setIsMyTripsOpen(true)}
      />

      {/* 5. Mobile Bottom Navigation (Hidden on desktop) */}
      <MobileBottomNav
        currentTab={activeTab === 'detail' ? 'packages' : activeTab}
        onNavigate={(tab) => {
          setActiveTab(tab);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onOpenFavorites={() => setIsFavoritesOpen(true)}
        onOpenMyTrips={() => setIsMyTripsOpen(true)}
        onOpenPlanner={() => setIsPlannerOpen(true)}
        favoritesCount={favorites.length}
        bookedTripsCount={bookedTrips.length}
      />

      {/* 6. Drawers & Modals */}
      {/* My Trips Side Drawer */}
      <MyTripsDrawer
        isOpen={isMyTripsOpen}
        onClose={() => setIsMyTripsOpen(false)}
        trips={bookedTrips}
        packages={TOUR_PACKAGES}
        onSelectPackage={handleOpenPackageDetail}
        onExplorePackages={handleViewAllPackages}
      />

      {/* Favorites Wishlist Drawer */}
      <FavoritesDrawer
        isOpen={isFavoritesOpen}
        onClose={() => setIsFavoritesOpen(false)}
        favoriteIds={favorites}
        packages={TOUR_PACKAGES}
        onRemoveFavorite={handleToggleFavorite}
        onSelectPackage={handleOpenPackageDetail}
        onExplorePackages={handleViewAllPackages}
      />

      {/* Plan a Trip Bespoke Modal */}
      <PlanTripModal
        isOpen={isPlannerOpen}
        onClose={() => setIsPlannerOpen(false)}
        onTripBuilt={handleTripBuilt}
      />

      {/* Quiet Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-20 md:bottom-8 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-full bg-[#1E2022] text-[#FAF8F5] text-xs sm:text-sm font-medium shadow-2xl flex items-center gap-2 border border-white/10 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <div className="w-4 h-4 rounded-full bg-[#C2571A] flex items-center justify-center text-white shrink-0">
            <Check className="w-2.5 h-2.5" />
          </div>
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
