# Task: Package Discovery-to-Planning Journey Audit & Functional Integration

- **Date**: 2026-10-22
- **Status**: Completed ✅
- **Author**: Senior Frontend Engineer & QA Specialist
- **Related Features**:
  - `FEAT-003`: Package Discovery & Curated Journeys
  - `FEAT-018`: Save for Later (Wishlist)
  - `FEAT-019`: Package Enquiry & Callback Requests
  - `FEAT-017`: Unified Trip State Synchronization
  - `FEAT-004`: Drag-and-Drop Itinerary Planner

---

## 1. Audit Findings Across User Journey Stages

### Stage 1: Open the Homepage
- **Audited Files**: `src/App.tsx`, `src/components/Header.tsx`, `src/components/MobileBottomNav.tsx`.
- **Status**: Functional. Splash loader properly parks page, header navigation updates on scroll, badges for Saved Packages and My Trips display accurate counts.

### Stage 2: Discover Curated Travel Packages
- **Audited Files**: `src/components/CuratedPackages.tsx`.
- **Status**: Functional. Curated package catalogue defines 6 canonical packages with stable IDs (`pkg-bali-sanctuary`, `pkg-dubai-mirage`, `pkg-maldives-solitude`, `pkg-manali-peaks`, `pkg-goa-heritage`, `pkg-singapore-skyline`). Filtering by category ('All', 'Beach', 'Mountains', 'Luxury', 'Culture') works cleanly without layout jumping.

### Stage 3: Browse Available Package Information
- **Audited Files**: `src/components/CuratedPackages.tsx`.
- **Status**: Functional. Photos, category tags, duration badges, price per person, inclusions, and highlights are clearly presented.

### Stage 4: Save a Package for Later
- **Audited Files**: `src/context/SavedPackagesContext.tsx`, `src/components/CuratedPackages.tsx`.
- **Finding**: Save for Later toggles correctly via `toggleSavePackage(pkg.id)`. However, `toggleSavePackage` checked `isPackageSaved` outside the functional state setter `setSavedItems(prev => ...)`, which was susceptible to race conditions on rapid repeated clicking.
- **Fix Required**: Make `toggleSavePackage` atomic inside `setSavedItems(prev => ...)` to ensure guaranteed deduplication and race-free toggling.

### Stage 5: Open a Saved Package
- **Audited Files**: `src/components/SavedPackagesDrawer.tsx`, `src/components/Header.tsx`, `src/components/MobileBottomNav.tsx`.
- **Status**: Functional. Drawer opens smoothly, displays saved packages from `SavedPackagesContext`, prunes stale items on load, and provides actions for "Customise" and "Enquire".

### Stage 6: Start an Enquiry for a Particular Package
- **Audited Files**: `src/components/PackageEnquiryModal.tsx`, `src/services/enquiryService.ts`.
- **Status**: Functional. Enquiry context is bound to the target package (`pkg={enquiryPackage}`) regardless of whether opened from card or Saved Packages drawer. Independent from active trip state. Form validation enforces required fields and truthful messaging for unsupported backend.

### Stage 7 & 8: Customize a Package & Transfer into Planner
- **Audited Files**: `src/context/TripContext.tsx`, `src/App.tsx`, `src/components/TripPlanner.tsx`.
- **Findings**:
  1. `TripDraft` and `ActiveTripState` lacked `packageId?: string | null`. The canonical package ID was not retained in active trip state, breaking traceability across refresh.
  2. `selectPackage(pkg)` previously hardcoded reset of guest counts (`rooms: 1, adults: 2, children: 0`), departure date, and stay style, discarding prior user preferences unexpectedly.
  3. Destination ID was not validated against `PLANNER_DESTINATIONS`, which could cause `getDestination()` to return `undefined` and crash `TripPlanner` with an uncaught `TypeError`.
  4. Package highlights were not mapped into baseline activities prior to auto-filling days, missing an opportunity to seed signature package experiences into Day 1-N.
  5. In `TripBooking` (My Trips), customized packages were renamed to generic "Custom X-Day Destination Journey", losing the package's canonical name.
- **Fix Required**:
  - Add `packageId?: string` to `TripDraft` and `activeTrip`.
  - Preserve user preferences (guests, travel dates, stay style) when customizing a package.
  - Defensively validate `destinationId` and clamp `durationNights` (1-14).
  - Seed matching signature activities into the initial plan.
  - Preserve `packageId` and package naming in `TripBooking` and display package banner in `TripPlanner`.

### Stage 9: Adjust Supported Trip Preferences
- **Audited Files**: `src/components/TripPlanner.tsx`, `src/components/TripPlanningConsole.tsx`.
- **Status**: Functional. Stay tier switching, custom times, activity reordering, and "Edit trip details" prefill console work as expected.

### Stage 10: Generate or Inspect the Itinerary
- **Audited Files**: `src/components/TripPlanner.tsx`, `src/data/planner.ts`.
- **Status**: Functional. Day-by-day kanban, slot indicators, arrival/departure logistics, and AI suggestions function properly.

