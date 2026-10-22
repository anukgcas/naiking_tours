# Task: Save for Later and Package Enquiry Implementation Plan

- **Date**: 2026-10-22
- **Status**: Completed ✅
- **Author**: Senior Frontend Engineer & Software Architect
- **Related Features**:
  - `FEAT-018`: Save for Later (Package Wishlist)
  - `FEAT-019`: Package Enquiry & Callback Requests

---

## 1. Repository Audit Findings

### 1.1 Technology Stack & Conventions
- **Framework**: React 19, TypeScript (strict mode, zero errors on `tsc --noEmit`), Vite 8.3.1, Tailwind CSS v4 (`@tailwindcss/vite`).
- **Icons & Motion**: `lucide-react`, `motion/react`.
- **Styling Philosophy**: Editorial luxury, warm ivory (`#F6F8FA`), deep navy (`#16222E`), cobalt accent (`#0B4A82`), slate neutrals (`#6B7280`).
- **Current Routing**: Single-page state-driven routing in [src/App.tsx](../../src/App.tsx) using `activeTab: 'home' | 'why' | 'start' | 'plan' | 'overview'`.

### 1.2 Package Architecture & Discovery
- **Package Model**: Defined in [src/components/CuratedPackages.tsx](../../src/components/CuratedPackages.tsx) as `CuratedPackage`.
- **Canonical Package Identifier**: `pkg.id` (e.g. `'pkg-bali-sanctuary'`, `'pkg-dubai-mirage'`, `'pkg-maldives-solitude'`, `'pkg-manali-peaks'`, `'pkg-goa-heritage'`, `'pkg-singapore-skyline'`).
- **Data Source**: `CURATED_PACKAGES` array in [src/components/CuratedPackages.tsx](../../src/components/CuratedPackages.tsx).
- **Package Selection Workflow**: Handled via `selectPackage(pkg: CuratedPackage)` in [src/context/TripContext.tsx](../../src/context/TripContext.tsx), which constructs a default `TripDraft`, calls `reconcilePlan` and `autoFillPlan`, and enters the planner canvas (`view === 'plan'`).

### 1.3 State Model & Persistence Separation
- **Active Trip State**: Managed in [src/context/TripContext.tsx](../../src/context/TripContext.tsx) under `localStorage` key `naiking_active_trip_v2`. Holds active draft, night count, guests, and day-by-day `PlanState`.
- **Saved Trips State**: Array of confirmed concierge bookings (`TripBooking[]`) under `localStorage` key `naiking_saved_trips_v2`. Displayed in [src/components/MyTripsDrawer.tsx](../../src/components/MyTripsDrawer.tsx).
- **Critical Requirement**: **Saved Packages** must remain strictly separated from **Active Trip** and **Saved Trips**. Saving a package is a wishlist operation and must not mutate the active trip draft or booked trips list.

### 1.4 Backend & API Audit
- **Existing Backend**: Vite dev/preview server middleware in [server/aiSuggest.ts](../../server/aiSuggest.ts) serving `POST /api/ai-suggest` for Gemini-assisted day activities.
- **Enquiry / CRM / Lead Capture**: **No existing endpoint, database table, or CRM integration exists.**
- **Architectural Decision**: Under the mandatory rules:
  - Do NOT invent fake endpoints or simulate successful backend delivery.
  - Implement a typed submission service boundary (`submitPackageEnquiry`).
  - Perform client-side validation.
  - Transparently communicate to the user that backend integration is currently unconfigured.
  - Formally document the proposed backend contract for engineering handover.

---

## 2. Implementation Architecture & Plan

### 2.1 Feature 1: Save for Later (`FEAT-012`)

#### A. Dedicated State Store (`SavedPackagesContext.tsx`)
To keep concerns completely decoupled, create `SavedPackagesContext` with a custom hook `useSavedPackages()`:
- **Storage Key**: `naiking_saved_packages_v1`.
- **Storage Schema**:
  ```typescript
  export interface SavedPackageItem {
    packageId: string;
    savedAt: string; // ISO 8601 timestamp
  }
  ```
- **Defensive Hydration**:
  - Validates parsed JSON array.
  - Resolves `packageId` against canonical `CURATED_PACKAGES`.
  - Filters out corrupt items or stale IDs gracefully without crashing.
  - Prevents duplicate entries.
- **API Methods**:
  - `savePackage(pkgId: string): void`
  - `removePackage(pkgId: string): void`
  - `toggleSavePackage(pkgId: string): void`
  - `isPackageSaved(pkgId: string): boolean`
  - `savedPackages: CuratedPackage[]`
  - `savedCount: number`

#### B. UI Entry Points
1. **Curated Package Cards ([src/components/CuratedPackages.tsx](../../src/components/CuratedPackages.tsx))**:
   - Add a bookmark/heart toggle button on each package card image header.
   - Use `e.stopPropagation()` to avoid triggering card click handlers.
   - Distinct visual state for saved vs unsaved.
2. **Global Navigation Header ([src/components/Header.tsx](../../src/components/Header.tsx))**:
   - Add a "Saved" button with count badge adjacent to "My Trips".
3. **Mobile Bottom Nav ([src/components/MobileBottomNav.tsx](../../src/components/MobileBottomNav.tsx))**:
   - Provide access to Saved Packages.
4. **Saved Packages Drawer ([src/components/SavedPackagesDrawer.tsx](../../src/components/SavedPackagesDrawer.tsx))**:
   - Slide-over drawer matching `MyTripsDrawer` styling.
   - Displays all saved packages with images, duration, category, price, and inclusions.
   - Actions:
     - **Customise Itinerary**: Reuses existing `selectPackage(pkg)` flow to start planning seamlessly.
     - **Enquire**: Opens package-specific enquiry dialog.
     - **Remove**: Removes from wishlist with feedback.
   - Accessible empty state with CTA to explore packages.

