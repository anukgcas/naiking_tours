# Naikings Tours & Travels — Feature Inventory

This document is the authoritative catalog of all user-facing and architectural features in the Naikings Tours & Travels codebase.

---

## 1. Feature Catalog

| ID | Feature Name | Category | Primary Files | Entry Point | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **FEAT-001** | [Floating Header Navigation](FEATURES/homepage-navigation.md) | Navigation | `src/components/Header.tsx`, `NLogo.tsx` | Top viewport | Active ✅ |
| **FEAT-002** | Scenic Hero & Ambient Visuals | Homepage | `src/components/Hero.tsx`, `HeroParts.tsx` | Homepage top | Active ✅ |
| **FEAT-003** | [5-Field Holiday Customizer](FEATURES/holiday-customizer.md) | Customizer | `src/components/TripPlanningConsole.tsx` | Hero console | Active ✅ |
| **FEAT-004** | Curated Luxury Packages | Discovery | `src/components/CuratedPackages.tsx` | Mid homepage | Active ✅ |
| **FEAT-005** | Signature Destinations Tilt Grid | Discovery | `src/components/SignatureDestinations.tsx` | Mid homepage | Active ✅ |
| **FEAT-006** | [Central Trip State & Sync](FEATURES/trip-state-management.md) | Architecture | `src/context/TripContext.tsx` | Global context | Active ✅ |
| **FEAT-007** | Client-Side Draft & Saved Persistence | Architecture | `src/context/TripContext.tsx` | `localStorage` | Active ✅ |
| **FEAT-008** | Interactive Itinerary Planner | Planner | `src/components/TripPlanner.tsx` | `view === 'plan'` | Active ✅ |
| **FEAT-009** | Interactive Day Route Map | Planner | `src/components/RouteMap.tsx` | Planner sidebar | Active ✅ |
| **FEAT-010** | AI Concierge Trip Assistant | Planner | `src/components/TripPlanner.tsx`, `planner.ts` | Planner assistant | Active ✅ |
| **FEAT-011** | Trip Overview & Inquiry Submission | Booking | `src/components/TripOverview.tsx` | `view === 'overview'` | Active ✅ |
| **FEAT-012** | My Trips Drawer & Resumption | Booking | `src/components/MyTripsDrawer.tsx` | Navbar "My Trips" | Active ✅ |
| **FEAT-013** | Editorial Brand Storytelling | Information | `HowItWorks.tsx`, `StandardVsNaiking.tsx`, `WhyNaiking.tsx` | Lower homepage | Active ✅ |
| **FEAT-014** | Mobile Bottom Navigation | Navigation | `src/components/MobileBottomNav.tsx` | Mobile footer | Active ✅ |
| **FEAT-015** | Scroll Spy & Scroll-To-Top Pill | Navigation | `src/components/ScrollToTop.tsx`, `App.tsx` | Bottom right | Active ✅ |
| **FEAT-016** | Deep Trip Setup Wizard | Planner | `src/components/TripWizard.tsx` | `view === 'start'` | Secondary ⚠️ |
| **FEAT-017** | Editorial Ambient Loader | Presentation | `src/components/Loader.tsx` | Page initial mount | Active ✅ |
| **FEAT-018** | [Save for Later (Package Wishlist)](FEATURES/save-for-later.md) | Wishlist | `src/context/SavedPackagesContext.tsx`, `SavedPackagesDrawer.tsx` | Navbar "Saved" & Card Bookmark | Active ✅ |
| **FEAT-019** | [Package Enquiry & Callbacks](FEATURES/package-enquiry.md) | Lead Capture | `src/components/PackageEnquiryModal.tsx`, `enquiryService.ts` | Card "Enquire" Button | Active ✅ |
| **FEAT-020** | [Package Discovery-to-Planning Journey](FEATURES/package-discovery-to-planning.md) | Journey Integration | `src/context/TripContext.tsx`, `TripPlanner.tsx` | Package Cards & Saved Drawer | Active ✅ |
| **FEAT-021** | [Itinerary Export & Sharing](FEATURES/itinerary-export-and-sharing.md) | Export & Sharing | `src/services/shareService.ts`, `PrintableItinerary.tsx`, `ShareItineraryModal.tsx`, `SharedItineraryPreviewModal.tsx` | Planner & Overview Action Bars | Active ✅ |

---

## 2. Detailed Feature Specifications

### FEAT-001: Floating Header Navigation
- **Purpose**: Provides brand identity and primary navigation links (Home, Destinations, Packages, My Trips, Why Naiking) with an adaptive glassmorphism pill design.
- **Recent Updates**: The redundant `Plan a Trip` / `Resume Itinerary` CTA button was removed from the header to establish the homepage customizer as the sole primary trip-planning entry point.
- **Dependencies**: `NLogo.tsx`, `lucide-react` (for My Trips badge).
- **Known Limitations**: Does not use browser URL history; triggers smooth page scrolls or view state changes.

