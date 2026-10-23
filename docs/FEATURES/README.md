# Feature Specifications Index

This directory documents the core features of the Naikings Tours & Travels application. Each document details the user journey, architecture, components, data models, validation, and known limitations.

---

## Active Feature Specifications

1. [Homepage Navigation & Header Architecture](homepage-navigation.md) (`FEAT-001`)
   - Adaptive floating glassmorphism header, brand logo, section navigation, and mobile bottom bar.
2. [Holiday Packages & Customiser Console](holiday-customizer.md) (`FEAT-003`)
   - 5-field luxury planning console (Destination, When & Duration, Departure Date, Rooms & Guests, Filters).
3. [Trip State Management & Synchronization](trip-state-management.md) (`FEAT-006` / `FEAT-007`)
   - Central React Context store, persistence, round-trip synchronization, and saved-trip lifecycles.
4. [Save for Later (Package Wishlist)](save-for-later.md) (`FEAT-018`)
   - Package bookmarking, defensive localStorage persistence, dedicated drawer, and planner resumption.
5. [Package Enquiry & Callback Requests](package-enquiry.md) (`FEAT-019`)
   - Package-specific enquiries, 7 enquiry categories, client validation, and honest CRM dispatch handling.

---

## Guidelines for Authoring New Feature Documents

- Use [../templates/FEATURE_TEMPLATE.md](../templates/FEATURE_TEMPLATE.md).
- Keep descriptions grounded in the actual codebase.
- Link directly to the primary source files and related task records.
- Update [../FEATURE_INVENTORY.md](../FEATURE_INVENTORY.md) whenever a feature is added or modified.
