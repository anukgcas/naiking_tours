import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import {
  ActivityCategory,
  PlanState,
  TravellerType,
  TripBooking,
  TripDraft,
} from '../types';
import {
  PLANNER_DESTINATIONS,
  addDaysISO,
  aiPickCities,
  autoFillPlan,
  computeCosts,
  emptyPlan,
  getDestination,
  nightsBetween,
  reconcilePlan,
  todayISO,
  validateDraft,
} from '../data/planner';
import { INITIAL_BOOKED_TRIPS } from '../data/mockData';
import { CuratedPackage, CURATED_PACKAGES } from '../components/CuratedPackages';

const STORAGE_KEY_ACTIVE_TRIP = 'naiking_active_trip_v2';
const STORAGE_KEY_SAVED_TRIPS = 'naiking_saved_trips_v2';

export interface ContactDetails {
  name: string;
  phone: string;
  email: string;
}

export interface ActiveTripState {
  id: string;
  packageId?: string | null;
  isSavedTrip: boolean;
  savedTripId: string | null;
  destinationId: string;
  durationNights: number;
  timingPreference: string;
  departureDate: string;
  rooms: number;
  adults: number;
  children: number;
  interests: ActivityCategory[];
  stayTier: 0 | 1 | 2;
  draft: TripDraft;
  plan: PlanState | null;
}

export interface TripContextValue {
  // Authoritative State
  activeTripId: string;
  packageId?: string | null;
  isSavedTrip: boolean;
  savedTripId: string | null;
  destinationId: string;
  durationNights: number;
  timingPreference: string;
  departureDate: string;
  rooms: number;
  adults: number;
  children: number;
  interests: ActivityCategory[];
  stayTier: 0 | 1 | 2;
  draft: TripDraft;
  plan: PlanState | null;
  hasActivePlan: boolean;
  bookedTrips: TripBooking[];

  // Mutators
  setDestinationId: (id: string) => void;
  setDurationNights: (nights: number) => void;
  setTimingPreference: (timing: string) => void;
  setDepartureDate: (dateISO: string) => void;
  setRooms: (rooms: number) => void;
  setAdults: (adults: number) => void;
  setChildren: (children: number) => void;
  setGuests: (rooms: number, adults: number, children: number) => void;
  setInterests: (interests: ActivityCategory[]) => void;
  setStayTier: (tier: 0 | 1 | 2) => void;
  updateDraft: (patch: Partial<TripDraft>) => void;
  setPlan: (plan: PlanState | null) => void;
  updatePlan: (updater: (prev: PlanState | null) => PlanState | null) => void;

  // Lifecycle actions
  /** `keepPlan` keeps the days already built (editing a plan); otherwise the plan starts empty. */
  craftItinerary: (
    draftPatch?: Partial<TripDraft>,
    opts?: { keepPlan?: boolean },
  ) => { success: boolean; error?: string };
  startNewTrip: (destinationId?: string) => void;
  selectPackage: (pkg: CuratedPackage) => void;
  loadSavedTrip: (trip: TripBooking) => void;
  confirmTrip: (contact: ContactDetails) => TripBooking;
  /** Stores the current package in My Trips as a saved draft (updates it if already saved). */
  saveTripForLater: () => TripBooking | null;
  /** True when the current package has been saved to My Trips as a draft. */
  currentTripSaved: boolean;
  /** Removes a saved draft or a trip request that is still being prepared from the lists. */
  removeSavedTrip: (tripId: string) => void;
  adoptSharedTrip: (sharedDraft: TripDraft, sharedPlan: PlanState) => void;
}

const TripContext = createContext<TripContextValue | null>(null);

const deriveTravellerType = (adults: number, children: number, rooms: number): TravellerType => {
  if (adults === 1 && children === 0) return 'solo';
  if (adults === 2 && children === 0 && rooms === 1) return 'couple';
  if (children > 0) return 'family';
  return 'friends';
};

const buildDraft = (
  id: string,
  destinationId: string,
  departureDate: string,
  durationNights: number,
  rooms: number,
  adults: number,
  children: number,
  interests: ActivityCategory[],
  stayTier: 0 | 1 | 2,
  timingPreference: string,
  packageId?: string | null,
  cityIds?: string[]
): TripDraft => {
  const checkIn = departureDate;
  const checkOut = addDaysISO(departureDate, Math.max(1, durationNights));
  const baseDraft: TripDraft = {
    id,
    packageId: packageId || undefined,
    destinationId,
    aiDestination: false,
    travellerType: deriveTravellerType(adults, children, rooms),
    interests,
    // days start empty: the traveller builds the plan, and AI fills in only when asked
    aiPlan: false,
    cityIds: cityIds || [],
    aiCities: !cityIds || cityIds.length === 0,
    checkIn,
    checkOut,
    adults,
    children,
    rooms,
    stayTier,
    timingPreference,
  };

  if (!cityIds || cityIds.length === 0) {
    const picked = aiPickCities(baseDraft);
    if (picked.length > 0) {
      baseDraft.cityIds = picked;
    }
  }

  return baseDraft;
};

