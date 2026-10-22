# Architecture Whitepaper: Single-Page Navigation & View Flow

## 1. Overview

Naikings Tours & Travels uses an intentional single-page application (SPA) state-switching architecture instead of client-side pushState URL routing (`react-router` is intentionally not installed).

This document details how views are switched, how scroll positions and scroll spies are coordinated, and how active trip context is retained across view transitions.

---

## 2. Navigation State Machine

The top-level view state is managed by `activeTab` in [src/App.tsx](../../src/App.tsx):

```typescript
type Tab = 'home' | 'why' | 'start' | 'plan' | 'overview';
```

### View Transition Matrix

| Action | Current View | Target View | Mechanism |
| :--- | :--- | :--- | :--- |
| **Click Brand Logo / Home** | Any | `home` | `goTo('home')` $\rightarrow$ scrolls to top, unmounts planner/overview |
| **Click "Craft My Itinerary"** | `home` | `plan` | `handleCraftItinerary()` $\rightarrow$ validates inputs, sets `activeTab = 'plan'` |
| **Click "Customise Itinerary" on Package** | `home` | `plan` | `selectPackage(pkg)` $\rightarrow$ sets `activeTab = 'plan'` |
| **Click "Review Trip Overview"** | `plan` | `overview` | `goTo('overview')` $\rightarrow$ mounts summary & booking form |
| **Click "Edit Plan"** | `overview` | `plan` | `goTo('plan')` $\rightarrow$ reopens planner canvas |
| **Click "Open in Planner" in My Trips** | Drawer open | `plan` | `loadSavedTrip(trip)` $\rightarrow$ closes drawer, sets `activeTab = 'plan'` |
| **Click "Edit Cities" in Planner** | `plan` | `start` | `startWizard({ step: 3 })` $\rightarrow$ mounts deep wizard at step 3 |
| **Complete Wizard** | `start` | `plan` | `handleWizardComplete()` $\rightarrow$ returns to planner |

---

## 3. View Guarding & Fallbacks

To prevent rendering empty or invalid canvases:
```typescript
const canPlan = hasActivePlan; // plan !== null && validateDraft(draft) === null
const view: Tab = (activeTab === 'plan' || activeTab === 'overview') && !canPlan ? 'home' : activeTab;
```
If a user attempts to enter `plan` or `overview` before a valid trip draft and plan exist, the app gracefully falls back to `home`.

---

## 4. Scroll Spy and Link Indicator Coordination

On the homepage, the application tracks vertical scroll position to highlight the active header link:
- Top 35% viewport: Highlights **Home**.
- Middle sections (Packages, Destinations, How It Works): Highlights no specific nav item (`headerTab = null`).
- The Naiking Standard onwards: Highlights **Why Naiking**.

### Smooth Scroll Spy Lock
When a user clicks **Why Naiking**, a smooth scroll is triggered. A timestamp lock (`spyLock.current = Date.now() + 2000`) disables the window scroll listener during the smooth scroll animation to prevent the indicator line from jittering across intermediate sections.
