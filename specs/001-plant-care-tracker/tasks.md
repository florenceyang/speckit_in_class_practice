---

description: "Task list for Plant Care Tracker (PlantApp) implementation"
---

# Tasks: Plant Care Tracker

**Input**: Design documents from `/specs/001-plant-care-tracker/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/ui-contract.md, quickstart.md

**Tests**: INCLUDED. Constitution Principle I requires every acceptance scenario to be covered by at
least one test task. Each e2e test MUST be named `US<story>-S<scenario> [FR-…]` exactly as listed
below (Principle II). Write tests first and confirm they fail before implementing.

**Organization**: Tasks are grouped by user story so each story can be implemented and tested
independently. Every task cites the requirement IDs it serves.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: Which user story this task belongs to (US1–US4)
- All paths are relative to the repository root; all application code lives in `frontend/`
  (Principle III). No task may add authentication, a backend, or network calls (Principle IV).

## Shared references

- Validation rules and messages: `specs/001-plant-care-tracker/data-model.md` → "Validation messages"
- Element roles, labels, texts: `specs/001-plant-care-tracker/contracts/ui-contract.md`
- Storage key/document: `localStorage["plantapp.v1"]` = `{ "schemaVersion": 1, "plants": Plant[] }`
- Time constants: `DAY_MS = 86_400_000`, `HOUR_MS = 3_600_000`; all timestamps are epoch ms

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and tooling in `frontend/`

- [ ] T001 Create `frontend/package.json` (name `plantapp`, `"type": "module"`, `"private": true`) with devDependencies `typescript@^5`, `vite@^6`, `vitest`, `jsdom`, `@playwright/test`, and scripts: `dev` = `vite`, `build` = `tsc --noEmit && vite build`, `preview` = `vite preview`, `test` = `vitest run`, `test:e2e` = `playwright test`, `typecheck` = `tsc --noEmit`; then run `npm install` in `frontend/`
- [ ] T002 [P] Create `frontend/tsconfig.json` with `"strict": true`, `"target": "ES2022"`, `"module": "ESNext"`, `"moduleResolution": "Bundler"`, `"lib": ["ES2022", "DOM", "DOM.Iterable"]`, `"noEmit": true`, `"types": ["vitest/globals"]`, including `src` and `tests`
- [ ] T003 [P] Create `frontend/vite.config.ts` exporting a Vite config with Vitest settings `test: { environment: "jsdom", globals: true, include: ["tests/unit/**/*.test.ts"] }`
- [ ] T004 [P] Create `frontend/playwright.config.ts`: `testDir: "tests/e2e"`, single `chromium` project, `use.baseURL: "http://localhost:4173"`, `webServer: { command: "npm run build && npm run preview -- --port 4173 --strictPort", url: "http://localhost:4173", reuseExistingServer: true }`; then run `npx playwright install chromium`
- [ ] T005 [P] Create `frontend/index.html` with `<html lang="en">`, viewport meta, `<title>PlantApp</title>`, `<main id="app"></main>`, and `<script type="module" src="/src/main.ts"></script>`
- [ ] T006 [P] Create `frontend/.gitignore` ignoring `node_modules/`, `dist/`, `test-results/`, `playwright-report/`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Plant type, validation, storage, formatting, render shell, and test fixtures needed by every story

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T007 [P] Write unit tests in `frontend/tests/unit/plant.test.ts` for `validatePlantInput` covering boundaries: name `""`/whitespace-only → "Name is required."; 50 chars OK, 51 chars → "Name must be 50 characters or fewer."; `wateringIntervalDays` 0, 366, 2.5, NaN → "Watering interval must be a whole number from 1 to 365 days." and 1, 365 OK; `maxHoursOutside` 0, 73, 1.5 → "Max time outside must be a whole number from 1 to 72 hours." and 1, 72 OK; `validatePastTime(t, now)` with `t > now` → "Time can't be in the future." (FR-001, FR-002, FR-015)
- [ ] T008 [P] Write unit tests in `frontend/tests/unit/store.test.ts` (jsdom `localStorage`): missing key → `{ plants: [] , canSave: true }`; save then load round-trips plants; unparseable JSON → empty in-memory plants, `canSave: false`, and the raw stored value is NOT overwritten by later saves; unknown `schemaVersion` → same as unparseable; a plant failing validation is skipped while valid plants load; when `localStorage.setItem` throws → `canSave: false` (FR-014)
- [ ] T009 Implement `frontend/src/domain/plant.ts`: export `type Location = "inside" | "outside"`; `interface Plant { id: string; name: string; wateringIntervalDays: number; maxHoursOutside: number; lastWateredAt: number | null; location: Location; putOutsideAt: number | null; createdAt: number }`; constants `DAY_MS`, `HOUR_MS`, `DEFAULT_WATERING_DAYS = 3`, `DEFAULT_MAX_HOURS_OUTSIDE = 4`; `validatePlantInput({name, wateringIntervalDays, maxHoursOutside})` returning a field→message map using the exact messages from data-model.md (name "Trimmed length 1–50 characters; duplicates allowed", interval "Whole number 1–365", max outside "Whole number 1–72; default 4"); `validatePastTime(t, now)`; `createPlant(input, now)` that trims the name, sets `id = crypto.randomUUID()`, `lastWateredAt: null`, `location: "inside"`, `putOutsideAt: null`, `createdAt: now`; `isValidStoredPlant(x)` enforcing "`putOutsideAt` non-null **iff** `location = "outside"`". Make T007 pass (FR-001, FR-002, FR-015)
- [ ] T010 Implement `frontend/src/storage/store.ts`: `STORAGE_KEY = "plantapp.v1"`, `SCHEMA_VERSION = 1`; `loadPlants(): { plants: Plant[]; canSave: boolean }`; `savePlants(plants)` writing `{ schemaVersion: 1, plants }` synchronously and skipping writes when `canSave` is false; `subscribeToExternalChanges(onChange)` listening to the window `storage` event for `STORAGE_KEY`. Make T008 pass (FR-014, FR-016; research R3)
- [ ] T011 [P] Implement `frontend/src/ui/format.ts`: `formatDateTime(ms)` using `Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" })` (device locale, minute precision); `toDateTimeLocalValue(ms)` and `fromDateTimeLocalValue(str)` for `<input type="datetime-local">` (research R5)
- [ ] T012 Implement app shell in `frontend/src/main.ts` and `frontend/src/ui/render.ts`: hold `state = { plants, canSave }` from `loadPlants()`; `dispatch(updater)` applies a state change, calls `savePlants`, then re-renders; `render(root, state, now)` outputs `<h1>PlantApp</h1>`, the storage warning `role="alert"` "Changes can't be saved on this device." only when `canSave` is false, and an empty `<ul aria-label="Plants">`; `getNow()` returns `Date.now()` (single clock source for tests) (FR-014; ui-contract "Screen layout")
- [ ] T013 [P] Create `frontend/src/styles.css` with mobile-first single-column layout, readable button sizes (min 44px tap target), and badge styles that pair text with color; import it from `frontend/src/main.ts` (research R8)
- [ ] T014 [P] Create e2e helpers in `frontend/tests/e2e/fixtures.ts`: `seedPlants(page, plants)` that uses `page.addInitScript` to write `{ schemaVersion: 1, plants }` to `localStorage["plantapp.v1"]` before load; `makePlant(overrides)` with defaults (`wateringIntervalDays: 3`, `maxHoursOutside: 4`, `location: "inside"`, nulls); `installClock(page, isoTime)` wrapping `page.clock.install({ time })`; constants `DAY_MS`, `HOUR_MS`, `MINUTE_MS`; `plantRow(page, name)` locator for `li[data-testid^="plant-"]` filtered by heading text

