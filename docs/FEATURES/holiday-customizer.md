# Feature: Holiday Packages & Customiser Console

- **Feature ID**: `FEAT-003`
- **Category**: Customizer / Trip Planning
- **Status**: Active ✅
- **Primary Entry Point**: Homepage Hero Section (`#hero-planner-console`)
- **Primary Source Files**:
  - `src/components/TripPlanningConsole.tsx`
  - `src/components/Hero.tsx`
  - `src/context/TripContext.tsx`
  - `src/types.ts`
  - `src/data/planner.ts`

---

## 1. Purpose and Value Proposition

The **Holiday Packages & Customiser** console is the central interactive booking engine on the Naikings homepage. Inspired by the high-density, multi-field UX of modern travel platforms (such as MakeMyTrip), it empowers travellers to define their entire holiday context in 5 quick fields without tedious form steps:
1. **Destination**: Selects from 6 curated sanctuaries (Bali, Maldives, Dubai, Manali, Goa, Singapore).
2. **When & Duration**: Sets night count (3, 5, 7, 10 nights) or timing preference.
3. **Departure Date**: Selects exact check-in date via a dedicated monthly calendar.
4. **Rooms & Guests**: Configures rooms, adults, and children with increment/decrement steppers.
5. **Filters**: Customizes stay luxury tier (Comfort, Signature, Ultra Luxury) and activity vibes.

Clicking **Craft My Itinerary** immediately validates these preferences and launches the interactive day-by-day planner canvas.

---

## 2. User Journey & Field Interactions

```text
[Field 1: Destination]    --> Opens visual destination popover with photo cards
[Field 2: When & Dur.]    --> Opens nights presets + seasonal timing options
[Field 3: Departure Date] --> Opens interactive calendar with past-date disabling
[Field 4: Rooms & Guests] --> Opens steppers for rooms (min 1), adults (min 1), children
[Field 5: Filters]        --> Opens stay tier radio & activity interest chips
[Craft My Itinerary]      --> Validates inputs, auto-fills AI plan, transitions to TripPlanner
```

---

## 3. Architecture & Data Binding

The console has zero detached persistent state. It connects directly to [TripContext.tsx](../../src/context/TripContext.tsx):

```typescript
const {
  destinationId,
  durationNights,
  timingPreference,
  departureDate,
  rooms,
  adults,
  children,
  interests,
  stayTier,
  setDestinationId,
  setDurationNights,
  setTimingPreference,
  setDepartureDate,
  setRooms,
  setAdults,
  setChildren,
  setInterests,
  setStayTier,
  craftItinerary,
} = useTrip();
```

- **Local State**: Only dropdown visibility (`activePopup`), calendar viewing month (`calMonth`, `calYear`), and transient validation messages (`validationError`) exist locally.
- **Outside Clicks**: Document-level mousedown listener dismisses active popovers when clicking outside the console.

---

## 4. Derived UI Summaries

The console automatically computes readable summary labels from the authoritative state:
- `durationSummary`: `${durationNights} Nights`
- `guestSummary`: `${rooms} Room(s) · ${adults} Adult(s)${children > 0 ? ', ' + children + ' Child(ren)' : ''}`
- `filterSummary`: Displays selected interests (e.g. `Beach & Chill +1`) or stay tier (`Signature`).

---

## 5. Related Documentation

- [Task: Holiday Customizer 5-Field Console](../TASKS/2026-10-22-holiday-customizer.md)
- [Architecture: Trip Context](../ARCHITECTURE/trip-context.md)
- [Feature Inventory](../FEATURE_INVENTORY.md)
