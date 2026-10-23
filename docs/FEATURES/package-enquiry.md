# Feature: Package Enquiry & Callback Requests

- **Feature ID**: `FEAT-019`
- **Category**: Lead Capture & Concierge Inquiries
- **Status**: Active ✅
- **Primary Files**:
  - `src/components/PackageEnquiryModal.tsx`
  - `src/services/enquiryService.ts`
  - `src/components/CuratedPackages.tsx`
  - `src/components/SavedPackagesDrawer.tsx`
  - `src/types.ts`

---

## 1. Overview & Purpose

The **Package Enquiry and Callback Requests** feature allows users to contact the Naikings Tours & Travels concierge team regarding a specific package. Users can ask questions about inclusions, check coupon and discount eligibility, enquire about festive/seasonal offers, request bespoke package customization, check departure dates, or request a phone consultation callback—all without completing a booking or generating an itinerary.

---

## 2. Key Capabilities

1. **Context-Aware Package Association**:
   - Opened directly from any curated package card (in `CuratedPackages.tsx` or `SavedPackagesDrawer.tsx`).
   - Prefills and anchors the enquiry with the target `packageId`, `packageName`, destination, and starting price.
2. **7 Structured Enquiry Categories**:
   - `general_info`: General package information (inclusions, hotels, transfer logistics).
   - `callback_request`: Request a callback / consultation with a destination concierge.
   - `coupons_discounts`: Coupons & discount inquiries.
   - `festive_offers`: Festive & seasonal holiday departures.
   - `customization`: Bespoke routing, extra nights, villa upgrades.
   - `dates_availability`: Specific slot availability.
   - `other`: Additional questions and custom accommodations.
3. **Client-Side Form Validation**:
   - Full name required ($\ge 2$ characters).
   - Category required.
   - At least one valid contact method (email or phone) required.
   - Callback requests strictly enforce a valid phone number ($\ge 10$ digits).
   - Valid email formatting enforced (RFC 5322 regex).
4. **Honest Backend Submission Boundary (`enquiryService.ts`)**:
   - Reusable typed API boundary (`submitPackageEnquiry`).
   - If a live backend is configured via `VITE_ENQUIRY_API_ENDPOINT`, dispatches an HTTP POST request.
   - If no backend endpoint exists in the current environment, returns status `unsupported_backend` and renders an honest notification detailing that backend CRM dispatch is pending, pointing users to `concierge@naikingtours.com`.
   - **No fake success states are ever simulated.**
5. **Double-Click Prevention & Loading States**:
   - Button reflects `isSubmitting` with spinner and disabled states.
6. **Privacy & Security**:
   - User PII is never stored in `localStorage`.
   - User input is sanitized and rendered safely.

---

## 3. Data Models

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

---

## 4. Proposed Backend Contract Specification

- **Target Endpoint**: `POST /api/v1/packages/enquiry`
- **Headers**:
  ```http
  Content-Type: application/json
  ```
- **Request Body**:
  ```json
  {
    "packageId": "pkg-bali-sanctuary",
    "packageName": "Kamandalu Rainforest & Ocean Sanctuary",
    "destinationId": "bali",
    "fullName": "Kavya Sharma",
    "email": "kavya@example.com",
    "phone": "9876543210",
    "preferredContactMethod": "phone",
    "category": "callback_request",
    "message": "Interested in December snowfall availability and room customization.",
    "submittedAt": "2026-10-22T20:25:00.000Z"
  }
  ```
- **Expected Responses**:
  - `201 Created`:
    ```json
    {
      "success": true,
      "enquiryId": "ENQ-78219",
      "message": "Enquiry received. A concierge will reach out within 24 hours."
    }
    ```
  - `400 Bad Request`: Validation failure details.
  - `429 Too Many Requests`: Rate limit protection.