**Checkpoint**: Foundation ready. `npm test` passes; the app loads showing "PlantApp" and an empty list.

---

## Phase 3: User Story 1 - Add plants and log watering (Priority: P1) 🎯 MVP

**Goal**: Roommates add plants, mark them watered, edit/delete them, and see last-watered times that persist on the shared device.

**Independent Test**: Add a plant, mark it watered, reload, and confirm the last-watered time is unchanged.

### Tests for User Story 1 ⚠️ (write first, confirm they fail)

- [ ] T015 [P] [US1] Write e2e tests in `frontend/tests/e2e/us1-plants-watering.spec.ts`, one per scenario:
  - `US1-S1 [FR-001, FR-002, FR-005] adds a plant that shows Never watered`: empty storage; fill "Name" = "Fern", "Water every (days)" = 3; click "Add plant"; expect row "Fern" containing "Never watered"
  - `US1-S2 [FR-004, FR-005] marking watered records current time`: install clock at a fixed time; seed Fern never watered; click "Watered" in Fern's row; expect "Last watered: <formatted fixed time>"
  - `US1-S3 [FR-014] last-watered time survives reload`: mark Fern watered; `page.reload()`; expect the same "Last watered" text
  - `US1-S4 [FR-002] rejects invalid plant input`: submit with empty name → "Name is required." visible, field has `aria-invalid="true"`, list unchanged; submit name "Fern" with interval 0 → "Watering interval must be a whole number from 1 to 365 days." and list unchanged
  - `US1-S5 [FR-016] change is visible to the other roommate on the same device`: open two pages in the same browser context; mark Fern watered on page A; expect page B to show the updated "Last watered" without manual reload (storage event)
  - `US1-S6 [FR-003] edits interval and deletes a plant`: click "Edit" on Fern, set "Water every (days)" = 5, "Save" → row shows "Every 5 days"; click "Delete", accept dialog "Delete Fern?" → Fern no longer in list
