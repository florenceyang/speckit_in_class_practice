# Quickstart & Validation: Plant Care Tracker

**Feature**: [spec.md](./spec.md) | **Plan**: [plan.md](./plan.md)

## Prerequisites

- Node.js 20 LTS or newer, with npm. Check with `node -v`.
  - If Homebrew's node fails with `Library not loaded: libllhttp…dylib`, run
    `brew reinstall llhttp node` (research R7).
- A Chromium-based browser for manual checks; Playwright installs its own for automated tests.

## Setup

```bash
cd frontend
npm install
npx playwright install chromium
```

## Run

```bash
npm run dev        # starts the Vite dev server; open the printed localhost URL
npm run build      # static build in frontend/dist/ (no server runtime needed)
npm run preview    # serve the static build locally
```

## Validate

```bash
npm test           # Vitest unit tests: validation, alert rules, storage
npm run test:e2e   # Playwright acceptance tests: one per spec acceptance scenario
npm run typecheck  # tsc --noEmit
```

**Expected**: all tests pass. The e2e report lists tests named `US<story>-S<scenario> [FR-…]`;
there is one for every acceptance scenario in [spec.md](./spec.md) (US1-S1 … US4-S2, 18 total).

## Manual smoke test (≈3 minutes)

1. Open the app with empty storage → summary reads "All plants are taken care of."
2. Add "Fern", water every 3 days, max outside 4 h → Fern shows "Never watered" and a
   "Needs water" badge; summary shows "Fern — Needs water". *(US1-S1, US2-S3)*
3. Click **Watered** on Fern → badge and summary entry disappear; "Last watered" shows now.
   *(US1-S2, US2-S4)*
4. Click **Put outside** → "Outside since …" appears. *(US3-S1)*
5. Click **Edit**, set "Correct time put outside" to 5 hours ago, **Save** → "Bring inside"
   badge appears within a minute. *(FR-015, US3-S2)*
6. Click **Bring inside** → badge clears, status "Inside". *(US3-S4)*
7. Reload the page → Fern and its last-watered time are unchanged. *(US1-S3)*
8. Submit the add form with an empty name → "Name is required." and nothing added. *(US1-S4)*
9. Confirm in the browser devtools Network panel that no requests are made after initial page
   load (Principle IV).

## Key references

- Entity fields, validation, and alert rules: [data-model.md](./data-model.md)
- Element names, texts, and timing guarantees used by tests: [contracts/ui-contract.md](./contracts/ui-contract.md)
- Technology decisions: [research.md](./research.md)