---

### 2.2 Feature 2: Package Enquiry & Callback Requests (`FEAT-013`)

#### A. Typed Submission Boundary ([src/services/enquiryService.ts](../../src/services/enquiryService.ts))
Define strict TypeScript interfaces:
```typescript
export type EnquiryCategory =
  | 'general_info'
  | 'callback_request'
  | 'coupons_discounts'
  | 'festive_offers'
  | 'customization'
  | 'dates_availability'
  | 'other';

export interface PackageEnquiry {
  packageId: string;
  packageName: string;
  destinationId: string;
  fullName: string;
  email: string;
  phone: string;
  preferredContactMethod: 'email' | 'phone' | 'either';
  category: EnquiryCategory;
  message?: string;
  submittedAt: string;
}

export interface EnquirySubmissionResult {
  success: boolean;
  status: 'sent' | 'unsupported_backend' | 'validation_error' | 'network_error';
  message: string;
  enquiryId?: string;
}
```

#### B. Package Enquiry Modal ([src/components/PackageEnquiryModal.tsx](../../src/components/PackageEnquiryModal.tsx))
- Clean, accessible modal dialog overlay.
- Clear package context header (name, destination, nights, starting price).
- Input fields:
  - Full Name (required, min 2 chars).
  - Phone Number (required for callback requests, min 10 digits).
  - Email Address (required if email contact chosen, valid RFC 5322 format).
  - Preferred Contact Method (Email, Phone, Either).
  - Enquiry Category dropdown / selector.
  - Message / Questions (optional textarea).
- Interaction states:
  - Client-side validation errors displayed per field.
  - Loading state on submission button with disabled duplicate clicks.
  - Transparent notification banner when backend CRM/API is not yet provisioned.

---

## 3. Proposed Backend Contract Specification

Since no backend currently handles package enquiries, the frontend defines this target specification:

- **Endpoint**: `POST /api/v1/packages/enquiry`
- **Headers**:
  - `Content-Type: application/json`
  - `X-CSRF-Token`: Optional CSRF token
- **Request Body**:
  ```json
  {
    "packageId": "pkg-bali-sanctuary",
    "packageName": "Kamandalu Rainforest & Ocean Sanctuary",
    "destinationId": "bali",
    "fullName": "Aarav Sharma",
    "email": "aarav.sharma@example.com",
    "phone": "+91 98765 43210",
    "preferredContactMethod": "phone",
    "category": "callback_request",
    "message": "Interested in private villa upgrade options for December.",
    "submittedAt": "2026-10-22T20:15:00.000Z"
  }
  ```
- **Responses**:
  - `201 Created`: `{ "success": true, "enquiryId": "ENQ-90214", "message": "Enquiry received. Our concierge team will reach out within 24 hours." }`
  - `400 Bad Request`: `{ "success": false, "errors": { "phone": "Invalid phone format" } }`
  - `429 Too Many Requests`: `{ "success": false, "message": "Rate limit exceeded. Please wait a few minutes." }`
  - `503 Service Unavailable`: `{ "success": false, "message": "Enquiry dispatch temporarily offline." }`

---

## 4. Test Strategy

1. **Automated Unit & Scenario Tests**:
   - Script `scripts/verify-features.ts` executed with `tsx` verifying:
     - Saving, removing, toggle operations.
     - Deduplication of saved packages.
     - Storage parsing and corrupted JSON resilience.
     - Stale package ID filtering.
     - Independence from `naiking_active_trip_v2` and `naiking_saved_trips_v2`.
     - Form validation logic for each enquiry category.
     - Missing-backend handling without fake success.
2. **Type Checking & Build Validation**:
   - `npm run lint` (`tsc --noEmit`).
   - `npm run build` (`vite build`).
3. **Browser E2E Verification**:
   - Save packages, verify persistence across browser refresh, open Saved Packages drawer, resume planning in planner canvas, submit enquiry and verify feedback.

---

## 5. Actual Execution & Verification Results

### 5.1 Static Analysis
- **Command**: `npm run lint`
- **Exit Code**: `0` (Zero compiler errors)

### 5.2 Automated Test Suite
- **Command**: `npm test` (`tsx scripts/verify-features.ts`)
- **Exit Code**: `0`
- **Result**: `43 Passed, 0 Failed`

### 5.3 Production Build
- **Command**: `npm run build`
- **Exit Code**: `0`
- **Output**: Clean bundle output to `dist/` in 448ms (`index.html`, CSS, and JS).

### 5.4 Browser E2E Subagent Execution
- **Recordings**: `saved_enquiry_e2e_*.webp`, `enquiry_modal_e2e_*.webp`
- **Verified Flows**:
  - Bookmarked packages from card headers (`e.stopPropagation()` prevented unwanted clicks).
  - Header badge incremented from 0 to 2.
  - Opened `SavedPackagesDrawer`, removed a package, verified counter decremented to 1.
  - Clicked "Customise" on saved package $\rightarrow$ transitioned into planner canvas with correct destination and duration without modifying active saved trips.
  - Opened `PackageEnquiryModal`, verified field validations (name, category, phone required for callbacks).
  - Submitted consultation callback request $\rightarrow$ confirmed loading spinner and honest amber notification explaining backend CRM dispatch is unconfigured with direct contact to `concierge@naikingtours.com` (no fake success).
  - Reloaded page via F5 $\rightarrow$ verified persistence in `naiking_saved_packages_v1` with saved count 1 restored.