- [ ] T016 [P] [US1] Add unit tests in `frontend/tests/unit/actions.test.ts` for `markWatered(plant, now)` (sets `lastWateredAt = now`, leaves `location`/`putOutsideAt` unchanged), `updatePlant` (re-validates via `validatePlantInput`; correcting `lastWateredAt` to a future time is rejected with "Time can't be in the future."), and `deletePlant` (FR-003, FR-004, FR-015)

### Implementation for User Story 1

- [ ] T017 [US1] Implement in `frontend/src/domain/actions.ts`: `addPlant(plants, input, now)`, `markWatered(plants, id, now)`, `updatePlant(plants, id, changes, now)` (name, wateringIntervalDays, maxHoursOutside, optional corrected `lastWateredAt` which must satisfy `validatePastTime`), `deletePlant(plants, id)`; all pure, returning `{ plants } | { errors }`. Make T016 pass (FR-001–FR-004, FR-015)
- [ ] T018 [US1] Implement `frontend/src/ui/plantForm.ts`: `<form aria-label="Add plant">` with labeled inputs "Name" (text), "Water every (days)" (number, step 1, default 3), "Max time outside (hours)" (number, step 1, default 4) and submit "Add plant"; on submit call `addPlant`; on errors show each message next to its field, set `aria-invalid="true"`, focus the first invalid field, and save nothing; on success reset the form (FR-001, FR-002)
- [ ] T019 [US1] Implement `frontend/src/ui/plantRow.ts`: `<li data-testid="plant-<id>">` with the plant name as a heading, "Every N days" text, "Last watered: `<formatDateTime>`" or "Never watered", and a "Watered" button calling `markWatered` with `getNow()` (FR-004, FR-005)
- [ ] T020 [US1] Add edit and delete to `frontend/src/ui/plantRow.ts`: "Edit" opens an inline form reusing the plantForm fields plus "Correct last watered" (`datetime-local`), with "Save"/"Cancel"; "Delete" calls `window.confirm("Delete <name>?")` and on confirm calls `deletePlant` (FR-003, FR-015)
- [ ] T021 [US1] Wire into `frontend/src/ui/render.ts` and `frontend/src/main.ts`: render the add form and one row per plant ordered by `createdAt`; call `subscribeToExternalChanges` to reload state from storage and re-render when another tab on the same device changes it. Make T015 pass (FR-005, FR-014, FR-016)

**Checkpoint**: US1 e2e and unit tests pass; MVP usable for tracking watering.

---

## Phase 4: User Story 2 - Get alerted when a plant needs water (Priority: P1)

**Goal**: "Needs water" badge appears when the interval has elapsed or the plant was never watered, clears on watering, and appears within 1 minute without reload.

**Independent Test**: Seed a plant with a 1-day interval watered >1 day ago; confirm "Needs water" shows only for it; click "Watered" and confirm it clears.

### Tests for User Story 2 ⚠️ (write first, confirm they fail)

