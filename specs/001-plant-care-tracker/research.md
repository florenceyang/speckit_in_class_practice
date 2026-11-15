# Research: Plant Care Tracker

**Feature**: [spec.md](./spec.md) | **Plan**: [plan.md](./plan.md) | **Date**: 2026-11-14

All Technical Context unknowns are resolved below. Every decision is constrained by the
constitution: tests for every acceptance scenario (I), requirement IDs carried through (II), code
only in `frontend/` (III), and no auth/backend/external APIs (IV).

## R1. Language and build tooling

- **Decision**: TypeScript 5.x, bundled and served by Vite 6.x as a static single-page app.
- **Rationale**: Type checking catches date/interval arithmetic mistakes, which drive every alert
  rule. Vite gives a zero-config dev server and a static `dist/` build that needs no server
  runtime (Principle IV).
- **Alternatives considered**: Plain JavaScript with no build (fewer tools, but no type safety and
  awkward test setup); Next.js / server-rendered frameworks (rejected: introduce a server
  runtime).

## R2. UI approach

- **Decision**: No UI framework. Render with small TypeScript view functions over the DOM,
  re-rendering the plant list from state after each action or clock tick.
- **Rationale**: One screen, ~50 plants, a handful of forms. A framework adds dependencies and
  concepts without benefit at this size; full re-render of ≤50 rows is well under a frame.
- **Alternatives considered**: React (familiar, but extra runtime and JSX tooling for a single
  view); Lit/web components (unnecessary encapsulation for one page).

## R3. Persistence on a shared device (FR-014, FR-016)

- **Decision**: Browser `localStorage`, one JSON document under key `plantapp.v1`, with a
  `schemaVersion` field. Writes happen synchronously after every user action. Listen to the
  `storage` event so a second open tab on the same device refreshes.
- **Rationale**: Satisfies "persists across restarts on the same device" with no backend.
  Data size (≤50 plants, < 20 KB) is far below the ~5 MB quota. Synchronous writes mean a roommate
  who closes the tab immediately never loses an action.
- **Alternatives considered**: IndexedDB (async, more code, unnecessary at this size); cookies
  (size limits, sent to servers); any remote store (forbidden by Principle IV).
- **Failure handling**: If storage is unavailable or the stored JSON is unreadable, show a
  visible banner ("Changes can't be saved on this device") and keep working in memory; never
  silently discard the stored document.

## R4. Alert evaluation timing (FR-009, FR-011, FR-012, SC-003)

- **Decision**: Alerts are *derived*, never stored: a pure function
  `computeAlerts(plants, now)` returns the alert list. The app recomputes on load, after every
  action, every 30 seconds via `setInterval`, and on `visibilitychange` back to visible.
- **Rationale**: A 30-second tick guarantees an alert appears within 1 minute of becoming due
  (FR-012) even with timer jitter. Recomputing on visibility change covers browsers that throttle
  timers in background tabs. Keeping the rule pure makes every threshold scenario unit-testable
  with an injected `now`.
- **Alternatives considered**: Scheduling one timeout per plant at its due time (fragile across
  edits and sleep/wake); storing alert flags (can drift out of sync with timestamps).

## R5. Threshold semantics and time arithmetic

- **Decision**: Store all timestamps as epoch milliseconds (UTC). "Needs water" when
  `now − lastWateredAt ≥ wateringIntervalDays × 86 400 000` or `lastWateredAt` is null.
  "Bring inside" when `location = outside` and `now − putOutsideAt ≥ maxHoursOutside × 3 600 000`.
  Display in the device's local time zone. If a stored time is in the future (clock moved back),
  treat elapsed time as 0 (no alert, no error).
- **Rationale**: Elapsed-duration rules are unambiguous and independent of DST and time zones,
  matching the spec's "N days and 1 minute ago" scenarios exactly.
- **Alternatives considered**: Calendar-day rules ("due on the Nth calendar day"): friendlier for
  long intervals but ambiguous around midnight and DST and harder to test.

## R6. Testing strategy (Principle I)

- **Decision**:
  - **Vitest** for unit tests of pure logic (validation, alert rules, storage load/save/migrate).
  - **Playwright** (Chromium) for end-to-end acceptance tests: one test per acceptance scenario,
    named with its user story, scenario number, and FR IDs (e.g.,
    `US2-S1 [FR-009, FR-012] shows Needs water after interval passes`).
  - Time-dependent scenarios use Playwright's `page.clock` API (install/fast-forward) and Vitest
    fake timers, so "3 days and 1 minute later" runs in milliseconds.
  - Seed state for scenarios by writing `plantapp.v1` to `localStorage` before page load.
- **Rationale**: Every Given/When/Then maps to an automated, deterministic test, and the test
  name carries the requirement IDs for traceability (Principle II).
- **Alternatives considered**: Cypress (comparable; Playwright's built-in clock control is
  simpler); Jest + jsdom only (cannot verify real rendering, reload persistence, or timers in a
  real browser).

## R7. Local environment prerequisite

- **Finding**: On the development machine, the Homebrew `node` binary failed to start
  (`Library not loaded: libllhttp.9.3.dylib`).
- **Decision**: Require Node.js 20 LTS or newer.
- **Status**: Resolved 2026-11-14 via `brew reinstall llhttp node`; now Node v26.13.1, npm 11.20.0.

## R8. Accessibility and presentation

- **Decision**: Semantic HTML (form labels, buttons, a list of plants), alert badges that use text
  plus color, and an `aria-live="polite"` region for the attention summary. Mobile-first layout
  because the shared device may be a phone or tablet.
- **Rationale**: Supports SC-001/SC-005 (fast recognition and action) and makes elements easy to
  target in tests by role and accessible name.
