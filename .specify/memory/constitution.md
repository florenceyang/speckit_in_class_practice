# PlantApp Constitution

## Core Principles

### I. Testable Acceptance Scenarios

Every acceptance scenario in a feature specification MUST be objectively verifiable.

- Scenarios MUST use Given/When/Then form with a concrete initial state, a single triggering
  action, and an observable expected outcome.
- Expected outcomes MUST be stated in terms a tester can check through the user interface or an
  automated test (e.g., displayed text, element state, stored value); vague terms such as
  "works correctly", "user-friendly", or "fast" are prohibited unless quantified.
- Every scenario MUST be covered by at least one test task in `tasks.md`, and a feature is not
  complete until those tests pass.

**Rationale**: Untestable acceptance criteria cannot confirm that a requirement is satisfied,
which defeats the purpose of specification-driven development.

### II. Requirement Traceability

Requirement identifiers MUST be preserved from specification through implementation.

- Each functional requirement MUST have a stable ID (e.g., `FR-001`); IDs MUST NOT be renumbered,
  reused, or silently deleted once published. Retired requirements MUST be marked as removed
  rather than erased.
- Acceptance scenarios, plan decisions, and tasks MUST reference the requirement IDs they
  address, and tests SHOULD cite the requirement ID in their name or description.
- Every requirement MUST trace to at least one task, and every task MUST trace to at least one
  requirement or user story.

**Rationale**: Stable IDs let reviewers verify coverage and assess the impact of changes across
spec, plan, tasks, code, and tests.

### III. Frontend-Only Code Location

All generated application code MUST reside under the `frontend/` directory.

- Application source, assets, configuration, and application tests MUST be placed in
  `frontend/`.
- Spec Kit artifacts (`specs/`, `.specify/`), documentation (`docs/`), and agent configuration
  (`.claude/`) remain outside `frontend/` and MUST NOT contain application code.

**Rationale**: A single, predictable code location keeps the repository easy to navigate and
cleanly separates requirements artifacts from implementation.

### IV. No Authentication, Backend Services, or External APIs

The application MUST run entirely in the client with no server-side or third-party dependencies
at runtime.

- Features MUST NOT introduce user accounts, login, or any other authentication mechanism.
- Features MUST NOT introduce backend services, servers, databases hosted outside the browser,
  or serverless functions.
- Features MUST NOT call external APIs or remote network services at runtime. Persistence, when
  needed, MUST use browser-local storage (e.g., `localStorage` or IndexedDB).
- Alerts and notifications MUST be delivered in-app (or via browser-native APIs that require no
  external service).

**Rationale**: Keeps the in-class practice project small, self-contained, and focused on
requirements engineering rather than infrastructure.

## Scope & Technical Constraints

- The product is PlantApp: a client-side web application that helps roommates track plant
  watering and outdoor placement and alerts them when action is needed (see
  `docs/initial-spec.md`).
- Any proposed dependency MUST be justified in `plan.md` and MUST NOT violate Principle IV.
- Plans whose design requires a backend, authentication, or external API MUST be rejected or
  revised before task generation.

## Development Workflow & Quality Gates

- Work follows the Spec Kit flow: specify → clarify (as needed) → plan → tasks → analyze →
  implement.
- The Constitution Check in `plan.md` MUST confirm compliance with all four principles before
  task generation.
- Before implementation, `/speckit-analyze` SHOULD be run to confirm requirement-to-task coverage
  (Principle II) and scenario testability (Principle I).
- A feature is done only when all acceptance-scenario tests pass and all code is under
  `frontend/`.

## Governance

- This constitution supersedes other project practices; conflicts are resolved in its favor.
- Amendments MUST be made via `/speckit-constitution`, documented with a Sync Impact Report, and
  committed with a message describing the change.
- Versioning follows semantic versioning: MAJOR for removing or redefining principles, MINOR for
  adding principles or materially expanding guidance, PATCH for clarifications and wording fixes.
- Every spec, plan, task list, and review MUST verify compliance with these principles; any
  justified deviation MUST be recorded in the plan's Complexity Tracking section.

**Version**: 1.0.0 | **Ratified**: 2026-11-14 | **Last Amended**: 2026-11-14
