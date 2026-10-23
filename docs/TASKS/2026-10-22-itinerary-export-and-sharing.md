# Task: Itinerary Export & Sharing Implementation Plan (FEAT-021)

- **Date**: 2026-10-22
- **Status**: In Progress 🟡
- **Author**: Senior Frontend Engineer & Software Architect
- **Related Features**:
  - `FEAT-021`: Itinerary Export (Print / Save as PDF) & Shareable URL Links

---

## 1. Audit Findings: Existing Itinerary Model

### 1.1 Technology Stack & Architectural Context
- **Framework**: React 19, TypeScript strict mode, Vite 8.3.1, Tailwind CSS v4 (`@tailwindcss/vite`).
- **Icons & Motion**: `lucide-react`, `motion/react`.
- **Routing**: Single-page application without server-side routing or `react-router`. Views are switched in [src/App.tsx](../../src/App.tsx) via `activeTab: 'home' | 'why' | 'start' | 'plan' | 'overview'`.
- **Backend / Storage Scope**: Pure client-side static application. No backend database or server-side session store exists for custom itineraries.

### 1.2 Existing Data Models

#### A. `TripDraft` ([src/types.ts](../../src/types.ts))
Contains core itinerary configuration:
- `id?: string`: Session identifier.
- `packageId?: string`: Canonical curated package identifier (e.g. `'pkg-bali-sanctuary'`).
- `destinationId: string`: Valid destination key (e.g. `'bali'`, `'dubai'`, `'maldives'`, `'manali'`, `'goa'`, `'singapore'`).
- `aiDestination: boolean`: Flag whether AI selected destination.
- `travellerType: TravellerType | ''`: `'solo' | 'couple' | 'family' | 'friends' | ''`.
- `interests: ActivityCategory[]`: Array of activity categories (e.g. `['Leisure', 'Culture']`).
- `aiPlan: boolean`: Flag whether auto-fill was enabled.
- `cityIds: string[]`: Array of city identifiers within destination.
- `aiCities: boolean`: Flag whether AI picked cities.
- `checkIn: string`: Departure date (`YYYY-MM-DD`).
- `checkOut: string`: Return date (`YYYY-MM-DD`).
- `adults: number`: Number of adult travellers (>= 1).
- `children: number`: Number of child travellers (>= 0).
- `rooms?: number`: Hotel room count (>= 1).
- `stayTier: 0 | 1 | 2`: Accommodation tier (`0` = Comfort, `1` = Signature, `2` = Ultra Luxury).
- `timingPreference?: string`: Optional timing/season label.

#### B. `PlanState` ([src/types.ts](../../src/types.ts))
Contains day-by-day activity assignments:
- `signature: string`: Cache signature (e.g. `${destinationId}|${days}`).
- `days: string[][]`: Array of days where `days[i]` holds an array of activity IDs for Day `i + 1`.
- `extras: Activity[]`: Dynamic/session activities.
- `arrival?: ArrivalDetails`: Day 1 pickup / transfer customisation (mode, address, time, flightNo, vehicle, hotelId).
- `departure?: DepartureDetails`: Last day drop customisation (mode, address, time, flightNo, vehicle, pickupHotelId).
- `times?: Record<string, { start: number; end: number }>`: Minute timestamps for activities.

#### C. Derived Values (Must NOT be serialized)
The following are computed on-the-fly and will be recalculated upon decoding rather than serialized:
- **Cost Calculations (`computeCosts`)**: Total price, stay cost, transfers cost, activity costs, service fees, per-person rates. Client-supplied prices must never be trusted.
- **Activity Metadata**: Activity names, categories, slots, durations, images, and descriptions are derived from the canonical destination catalogue (`PLANNER_DESTINATIONS`).
- **City Stops (`cityStops`)**: Derived from destination and city selections.
- **Calendar Dates (`dayDate`)**: Derived from `checkIn` and day indices.
- **Vehicle Information & Summaries**: Derived from destination and logistics details.

### 1.3 State Isolation & Privacy Analysis
- **Active Trip Isolation**: Loading or previewing a shared itinerary must never silently overwrite the recipient's active trip (`ActiveTripState` in `localStorage['naiking_active_trip_v2']`).
- **Booked Trips & Wishlist Isolation**: Preserves confirmed bookings (`TripBooking[]` in `localStorage['naiking_saved_trips_v2']`) and saved packages (`SavedPackageItem[]` in `localStorage['naiking_saved_packages_v1']`).
- **Privacy Boundary**: Share URLs must never contain:
  - Personal contact info (lead traveller name, phone, email).
  - Enquiry messages or customer notes.
  - Private booking reference codes.
  - Unrelated saved trips or wishlists.
  - Authentication tokens or local storage blobs.

