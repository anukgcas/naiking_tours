# Testing & Quality Assurance Index

This directory maintains the testing strategy, validation run history, and regression checklists for Naikings Tours & Travels.

---

## Testing Documentation

1. [Validation History](validation-history.md)
   - Chronological log of build runs, static analysis checks, and automated browser end-to-end test executions.
2. [Regression Checklist](regression-checklist.md)
   - Mandatory manual and automated verification checklist to run prior to merging code or deploying releases.

---

## Testing Philosophy

- **Independently Verified**: All claims of passing checks must be backed by executed commands and verifiable logs.
- **Zero-Tolerance for Broken Types**: `npm run lint` (`tsc --noEmit`) must exit with code 0 before any PR is approved.
- **Full Journey Testing**: Testing is not limited to checking if the homepage mounts; complete user journeys (Configure $\rightarrow$ Plan $\rightarrow$ Edit $\rightarrow$ Return Home $\rightarrow$ Refresh $\rightarrow$ Resume Saved Trip) must be verified.
