# Naikings Tours & Travels — Documentation System

Welcome to the central technical documentation repository for **Naikings Tours & Travels**.

Documentation in this repository is treated as an active part of software engineering: **every development task, architectural evolution, and feature modification must have a corresponding record in this folder**.

---

## 1. Documentation Structure & Map

The documentation is organized into clear directories according to scope and lifecycle:

```text
docs/
├── README.md                      # Entry point and contributor instructions (this file)
├── PROJECT_OVERVIEW.md            # Mission, technology stack, pages, and domain scope
├── ARCHITECTURE.md                # System design, data flow, state architecture, and diagrams
├── FEATURE_INVENTORY.md           # Authoritative catalog of all features and implementation status
├── CHANGELOG.md                   # Chronological version history of user-facing and architecture changes
├── DEVELOPMENT_LOG.md             # Chronological ledger of engineering sessions
├── TASKS/                         # Workstream records for completed and active tasks
│   ├── README.md                  # Task index and status overview
│   ├── 2026-10-22-homepage-navigation.md
│   ├── 2026-10-22-holiday-customizer.md
│   └── 2026-10-22-trip-state-synchronization.md
├── FEATURES/                      # Feature specifications and implementation details
│   ├── README.md                  # Feature index
│   ├── homepage-navigation.md
│   ├── holiday-customizer.md
│   └── trip-state-management.md
├── ARCHITECTURE/                  # Deep-dive architecture whitepapers
│   ├── README.md                  # Architecture index
│   ├── trip-context.md            # Central state store and reactivity pattern
│   ├── navigation-flow.md         # Single-page navigation model and URL-free view states
│   └── persistence.md             # Client-side storage schema, validation, and guarantees
├── TESTING/                       # Quality assurance, test reports, and checklists
│   ├── README.md                  # Testing overview
│   ├── validation-history.md      # Record of build, lint, and browser E2E test runs
│   └── regression-checklist.md    # Pre-merge verification checklist
└── templates/                     # Standard templates for future documentation
    ├── TASK_TEMPLATE.md
    ├── FEATURE_TEMPLATE.md
    └── BUGFIX_TEMPLATE.md
```

---

## 2. Quick Navigation Links

- **New to the project?** Start with [Project Overview](PROJECT_OVERVIEW.md).
- **Understanding system design?** Read [Architecture](ARCHITECTURE.md) and [Trip Context Architecture](ARCHITECTURE/trip-context.md).
- **Looking up existing features?** Consult the [Feature Inventory](FEATURE_INVENTORY.md).
- **Checking recent changes?** Review [Changelog](CHANGELOG.md) and [Development Log](DEVELOPMENT_LOG.md).
- **Recent work completed**:
  - [Homepage Navigation Consolidation](TASKS/2026-10-22-homepage-navigation.md)
  - [Holiday Customizer 5-Field Console](TASKS/2026-10-22-holiday-customizer.md)
  - [Unified Trip State & Synchronization](TASKS/2026-10-22-trip-state-synchronization.md)
- **Pre-deployment testing?** Follow the [Regression Checklist](TESTING/regression-checklist.md).

---

## 3. Mandatory Documentation Rules for Future Tasks

To ensure documentation never drifts from the actual source code, the following process is **mandatory** for every commit and pull request:

1. **Before coding**: Review existing documentation in `docs/` to understand established patterns, data structures, and component responsibilities.
2. **During implementation**:
   - Create a task record in `docs/TASKS/YYYY-MM-DD-[task-name].md` using [TASK_TEMPLATE.md](templates/TASK_TEMPLATE.md).
   - If a new feature is introduced or heavily modified, create/update the document in `docs/FEATURES/` using [FEATURE_TEMPLATE.md](templates/FEATURE_TEMPLATE.md).
   - If application architecture, state models, or persistence change, update [ARCHITECTURE.md](ARCHITECTURE.md) and relevant files in `docs/ARCHITECTURE/`.
3. **Verification**:
   - Run typecheck (`npm run lint` / `tsc --noEmit`).
   - Run production bundle build (`npm run build`).
   - Run interactive tests and record results in [Validation History](TESTING/validation-history.md).
4. **Closing the task**:
   - Update [CHANGELOG.md](CHANGELOG.md) with concise bullet points.
   - Update [DEVELOPMENT_LOG.md](DEVELOPMENT_LOG.md) with the session details.
   - Update [FEATURE_INVENTORY.md](FEATURE_INVENTORY.md) status.
   - Mark task acceptance criteria as verified in the task file.

---

## 4. Documentation Quality Standards

- **Honesty First**: Distinguish verified code behavior from planned or intended behavior. Never claim an API exists or that a test passed unless verified in the actual environment.
- **Source Paths**: Always provide exact, relative file links (`[src/App.tsx](../src/App.tsx)`).
- **No Sensitive Data**: Never commit secrets, tokens, customer phone numbers, or private keys.
- **Concise & Scannable**: Use tables, markdown alerts (`> [!NOTE]`), and Mermaid diagrams to make technical documents easy to digest.