const createDefaultState = (): ActiveTripState => {
  const today = todayISO();
  const departureDate = addDaysISO(today, 30);
  const id = `draft-${Date.now()}`;
  const destinationId = 'bali';
  const durationNights = 5;
  const timingPreference = 'Upcoming Month';
  const rooms = 1;
  const adults = 2;
  const children = 0;
  const interests: ActivityCategory[] = ['Leisure', 'Culture'];
  const stayTier: 0 | 1 | 2 = 1;

  const draft = buildDraft(
    id,
    destinationId,
    departureDate,
    durationNights,
    rooms,
    adults,
    children,
    interests,
    stayTier,
    timingPreference,
    null
  );

  return {
    id,
    packageId: null,
    isSavedTrip: false,
    savedTripId: null,
    destinationId,
    durationNights,
    timingPreference,
    departureDate,
    rooms,
    adults,
    children,
    interests,
    stayTier,
    draft,
    plan: null,
  };
};

const loadInitialActiveTrip = (): ActiveTripState => {
  const fallback = createDefaultState();
  if (typeof window === 'undefined' || !window.localStorage) return fallback;

  try {
    const raw = localStorage.getItem(STORAGE_KEY_ACTIVE_TRIP);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return fallback;

    // Validate destination
    const validDest = PLANNER_DESTINATIONS.some((d) => d.id === parsed.destinationId)
      ? parsed.destinationId
      : 'bali';

    // Validate package identity if present
    const rawPackageId = typeof parsed.packageId === 'string'
      ? parsed.packageId
      : typeof parsed.draft?.packageId === 'string'
      ? parsed.draft.packageId
      : null;
    const packageId = rawPackageId && CURATED_PACKAGES.some((p) => p.id === rawPackageId)
      ? rawPackageId
      : null;

    // Validate dates
    const today = todayISO();
    let departureDate = typeof parsed.departureDate === 'string' && parsed.departureDate.length === 10
      ? parsed.departureDate
      : addDaysISO(today, 30);
    if (departureDate < today) {
      departureDate = addDaysISO(today, 30);
    }

    const durationNights = typeof parsed.durationNights === 'number' && parsed.durationNights >= 1 && parsed.durationNights <= 14
      ? parsed.durationNights
      : 5;

    const timingPreference = typeof parsed.timingPreference === 'string' ? parsed.timingPreference : 'Upcoming Month';
    const rooms = typeof parsed.rooms === 'number' && parsed.rooms >= 1 ? parsed.rooms : 1;
    const adults = typeof parsed.adults === 'number' && parsed.adults >= 1 ? parsed.adults : 2;
    const children = typeof parsed.children === 'number' && parsed.children >= 0 ? parsed.children : 0;
    const stayTier = (parsed.stayTier === 0 || parsed.stayTier === 1 || parsed.stayTier === 2) ? parsed.stayTier : 1;
    const interests = Array.isArray(parsed.interests) ? parsed.interests : ['Leisure', 'Culture'];
    const id = typeof parsed.id === 'string' ? parsed.id : `draft-${Date.now()}`;
    const isSavedTrip = Boolean(parsed.isSavedTrip);
    const savedTripId = typeof parsed.savedTripId === 'string' ? parsed.savedTripId : null;

    const draft = buildDraft(
      id,
      validDest,
      departureDate,
      durationNights,
      rooms,
      adults,
      children,
      interests,
      stayTier,
      timingPreference,
      packageId
    );

    let plan: PlanState | null = null;
    if (parsed.plan && typeof parsed.plan === 'object' && Array.isArray(parsed.plan.days)) {
      plan = {
        signature: typeof parsed.plan.signature === 'string' ? parsed.plan.signature : `${validDest}|${durationNights + 1}`,
        days: parsed.plan.days,
        extras: Array.isArray(parsed.plan.extras) ? parsed.plan.extras : [],
        arrival: parsed.plan.arrival && typeof parsed.plan.arrival === 'object' ? parsed.plan.arrival : undefined,
        departure: parsed.plan.departure && typeof parsed.plan.departure === 'object' ? parsed.plan.departure : undefined,
        times: parsed.plan.times && typeof parsed.plan.times === 'object' ? parsed.plan.times : undefined,
      };
    }

    return {
      id,
      packageId,
      isSavedTrip,
      savedTripId,
      destinationId: validDest,
      durationNights,
      timingPreference,
      departureDate,
      rooms,
      adults,
      children,
      interests,
      stayTier,
      draft,
      plan,
    };
  } catch (err) {
    console.warn('[TripContext] Failed to parse active trip from storage; using defaults', err);
    return fallback;
  }
};

