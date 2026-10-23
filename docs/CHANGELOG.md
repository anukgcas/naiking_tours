# Changelog

All notable changes to the Naikings Tours & Travels project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

---

## [Unreleased]

### Planned
- Cloud-synchronized user accounts and authentication.
- Real-time flight availability integration.

---

## [2026-10-22] — Itinerary Export & Sharing (FEAT-021)

### Added
- **Browser-Native Print & PDF Export (`PrintableItinerary.tsx`, `index.css`)**:
  - Implemented high-contrast, printer-friendly dedicated itinerary document with Naikings Tours branding, concierge hotline, dates, guests, hotel tier, day-by-day schedules, transfer summaries, and itemized cost calculations.
  - Added `@media print` rules hiding app navigation chrome, header, footer, bottom nav, modals, buttons, and sidebars.
  - Added `.print-avoid-break` to prevent awkward splits across printed pages.
- **Stateless Shareable Itinerary URLs (`shareService.ts`)**:
  - Implemented typed, versioned wire format (`SharePayloadV1`) encoded in compact, URL-safe Base64 (`?trip=...`).
  - Strict privacy boundary: excludes all personal contact info, enquiry messages, private booking IDs, and unrelated saved trips.
  - Zero server storage: encodes supported trip parameters directly into the browser URL under an 8 KB payload ceiling.
  - Fully recalculates derived values and prices via `computeCosts`, strictly ignoring client-supplied price values.
- **Non-Destructive Recipient Preview (`SharedItineraryPreviewModal.tsx`, `App.tsx`)**:
  - Automatically detects `?trip=...` on initial load and browser navigation.
  - Renders an isolated, non-destructive preview dialog showing day-by-day activities and live recalculated pricing.
  - Recipient's active trip and saved trips remain 100% untouched until they explicitly choose "Continue Planning This Itinerary".
  - Clean URL cleanup via `history.replaceState` upon adoption or dismissal.
- **Export UI Actions (`TripOverview.tsx`, `TripPlanner.tsx`, `ShareItineraryModal.tsx`)**:
  - Added "Print / Save as PDF" and "Share Link" action buttons to both the Planner top bar and the Trip Overview page.
  - Share modal includes one-click clipboard copying, manual fallback selection, and privacy disclosures.
- **Comprehensive Automated Test Suite (`scripts/verify-features.ts`)**:
  - Added 76 new test assertions across 4 test groups (150 total passing) verifying round-trip serialization, payload limits, version rejection, PII exclusion, price recalculation, defensive ID pruning, recipient state isolation, and print immutability.


---

## [2026-10-22] — Package Discovery-to-Planning Journey Integration

### Added
- **Canonical Package Identity in Trip Planning (`TripContext.tsx`, `types.ts`)**: Added `packageId?: string` to `TripDraft`, `ActiveTripState`, and `TripBooking` to preserve canonical package association across refresh, itinerary planning, and booking confirmation.
- **Preference-Preserving Package Customization (`selectPackage`)**: When customizing a package from card or Saved Packages drawer, existing user preferences for guests (rooms, adults, children), travel dates, timing, and stay tier are preserved rather than unexpectedly wiped out.
- **Signature Package Highlights Seeding**: Package highlights (e.g. Tegallalang sunrise, Uluwatu Kecak dance, Jimbaran seafood) are extracted via keyword matching and seeded as anchor activities into the baseline plan before auto-filling remaining slots.
- **Customization Banner in Planner (`TripPlanner.tsx`)**: Displays an editorial contextual badge (`"Customising: [Package Name]"`) when a package is active.
- **Safe Fallback Error Handling (`TripPlanner.tsx`, `TripContext.tsx`)**: Added defensive validation against `PLANNER_DESTINATIONS` for package destinations, safe fallback to prevent fatal crashes, and clamping of night counts (1–14).
- **Atomic Save for Later Toggling (`SavedPackagesContext.tsx`)**: Re-architected `toggleSavePackage` using atomic functional state updates (`setSavedItems(prev => ...)`) to eliminate race conditions and double-click desynchronization.
- **Modal Navigation Cleanup (`App.tsx`)**: Ensures enquiry modals are cleanly closed when switching views or selecting packages, preventing orphan modals.
- **Extended Test Suite (`scripts/verify-features.ts`)**: Added 34 new assertions across 4 test groups (74 total passing) covering data transfer, preference preservation, highlights matching, isolation between saved packages/active trip/saved trips, and concurrent toggling.

---

