# Feature: Save for Later (Package Wishlist)

- **Feature ID**: `FEAT-018`
- **Category**: Discovery & Wishlist
- **Status**: Active ✅
- **Primary Files**:
  - `src/context/SavedPackagesContext.tsx`
  - `src/components/SavedPackagesDrawer.tsx`
  - `src/components/CuratedPackages.tsx`
  - `src/components/Header.tsx`
  - `src/components/MobileBottomNav.tsx`
  - `src/types.ts`
- **Storage Key**: `naiking_saved_packages_v1`

---

## 1. Overview & Purpose

The **Save for Later** feature allows travellers to bookmark curated travel packages they are interested in without starting or completing trip planning. It acts as an independent package wishlist, completely decoupled from active itinerary drafts (`naiking_active_trip_v2`) and confirmed bookings (`naiking_saved_trips_v2`).

---

## 2. Key Capabilities

1. **One-Click Package Bookmarking**:
   - Each curated package card in `CuratedPackages.tsx` contains a bookmark button in its header.
   - Click events stop propagation (`e.stopPropagation()`) to avoid triggering card-level interactions.
   - Visual toggle state dynamically reflects whether the package is saved (filled blue bookmark vs semi-transparent dark button).
2. **Dedicated Wishlist Drawer (`SavedPackagesDrawer.tsx`)**:
   - Accessible via the **Saved** button in the global navbar and mobile bottom navigation.
   - Shows badge counter with real-time count of saved packages.
   - Lists saved packages with photos, duration badges, price per person, category, tagline, and inclusions.
   - Actions per card:
     - **Remove**: Removes package from the wishlist.
     - **Enquire**: Opens package-specific enquiry modal.
     - **Customise**: Seamlessly launches the package into the interactive trip planner canvas using `onSelectPackage(pkg)`.
3. **Empty State & Discovery Link**:
   - When no packages are bookmarked, presents an informative empty state with a direct CTA to explore curated packages.
4. **Resilient Client Persistence**:
   - Persists wishlist state to `localStorage` under `naiking_saved_packages_v1`.
   - Deduplicates entries and verifies IDs against the canonical `CURATED_PACKAGES` array.
   - Safely ignores malformed data or stale package references without throwing runtime exceptions.
   - Synchronizes across browser tabs using window `storage` event listeners.

---

## 3. Data Model

```typescript
export interface SavedPackageItem {
  packageId: string; // e.g. "pkg-bali-sanctuary"
  savedAt: string;   // ISO 8601 timestamp
}
```

---

## 4. State Management Boundaries

| Concept | State Holder | Storage Key | Role |
| :--- | :--- | :--- | :--- |
| **Saved Packages** | `SavedPackagesContext` | `naiking_saved_packages_v1` | Bookmark wishlist of curated packages. Does NOT alter active trip or booked trips. |
| **Active Trip Draft** | `TripContext` | `naiking_active_trip_v2` | Currently configured trip preferences and day-by-day planner assignments. |
| **Saved Trips** | `TripContext` | `naiking_saved_trips_v2` | Confirmed bookings and concierge inquiry submissions. |

---

## 5. Known Limitations

- **Browser-Specific Storage**: Saved packages persist within the current browser's local storage and are not yet synchronized across multiple devices or user accounts.