---

## 2. Implementation Plan

### 2.1 Phase 2: Print / PDF Export
1. **Dedicated Export Action**:
   - Add "Print / Save as PDF" action to [src/components/TripOverview.tsx](../../src/components/TripOverview.tsx), [src/components/TripPlanner.tsx](../../src/components/TripPlanner.tsx), and the shared preview view.
   - Clear helper text explaining that users can select "Save as PDF" as their destination in the browser print dialog.
2. **Dedicated Printable Itinerary Presentation**:
   - Create a clean, print-optimised section or document structure including:
     - Naikings Tours & Travels branding and contact hotline.
     - Trip title, curated package badge (if applicable), destination and dates.
     - Traveller count (adults, children, rooms) and stay tier.
     - Itemized day-by-day schedule with date, city, time slots, activity names, durations, and categories.
     - Transport & accommodation summary (vehicle choice, pickup/drop notes).
     - Estimated cost breakdown with explicit disclosure that prices are estimates subject to concierge confirmation.
3. **Print-Only CSS (`@media print`)**:
   - Hide interactive elements: top header, mobile navigation, search/filter bars, buttons, modals, toasts, drawer overlays, drag handles, edit controls.
   - Force clean background, black/slate typography, print-friendly borders.
   - Use `break-inside: avoid` / `page-break-inside: avoid` on day cards and price summary blocks to avoid awkward page cutoffs.
   - Graceful handling for empty itineraries.

### 2.2 Phase 3: Shareable Itinerary URLs
1. **Serialization Service (`src/services/shareService.ts`)**:
   - Versioned schema: `version: 1`.
   - Compact payload fields:
     - `v`: schema version (`1`)
     - `d`: `destinationId` (validated against `PLANNER_DESTINATIONS`)
     - `pkg`: `packageId` (validated against `CURATED_PACKAGES` if present)
     - `in`: `checkIn` (`YYYY-MM-DD`)
     - `out`: `checkOut` (`YYYY-MM-DD`)
     - `a`: `adults` (1–20)
     - `c`: `children` (0–10)
     - `r`: `rooms` (1–10)
     - `st`: `stayTier` (0, 1, 2)
     - `tp`: `timingPreference` (optional, string <= 50 chars)
     - `i`: `interests` (array of valid `ActivityCategory`)
     - `cids`: `cityIds` (valid city IDs for destination)
     - `days`: `string[][]` (array of activity IDs, validated against destination's catalogue)
     - `veh`: `vehicle` (optional, string <= 60 chars)
2. **Encoding Strategy**:
   - URL-safe base64 encoding with URL parameter `?trip=...`.
   - Size limit enforcement: Reject payloads exceeding 8 KB.
   - Comprehensive validation on deserialization:
     - Safe JSON parsing.
     - Schema version check.
     - Validates destination against catalogue.
     - Strips unknown/stale activity IDs gracefully.
     - Recalculates all costs, timings, and stops from canonical catalogue.
3. **Shared Itinerary Preview & Non-Destructive Workflow**:
   - Detect `?trip=...` on load.
   - If present, parse into an isolated `SharedItineraryPreview` state.
   - Do NOT overwrite `activeTrip` or mutate localStorage.
   - Render a dedicated Shared Itinerary Preview banner/view:
     - Clearly displays shared itinerary details and activities.
     - Recalculated live pricing with "Estimated Price" banner.
     - Primary Action: "Continue Planning / Customise This Itinerary" (explicit user choice to adopt shared trip as their active draft).
     - Secondary Action: "Print / Save as PDF".
     - Dismiss / Exit action: Return to personal active trip without changes.
4. **Copy Link Action & Fallbacks**:
   - Implement `navigator.clipboard.writeText` with permission handling.
   - Provide manual copy fallback input with select-all for older browsers or restricted permissions.
   - Success toast confirmation.

### 2.3 Phase 4: Automated Testing & Validation
- Unit tests for serialization and deserialization:
  - Round trip encode/decode.
  - Package ID preservation.
  - Day assignments preservation.
  - Recalculation of derived costs.
  - Rejection of malformed / oversized payloads.
  - Rejection of unsupported schema versions.
  - Defensive pruning of invalid destination or activity IDs.
  - Non-inclusion of PII or saved trips.
- Browser interaction testing:
  - Print dialog invocation.
  - Link generation and copying.
  - Loading shared link in fresh state.
  - Continuing planning without corruption of existing active/saved trips.

---
