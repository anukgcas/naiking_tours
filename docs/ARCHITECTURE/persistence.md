# Architecture Whitepaper: Client-Side Persistence Engine

## 1. Overview

In the absence of a backend database or user authentication service, Naikings Tours & Travels utilizes a versioned, defensive client-side persistence engine built directly into [src/context/TripContext.tsx](../../src/context/TripContext.tsx).

This document details storage schemas, hydration safety checks, validation rules, and persistence guarantees.

---

## 2. Storage Keys & Schemas

### Key 1: `naiking_active_trip_v2`
Stores the active planning session:
```json
{
  "id": "draft-1792606829",
  "isSavedTrip": false,
  "savedTripId": null,
  "destinationId": "dubai",
  "durationNights": 7,
  "timingPreference": "Upcoming Month",
  "departureDate": "2026-11-21",
  "rooms": 2,
  "adults": 3,
  "children": 0,
  "interests": ["Leisure", "Culture"],
  "stayTier": 1,
  "draft": {
    "destinationId": "dubai",
    "checkIn": "2026-11-21",
    "checkOut": "2026-11-28",
    "adults": 3,
    "children": 0,
    "rooms": 2,
    "stayTier": 1
  },
  "plan": {
    "signature": "dubai|8",
    "days": [
      ["dxb-burj", "dxb-desert"],
      ["dxb-oldtown", "dxb-marina"]
    ],
    "extras": []
  }
}
```

### Key 2: `naiking_saved_trips_v2`
Stores an array of `TripBooking` records (both initial mock data and newly submitted concierge inquiries):
```json
[
  {
    "id": "NT-8421",
    "destination": "Dubai",
    "packageName": "Custom 8-Day Dubai Journey",
    "startDate": "2026-11-21",
    "endDate": "2026-11-28",
    "travellers": { "adults": 3, "children": 0 },
    "totalPrice": 128500,
    "status": "Preparing",
    "bookingDate": "Today",
    "image": "/images/dest_dubai_1790674315094.jpg",
    "draft": { ... },
    "plan": { ... }
  }
]
```

---

## 3. Defensive Hydration Rules

During application startup, `loadInitialActiveTrip()` executes a series of safety validations:

```mermaid
flowchart TD
    Start[Read localStorage] --> CheckNull{Key exists & valid JSON?}
    CheckNull -- No --> Defaults[Load Default State: Bali, 5N, 2 Adults, 1 Room]
    CheckNull -- Yes --> ValDest{Valid Destination ID?}
    ValDest -- No --> FixDest[Fallback destinationId = 'bali']
    ValDest -- Yes --> CheckDate{departureDate >= todayISO()?}
    CheckDate -- No (Past Date) --> AdvanceDate[Advance departureDate = today + 30 days]
    CheckDate -- Yes --> ClampNights[Clamp durationNights between 1 and 14]
    FixDest --> CheckDate
    AdvanceDate --> ClampNights
    ClampNights --> RebuildDraft[Reconstruct TripDraft & Reconcile PlanState]
    RebuildDraft --> Ready[Hydrated into TripContext State]
```

### Protection Against Past-Date Drift
If a traveller configures a trip, leaves the tab, and returns weeks later, the departure date might now be in the past. To prevent scheduling calendar bugs or negative countdowns, `loadInitialActiveTrip()` automatically advances any past date to `today + 30 days` and shifts `checkIn`/`checkOut` accordingly.

---

## 4. Boundaries and Guarantees

1. **Browser-Scoped Guarantee**: Data persists across page reloads, browser restarts, and tab switching on the same browser profile.
2. **Offline Resilience**: All data parsing and auto-saving occurs locally without requiring internet connectivity.
3. **No Cross-Device Sync**: Without backend accounts, clearing browser data or switching devices will start a fresh session.
4. **No Sensitive PII**: No passwords, credit card numbers, or payment tokens are ever written to `localStorage`.
