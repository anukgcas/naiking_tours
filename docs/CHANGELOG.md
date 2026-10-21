# Changelog

All notable changes to the Naikings Tours & Travels project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

---

## [Unreleased]

### Planned
- Cloud-synchronized user accounts and authentication.
- Real-time flight availability integration.
- PDF and shareable link export for concierge itineraries.

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
