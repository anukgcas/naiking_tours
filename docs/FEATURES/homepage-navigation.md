# Feature: Homepage Navigation & Header Architecture

- **Feature ID**: `FEAT-001`
- **Category**: Navigation
- **Status**: Active ✅
- **Primary Entry Point**: Floating pill header fixed at viewport top
- **Primary Source Files**:
  - `src/components/Header.tsx`
  - `src/components/NLogo.tsx`
  - `src/components/MobileBottomNav.tsx`
  - `src/components/ScrollToTop.tsx`
  - `src/App.tsx`

---

## 1. Purpose and Value Proposition

The navigation architecture provides a discreet, luxury brand presence while enabling effortless discovery across the single-page application:
- **Transparent-to-Opaque Transition**: Floats seamlessly over the hero photography at the top of the homepage and transitions into an elegant `bg-white/95 border-white/90 shadow-md backdrop-blur-md` pill on scroll.
- **Unified Trip Planning Entry Point**: Rather than distracting travellers with a duplicate "Plan a Trip" button in the header, the navigation routes users cleanly to the homepage customizer, which serves as the primary trip-planning engine.
- **Quick Status Awareness**: The **My Trips** button incorporates a dynamic badge showing the number of confirmed/in-progress concierge trips.

---

## 2. User Journey & Interaction Flow

1. **Brand Recognition**: On landing, traveller sees the animated Naikings logo in the top-left of the floating pill.
2. **Browsing Sections**:
   - Clicking **Destinations** smooth-scrolls to the Signature Destinations showcase (`#signature-destinations`).
   - Clicking **Packages** smooth-scrolls to Curated Packages (`#curated-packages`).
   - Clicking **Why Naiking** smooth-scrolls to the Naiking Standard section (`#naiking-standard`).
3. **Trip Management**:
   - Clicking **My Trips** opens the slide-over drawer showing active and historical trips.
4. **Mobile Navigation**:
   - On screens `< 768px`, navigation shifts to the fixed [MobileBottomNav.tsx](../../src/components/MobileBottomNav.tsx) providing quick access to Home, Plan, My Trips, and Why Us.

---

## 3. Architecture & Key Components

| Component | File Path | Role |
| :--- | :--- | :--- |
| `Header` | `src/components/Header.tsx` | Desktop floating pill navbar and scroll listener. |
| `NLogo` | `src/components/NLogo.tsx` | SVG/typography luxury logo with scale-on-scroll animation. |
| `MobileBottomNav` | `src/components/MobileBottomNav.tsx` | Mobile viewport bottom tab bar. |
| `ScrollToTop` | `src/components/ScrollToTop.tsx` | Floating return-to-top trigger shown when scrolled down. |

---

## 4. State Management

- `isScrolled` (`useState` in `Header.tsx`): Tracks `window.scrollY > 20` to toggle background blur and border styles.
- `isNarrow` (`useState` in `Header.tsx`): Tracks `max-width: 639px` media query for responsive logo scaling.
- `activeTab` / `homeSection` in `App.tsx`: Controls which nav item displays the terracotta indicator line (`#C2571A`).
- `bookedTripsCount`: Passed from `useTrip().bookedTrips.length` to render the notification badge.

---

## 5. Related Documentation

- [Task: Homepage Navigation Consolidation](../TASKS/2026-10-22-homepage-navigation.md)
- [Architecture: Navigation Flow](../ARCHITECTURE/navigation-flow.md)
- [Feature Inventory](../FEATURE_INVENTORY.md)