- [ ] T022 [P] [US2] Write unit tests in `frontend/tests/unit/alerts.test.ts` for `computeAlerts(plants, now)` needs-water rules: never watered → alert with `dueAt: null`; elapsed = `3 × DAY_MS − 1` → none; elapsed = exactly `3 × DAY_MS` → alert (rule is "≥"); `lastWateredAt` in the future (clock moved back) → no alert, no throw (FR-009; data-model "Alert" rules)
- [ ] T023 [P] [US2] Write e2e tests in `frontend/tests/e2e/us2-water-alerts.spec.ts`:
  - `US2-S1 [FR-009, FR-012] shows Needs water after interval passes`: clock at T; seed Fern (3 days) watered at `T − 3 days − 1 minute`; expect "Needs water" in Fern's row
  - `US2-S2 [FR-009] no alert before interval passes`: seed Fern watered at `T − 2 days`; expect no "Needs water" in Fern's row
  - `US2-S3 [FR-009] never-watered plant needs water`: seed Fern with `lastWateredAt: null`; expect "Needs water"
  - `US2-S4 [FR-010] watering clears the alert immediately`: from S1 state click "Watered"; expect "Needs water" gone without waiting
  - `US2-S5 [FR-012] alert appears within 1 minute without reload`: seed Fern watered at `T − 3 days + 30 seconds`; expect no alert; `page.clock.runFor(60_000)`; expect "Needs water" visible with no reload

### Implementation for User Story 2

- [ ] T024 [US2] Implement `frontend/src/domain/alerts.ts`: `type AlertType = "needs-water" | "bring-inside"`; `interface Alert { plantId: string; type: AlertType; dueAt: number | null }`; `computeAlerts(plants, now)` emitting `needs-water` iff `lastWateredAt === null` or `max(0, now − lastWateredAt) ≥ wateringIntervalDays × DAY_MS`, with `dueAt = lastWateredAt + wateringIntervalDays × DAY_MS` (or `null`). Leave a clearly marked spot for `bring-inside` (added in T031). Make T022 pass (FR-009)
- [ ] T025 [US2] In `frontend/src/ui/plantRow.ts`, render a text badge "Needs water" (class `badge badge--water`) when the plant has a `needs-water` alert; `render.ts` computes alerts once per render via `computeAlerts(state.plants, getNow())` and passes them to rows (FR-009, FR-010)
- [ ] T026 [US2] In `frontend/src/main.ts`, re-render every 30 seconds via `setInterval(rerender, 30_000)` and on `document` `visibilitychange` when `document.visibilityState === "visible"`; make no `Notification` or network calls. Make T023 pass (FR-012; research R4)

**Checkpoint**: US1 + US2 tests pass; watering alerts work end-to-end.

---

## Phase 5: User Story 3 - Track plants put outside and get alerted to bring them in (Priority: P2)

**Goal**: Mark plants outside/inside, show "Outside since …", and show "Bring inside" once the plant's max time outside has elapsed.

**Independent Test**: Put a plant outside, advance past its max time outside, confirm "Bring inside" appears, bring it in, confirm the alert clears.

### Tests for User Story 3 ⚠️ (write first, confirm they fail)

- [ ] T027 [P] [US3] Extend `frontend/tests/unit/alerts.test.ts` with bring-inside rules: inside plant → none; outside with elapsed `4 × HOUR_MS − 1` → none; exactly `4 × HOUR_MS` → alert; plant both overdue for water and outside past limit → both alerts (FR-011; Edge Cases)
- [ ] T028 [P] [US3] Extend `frontend/tests/unit/actions.test.ts` for `markOutside(plants, id, now)` (sets `location: "outside"`, `putOutsideAt: now`, leaves `lastWateredAt`), `markInside` (sets `location: "inside"`, `putOutsideAt: null`), and correcting `putOutsideAt` to a future time → "Time can't be in the future." (FR-006, FR-008, FR-015)
- [ ] T029 [P] [US3] Write e2e tests in `frontend/tests/e2e/us3-outside-alerts.spec.ts`:
  - `US3-S1 [FR-006, FR-007] putting a plant outside records the time`: clock at T; seed Basil inside; click "Put outside"; expect "Outside since <formatted T>"
  - `US3-S2 [FR-011, FR-012] shows Bring inside after max time outside`: seed Basil outside, `maxHoursOutside: 4`, `putOutsideAt: T − 4 h − 1 min`; expect "Bring inside" badge
  - `US3-S3 [FR-011] no alert before max time outside`: `putOutsideAt: T − 3 h`; expect no "Bring inside" badge
  - `US3-S4 [FR-008] bringing inside clears the alert`: from S2 state click the "Bring inside" button; expect badge gone and row text "Inside"
  - `US3-S5 [FR-011] inside plant never shows Bring inside`: seed Basil inside; expect no "Bring inside" badge
  - Also: `US3-edge [FR-007] Put outside again requires confirmation`: seed Basil outside at `T − 1 h`; click "Put outside again", dismiss the dialog → time unchanged; click again and accept → "Outside since <formatted T>"

