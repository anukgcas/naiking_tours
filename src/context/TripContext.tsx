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
  autoFillPlan,
  emptyPlan,
  getDestination,
  nightsBetween,
  reconcilePlan,
  todayISO,
  validateDraft,
} from '../data/planner';
import { INITIAL_BOOKED_TRIPS } from '../data/mockData';
import { CuratedPackage } from '../components/CuratedPackages';

const STORAGE_KEY_ACTIVE_TRIP = 'naiking_active_trip_v2';
const STORAGE_KEY_SAVED_TRIPS = 'naiking_saved_trips_v2';

export interface ContactDetails {
  name: string;
  phone: string;
  email: string;
}

export interface ActiveTripState {
  id: string;
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
  timingPreference: string
): TripDraft => {
  const checkIn = departureDate;
  const checkOut = addDaysISO(departureDate, Math.max(1, durationNights));
  return {
    id,
    destinationId,
    aiDestination: false,
    travellerType: deriveTravellerType(adults, children, rooms),
    interests,
    // days start empty: the traveller builds the plan, and AI fills in only when asked
    aiPlan: false,
    cityIds: [],
    aiCities: true,
    checkIn,
    checkOut,
    adults,
    children,
    rooms,
    stayTier,
    timingPreference,
  };
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
    timingPreference
  );

  return {
    id,
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
      timingPreference
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
        prev.timingPreference
      );
      // Reconcile plan for new destination
      const nextPlan = prev.plan ? reconcilePlan(prev.plan, nextDraft) : null;
      return {
        ...prev,
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
        prev.timingPreference
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
        prev.timingPreference
      );
      return {
        ...prev,
        departureDate: dateISO,
        draft: nextDraft,
      };
    });
  }, []);

  const setRooms = useCallback((rooms: number) => {
    const valid = Math.max(1, rooms);
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
        prev.timingPreference
      );
      return {
        ...prev,
        rooms: valid,
        draft: nextDraft,
      };
    });
  }, []);

  const setAdults = useCallback((adults: number) => {
    const valid = Math.max(1, adults);
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
        prev.timingPreference
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
        prev.timingPreference
      );
      return {
        ...prev,
        children: valid,
        draft: nextDraft,
      };
    });
  }, []);

  const setGuests = useCallback((rooms: number, adults: number, children: number) => {
    const r = Math.max(1, rooms);
    const a = Math.max(1, adults);
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
        prev.timingPreference
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
      const mergedDraft: TripDraft = { ...prev.draft, ...patch };
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
        timingPreference
      );

      // Reconcile plan if destination or duration changed
      const nextPlan = prev.plan ? reconcilePlan(prev.plan, nextDraft) : null;

      return {
        ...prev,
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
      const merged = { ...activeTrip.draft, ...draftPatch };
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
        timingPreference
      );

      effectiveState = {
        ...activeTrip,
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

    setActiveTrip({
      ...effectiveState,
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
      timingPreference
    );

    setActiveTrip({
      id,
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
    const today = todayISO();
    const departureDate = addDaysISO(today, 30);
    const id = `pkg-${pkg.id}-${Date.now()}`;
    const destinationId = pkg.destinationId;
    const durationNights = pkg.nights;
    const timingPreference = 'Upcoming Month';
    const rooms = 1;
    const adults = 2;
    const children = 0;
    const interests: ActivityCategory[] = ['Leisure', 'Sightseeing'];
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
      timingPreference
    );

    const basePlan = reconcilePlan(null, draft);
    const finalPlan = autoFillPlan(draft, basePlan);

    setActiveTrip({
      id,
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
      plan: finalPlan,
    });
  }, []);

  const loadSavedTrip = useCallback((trip: TripBooking) => {
    // If trip already has draft and plan attached, load them
    if (trip.draft && trip.plan) {
      setActiveTrip({
        id: trip.id,
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
        draft: trip.draft,
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
      timingPreference
    );

    const basePlan = reconcilePlan(null, draft);
    const finalPlan = autoFillPlan(draft, basePlan);

    setActiveTrip({
      id: trip.id,
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

    const newBooking: TripBooking = {
      id: newBookingId,
      destination: dest.name,
      packageName: `Custom ${activeTrip.durationNights + 1}-Day ${dest.name} Journey`,
      startDate: activeTrip.draft.checkIn,
      endDate: activeTrip.draft.checkOut,
      travellers: {
        adults: activeTrip.adults,
        children: activeTrip.children,
      },
      totalPrice: 45000 + activeTrip.durationNights * 8500 * activeTrip.rooms,
      status: 'Preparing',
      bookingDate: 'Today',
      image: dest.image,
      draft: { ...activeTrip.draft, id: newBookingId },
      plan: activeTrip.plan ? { ...activeTrip.plan } : undefined,
    };

    setBookedTrips((prev) => [newBooking, ...prev]);

    // Keep active trip state in sync with this newly created saved trip
    setActiveTrip((prev) => ({
      ...prev,
      isSavedTrip: true,
      savedTripId: newBookingId,
    }));

    return newBooking;
  }, [activeTrip]);

  const hasActivePlan = useMemo(() => {
    return activeTrip.plan !== null && validateDraft(activeTrip.draft) === null;
  }, [activeTrip.plan, activeTrip.draft]);

  const value: TripContextValue = useMemo(() => ({
    activeTripId: activeTrip.id,
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
