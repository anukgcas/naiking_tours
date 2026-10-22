import React, { useEffect, useRef, useState } from 'react';
import { Loader } from './components/Loader';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { CuratedPackages, CuratedPackage } from './components/CuratedPackages';
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
import { ScrollToTop } from './components/ScrollToTop';
import { SIGNATURE_DESTINATIONS } from './data/mockData';
import {
  PLANNER_DESTINATIONS,
  autoFillPlan,
  reconcilePlan,
} from './data/planner';
import { TripBooking, TripDraft } from './types';
import { Check } from 'lucide-react';
import { TripProvider, useTrip } from './context/TripContext';

type Tab = 'home' | 'why' | 'start' | 'plan' | 'overview';

function AppContent() {
  const [showLoader, setShowLoader] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('home');
  // Which part of the home page is on screen: the hero, the sections in between, or Naiking Standard onwards
  const [homeSection, setHomeSection] = useState<'hero' | 'mid' | 'why'>('hero');
  const [isMyTripsOpen, setIsMyTripsOpen] = useState(false);

  // Unified persistent trip context
  const {
    draft,
    plan,
    hasActivePlan,
    bookedTrips,
    setDestinationId,
    updateDraft,
    setPlan,
    updatePlan,
    craftItinerary,
    startNewTrip,
    selectPackage,
    loadSavedTrip,
    confirmTrip,
  } = useTrip();

  // Guided wizard step state for deep-editing when needed
  const [wizardStep, setWizardStep] = useState(0);
  const [wizardKey, setWizardKey] = useState(0);

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // While a nav click is smooth-scrolling, the scroll spy below must not flip the highlighted link
  const spyLock = useRef(0);
  const lockSpy = () => {
    spyLock.current = Date.now() + 2000;
  };

  const scrollTop = () => {
    lockSpy();
    setHomeSection('hero');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const goTo = (tab: Tab) => {
    setActiveTab(tab);
    scrollTop();
  };

  /** Primary homepage customizer action: directly seeds/validates itinerary and enters planner */
  const handleCraftItinerary = () => {
    const res = craftItinerary();
    if (res.success) {
      goTo('plan');
    } else {
      showToast(res.error || 'Please fill in required trip details.');
    }
  };

  /** Opens the optional guided wizard for deep customizations (e.g. cities editing) */
  const startWizard = (opts?: {
    destinationId?: string;
    step?: number;
    draftPatch?: Partial<TripDraft>;
  }) => {
    if (opts?.draftPatch) {
      updateDraft({
        ...opts.draftPatch,
        ...(opts.draftPatch?.destinationId && opts.draftPatch.destinationId !== draft.destinationId
          ? { cityIds: [], aiCities: true }
          : {}),
      });
    } else if (opts?.destinationId) {
      setDestinationId(opts.destinationId);
    }
    setWizardStep(opts?.step ?? (opts?.destinationId || opts?.draftPatch?.destinationId ? 1 : 0));
    setWizardKey((k) => k + 1);
    goTo('start');
  };

  const handleWizardComplete = (final: TripDraft) => {
    updateDraft(final);
    updatePlan((prev) => {
      const base = reconcilePlan(prev, final);
      return final.aiPlan ? autoFillPlan(final, base) : base;
    });
    goTo('plan');
  };

  const handlePlanCTA = () => {
    if (activeTab === 'start') return;
    if (hasActivePlan) {
      if (activeTab !== 'plan') goTo('plan');
    } else {
      handleCraftItinerary();
    }
  };

  const handleSelectDestination = (destName: string) => {
    const match = PLANNER_DESTINATIONS.find((d) => d.name.toLowerCase() === destName.toLowerCase());
    if (match) {
      setDestinationId(match.id);
      if (activeTab !== 'home') {
        setActiveTab('home');
      }
      setTimeout(() => {
        document.getElementById('hero-planner-console')?.scrollIntoView({ behavior: 'smooth' });
      }, 80);
    }
  };

  const handleSelectPackage = (pkg: CuratedPackage) => {
    selectPackage(pkg);
    goTo('plan');
    showToast(`Configured ${pkg.name} in itinerary planner.`);
  };

  const handleSelectSavedTrip = (trip: TripBooking) => {
    loadSavedTrip(trip);
    setIsMyTripsOpen(false);
    goTo('plan');
    showToast(`Loaded ${trip.packageName} into planner.`);
  };

  const scrollToDestinations = () => {
    if (activeTab !== 'home' && activeTab !== 'why') {
      setActiveTab('home');
    }
    setTimeout(() => {
      document.getElementById('signature-destinations')?.scrollIntoView({ behavior: 'smooth' });
    }, 80);
  };

  const scrollToPackages = () => {
    if (activeTab !== 'home' && activeTab !== 'why') {
      setActiveTab('home');
    }
    setTimeout(() => {
      document.getElementById('curated-packages')?.scrollIntoView({ behavior: 'smooth' });
    }, 80);
  };

  const handleNavigate = (tab: 'home' | 'plan' | 'why') => {
    if (tab === 'plan') return handlePlanCTA();
    setActiveTab(tab);
    if (tab === 'why') {
      lockSpy();
      setHomeSection('why');
      setTimeout(() => document.getElementById('naiking-standard')?.scrollIntoView({ behavior: 'smooth' }), 60);
    } else {
      scrollTop();
    }
  };

  const handleConfirmTrip = (contact: ContactDetails): TripBooking => {
    const booking = confirmTrip(contact);
    showToast(`Your ${booking.destination} trip request is in. Added to My Trips.`);
    return booking;
  };

  const handlePlanAnother = () => {
    startNewTrip();
    goTo('home');
  };

  // On the home page, highlight "Why Naiking" only while The Naiking Standard (and what follows) is on screen
  const onHome = activeTab === 'home' || activeTab === 'why';
  useEffect(() => {
    if (!onHome) return;
    const update = () => {
      if (Date.now() < spyLock.current) return;
      const standard = document.getElementById('naiking-standard');
      const hero = document.getElementById('hero');
      if (!standard || !hero) return;
      const vh = window.innerHeight;
      setHomeSection(
        standard.getBoundingClientRect().top <= vh * 0.35 ? 'why' : hero.getBoundingClientRect().bottom > vh * 0.35 ? 'hero' : 'mid',
      );
    };
    const onScrollEnd = () => {
      spyLock.current = 0;
      update();
    };
    update();
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('scrollend', onScrollEnd);
    return () => {
      window.removeEventListener('scroll', update);
      window.removeEventListener('scrollend', onScrollEnd);
    };
  }, [onHome]);

  // Guard: the planner pages need a valid draft and a plan
  const view: Tab = (activeTab === 'plan' || activeTab === 'overview') && !hasActivePlan ? 'home' : activeTab;
  const onHomePage = view === 'home' || view === 'why';
  const navTab = view === 'overview' || view === 'start' ? 'plan' : onHomePage ? (homeSection === 'why' ? 'why' : 'home') : view;
  // The top bar shows no current link while scrolling through the middle of the home page
  const headerTab = onHomePage && homeSection === 'mid' ? null : navTab;

  return (
    <div className="min-h-screen flex flex-col bg-white text-[#1E2022] font-sans">
      {showLoader && <Loader onComplete={() => setShowLoader(false)} />}

      {/* The trip-setup page opens as its own full page: no site header, footer or tab bar */}
      {view !== 'start' && (
        <Header
          activeTab={headerTab}
          onNavigate={handleNavigate}
          onOpenMyTrips={() => setIsMyTripsOpen(true)}
          bookedTripsCount={bookedTrips.length}
          onExploreDestinations={scrollToDestinations}
          onBrowsePackages={scrollToPackages}
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
            onStayTierChange={(stayTier) => updateDraft({ stayTier })}
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
            <Hero
              onStartWizard={() => startWizard()}
              onExploreDestination={handleSelectDestination}
              onStartPlanningWithDraft={(patch, step) => startWizard({ draftPatch: patch, step })}
              onCraftItinerary={handleCraftItinerary}
            />
            <CuratedPackages onSelectPackage={handleSelectPackage} />
            <SignatureDestinations
              destinations={SIGNATURE_DESTINATIONS}
              onSelectDestination={handleSelectDestination}
              onStartCustomising={() => {
                document.getElementById('hero-planner-console')?.scrollIntoView({ behavior: 'smooth' });
              }}
            />
            <HowItWorks />
            <StandardVsNaiking />
            <WhyNaiking />
          </>
        )}
      </main>

      {view !== 'start' && (
        <>
          {/* The planner locks the page on wide screens, so its footer would only force a page scroll */}
          <div className={view === 'plan' ? 'xl:hidden' : undefined}>
            <Footer
              onNavigate={handleNavigate}
              onOpenPlanner={handlePlanCTA}
              onOpenMyTrips={() => setIsMyTripsOpen(true)}
            />
          </div>

          {onHomePage && <ScrollToTop onClick={scrollTop} />}

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
          startNewTrip();
          goTo('home');
        }}
        onSelectTrip={handleSelectSavedTrip}
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

export default function App() {
  return (
    <TripProvider>
      <AppContent />
    </TripProvider>
  );
}
