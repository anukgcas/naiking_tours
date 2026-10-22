# Regression & Release Checklist

This checklist must be executed and verified prior to merging pull requests or tagging releases for Naikings Tours & Travels.

---

## Pre-Merge Verification Checklist

### 1. Automated Checks
- [ ] Run static analysis: `npm run lint` (`tsc --noEmit`) $\rightarrow$ Must exit with `0` errors.
- [ ] Run production build: `npm run build` (`vite build`) $\rightarrow$ Must compile cleanly to `dist/`.

---

### 2. Header & Navigation Integrity
- [ ] Verify brand logo renders and links to Home.
- [ ] Confirm the **"Plan a Trip"** / **"Resume Itinerary"** button is **NOT** present in the main navbar.
- [ ] Verify **Home**, **Destinations**, **Packages**, **My Trips**, and **Why Naiking** are present and legible.
- [ ] Verify that clicking Destinations or Packages smooth-scrolls to the appropriate homepage section.
- [ ] Verify My Trips badge accurately reflects `bookedTrips.length`.
- [ ] Verify header transitions smoothly from transparent to white glassmorphism upon scrolling > 20px.

---

### 3. Holiday Customizer Console (`TripPlanningConsole.tsx`)
- [ ] Open Destination popover: verify 6 destinations with thumbnail photos; select one (e.g. Dubai).
- [ ] Open When & Duration popover: toggle nights presets (3, 5, 7, 10); confirm summary updates.
- [ ] Open Departure Date popover: pick a date; verify past dates are disabled; verify summary updates.
- [ ] Open Rooms & Guests popover: test steppers for Rooms, Adults, and Children; verify summary updates.
- [ ] Open Filters popover: toggle Activity Category chips and Stay Tier radio options.
- [ ] Click outside any popover or press Escape: confirm popover closes cleanly.
- [ ] Click **Craft My Itinerary**: confirm direct transition to `TripPlanner` without intermediate wizard forms.

---

### 4. Interactive Planner Canvas (`TripPlanner.tsx`)
- [ ] Confirm planner heading reflects the chosen destination (e.g. "Plan your Dubai days").
- [ ] Confirm date range and guest counts match homepage customizer selections.
- [ ] Verify day columns reflect the selected night/day count.
- [ ] Drag an activity between morning, afternoon, and evening slots; verify placement persists.
- [ ] Switch Stay Tier (Comfort, Signature, Ultra Luxury); verify price updates in real time.
- [ ] Inspect the Leaflet RouteMap in the planner sidebar; verify activity coordinate markers.

---

### 5. Cross-Page Round-Trip Synchronization
- [ ] From `TripPlanner`, click **Home** in the header.
- [ ] Verify the homepage customizer still displays the exact destination, duration, departure date, rooms, and guests selected previously.
- [ ] Change destination or duration on the homepage customizer $\rightarrow$ click **Craft My Itinerary**.
- [ ] Verify planner updates to the new destination/duration and reconciles plan days accordingly.

---

### 6. Client Persistence & Browser Refresh
- [ ] Make edits in the planner canvas.
- [ ] Refresh the browser (`Cmd+R` / `F5`).
- [ ] Confirm that active draft preferences and customized activity assignments are restored from `localStorage`.
- [ ] Verify console logs show no JSON parsing errors or unhandled exceptions.

---

### 7. Saved Trips Lifecycle (`MyTripsDrawer.tsx`)
- [ ] Click **My Trips** in header to open slide-over drawer.
- [ ] Confirm list of upcoming and past bookings is displayed.
- [ ] Click **Open in Planner** on any saved trip.
- [ ] Confirm saved trip loads into planner canvas with its own destination, dates, and activities.
- [ ] Return to Home: verify customizer displays the loaded trip's parameters.
- [ ] Confirm that other saved trips have not been mutated or overwritten.

---

### 8. Trip Overview & Concierge Inquiry (`TripOverview.tsx`)
- [ ] Click **Review Trip Overview** from planner canvas.
- [ ] Verify itemized pricing breakdown (Stays, Transfers, Experiences, 5% Service).
- [ ] Enter traveller contact details and submit inquiry.
- [ ] Verify confirmation screen renders with assigned booking ID (`NT-XXXX`).
- [ ] Verify newly submitted trip appears in My Trips drawer and storage.

---

### 9. Mobile Responsive Viewport (375px)
- [ ] Inspect mobile layout on phone screen size.
- [ ] Confirm header renders brand logo without horizontal overflow.
- [ ] Confirm fixed [MobileBottomNav.tsx](../../src/components/MobileBottomNav.tsx) provides Home, Plan, My Trips, and Why Us.
- [ ] Verify customizer fields stack cleanly into readable touch targets.
