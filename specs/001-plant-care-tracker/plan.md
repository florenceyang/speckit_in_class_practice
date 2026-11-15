# Implementation Plan: Plant Care Tracker

**Branch**: `001-plant-care-tracker` (spec directory; work is on `main`, no git branch created) |
**Date**: 2026-11-14 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/001-plant-care-tracker/spec.md`

**Note**: This template is filled in by the `/speckit-plan` command; its definition describes the execution workflow.

## Summary

PlantApp lets two roommates sharing one device track each plant's last watering and outdoor time,
and shows in-app "Needs water" and "Bring inside" alerts when a plant's watering interval or
maximum time outside has elapsed (FR-001–FR-016). The technical approach is a static,
client-only TypeScript single-page app in `frontend/`, built with Vite, persisting to browser
`localStorage`, with alerts derived by a pure function re-evaluated every 30 seconds. Every
acceptance scenario is automated as a Playwright test named with its FR IDs; alert and validation
rules are unit-tested with Vitest using controlled clocks.

## Technical Context

**Language/Version**: TypeScript 5.x (strict), targeting ES2022 browsers

**Primary Dependencies**: Vite 6.x (dev server/build only); no runtime dependencies, no UI framework

**Storage**: Browser `localStorage`, key `plantapp.v1`, versioned JSON document (research R3)

**Testing**: Vitest (unit, jsdom) + Playwright (Chromium e2e acceptance tests with `page.clock`)

**Target Platform**: Current evergreen browsers (Chrome, Edge, Firefox, Safari) on a shared phone,
tablet, or laptop; served as static files

**Project Type**: Client-only web application (single-page app)

**Performance Goals**: Initial load < 1 s on a local/static host; any action re-renders in
< 100 ms with 50 plants; alert appears ≤ 60 s after due time (SC-003)

**Constraints**: No auth, backend, or network calls at runtime (Principle IV); works offline after
load; all app code under `frontend/` (Principle III); local time-zone display

**Scale/Scope**: 2 users on 1 device, up to ~50 plants, 1 screen, 16 FRs, 18 acceptance scenarios

Unknowns: none remaining. The local Node install was repaired (Node v26.13.1; research R7).

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Gate | Pre-research | Post-design |
|-----------|------|--------------|-------------|
| I. Testable Acceptance Scenarios | Every Given/When/Then has an observable outcome and a planned automated test | ✅ All 18 scenarios have concrete outcomes | ✅ One Playwright test per scenario (R6); UI contract fixes the texts/roles tests assert on; clock control makes time scenarios deterministic |
| II. Requirement Traceability | FR IDs preserved and referenced downstream | ✅ FR-001–FR-016 unchanged from spec | ✅ data-model fields and UI contract rows cite FR IDs; tests named `US<n>-S<m> [FR-…]`; tasks must cite FRs |
| III. Frontend-Only Code Location | All application code in `frontend/` | ✅ | ✅ Structure below places source, tests, and config under `frontend/` only |
| IV. No Auth / Backend / External APIs | No login, server, remote storage, or runtime network calls | ✅ | ✅ Static build, `localStorage` only, no notifications service; quickstart step 9 verifies no network requests |

**Result**: PASS (no violations; Complexity Tracking not needed).

## Project Structure

### Documentation (this feature)

```text
specs/001-plant-care-tracker/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md        # Phase 1 output (/speckit-plan command)
├── quickstart.md        # Phase 1 output (/speckit-plan command)
├── contracts/
│   └── ui-contract.md   # Phase 1 output: UI + storage contract used by tests
├── checklists/
│   └── requirements.md  # From /speckit-specify
└── tasks.md             # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

### Source Code (repository root)

```text
frontend/
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
├── playwright.config.ts
├── src/
│   ├── main.ts               # bootstraps app: load state, render, start 30 s tick
│   ├── domain/
│   │   ├── plant.ts          # Plant type, create/update, validation (FR-001–FR-003, FR-015)
│   │   ├── actions.ts        # markWatered, markOutside, markInside (FR-004, FR-006–FR-008)
│   │   └── alerts.ts         # computeAlerts(plants, now) — pure (FR-009–FR-011, FR-013)
│   ├── storage/
│   │   └── store.ts          # load/save plantapp.v1, storage-event sync (FR-014, FR-016)
│   ├── ui/
│   │   ├── render.ts         # top-level render of summary, form, list
│   │   ├── summary.ts        # attention summary (FR-013)
│   │   ├── plantForm.ts      # add/edit form + validation messages (FR-001–FR-003, FR-015)
│   │   ├── plantRow.ts       # row, badges, action buttons (FR-004–FR-012)
│   │   └── format.ts         # local date-time formatting
│   └── styles.css
└── tests/
    ├── unit/
    │   ├── plant.test.ts     # validation boundaries
    │   ├── alerts.test.ts    # threshold, never-watered, both-alerts, clock-skew cases
    │   └── store.test.ts     # persistence, corrupt data, schema version
    └── e2e/
        ├── fixtures.ts       # seed localStorage, install clock
        ├── us1-plants-watering.spec.ts
        ├── us2-water-alerts.spec.ts
        ├── us3-outside-alerts.spec.ts
        └── us4-summary.spec.ts
```

**Structure Decision**: Single client-only web project rooted at `frontend/` (Principle III).
No `backend/` or `api/` directories exist or will be created (Principle IV). Domain logic
(`src/domain/`) is pure and framework-free so the alert rules can be unit-tested with an injected
`now`; the UI layer only renders state and dispatches actions. E2E specs are split per user story
so each story is independently testable as the spec requires.

## Complexity Tracking

No constitution violations; no entries.