const loadInitialBookedTrips = (): TripBooking[] => {
  if (typeof window === 'undefined' || !window.localStorage) return INITIAL_BOOKED_TRIPS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SAVED_TRIPS);
    if (!raw) return INITIAL_BOOKED_TRIPS;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
    return INITIAL_BOOKED_TRIPS;
  } catch (err) {
    console.warn('[TripContext] Failed to parse saved trips from storage; using initial', err);
    return INITIAL_BOOKED_TRIPS;
  }
};

export const TripProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeTrip, setActiveTrip] = useState<ActiveTripState>(loadInitialActiveTrip);
  const [bookedTrips, setBookedTrips] = useState<TripBooking[]>(loadInitialBookedTrips);

  // Sync active trip to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_ACTIVE_TRIP, JSON.stringify(activeTrip));
    } catch (e) {
      console.warn('[TripContext] Failed to persist active trip to localStorage', e);
    }
  }, [activeTrip]);

  // Sync booked trips to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_SAVED_TRIPS, JSON.stringify(bookedTrips));
    } catch (e) {
      console.warn('[TripContext] Failed to persist booked trips to localStorage', e);
    }
  }, [bookedTrips]);

  const setDestinationId = useCallback((newDestId: string) => {
    setActiveTrip((prev) => {
      if (prev.destinationId === newDestId) return prev;
      const packageId = prev.packageId && CURATED_PACKAGES.find((p) => p.id === prev.packageId)?.destinationId === newDestId
        ? prev.packageId
        : null;
      const nextDraft = buildDraft(
        prev.id,
        newDestId,
        prev.departureDate,
        prev.durationNights,
        prev.rooms,
        prev.adults,
        prev.children,
        prev.interests,
        prev.stayTier,
        prev.timingPreference,
        packageId
      );
      // Reconcile plan for new destination
      const nextPlan = prev.plan ? reconcilePlan(prev.plan, nextDraft) : null;
      return {
        ...prev,
        packageId,
        destinationId: newDestId,
        draft: nextDraft,
        plan: nextPlan,
      };
    });
  }, []);

  const setDurationNights = useCallback((nights: number) => {
    const clamped = Math.max(1, Math.min(14, nights));
    setActiveTrip((prev) => {
      if (prev.durationNights === clamped) return prev;
      const nextDraft = buildDraft(
        prev.id,
        prev.destinationId,
        prev.departureDate,
        clamped,
        prev.rooms,
        prev.adults,
        prev.children,
        prev.interests,
        prev.stayTier,
        prev.timingPreference,
        prev.packageId
      );
      const nextPlan = prev.plan ? reconcilePlan(prev.plan, nextDraft) : null;
      return {
        ...prev,
        durationNights: clamped,
        draft: nextDraft,
        plan: nextPlan,
      };
    });
  }, []);

  const setTimingPreference = useCallback((timing: string) => {
    setActiveTrip((prev) => ({
      ...prev,
      timingPreference: timing,
      draft: { ...prev.draft, timingPreference: timing },
    }));
  }, []);

  const setDepartureDate = useCallback((dateISO: string) => {
    setActiveTrip((prev) => {
      if (prev.departureDate === dateISO) return prev;
      const nextDraft = buildDraft(
        prev.id,
        prev.destinationId,
        dateISO,
        prev.durationNights,
        prev.rooms,
        prev.adults,
        prev.children,
        prev.interests,
        prev.stayTier,
        prev.timingPreference,
        prev.packageId
      );
      return {
        ...prev,
        departureDate: dateISO,
        draft: nextDraft,
      };
    });
  }, []);

  const setRooms = useCallback((rooms: number) => {
    const valid = Math.max(0, rooms);
    setActiveTrip((prev) => {
      if (prev.rooms === valid) return prev;
      const nextDraft = buildDraft(
        prev.id,
        prev.destinationId,
        prev.departureDate,
        prev.durationNights,
        valid,
        prev.adults,
        prev.children,
        prev.interests,
        prev.stayTier,
        prev.timingPreference,
        prev.packageId
      );
      return {
        ...prev,
        rooms: valid,
        draft: nextDraft,
      };
    });
  }, []);

  const setAdults = useCallback((adults: number) => {
    const valid = Math.max(0, adults);
    setActiveTrip((prev) => {
      if (prev.adults === valid) return prev;
      const nextDraft = buildDraft(
        prev.id,
        prev.destinationId,
        prev.departureDate,
        prev.durationNights,
        prev.rooms,
        valid,
        prev.children,
        prev.interests,
        prev.stayTier,
        prev.timingPreference,
        prev.packageId
      );
      return {
        ...prev,
        adults: valid,
        draft: nextDraft,
      };
    });
  }, []);

  const setChildren = useCallback((children: number) => {
    const valid = Math.max(0, children);
    setActiveTrip((prev) => {
      if (prev.children === valid) return prev;
      const nextDraft = buildDraft(
        prev.id,
        prev.destinationId,
        prev.departureDate,
        prev.durationNights,
        prev.rooms,
        prev.adults,
        valid,
        prev.interests,
        prev.stayTier,
        prev.timingPreference,
        prev.packageId
      );
      return {
        ...prev,
        children: valid,
        draft: nextDraft,
      };
    });
  }, []);

  const setGuests = useCallback((rooms: number, adults: number, children: number) => {
    const r = Math.max(0, rooms);
    const a = Math.max(0, adults);
    const c = Math.max(0, children);
    setActiveTrip((prev) => {
      const nextDraft = buildDraft(
        prev.id,
        prev.destinationId,
        prev.departureDate,
        prev.durationNights,
        r,
        a,
        c,
        prev.interests,
        prev.stayTier,
        prev.timingPreference,
        prev.packageId
      );
      return {
        ...prev,
        rooms: r,
        adults: a,
        children: c,
        draft: nextDraft,
      };
    });
  }, []);

  const setInterests = useCallback((interests: ActivityCategory[]) => {
    setActiveTrip((prev) => ({
      ...prev,
      interests,
      draft: { ...prev.draft, interests },
    }));
  }, []);

  const setStayTier = useCallback((tier: 0 | 1 | 2) => {
    setActiveTrip((prev) => ({
      ...prev,
      stayTier: tier,
      draft: { ...prev.draft, stayTier: tier },
    }));
  }, []);

  const updateDraft = useCallback((patch: Partial<TripDraft>) => {
    setActiveTrip((prev) => {
      let departureDate = prev.departureDate;
      let durationNights = prev.durationNights;

      if (patch.checkIn) {
        departureDate = patch.checkIn;
      }
      if (patch.checkIn && patch.checkOut) {
        durationNights = nightsBetween(patch.checkIn, patch.checkOut);
      } else if (patch.checkOut && prev.departureDate) {
        durationNights = nightsBetween(prev.departureDate, patch.checkOut);
      }

      const destinationId = patch.destinationId ?? prev.destinationId;
      const rooms = patch.rooms ?? prev.rooms;
      const adults = patch.adults ?? prev.adults;
      const children = patch.children ?? prev.children;
      const interests = patch.interests ?? prev.interests;
      const stayTier = patch.stayTier ?? prev.stayTier;
      const timingPreference = patch.timingPreference ?? prev.timingPreference;
      const packageId = patch.packageId !== undefined
        ? (patch.packageId && CURATED_PACKAGES.some((p) => p.id === patch.packageId) ? patch.packageId : null)
        : prev.packageId;

      const nextDraft = buildDraft(
        prev.id,
        destinationId,
        departureDate,
        durationNights,
        rooms,
        adults,
        children,
        interests,
        stayTier,
        timingPreference,
        packageId
      );

      // Reconcile plan if destination or duration changed
      const nextPlan = prev.plan ? reconcilePlan(prev.plan, nextDraft) : null;

      return {
        ...prev,
        packageId,
        destinationId,
        durationNights,
        timingPreference,
        departureDate,
        rooms,
        adults,
        children,
        interests,
        stayTier,
        draft: nextDraft,
        plan: nextPlan,
      };
    });
  }, []);

  const setPlan = useCallback((plan: PlanState | null) => {
    setActiveTrip((prev) => ({ ...prev, plan }));
  }, []);

  const updatePlan = useCallback((updater: (prev: PlanState | null) => PlanState | null) => {
    setActiveTrip((prev) => ({ ...prev, plan: updater(prev.plan) }));
  }, []);

  const craftItinerary = useCallback((draftPatch?: Partial<TripDraft>, opts?: { keepPlan?: boolean }): { success: boolean; error?: string } => {
    let effectiveState = activeTrip;

    if (draftPatch) {
      let departureDate = activeTrip.departureDate;
      let durationNights = activeTrip.durationNights;

      if (draftPatch.checkIn) {
        departureDate = draftPatch.checkIn;
      }
      if (draftPatch.checkIn && draftPatch.checkOut) {
        durationNights = nightsBetween(draftPatch.checkIn, draftPatch.checkOut);
      }

      const destinationId = draftPatch.destinationId ?? activeTrip.destinationId;
      const rooms = draftPatch.rooms ?? activeTrip.rooms;
      const adults = draftPatch.adults ?? activeTrip.adults;
      const children = draftPatch.children ?? activeTrip.children;
      const interests = draftPatch.interests ?? activeTrip.interests;
      const stayTier = draftPatch.stayTier ?? activeTrip.stayTier;
      const timingPreference = draftPatch.timingPreference ?? activeTrip.timingPreference;
      const packageId = draftPatch.packageId !== undefined
        ? (draftPatch.packageId && CURATED_PACKAGES.some((p) => p.id === draftPatch.packageId) ? draftPatch.packageId : null)
        : activeTrip.packageId;

      const nextDraft = buildDraft(
        activeTrip.id,
        destinationId,
        departureDate,
        durationNights,
        rooms,
        adults,
        children,
        interests,
        stayTier,
        timingPreference,
        packageId
      );

      effectiveState = {
        ...activeTrip,
        packageId,
        destinationId,
        durationNights,
        timingPreference,
        departureDate,
        rooms,
        adults,
        children,
        interests,
        stayTier,
        draft: nextDraft,
      };
    }

    const validationError = validateDraft(effectiveState.draft);
    if (validationError) {
      return { success: false, error: validationError };
    }

    // Ensure plan is generated
    const basePlan = opts?.keepPlan
      ? reconcilePlan(effectiveState.plan, effectiveState.draft)
      : emptyPlan(effectiveState.draft);
    const finalPlan = effectiveState.draft.aiPlan ? autoFillPlan(effectiveState.draft, basePlan) : basePlan;

    // a brand-new craft is a new trip: it must not inherit the id of a trip that was saved or booked earlier
    const freshId = opts?.keepPlan ? null : `draft-${Date.now()}`;
    setActiveTrip({
      ...effectiveState,
      ...(freshId
        ? { id: freshId, isSavedTrip: false, savedTripId: null, draft: { ...effectiveState.draft, id: freshId } }
        : {}),
      plan: finalPlan,
    });

    return { success: true };
  }, [activeTrip]);

  const startNewTrip = useCallback((destinationId?: string) => {
    const today = todayISO();
    const departureDate = addDaysISO(today, 30);
    const id = `draft-${Date.now()}`;
    const dest = destinationId || 'bali';
    const durationNights = 5;
    const timingPreference = 'Upcoming Month';
    const rooms = 1;
    const adults = 2;
    const children = 0;
    const interests: ActivityCategory[] = ['Leisure', 'Culture'];
    const stayTier: 0 | 1 | 2 = 1;

    const draft = buildDraft(
      id,
      dest,
      departureDate,
      durationNights,
      rooms,
      adults,
      children,
      interests,
      stayTier,
      timingPreference,
      null
    );

    setActiveTrip({
      id,
      packageId: null,
      isSavedTrip: false,
      savedTripId: null,
      destinationId: dest,
      durationNights,
      timingPreference,
      departureDate,
      rooms,
      adults,
      children,
      interests,
      stayTier,
      draft,
      plan: null,
    });
  }, []);

  const selectPackage = useCallback((pkg: CuratedPackage) => {
    // 1. Defensively validate destination against canonical destinations
    const validDest = PLANNER_DESTINATIONS.some((d) => d.id === pkg.destinationId)
      ? pkg.destinationId
      : 'bali';

    // 2. Clamp duration nights (1-14)
    const durationNights = Math.max(1, Math.min(14, typeof pkg.nights === 'number' ? pkg.nights : 4));

    // 3. Preserve user preferences when valid; otherwise fallback to sensible defaults
    const today = todayISO();
    const departureDate = activeTrip.departureDate && activeTrip.departureDate >= today
      ? activeTrip.departureDate
      : addDaysISO(today, 30);
    const timingPreference = activeTrip.timingPreference || 'Upcoming Month';
    const rooms = activeTrip.rooms >= 1 ? activeTrip.rooms : 1;
    const adults = activeTrip.adults >= 1 ? activeTrip.adults : 2;
    const children = activeTrip.children >= 0 ? activeTrip.children : 0;

    // Stay tier: preserve user stayTier or adapt for luxury package
    const stayTier: 0 | 1 | 2 = activeTrip.stayTier ?? (pkg.category === 'Luxury' ? 2 : 1);

    // Interests: preserve user's interests if set; otherwise derive from package category
    const interests: ActivityCategory[] = activeTrip.interests && activeTrip.interests.length > 0
      ? activeTrip.interests
      : pkg.category === 'Beach'
      ? ['Leisure', 'Wellness']
      : pkg.category === 'Mountains'
      ? ['Adventure', 'Sightseeing']
      : pkg.category === 'Culture'
      ? ['Culture', 'Sightseeing']
      : ['Leisure', 'Wellness'];

    const id = `pkg-${pkg.id}-${Date.now()}`;
    const draft = buildDraft(
      id,
      validDest,
      departureDate,
      durationNights,
      rooms,
      adults,
      children,
      interests,
      stayTier,
      timingPreference,
      pkg.id
    );

    // 4. Seed baseline plan from package highlights if matching activities exist
    const destObj = getDestination(validDest);
    let basePlan = emptyPlan(draft);
    if (destObj && Array.isArray(pkg.highlights)) {
      const matchedActivityIds: string[] = [];
      for (const h of pkg.highlights) {
        const words = h.toLowerCase().split(/[\s,&]+/).filter((w) => w.length >= 4);
        const found = destObj.activities.find((a) => {
          const lowerName = a.name.toLowerCase();
          return words.some((w) => lowerName.includes(w));
        });
        if (found && !matchedActivityIds.includes(found.id)) {
          matchedActivityIds.push(found.id);
        }
      }

      // Distribute matched anchor activities across the days
      if (matchedActivityIds.length > 0) {
        matchedActivityIds.forEach((actId, idx) => {
          const dayIdx = idx % basePlan.days.length;
          basePlan.days[dayIdx].push(actId);
        });
      }
    }

    // 5. Auto fill remaining open slots with balanced picks
    const finalPlan = autoFillPlan(draft, basePlan);

    // 6. Update active trip state - isSavedTrip false, savedTripId null (preserves booked trips)
    setActiveTrip({
      id,
      packageId: pkg.id,
      isSavedTrip: false,
      savedTripId: null,
      destinationId: validDest,
      durationNights,
      timingPreference,
      departureDate,
      rooms,
      adults,
      children,
      interests,
      stayTier,
      draft,
      plan: finalPlan,
    });
  }, [activeTrip]);

  const loadSavedTrip = useCallback((trip: TripBooking) => {
    // If trip already has draft and plan attached, load them
    if (trip.draft && trip.plan) {
      const pkgId = trip.packageId || trip.draft.packageId || null;
      setActiveTrip({
        id: trip.id,
        packageId: pkgId,
        isSavedTrip: true,
        savedTripId: trip.id,
        destinationId: trip.draft.destinationId,
        durationNights: nightsBetween(trip.draft.checkIn, trip.draft.checkOut),
        timingPreference: trip.draft.timingPreference || 'Upcoming Month',
        departureDate: trip.draft.checkIn,
        rooms: trip.draft.rooms || 1,
        adults: trip.draft.adults,
        children: trip.draft.children,
        interests: trip.draft.interests,
        stayTier: trip.draft.stayTier,
        draft: { ...trip.draft, packageId: pkgId || undefined },
        plan: trip.plan,
      });
      return;
    }

    // Otherwise reconstruct from mock data
    const matchedDest = PLANNER_DESTINATIONS.find(
      (d) => d.name.toLowerCase() === trip.destination.toLowerCase()
    ) || PLANNER_DESTINATIONS[0];

    const today = todayISO();
    const departureDate = addDaysISO(today, 25);
    const durationNights = 5;
    const rooms = 1;
    const adults = trip.travellers?.adults || 2;
    const children = trip.travellers?.children || 0;
    const stayTier: 0 | 1 | 2 = 1;
    const interests: ActivityCategory[] = ['Leisure', 'Culture'];
    const timingPreference = 'Upcoming Month';
    const pkgId = trip.packageId || null;

    const draft = buildDraft(
      trip.id,
      matchedDest.id,
      departureDate,
      durationNights,
      rooms,
      adults,
      children,
      interests,
      stayTier,
      timingPreference,
      pkgId
    );

    const basePlan = reconcilePlan(null, draft);
    const finalPlan = autoFillPlan(draft, basePlan);

    setActiveTrip({
      id: trip.id,
      packageId: pkgId,
      isSavedTrip: true,
      savedTripId: trip.id,
      destinationId: matchedDest.id,
      durationNights,
      timingPreference,
      departureDate,
      rooms,
      adults,
      children,
      interests,
      stayTier,
      draft,
      plan: finalPlan,
    });
  }, []);

  const confirmTrip = useCallback((contact: ContactDetails): TripBooking => {
    const dest = getDestination(activeTrip.destinationId) || PLANNER_DESTINATIONS[0];
    const newBookingId = `NT-${Math.floor(1000 + Math.random() * 9000)}`;

    const curatedPkg = activeTrip.packageId
      ? CURATED_PACKAGES.find((p) => p.id === activeTrip.packageId)
      : null;
    const packageName = curatedPkg
      ? `${curatedPkg.name} (Customized)`
      : `Custom ${activeTrip.durationNights + 1}-Day ${dest.name} Journey`;

    const newBooking: TripBooking = {
      id: newBookingId,
      packageId: activeTrip.packageId || undefined,
      destination: dest.name,
      packageName,
      startDate: activeTrip.draft.checkIn,
      endDate: activeTrip.draft.checkOut,
      travellers: {
        adults: activeTrip.adults,
        children: activeTrip.children,
      },
      totalPrice: 45000 + activeTrip.durationNights * 8500 * activeTrip.rooms,
      status: 'Preparing',
      bookingDate: 'Today',
      image: curatedPkg?.image || dest.image,
      draft: { ...activeTrip.draft, id: newBookingId, packageId: activeTrip.packageId || undefined },
      plan: activeTrip.plan ? { ...activeTrip.plan } : undefined,
    };

    setBookedTrips((prev) => [
      newBooking,
      ...prev.filter((t) => !(t.id === activeTrip.savedTripId && t.status === 'Saved')),
    ]);

    // Keep active trip state in sync with this newly created saved trip
    setActiveTrip((prev) => ({
      ...prev,
      isSavedTrip: true,
      savedTripId: newBookingId,
    }));

    return newBooking;
  }, [activeTrip]);

  const saveTripForLater = useCallback((): TripBooking | null => {
    if (!activeTrip.plan) return null;
    const dest = getDestination(activeTrip.destinationId) || PLANNER_DESTINATIONS[0];
    const existing = activeTrip.savedTripId ? bookedTrips.find((t) => t.id === activeTrip.savedTripId) : undefined;
    // a trip already sent to the concierge stays as it is
    if (existing && existing.status !== 'Saved') return existing;

    const id = existing?.id ?? `SV-${Math.floor(1000 + Math.random() * 9000)}`;
    const curatedPkg = activeTrip.packageId
      ? CURATED_PACKAGES.find((p) => p.id === activeTrip.packageId)
      : null;
    const packageName = curatedPkg
      ? `${curatedPkg.name} (Customized)`
      : `Custom ${activeTrip.durationNights + 1}-Day ${dest.name} Journey`;
    const costs = computeCosts(activeTrip.draft, activeTrip.plan);

    const saved: TripBooking = {
      id,
      packageId: activeTrip.packageId || undefined,
      destination: dest.name,
      packageName,
      startDate: activeTrip.draft.checkIn,
      endDate: activeTrip.draft.checkOut,
      travellers: { adults: activeTrip.adults, children: activeTrip.children },
      totalPrice: costs.total,
      status: 'Saved',
      bookingDate: 'Today',
      image: curatedPkg?.image || dest.image,
      draft: { ...activeTrip.draft, id, packageId: activeTrip.packageId || undefined },
      plan: { ...activeTrip.plan },
    };

    setBookedTrips((prev) => (existing ? prev.map((t) => (t.id === id ? saved : t)) : [saved, ...prev]));
    setActiveTrip((prev) => ({ ...prev, isSavedTrip: true, savedTripId: id }));
    return saved;
  }, [activeTrip, bookedTrips]);

  const removeSavedTrip = useCallback((tripId: string) => {
    setBookedTrips((prev) => prev.filter((t) => !(t.id === tripId && (t.status === 'Saved' || t.status === 'Preparing'))));
    setActiveTrip((prev) => (prev.savedTripId === tripId ? { ...prev, isSavedTrip: false, savedTripId: null } : prev));
  }, []);

  // A saved package stays up to date as the traveller keeps editing the plan.
  useEffect(() => {
    const id = activeTrip.savedTripId;
    if (!id || !activeTrip.plan) return;
    setBookedTrips((prev) => {
      const current = prev.find((t) => t.id === id);
      if (!current || current.status !== 'Saved') return prev;
      const costs = computeCosts(activeTrip.draft, activeTrip.plan as PlanState);
      const updated: TripBooking = {
        ...current,
        startDate: activeTrip.draft.checkIn,
        endDate: activeTrip.draft.checkOut,
        travellers: { adults: activeTrip.adults, children: activeTrip.children },
        totalPrice: costs.total,
        draft: { ...activeTrip.draft, id, packageId: activeTrip.packageId || undefined },
        plan: { ...(activeTrip.plan as PlanState) },
      };
      return prev.map((t) => (t.id === id ? updated : t));
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTrip.plan, activeTrip.draft, activeTrip.adults, activeTrip.children, activeTrip.savedTripId]);

  const currentTripSaved = useMemo(
    () => bookedTrips.some((t) => t.id === activeTrip.savedTripId),
    [bookedTrips, activeTrip.savedTripId],
  );

  const adoptSharedTrip = useCallback((sharedDraft: TripDraft, sharedPlan: PlanState) => {
    const validDest = PLANNER_DESTINATIONS.some((d) => d.id === sharedDraft.destinationId)
      ? sharedDraft.destinationId
      : 'bali';
    const nights = nightsBetween(sharedDraft.checkIn, sharedDraft.checkOut);
    const clampedNights = Math.max(1, Math.min(14, nights));
    const packageId = sharedDraft.packageId && CURATED_PACKAGES.some((p) => p.id === sharedDraft.packageId)
      ? sharedDraft.packageId
      : null;
    const newId = `shared-${Date.now()}`;

    const draft: TripDraft = {
      ...sharedDraft,
      id: newId,
      packageId: packageId || undefined,
      destinationId: validDest,
    };

    setActiveTrip({
      id: newId,
      packageId,
      isSavedTrip: false,
      savedTripId: null,
      destinationId: validDest,
      durationNights: clampedNights,
      timingPreference: sharedDraft.timingPreference || 'Upcoming Month',
      departureDate: sharedDraft.checkIn,
      rooms: sharedDraft.rooms || 1,
      adults: sharedDraft.adults || 2,
      children: sharedDraft.children || 0,
      interests: sharedDraft.interests || ['Leisure', 'Culture'],
      stayTier: sharedDraft.stayTier ?? 1,
      draft,
      plan: sharedPlan,
    });
  }, []);

  const hasActivePlan = useMemo(() => {
    return activeTrip.plan !== null && validateDraft(activeTrip.draft) === null;
  }, [activeTrip.plan, activeTrip.draft]);

  const value: TripContextValue = useMemo(() => ({
    activeTripId: activeTrip.id,
    packageId: activeTrip.packageId,
    isSavedTrip: activeTrip.isSavedTrip,
    savedTripId: activeTrip.savedTripId,
    destinationId: activeTrip.destinationId,
    durationNights: activeTrip.durationNights,
    timingPreference: activeTrip.timingPreference,
    departureDate: activeTrip.departureDate,
    rooms: activeTrip.rooms,
    adults: activeTrip.adults,
    children: activeTrip.children,
    interests: activeTrip.interests,
    stayTier: activeTrip.stayTier,
    draft: activeTrip.draft,
    plan: activeTrip.plan,
    hasActivePlan,
    bookedTrips,

    setDestinationId,
    setDurationNights,
    setTimingPreference,
    setDepartureDate,
    setRooms,
    setAdults,
    setChildren,
    setGuests,
    setInterests,
    setStayTier,
    updateDraft,
    setPlan,
    updatePlan,

    craftItinerary,
    startNewTrip,
    selectPackage,
    loadSavedTrip,
    confirmTrip,
    saveTripForLater,
    currentTripSaved,
    removeSavedTrip,
    adoptSharedTrip,
  }), [
    activeTrip,
    hasActivePlan,
    bookedTrips,
    setDestinationId,
    setDurationNights,
    setTimingPreference,
    setDepartureDate,
    setRooms,
    setAdults,
    setChildren,
    setGuests,
    setInterests,
    setStayTier,
    updateDraft,
    setPlan,
    updatePlan,
    craftItinerary,
    startNewTrip,
    selectPackage,
    loadSavedTrip,
    confirmTrip,
    saveTripForLater,
    currentTripSaved,
    removeSavedTrip,
    adoptSharedTrip,
  ]);

  return <TripContext.Provider value={value}>{children}</TripContext.Provider>;
};

export const useTrip = (): TripContextValue => {
  const ctx = useContext(TripContext);
  if (!ctx) {
    throw new Error('useTrip must be used within a TripProvider');
  }
  return ctx;
};
