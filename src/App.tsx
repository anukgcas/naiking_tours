import React, { useState } from 'react';
import { Loader } from './components/Loader';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { SignatureDestinations } from './components/SignatureDestinations';
import { HowItWorks } from './components/HowItWorks';
import { StandardVsNaiking } from './components/StandardVsNaiking';
import { TripPlanner } from './components/TripPlanner';
import { TripOverview, ContactDetails } from './components/TripOverview';
import { MyTripsDrawer } from './components/MyTripsDrawer';
import { WhyNaiking } from './components/WhyNaiking';
import { Footer } from './components/Footer';
import { MobileBottomNav } from './components/MobileBottomNav';
import { SIGNATURE_DESTINATIONS, INITIAL_BOOKED_TRIPS } from './data/mockData';
import {
  PLANNER_DESTINATIONS,
  formatDate,
  getDestination,
  newDraft,
  reconcilePlan,
  toPlannedDays,
  computeCosts,
  tripDays,
  validateDraft,
} from './data/planner';
import { PlanState, TripBooking, TripDraft } from './types';
import { Check } from 'lucide-react';

type Tab = 'home' | 'why' | 'plan' | 'overview';

export default function App() {
  const [showLoader, setShowLoader] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('home');
  const [isMyTripsOpen, setIsMyTripsOpen] = useState(false);

  // Customiser state: step 1 (draft) -> step 2 (plan board) -> step 3 (overview)
  const [draft, setDraft] = useState<TripDraft>(newDraft);
  const [plan, setPlan] = useState<PlanState | null>(null);

  const [bookedTrips, setBookedTrips] = useState<TripBooking[]>(INITIAL_BOOKED_TRIPS);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const scrollTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  const goTo = (tab: Tab) => {
    setActiveTab(tab);
    scrollTop();
  };

  const scrollToTripFinder = () => {
    setActiveTab('home');
    // Wait for the home view to mount when coming from another page
    setTimeout(() => {
      document.getElementById('hero-search')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 60);
  };

  const canPlan = plan !== null && validateDraft(draft) === null;

  const handleDraftChange = (patch: Partial<TripDraft>) => setDraft((d) => ({ ...d, ...patch }));

  const handleStartPlanning = () => {
    setPlan((prev) => reconcilePlan(prev, draft));
    goTo('plan');
  };

  // Header / footer / mobile "Plan a Trip": resume a plan in progress, otherwise start at the trip finder
  const handlePlanCTA = () => {
    if (canPlan && activeTab !== 'plan') goTo('plan');
    else if (!canPlan) scrollToTripFinder();
  };

  const handleSelectDestination = (destName: string) => {
    const match = PLANNER_DESTINATIONS.find((d) => d.name.toLowerCase() === destName.toLowerCase());
    if (match) handleDraftChange({ destinationId: match.id });
    scrollToTripFinder();
  };

  const handleNavigate = (tab: 'home' | 'plan' | 'why') => {
    if (tab === 'plan') return handlePlanCTA();
    setActiveTab(tab);
    if (tab === 'why') {
      setTimeout(() => document.getElementById('why-naiking')?.scrollIntoView({ behavior: 'smooth' }), 60);
    } else {
      scrollTop();
    }
  };

  const handleConfirmTrip = (_contact: ContactDetails): TripBooking => {
    const dest = getDestination(draft.destinationId)!;
    const costs = computeCosts(draft, plan!);
    const trip: TripBooking = {
      id: `NT-${Math.floor(1000 + Math.random() * 9000)}`,
      destination: dest.name,
      packageName: `Custom ${tripDays(draft)}-Day ${dest.name} Journey`,
      startDate: formatDate(draft.checkIn),
      endDate: formatDate(draft.checkOut),
      travellers: { adults: draft.adults, children: draft.children },
      totalPrice: costs.total,
      status: 'Preparing',
      bookingDate: 'Today',
      image: dest.image,
      itinerary: toPlannedDays(plan!),
    };
    setBookedTrips((prev) => [trip, ...prev]);
    showToast(`Your ${dest.name} trip request is in. Added to My Trips.`);
    return trip;
  };

  const handlePlanAnother = () => {
    setDraft(newDraft());
    setPlan(null);
    goTo('home');
  };

  // Guard: the planner pages need a valid draft and a plan
  const view: Tab = (activeTab === 'plan' || activeTab === 'overview') && !canPlan ? 'home' : activeTab;
  const navTab = view === 'overview' ? 'plan' : view;

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF8F5] text-[#1E2022] font-sans">
      {showLoader && <Loader onComplete={() => setShowLoader(false)} />}

      <Header
        activeTab={navTab}
        onNavigate={handleNavigate}
        onOpenMyTrips={() => setIsMyTripsOpen(true)}
        onOpenPlanner={handlePlanCTA}
        bookedTripsCount={bookedTrips.length}
      />

      <main className="flex-1">
        {view === 'plan' && plan ? (
          <TripPlanner
            draft={draft}
            plan={plan}
            onPlanChange={setPlan}
            onEditDetails={scrollToTripFinder}
            onContinue={() => goTo('overview')}
          />
        ) : view === 'overview' && plan ? (
          <TripOverview
            draft={draft}
            plan={plan}
            onEditPlan={() => goTo('plan')}
            onConfirm={handleConfirmTrip}
            onViewTrips={() => setIsMyTripsOpen(true)}
            onPlanAnother={handlePlanAnother}
          />
        ) : (
          <>
            <Hero
              draft={draft}
              onDraftChange={handleDraftChange}
              onStartPlanning={handleStartPlanning}
              onExploreDestination={handleSelectDestination}
            />
            <SignatureDestinations
              destinations={SIGNATURE_DESTINATIONS}
              onSelectDestination={handleSelectDestination}
              onStartCustomising={scrollToTripFinder}
            />
            <HowItWorks />
            <StandardVsNaiking />
            <WhyNaiking />
          </>
        )}
      </main>

      <Footer
        onNavigate={handleNavigate}
        onOpenPlanner={handlePlanCTA}
        onOpenMyTrips={() => setIsMyTripsOpen(true)}
      />

      <MobileBottomNav
        currentTab={navTab}
        onNavigate={handleNavigate}
        onOpenMyTrips={() => setIsMyTripsOpen(true)}
        bookedTripsCount={bookedTrips.length}
      />

      <MyTripsDrawer
        isOpen={isMyTripsOpen}
        onClose={() => setIsMyTripsOpen(false)}
        trips={bookedTrips}
        onPlanTrip={() => {
          setIsMyTripsOpen(false);
          handlePlanCTA();
        }}
      />

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