### FEAT-003: 5-Field Holiday Customizer
- **Purpose**: High-efficiency holiday configuration console (Destination, When & Duration, Departure Date, Rooms & Guests, Filters) modeled after modern travel portals.
- **Recent Updates**: Replaced the previous generic travellers field with dedicated controls for Departure Date (calendar picker), Rooms & Guests (stepper), and Filters (stay tiers and travel interests). Removed the redundant "Quick Configurations" pill strip.
- **Dependencies**: `TripContext.tsx`, `lucide-react`.
- **Known Limitations**: Validates up to 14 days maximum trip duration per platform rules.

### FEAT-006: Central Trip State & Synchronization
- **Purpose**: Establishes one authoritative source of truth for active trip configuration, ensuring seamless round-trip synchronization between Home, Planner, Packages, and My Trips.
- **Recent Updates**: Implemented `TripContext.tsx` and the `useTrip()` hook; eliminated fragmented state across `App.tsx` and `TripPlanningConsole.tsx`.
- **Dependencies**: React Context API, `src/data/planner.ts`.
- **Known Limitations**: Synchronized within the current browser; no cross-device sync.

### FEAT-007: Client-Side Draft & Saved Persistence
- **Purpose**: Persists in-progress active drafts and confirmed concierge inquiries across page refreshes and view switches.
- **Storage Keys**: `naiking_active_trip_v2`, `naiking_saved_trips_v2`.
- **Safety**: Validates destination ID and advances past dates automatically to `today + 30 days`.
- **Known Limitations**: Dependent on client localStorage quotas; cleared if user clears site storage.

### FEAT-008: Interactive Itinerary Planner
- **Purpose**: Kanban-style day-by-day scheduler allowing travellers to drag experiences into Morning, Afternoon, and Evening slots, inspect costs in real time, and switch accommodation luxury tiers.
- **Dependencies**: `TripContext.tsx`, `RouteMap.tsx`, `StepIndicator.tsx`, `src/data/planner.ts`.
- **Known Limitations**: Locked on extra-wide screens to maintain planner canvas ergonomics; mobile uses stacked day accordions.

### FEAT-011: Trip Overview & Inquiry Submission
- **Purpose**: Itemized price breakdown (stays, private transfers, experiences, concierge fee), day schedules, and contact form for submitting concierge trip requests.
- **Dependencies**: `computeCosts`, `formatINR`, `TripContext.tsx`.
- **Known Limitations**: Generates a confirmed concierge inquiry request (`'Preparing'`), but does not process credit cards.

### FEAT-012: My Trips Drawer & Resumption
- **Purpose**: Slide-over drawer displaying saved concierge trips with status badges, price totals, expandable itinerary breakdowns, and an **Open in Planner** action.
- **Recent Updates**: Connected to `loadSavedTrip(trip)` in `TripContext` to allow any saved trip to be loaded into the active planner canvas.
- **Known Limitations**: Historical mock trips without stored plan data are reconstructed via rule-based defaults.

### FEAT-018: Save for Later (Package Wishlist)
- **Purpose**: Bookmark curated travel packages without starting trip planning. Provides an isolated wishlist drawer, live badge counter, and planner continuation.
- **Dependencies**: `SavedPackagesContext.tsx`, `SavedPackagesDrawer.tsx`, `CuratedPackages.tsx`.
- **Known Limitations**: Browser-specific `localStorage` persistence (`naiking_saved_packages_v1`); not synchronized across multiple devices without user accounts.

### FEAT-019: Package Enquiry & Callback Requests
- **Purpose**: Allows users to contact the concierge team about a specific package, ask questions across 7 categories (inclusions, coupons, festive discounts, customization, dates), or request a callback.
- **Dependencies**: `PackageEnquiryModal.tsx`, `enquiryService.ts`.
- **Known Limitations**: Connected to a typed submission boundary. When unconfigured with a live CRM endpoint, reports an honest notice rather than simulating fake success.

### FEAT-020: Package Discovery-to-Planning Journey
- **Purpose**: Seamless, state-preserving journey linking curated package discovery, Save for Later wishlists, package enquiry, and customized itinerary planning with canonical package identity, preference preservation, and signature activity seeding.
- **Dependencies**: `TripContext.tsx`, `SavedPackagesContext.tsx`, `TripPlanner.tsx`, `CuratedPackages.tsx`.
- **Known Limitations**: Client-side storage scoped to local device; backend CRM dispatch pending production endpoint configuration.

### FEAT-021: Itinerary Export & Sharing
- **Purpose**: Allows users to export a customized itinerary via browser-native print (save as PDF) and generate compact, shareable URLs (`?trip=...`) that encode supported itinerary fields without requiring server-side storage. Includes isolated, non-destructive recipient preview.
- **Dependencies**: `shareService.ts`, `PrintableItinerary.tsx`, `ShareItineraryModal.tsx`, `SharedItineraryPreviewModal.tsx`, `TripContext.tsx`, `@media print` CSS.
- **Known Limitations**: Share URLs encode data client-side; URLs cannot exceed browser length limits (capped at 8,192 chars, typical size ~400 chars). Does not sync edits in real-time across users.

