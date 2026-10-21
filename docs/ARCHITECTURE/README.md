# Architecture Whitepapers Index

This directory contains deep-dive architectural documents detailing core systems in Naikings Tours & Travels.

---

## Architecture Whitepapers

1. [Trip Context Architecture](trip-context.md)
   - Detailed analysis of `TripContext.tsx`, custom hook design, reactivity, and domain synchronization.
2. [Single-Page Navigation Flow](navigation-flow.md)
   - View routing without pushState, scroll spy mechanics, and tab synchronization.
3. [Client-Side Persistence Engine](persistence.md)
   - Storage schemas, defensive validation, past-date advancement, and offline guarantees.

---

## Architectural Principles Quick Reference

- **Zero Unnecessary Dependencies**: Built with native React 19 primitives (Context + hooks + reducers).
- **Separation of Concerns**: Temporary UI interaction states are separated from persistent trip preferences.
- **Data Integrity**: In-progress drafts cannot silently overwrite independently saved trips.
