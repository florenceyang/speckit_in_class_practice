# PlantApp

A client-only web app that helps two roommates sharing one device track when each plant was last
watered and when it was put outside, with in-app "Needs water" and "Bring inside" alerts.

- Spec: [`specs/001-plant-care-tracker/spec.md`](../specs/001-plant-care-tracker/spec.md)
- Plan: [`specs/001-plant-care-tracker/plan.md`](../specs/001-plant-care-tracker/plan.md)
- Validation guide: [`specs/001-plant-care-tracker/quickstart.md`](../specs/001-plant-care-tracker/quickstart.md)

No accounts, backend, or network calls: data is stored in this browser's `localStorage`
(key `plantapp.v1`).

## Requirements

Node.js 20 or newer with npm.

## Setup

```bash
cd frontend
npm install
npx playwright install chromium
```

## Run

```bash
npm run dev        # dev server; open the printed localhost URL
npm run build      # static build in dist/
npm run preview    # serve the static build
```

## Test

```bash
npm run typecheck  # TypeScript
npm test           # Vitest unit tests (validation, alert rules, storage, summary order)
npm run test:e2e   # Playwright tests, one per acceptance scenario: US<story>-S<scenario> [FR-…]
```