## [2026-10-22] — Save for Later (Wishlist) & Package Enquiry Implementation

### Added
- **Save for Later Wishlist (`SavedPackagesContext.tsx`)**: Introduced a dedicated context and hook `useSavedPackages()` for package bookmarking with versioned client storage (`naiking_saved_packages_v1`), deduplication, and stale package handling.
- **Saved Packages Drawer (`SavedPackagesDrawer.tsx`)**: Slide-over drawer displaying bookmarked packages with itemized inclusions, pricing, removal action, enquiry trigger, and planner resumption (`onSelectPackage`).
- **Package Card Bookmark Controls (`CuratedPackages.tsx`)**: Added one-click bookmark toggle button to all curated package card image headers with `e.stopPropagation()` protection.
- **Global Saved Access (`Header.tsx`, `MobileBottomNav.tsx`)**: Added "Saved" navigation buttons with live badge counters in both desktop header and mobile bottom navbar.
- **Package Enquiry Modal (`PackageEnquiryModal.tsx`)**: Accessible modal dialog allowing users to enquire about package details, discounts, coupons, festive offers, customization, and callbacks.
- **Enquiry Submission Service (`enquiryService.ts`)**: Decoupled typed submission boundary with full client-side validation, RFC 5322 email checks, 10-digit phone verification, and honest reporting when backend CRM dispatch is unconfigured (strictly zero fake success).
- **Automated Verification Suite (`scripts/verify-features.ts`)**: Added 40 unit and scenario tests covering catalogue consistency, storage resilience, corrupted data handling, category validations, and submission status reporting.

---

## [2026-10-22] — Unified Trip State, Synchronization & Navigation Cleanup

### Added
- **Centralized Trip State (`TripContext.tsx`)**: Introduced a single authoritative React Context and custom `useTrip()` hook managing active trip draft, day-by-day plan state, and saved trips.
- **Client-Side Persistence**: Added versioned, defensive storage handlers (`naiking_active_trip_v2` and `naiking_saved_trips_v2`) with automatic past-date correction and data validation.
- **Saved Trip Resumption**: Added "Open in Planner" action to saved trip cards in `MyTripsDrawer.tsx`, allowing travellers to reload any saved journey into the interactive planner.
- **Direct Itinerary Generation**: Connected **Craft My Itinerary** to `craftItinerary()` to auto-generate day-by-day AI recommendations and transition directly into `TripPlanner` without intermediate wizard prompts.
- **Dedicated Documentation System (`docs/`)**: Created comprehensive project overview, architectural whitepapers, feature inventory, development log, testing reports, and reusable templates.

### Changed
- **Homepage Customizer Console (`TripPlanningConsole.tsx`)**:
  - Replaced decoupled local state with direct two-way binding to `useTrip()`.
  - Added dedicated Departure Date calendar popover and Rooms & Guests stepper.
  - Added Stay Tier and Travel Interests filter popover.
  - Removed redundant "Quick Configurations" pill strip (Couple, Family, Solo, Friends).
- **Main Header (`Header.tsx`)**:
  - Removed the redundant `Plan a Trip` / `Resume Itinerary` CTA button.
  - Cleaned up unused icon imports (`Sparkles`, `Calendar`) and props.
  - Maintained balanced, responsive desktop and mobile layouts for Logo, Home, Destinations, Packages, My Trips (with live badge), and Why Naiking.
- **Application Shell (`App.tsx`)**:
  - Wrapped root in `<TripProvider>`.
  - Replaced redundant draft/plan local states with centralized context dispatchers.

### Removed
- **Redundant Secondary Navigation Bar (`UnifiedTravelNav.tsx`)**: Removed in favor of consolidated floating header and homepage customizer.
- **Redundant Setup Steps**: Eliminated intermediate `TripWizard` steps (cities and dates) previously forced when launching planning from the homepage.

---

## [2026-10-21] — Homepage Redesign & Travel Features

### Added
- **Curated Packages Section (`CuratedPackages.tsx`)**: Showcase of boutique luxury packages for Bali, Dubai, Maldives, Manali, Goa, and Singapore.
- **Signature Destinations 3D/Tilt Grid (`SignatureDestinations.tsx`)**: Interactive destination cards with theme categories (Beach, Mountains, Skyline, Heritage).
- **MakeMyTrip Inspired Console**: Initial 5-field holiday customizer layout in `TripPlanningConsole.tsx`.
- **Editorial Luxury Styling**: Custom typography tokens for Marcellus and Jost, glassmorphism overlays, and smooth scroll spy.