### Implementation for User Story 3

- [ ] T030 [US3] Add to `frontend/src/domain/actions.ts`: `markOutside(plants, id, now)`, `markInside(plants, id)`, and support for a corrected `putOutsideAt` in `updatePlant` (only when `location === "outside"`, must satisfy `validatePastTime`); preserve the invariant "`putOutsideAt` non-null **iff** `location = "outside"`". Make T028 pass (FR-006, FR-008, FR-015)
- [ ] T031 [US3] Extend `computeAlerts` in `frontend/src/domain/alerts.ts` to emit `bring-inside` iff `location === "outside"` and `max(0, now − putOutsideAt) ≥ maxHoursOutside × HOUR_MS`, with `dueAt = putOutsideAt + maxHoursOutside × HOUR_MS`. Make T027 pass (FR-011)
- [ ] T032 [US3] Update `frontend/src/ui/plantRow.ts`: location text "Inside" or "Outside since `<formatDateTime(putOutsideAt)>`"; when inside show button "Put outside"; when outside show buttons "Bring inside" and "Put outside again" (the latter calls `window.confirm("Reset the time <name> was put outside?")` before `markOutside`); show "Bring inside" text badge (class `badge badge--inside`) when the alert is active; in the edit form add "Correct time put outside" (`datetime-local`) shown only when outside. Make T029 pass (FR-006–FR-008, FR-011, FR-015)

**Checkpoint**: US1–US3 tests pass; both source alert requirements are met.

---

## Phase 6: User Story 4 - See everything that needs attention at a glance (Priority: P3)

**Goal**: A summary at the top lists every active alert, or says all plants are taken care of.

**Independent Test**: Seed 5 plants (2 need water, 1 must come inside, 2 fine); confirm the summary lists exactly those 3 alerts.

### Tests for User Story 4 ⚠️ (write first, confirm they fail)

- [ ] T033 [P] [US4] Write unit tests in `frontend/tests/unit/summary.test.ts` for `orderAlerts(alerts, plants)`: `bring-inside` before `needs-water`, then `dueAt` ascending with `null` (never watered) first, then plant name (FR-013; data-model "Summary ordering")
- [ ] T034 [P] [US4] Write e2e tests in `frontend/tests/e2e/us4-summary.spec.ts`:
  - `US4-S1 [FR-013] summary lists exactly the plants needing attention`: seed 5 plants (Fern and Ivy overdue for water, Basil outside past 4 h, Cactus and Mint fine); expect region "Needs attention" to contain "3 alerts", "Basil — Bring inside", "Fern — Needs water", "Ivy — Needs water", and not contain "Cactus" or "Mint"
  - `US4-S2 [FR-013] summary says all plants are taken care of`: seed only fine plants; expect "All plants are taken care of."

### Implementation for User Story 4

- [ ] T035 [US4] Implement `frontend/src/ui/summary.ts`: export `orderAlerts`; render `<section aria-label="Needs attention" aria-live="polite">` with "`N` alert(s)" (singular "1 alert") and one list item per alert formatted "`<name>` — Needs water" / "`<name>` — Bring inside", or "All plants are taken care of." when there are none. Make T033 pass (FR-013)
- [ ] T036 [US4] Render the summary above the add form in `frontend/src/ui/render.ts` using the same `computeAlerts` result as the rows. Make T034 pass (FR-013)

**Checkpoint**: All four user stories pass independently.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Constitution compliance checks and final validation