### Stage 11: Review Route Maps and Pricing
- **Audited Files**: `src/components/RouteMap.tsx`, `src/components/TripOverview.tsx`, `src/data/planner.ts`.
- **Status**: Functional. Dynamic Leaflet route map, per-person and total cost breakdowns with stay, vehicle transfers, experiences, and concierge fee calculate accurately.

### Stage 12: Save or Review Trip-Planning Progress
- **Audited Files**: `src/context/TripContext.tsx`, `src/components/MyTripsDrawer.tsx`, `src/components/TripOverview.tsx`.
- **Status**: Functional. Booking confirmation writes to `STORAGE_KEY_SAVED_TRIPS`, keeps active trip in sync without creating duplicate entries, and loads saved trips back into planner cleanly.

---

## 2. Implementation Plan

1. **Package Identity & State Model (`src/types.ts`, `src/context/TripContext.tsx`)**:
   - Add `packageId?: string` to `TripDraft`.
   - Add `packageId?: string | null` to `ActiveTripState` and `TripContextValue`.
   - In `loadInitialActiveTrip`, validate and restore `packageId` against `CURATED_PACKAGES`.
   - Update `selectPackage` to:
     - Validate `pkg.destinationId` against `PLANNER_DESTINATIONS`.
     - Clamp `durationNights` safely between 1 and 14.
     - Preserve user's existing valid `adults`, `children`, `rooms`, `departureDate`, `timingPreference`, and `stayTier`.
     - Set `packageId: pkg.id`.
     - Seed package signature activities into Day 1..N based on package highlights before auto-filling.
     - Keep `isSavedTrip: false` and `savedTripId: null` to avoid overwriting booked trips.
   - Update `confirmTrip` to retain `packageId` in `TripBooking` and preserve the curated package title (e.g. `"[Package Name] (Customized)"`).

2. **Planner Context Presentation (`src/components/TripPlanner.tsx`)**:
   - Add safe fallback `getDestination(draft.destinationId) || PLANNER_DESTINATIONS[0]`.
   - Display package badge when `draft.packageId` is present, confirming to the user that they are customizing their chosen package.

3. **Concurrency & Rapid Clicks in Save for Later (`src/context/SavedPackagesContext.tsx`)**:
   - Make `toggleSavePackage` atomic using `setSavedItems(prev => ...)` to prevent duplicate or skipped toggles under rapid clicks.

4. **Modal Cleanup on Navigation (`src/App.tsx`)**:
   - Ensure `enquiryPackage` is reset when customizer actions or tab navigation occur, preventing orphaned modal states.

5. **Test Suite Expansion (`scripts/verify-features.ts`)**:
   - Add automated verification for:
     - Package identity transfer to planner draft.
     - User preference preservation during package customization.
     - Invalid destination ID defensive fallback.
     - Rapid repeated save toggling deduplication.
     - Independent enquiry package context vs active trip draft.
     - Package name preservation in confirmed trip bookings.

---

## 3. Relevant Files

- `src/types.ts`
- `src/context/TripContext.tsx`
- `src/context/SavedPackagesContext.tsx`
- `src/components/CuratedPackages.tsx`
- `src/components/SavedPackagesDrawer.tsx`
- `src/components/TripPlanner.tsx`
- `src/components/PackageEnquiryModal.tsx`
- `src/App.tsx`
- `scripts/verify-features.ts`
- `docs/TESTING/regression-checklist.md`
- `docs/TESTING/validation-history.md`

---

## 4. Acceptance Criteria

1. Choosing "Customise" from a package card or Saved Packages drawer initializes the planner with:
   - The correct destination.
   - The supported package duration (nights).
   - The canonical `packageId`.
   - Baseline signature activities corresponding to package highlights.
2. Unrelated user preferences (adults, children, rooms, departure date, timing preference) are preserved when customizing a package if already set.
3. Customizing a package never modifies or deletes items in Saved Packages.
4. Customizing a package does not create a booking in My Trips (`bookedTrips`).
5. Confirming a customized package trip preserves the canonical package name in My Trips.
6. Opening an enquiry for Package A while Package B is in the active trip displays Package A's context and submits Package A's `packageId`.
7. Rapid repeated clicks on Save for Later toggle cleanly without duplicate entries or race conditions.
8. Corrupted or invalid `packageId` in `localStorage` fails gracefully without crashing the app.
9. All 16 verification scenarios pass and production build succeeds.

---

## 5. Known Risks & Mitigations

- **Risk**: Changing `selectPackage` could accidentally break existing tests or override saved trips.
  - **Mitigation**: Strictly maintain `isSavedTrip: false` and `savedTripId: null` on new package selections, and verify with automated tests that `bookedTrips` remains unchanged until explicit `confirmTrip`.
- **Risk**: Missing destination activities could cause array index errors when seeding highlights.
  - **Mitigation**: Match activity IDs defensively using `dest.activities.find(...)` and only push valid IDs to day arrays.
