# Architecture Whitepaper: Trip Context & Central State Architecture

## 1. Executive Summary

In Task 2, Naikings Tours & Travels transitioned from fragmented, component-local state to a centralized state model managed by [src/context/TripContext.tsx](../../src/context/TripContext.tsx).

This document outlines the design decisions, reactivity model, synchronization guarantees, and lifecycle boundaries of `TripContext`.

---

## 2. Why React Context Over Redux/Zustand?

The project evaluated introducing external libraries (such as Redux Toolkit or Zustand) versus utilizing React 19's native Context API:
1. **Dependency Footprint**: The application is an interactive single-page booking application with a well-defined domain model (`TripDraft`, `PlanState`, `TripBooking`). React Context provides type-safe state sharing without increasing bundle weight.
2. **Reactivity Simplicity**: `useTrip()` provides custom mutation helpers (`setGuests`, `craftItinerary`, `loadSavedTrip`) that encapsulate reconciliation logic and auto-persistence in a single place.
3. **No Boilerplate Overhead**: Eliminates actions, reducers, and slice files for straightforward domain operations.

---

## 3. Two-Way State Synchronization Model

The core challenge resolved by `TripContext` was keeping the homepage customizer's 5 fields synchronized with the planner's underlying domain models:

```mermaid
flowchart LR
    subgraph CustomizerFields ["Customizer Inputs"]
        dest[destinationId]
        nights[durationNights]
        dep[departureDate]
        rooms[rooms]
        adults[adults]
        children[children]
        tier[stayTier]
        ints[interests]
    end

    subgraph InternalEngine ["TripContext State Engine"]
        buildDraft[buildDraft()]
        reconcile[reconcilePlan()]
    end

    subgraph DomainModels ["Authoritative Domain Models"]
        draft[draft: TripDraft]
        plan[plan: PlanState]
    end

    CustomizerFields -->|Mutators| buildDraft
    buildDraft --> draft
    draft -->|Reconciles on change| reconcile
    reconcile --> plan
    draft -.->|Direct Binding| CustomizerFields
```

### Automatic Reconciliation Rules
When a user updates a preference:
- **Destination Changed**: If `destinationId` changes, `reconcilePlan` resets the day plan to match the new destination's curated activity catalog.
- **Duration Changed**: If `durationNights` changes, `reconcilePlan` preserves existing planned activities up to the new day count, appending empty days or trimming extra days.
- **Dates Changed**: `checkIn` is updated to `departureDate`, and `checkOut` is calculated as `departureDate + durationNights`.
- **Party Size Changed**: `adults`, `children`, and `rooms` trigger `deriveTravellerType` to categorize the traveller party as `solo`, `couple`, `family`, or `friends`.

---

## 4. Lifecycle Boundaries: Active Draft vs. Saved Trips

To guarantee that in-progress planning does not corrupt previous concierge bookings:
- **`activeTripId`**: Every active planning session has an ID (`draft-TIMESTAMP` or the ID of a loaded saved trip).
- **`isSavedTrip` & `savedTripId`**: Flag whether the active planner canvas is viewing a pre-existing booked trip.
- **`startNewTrip()`**: Explicitly resets the canvas to a clean state, generates a fresh draft ID, and detaches any previous saved trip ID.
- **`confirmTrip()`**: Takes a deep snapshot of the active draft and plan, assigns an `NT-XXXX` booking identifier, and prepends it to `bookedTrips`.

---

## 5. Performance and Re-render Optimization

- Mutator functions (`setDestinationId`, `setDurationNights`, `setGuests`, `craftItinerary`, etc.) are wrapped in `useCallback` to prevent unnecessary re-renders of consuming components.
- The context value is wrapped in `useMemo` dependent on `activeTrip`, `hasActivePlan`, and `bookedTrips`.
- Popover open/close states remain local to `TripPlanningConsole.tsx` to prevent firing full context re-renders during simple menu navigation.