- [ ] T037 [P] Add e2e test `frontend/tests/e2e/constraints.spec.ts`: `CONST [Principle IV] makes no network requests after load` — record `page.on("request")` after initial load, perform add/water/outside/inside actions, expect zero requests; and `EDGE [FR-014] shows storage warning on corrupt data` — seed `localStorage["plantapp.v1"] = "not json"`, expect `role="alert"` "Changes can't be saved on this device." and the raw value unchanged after an action
- [ ] T038 [P] Add e2e test in `frontend/tests/e2e/us1-plants-watering.spec.ts`: `EDGE [FR-015] rejects a future last-watered correction` — Edit Fern, set "Correct last watered" to tomorrow, Save → "Time can't be in the future." and the stored time unchanged
- [ ] T039 [P] Add `frontend/README.md` with the setup, run, and test commands from `specs/001-plant-care-tracker/quickstart.md` and a link back to the spec
- [ ] T040 Traceability check: confirm every FR-001–FR-016 appears in at least one test name under `frontend/tests/` (e.g. `grep -rhoE "FR-0[0-9]{2}" frontend/tests | sort -u`) and that all 18 `US<n>-S<m>` scenario tests exist; add any missing test (Principle II)
- [ ] T041 Run `npm run typecheck`, `npm test`, and `npm run test:e2e` in `frontend/`; then perform the manual smoke test in `specs/001-plant-care-tracker/quickstart.md`; all must pass
- [ ] T042 Verify `git status` shows no application files outside `frontend/` (Principle III)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies. T001 first; T002–T006 in parallel after it.
- **Foundational (Phase 2)**: Depends on Setup. BLOCKS all user stories.
  - T007 → T009; T008 → T010 (tests before code); T009 → T010 → T012; T011, T013, T014 parallel.
- **US1 (Phase 3)**: Depends on Foundational only.
- **US2 (Phase 4)**: Depends on Foundational and on US1's `plantRow.ts`/`actions.ts` (T017, T019) for the "Watered" button that clears alerts. Its tests seed state directly, so they can be written in parallel with US1.
- **US3 (Phase 5)**: Depends on Foundational, `plantRow.ts` (T019), and `alerts.ts` (T024).
- **US4 (Phase 6)**: Depends on `alerts.ts` (T024; T031 for bring-inside items).
- **Polish (Phase 7)**: After all stories.

### User Story Dependencies

```text
Setup → Foundational ─┬─▶ US1 (P1) ─┬─▶ US2 (P1) ─┬─▶ US3 (P2) ─┐
                      │             │             └─▶ US4 (P3) ─┴─▶ Polish
                      └─ (test files for every story can be written as soon as T014 exists)
```

### Within Each User Story

- Tests are written first and must fail before implementation.
- Domain (`src/domain/`) before UI (`src/ui/`); UI before wiring in `render.ts`/`main.ts`.
- Tasks touching the same file (`plantRow.ts`, `actions.ts`, `alerts.ts`, `render.ts`) are sequential.

### Parallel Opportunities

- Setup: T002, T003, T004, T005, T006
- Foundational: T007 ∥ T008 ∥ T011 ∥ T013 ∥ T014
- US1: T015 ∥ T016
- US2: T022 ∥ T023
- US3: T027 ∥ T028 ∥ T029
- US4: T033 ∥ T034
- Polish: T037 ∥ T038 ∥ T039

---

## Parallel Example: User Story 1

```bash
# Write the US1 tests together (different files):
Task: "Write e2e tests in frontend/tests/e2e/us1-plants-watering.spec.ts (US1-S1 … US1-S6)"
Task: "Add unit tests in frontend/tests/unit/actions.test.ts for markWatered/updatePlant/deletePlant"
```

## Parallel Example: User Story 3

```bash
Task: "Extend frontend/tests/unit/alerts.test.ts with bring-inside rules"
Task: "Extend frontend/tests/unit/actions.test.ts for markOutside/markInside"
Task: "Write e2e tests in frontend/tests/e2e/us3-outside-alerts.spec.ts (US3-S1 … US3-S5)"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: run `npm test` and `npx playwright test us1` in `frontend/`
5. Demo: roommates can add plants and log watering on the shared device

### Incremental Delivery

1. Setup + Foundational → foundation ready
2. US1 → watering tracked (source requirement 1) → MVP
3. US2 → watering alerts (source requirement 3)
4. US3 → outdoor tracking and bring-inside alerts (source requirements 2 and 4)
5. US4 → attention summary
6. Polish → constitution and traceability checks

---

## Notes

- [P] tasks = different files, no dependencies on incomplete tasks
- [Story] labels and FR IDs in every task and test name provide traceability (Principle II)
- 18 acceptance-scenario tests: US1-S1…S6 (T015), US2-S1…S5 (T023), US3-S1…S5 (T029), US4-S1…S2 (T034)
- Commit after each task or logical group; stop at any checkpoint to validate a story independently
