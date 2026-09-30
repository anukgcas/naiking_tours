import React, { useState } from 'react';
import { Loader } from './components/Loader';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { SignatureDestinations } from './components/SignatureDestinations';
import { HowItWorks } from './components/HowItWorks';
import { StandardVsNaiking } from './components/StandardVsNaiking';
import { TripWizard } from './components/TripWizard';
import { TripPlanner } from './components/TripPlanner';
import { TripOverview, ContactDetails } from './components/TripOverview';
import { MyTripsDrawer } from './components/MyTripsDrawer';
import { WhyNaiking } from './components/WhyNaiking';
import { Footer } from './components/Footer';
import { MobileBottomNav } from './components/MobileBottomNav';
import { SIGNATURE_DESTINATIONS, INITIAL_BOOKED_TRIPS } from './data/mockData';
import {
  PLANNER_DESTINATIONS,
  autoFillPlan,
  computeCosts,
  formatDate,
  getDestination,
  newDraft,
  reconcilePlan,
  toPlannedDays,
  tripDays,
  validateDraft,
} from './data/planner';
import { PlanState, TripBooking, TripDraft } from './types';
import { Check } from 'lucide-react';

type Tab = 'home' | 'why' | 'start' | 'plan' | 'overview';

export default function App() {
  const [showLoader, setShowLoader] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('home');
  const [isMyTripsOpen, setIsMyTripsOpen] = useState(false);

  // Customiser: wizard (draft) -> plan board -> overview
  const [draft, setDraft] = useState<TripDraft>(newDraft);
  const [plan, setPlan] = useState<PlanState | null>(null);
  const [wizardStep, setWizardStep] = useState(0);
  const [wizardKey, setWizardKey] = useState(0);

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

  const canPlan = plan !== null && validateDraft(draft) === null;

  const handleDraftChange = (patch: Partial<TripDraft>) => setDraft((d) => ({ ...d, ...patch }));

  /** Opens the guided wizard, optionally with a place already chosen (skips straight to "who's going"). */
  const startWizard = (opts?: { destinationId?: string; step?: number }) => {
    if (opts?.destinationId) {
      setDraft((d) => ({
        ...d,
        destinationId: opts.destinationId!,
        aiDestination: false,
        ...(d.destinationId !== opts.destinationId ? { cityIds: [], aiCities: false } : {}),
      }));
    }
    setWizardStep(opts?.step ?? (opts?.destinationId ? 1 : 0));
    setWizardKey((k) => k + 1);
    goTo('start');
  };

  const handleWizardComplete = (final: TripDraft) => {
    setDraft(final);
    setPlan((prev) => {
      const base = reconcilePlan(prev, final);
      return final.aiPlan ? autoFillPlan(final, base) : base;
    });
    goTo('plan');
  };

  // Header / footer / mobile "Plan a Trip": resume a plan in progress, otherwise begin the wizard
  const handlePlanCTA = () => {
    if (activeTab === 'start') return;
    if (canPlan) {
      if (activeTab !== 'plan') goTo('plan');
    } else {
      startWizard();
    }
  };

  const handleSelectDestination = (destName: string) => {
    const match = PLANNER_DESTINATIONS.find((d) => d.name.toLowerCase() === destName.toLowerCase());
    startWizard(match ? { destinationId: match.id } : undefined);
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
  const navTab = view === 'overview' || view === 'start' ? 'plan' : view;

  return (
    <div className="min-h-screen flex flex-col bg-white text-[#1E2022] font-sans">
      {showLoader && <Loader onComplete={() => setShowLoader(false)} />}

      {/* The trip-setup page opens as its own full page: no site header, footer or tab bar */}
      {view !== 'start' && (
      <Header
        activeTab={navTab}
        onNavigate={handleNavigate}
        onOpenMyTrips={() => setIsMyTripsOpen(true)}
        onOpenPlanner={handlePlanCTA}
        bookedTripsCount={bookedTrips.length}
      />
      )}

      <main className="flex-1">
        {view === 'start' ? (
          <TripWizard
            key={wizardKey}
            initialDraft={draft}
            initialStep={wizardStep}
            onComplete={handleWizardComplete}
            onExit={() => goTo('home')}
          />
        ) : view === 'plan' && plan ? (
          <TripPlanner
            draft={draft}
            plan={plan}
            onPlanChange={setPlan}
            onStayTierChange={(stayTier) => handleDraftChange({ stayTier })}
            onEditDetails={() => startWizard({ step: 4 })}
            onEditCities={() => startWizard({ step: 3 })}
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
            <Hero onStartWizard={() => startWizard()} onExploreDestination={handleSelectDestination} />
            <SignatureDestinations
              destinations={SIGNATURE_DESTINATIONS}
              onSelectDestination={handleSelectDestination}
              onStartCustomising={() => startWizard()}
            />
            <HowItWorks />
            <StandardVsNaiking />
            <WhyNaiking />
          </>
        )}
      </main>

      {view !== 'start' && (
        <>
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
        </>
      )}

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
