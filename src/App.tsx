import React, { useEffect, useRef, useState } from 'react';
import { Loader } from './components/Loader';
import { CraftingOverlay } from './components/CraftingOverlay';
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
  getDestination,
  reconcilePlan,
} from './data/planner';
import { TripBooking, TripDraft, PlanState } from './types';
import { Check } from 'lucide-react';
import { TripProvider, useTrip } from './context/TripContext';
import { SavedPackagesProvider, useSavedPackages } from './context/SavedPackagesContext';
import { SavedPackagesDrawer } from './components/SavedPackagesDrawer';
import { PackageEnquiryModal } from './components/PackageEnquiryModal';
import { SharedItineraryPreviewModal } from './components/SharedItineraryPreviewModal';
import { PrintableItinerary } from './components/PrintableItinerary';
import { getSharePayloadFromUrl, deserializeItinerary } from './services/shareService';

type Tab = 'home' | 'why' | 'start' | 'plan' | 'overview';

function AppContent() {
  const [showLoader, setShowLoader] = useState(true);

  // Keep the page parked at the top behind the splash so the home page opens fresh when it lifts
  useEffect(() => {
    if (!showLoader) return;
    const prev = window.history.scrollRestoration;
    window.history.scrollRestoration = 'manual';
    window.scrollTo(0, 0);
    const html = document.documentElement;
    const overflow = html.style.overflow;
    html.style.overflow = 'hidden';
    return () => {
      html.style.overflow = overflow;
      window.history.scrollRestoration = prev;
      window.scrollTo(0, 0);
    };
  }, [showLoader]);
  const [activeTab, setActiveTab] = useState<Tab>('home');
  // True while the visitor is editing an existing plan from the home page planner card
  const [editingTrip, setEditingTrip] = useState(false);
  // The "crafting your itinerary" animation that plays before the planner page opens
  const [crafting, setCrafting] = useState(false);
  // Which part of the home page is on screen: the hero, the sections in between, or Naiking Standard onwards
  const [homeSection, setHomeSection] = useState<'hero' | 'mid' | 'why'>('hero');
  const [isMyTripsOpen, setIsMyTripsOpen] = useState(false);
  const [isSavedPackagesOpen, setIsSavedPackagesOpen] = useState(false);
  const [enquiryPackage, setEnquiryPackage] = useState<CuratedPackage | null>(null);

  // Saved packages wishlist context
  const { savedPackages, savedCount, removePackage } = useSavedPackages();

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
    adoptSharedTrip,
  } = useTrip();

  // Shared itinerary preview state (non-destructive URL loading)
  const [sharedTripPreview, setSharedTripPreview] = useState<{
    isOpen: boolean;
    draft: TripDraft | null;
    plan: PlanState | null;
    error: string | null;
  }>({ isOpen: false, draft: null, plan: null, error: null });

  // Guided wizard step state for deep-editing when needed
  const [wizardStep, setWizardStep] = useState(0);
  const [wizardKey, setWizardKey] = useState(0);

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Check for shared itinerary URL parameter (?trip=...) on load and popstate
  useEffect(() => {
    const checkUrl = () => {
      const payloadStr = getSharePayloadFromUrl();
      if (!payloadStr) return;

      const res = deserializeItinerary(payloadStr);
      if (res.success) {
        setSharedTripPreview({
          isOpen: true,
          draft: res.data.draft,
          plan: res.data.plan,
          error: null,
        });
      } else {
        setSharedTripPreview({
          isOpen: true,
          draft: null,
          plan: null,
          error: res.error,
        });
      }
    };

    checkUrl();
    window.addEventListener('popstate', checkUrl);
    return () => window.removeEventListener('popstate', checkUrl);
  }, []);

  const clearTripUrlParam = () => {
    try {
      const url = new URL(window.location.href);
      url.searchParams.delete('trip');
      window.history.replaceState({}, document.title, url.pathname + (url.search ? url.search : '') + url.hash);
    } catch {
      // Ignore in restricted environments
    }
  };

  const handleAdoptSharedItinerary = (sharedDraft: TripDraft, sharedPlan: PlanState) => {
    adoptSharedTrip(sharedDraft, sharedPlan);
    clearTripUrlParam();
    setSharedTripPreview({ isOpen: false, draft: null, plan: null, error: null });
    goTo('plan');
    showToast('Imported shared itinerary into your planner.');
  };

  const handleDismissSharedPreview = () => {
    clearTripUrlParam();
    setSharedTripPreview({ isOpen: false, draft: null, plan: null, error: null });
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
    const res = craftItinerary(undefined, { keepPlan: editingTrip });
    if (res.success) {
      setCrafting(true);
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
    setEnquiryPackage(null);
    selectPackage(pkg);
    goTo('plan');
    showToast(`Configured ${pkg.name} in itinerary planner.`);
  };

  const handleSelectSavedTrip = (trip: TripBooking) => {
    setEnquiryPackage(null);
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

  /** "Edit trip details": back to the home page planner card, pre-filled with the current trip. */
  const handleEditDetails = () => {
    setEditingTrip(true);
    setActiveTab('home');
    lockSpy();
    setHomeSection('hero');
    setTimeout(() => document.getElementById('hero-planner-console')?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 120);
  };

  const handleNavigate = (tab: 'home' | 'plan' | 'why') => {
    if (tab === 'plan') return handlePlanCTA();
    if (tab === 'home') setEditingTrip(false);
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
    <div className="min-h-screen flex flex-col bg-white text-[#16222E] font-sans">
      {showLoader && <Loader onComplete={() => setShowLoader(false)} />}
      {crafting && (
        <CraftingOverlay
          destination={getDestination(draft.destinationId)?.name ?? 'your'}
          image={getDestination(draft.destinationId)?.image}
          onDone={() => {
            setCrafting(false);
            setEditingTrip(false);
            goTo('plan');
          }}
        />
      )}

      {/* The trip-setup page opens as its own full page: no site header, footer or tab bar */}
      {view !== 'start' && (
        <Header
          activeTab={headerTab}
          onNavigate={handleNavigate}
          onOpenMyTrips={() => setIsMyTripsOpen(true)}
          onOpenSavedPackages={() => setIsSavedPackagesOpen(true)}
          bookedTripsCount={bookedTrips.length}
          savedPackagesCount={savedCount}
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
            onEditDetails={handleEditDetails}
            onContinue={() => goTo('overview')}
            onShowToast={showToast}
          />
        ) : view === 'overview' && plan ? (
          <TripOverview
            draft={draft}
            plan={plan}
            onEditPlan={() => goTo('plan')}
            onPlanChange={setPlan}
            onConfirm={handleConfirmTrip}
            onViewTrips={() => setIsMyTripsOpen(true)}
            onPlanAnother={handlePlanAnother}
            onShowToast={showToast}
          />
        ) : (
          <>
            <Hero
              onStartWizard={() => startWizard()}
              onExploreDestination={handleSelectDestination}
              onStartPlanningWithDraft={(patch, step) => startWizard({ draftPatch: patch, step })}
              onCraftItinerary={handleCraftItinerary}
              paused={showLoader}
              prefillConsole={editingTrip}
            />
            <CuratedPackages
              onSelectPackage={handleSelectPackage}
              onEnquirePackage={(pkg) => setEnquiryPackage(pkg)}
            />
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
            onOpenSavedPackages={() => setIsSavedPackagesOpen(true)}
            bookedTripsCount={bookedTrips.length}
            savedPackagesCount={savedCount}
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

      <SavedPackagesDrawer
        isOpen={isSavedPackagesOpen}
        onClose={() => setIsSavedPackagesOpen(false)}
        savedPackages={savedPackages}
        onRemovePackage={(pkgId) => {
          removePackage(pkgId);
          showToast('Package removed from saved wishlist.');
        }}
        onSelectPackage={(pkg) => {
          setIsSavedPackagesOpen(false);
          handleSelectPackage(pkg);
        }}
        onEnquirePackage={(pkg) => {
          setIsSavedPackagesOpen(false);
          setEnquiryPackage(pkg);
        }}
        onExplorePackages={scrollToPackages}
      />

      <PackageEnquiryModal
        pkg={enquiryPackage}
        isOpen={Boolean(enquiryPackage)}
        onClose={() => setEnquiryPackage(null)}
      />

      <SharedItineraryPreviewModal
        isOpen={sharedTripPreview.isOpen}
        draft={sharedTripPreview.draft}
        plan={sharedTripPreview.plan}
        errorMessage={sharedTripPreview.error}
        onContinuePlanning={handleAdoptSharedItinerary}
        onPrint={() => window.print()}
        onDismiss={handleDismissSharedPreview}
      />

      {sharedTripPreview.isOpen && sharedTripPreview.draft && sharedTripPreview.plan && (
        <div className="hidden print:block">
          <PrintableItinerary draft={sharedTripPreview.draft} plan={sharedTripPreview.plan} />
        </div>
      )}

      {toastMessage && (
        <div className="fixed bottom-20 md:bottom-8 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-full bg-[#16222E] text-[#F6F8FA] text-xs sm:text-sm font-medium shadow-2xl flex items-center gap-2 border border-white/10 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <div className="w-4 h-4 rounded-full bg-[#0B4A82] flex items-center justify-center text-white shrink-0">
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
      <SavedPackagesProvider>
        <AppContent />
      </SavedPackagesProvider>
    </TripProvider>
  );
}
