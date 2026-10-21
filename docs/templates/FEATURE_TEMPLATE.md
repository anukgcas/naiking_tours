# Feature: [Feature Name]

- **Feature ID**: [e.g. `FEAT-001`]
- **Category**: [Navigation | Trip Planning | Itinerary Editor | Persistence | Overview & Booking]
- **Status**: [Active | In Development | Deprecated]
- **Primary Entry Point**: [e.g. Homepage Customizer, Navbar, Drawer, etc.]
- **Primary Source Files**:
  - `src/...`
  - `src/...`

---

## 1. Purpose and Value Proposition

Describe what this feature accomplishes from a traveller's and a business perspective.

---

## 2. User Journey & Interaction Flow

Step-by-step description of how a traveller interacts with this feature:
1. Entry: ...
2. Action: ...
3. Progression: ...
4. Feedback & Outcome: ...

---

## 3. Architecture & Key Components

Describe the components that comprise this feature and their architectural boundaries.

| Component | File Path | Role |
| :--- | :--- | :--- |
| `[ComponentName]` | `src/...` | ... |

---

## 4. State Management & Data Models

- **Data Models**: Domain types used (e.g. `TripDraft`, `PlanState`).
- **State Store**: How the feature reads and writes state (e.g. `useTrip()`).
- **Persistence**: How data survives remounts and refreshes.

---

## 5. Dependencies and Integrations

- Internal dependencies (data modules, utility functions, hooks).
- External integrations (APIs, third-party libraries, storage).

---

## 6. Validation and Quality History

Summary of checks, test scenarios, and regression expectations for this feature.

---

## 7. Known Limitations and Edge Cases

Document any incomplete paths, performance caveats, or device-specific considerations.

---

## 8. Related Tasks and Documentation

- Related Task Record: [Task Title](../TASKS/YYYY-MM-DD-[task-name].md)
- [Architecture Overview](../ARCHITECTURE.md)
- [Feature Inventory](../FEATURE_INVENTORY.md)
