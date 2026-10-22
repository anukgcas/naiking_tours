# Feature: Trip State Management & Synchronization

- **Feature ID**: `FEAT-006` / `FEAT-007`
- **Category**: State Architecture & Persistence
- **Status**: Active ✅
- **Primary Source Files**:
  - `src/context/TripContext.tsx`
  - `src/App.tsx`
  - `src/types.ts`
  - `src/data/planner.ts`

---

## 1. Purpose and Value Proposition

Trip planning in Naikings Tours & Travels is designed as **one continuous, synchronized experience**:
- **Configure once**: Define travel dates, destination, party size, and vibe preferences on the homepage.
- **Craft itinerary**: Transition directly into the planner with AI-recommended day activities without re-entering details.
- **Edit and explore**: Fine-tune activities, adjust stay tiers, or view route maps.
- **Navigate back**: Return to the homepage at any time and find all previous configurations intact.
- **Persist seamlessly**: Close the tab or refresh the browser without losing in-progress work.
- **Isolate saved trips**: Inspect, load, or submit inquiries without corrupting or merging active drafts with previous bookings.

---

## 2. Core State Models

### `TripDraft` ([src/types.ts](../../src/types.ts))
Represents the traveller's preferences that seed the itinerary:
```typescript
export interface TripDraft {
  id?: string;
  destinationId: string;
  aiDestination: boolean;
  travellerType: TravellerType | '';
  interests: ActivityCategory[];
  aiPlan: boolean;
  cityIds: string[];
  aiCities: boolean;
  checkIn: string;   // ISO date (YYYY-MM-DD)
  checkOut: string;  // ISO date (YYYY-MM-DD)
  adults: number;
  children: number;
  rooms?: number;
  stayTier: 0 | 1 | 2;
  timingPreference?: string;
}
```

### `PlanState` ([src/types.ts](../../src/types.ts))
Represents the day-by-day activity assignments:
```typescript
export interface PlanState {
  signature: string;   // e.g. "bali|6"
  days: string[][];    // days[i] holds activity IDs for Day i+1
  extras: Activity[];  // AI-generated activities added during session
}
```

### `TripBooking` ([src/types.ts](../../src/types.ts))
Represents a confirmed concierge inquiry:
```typescript
export interface TripBooking {
  id: string;          // e.g. "NT-8921"
  destination: string;
  packageName: string;
  startDate: string;
  endDate: string;
  travellers: { adults: number; children: number };
  totalPrice: number;
  status: 'Confirmed' | 'Preparing' | 'Completed';
  bookingDate: string;
  image: string;
  itinerary?: PlannedDay[];
  draft?: TripDraft;   // Full snapshot for round-trip resumption
  plan?: PlanState;    // Full snapshot for round-trip resumption
}
```

---

## 3. Persistence Architecture

### Keys
- `naiking_active_trip_v2`: Active trip draft, duration, destination, departure date, guest counts, and plan.
- `naiking_saved_trips_v2`: Array of confirmed concierge bookings.

### Defensive Storage Rules
1. **Past Date Correction**: If stored `departureDate < todayISO()`, the departure date is automatically reset to `today + 30 days` to prevent date-picker crashes.
2. **Clamping & Validation**: Duration is clamped to $1 \le \text{nights} \le 14$; rooms and adults are validated to be $\ge 1$.
3. **Environment Guards**: Wrapped in `typeof window !== 'undefined' && window.localStorage` and JSON parse try/catch blocks.

---

## 4. Related Documentation

- [Task: Trip State Synchronization](../TASKS/2026-10-22-trip-state-synchronization.md)
- [Architecture: Trip Context](../ARCHITECTURE/trip-context.md)
- [Architecture: Persistence](../ARCHITECTURE/persistence.md)
