# Data Model: Plant Care Tracker

**Feature**: [spec.md](./spec.md) | **Research**: [research.md](./research.md) | **Date**: 2026-11-14

## Entity: Plant (stored)

| Field | Type | Required | Rules | Requirement |
|-------|------|----------|-------|-------------|
| `id` | string (UUID) | yes | Generated on create; immutable; unique | FR-001, Edge: duplicate names |
| `name` | string | yes | Trimmed length 1–50 characters; duplicates allowed | FR-001, FR-002 |
| `wateringIntervalDays` | integer | yes | Whole number 1–365 | FR-001, FR-002 |
| `maxHoursOutside` | integer | yes | Whole number 1–72; default 4 | FR-001, FR-002, FR-011 |
| `lastWateredAt` | number \| null | yes | Epoch ms; `null` = never watered; must not be in the future when set by the user | FR-004, FR-005, FR-015 |
| `location` | `"inside"` \| `"outside"` | yes | Default `"inside"` | FR-006, FR-008 |
| `putOutsideAt` | number \| null | yes | Epoch ms; non-null **iff** `location = "outside"`; must not be in the future when set by the user | FR-006, FR-007, FR-015 |
| `createdAt` | number | yes | Epoch ms; used for stable list ordering | — |

### Validation messages (FR-002)

| Field | Condition | Message |
|-------|-----------|---------|
| name | empty after trim | "Name is required." |
| name | > 50 chars | "Name must be 50 characters or fewer." |
| wateringIntervalDays | not an integer 1–365 | "Watering interval must be a whole number from 1 to 365 days." |
| maxHoursOutside | not an integer 1–72 | "Max time outside must be a whole number from 1 to 72 hours." |
| lastWateredAt / putOutsideAt | later than now | "Time can't be in the future." (FR-015) |

### State transitions: location

```text
            markOutside (sets putOutsideAt = now)
  ┌────────┐ ─────────────────────────────────────▶ ┌─────────┐
  │ inside │                                         │ outside │──┐ markOutside again:
  └────────┘ ◀───────────────────────────────────── └─────────┘  │ requires confirmation,
            markInside (sets putOutsideAt = null)        ▲        │ then resets putOutsideAt
                                                         └────────┘ (FR-007)
```

Watering is orthogonal: `markWatered` sets `lastWateredAt = now` and never changes `location`;
moving never changes `lastWateredAt` (Edge Cases).

## Entity: Alert (derived, never stored)

Computed by `computeAlerts(plants, now)` on every render (research R4).

| Field | Type | Rule | Requirement |
|-------|------|------|-------------|
| `plantId` | string | References Plant.id | FR-013 |
| `type` | `"needs-water"` \| `"bring-inside"` | See rules below | FR-009, FR-011 |
| `dueAt` | number \| null | When the alert became due; `null` for never-watered | FR-013 |

**Rules** (elapsed time clamps to ≥ 0 if a stored time is in the future):

- `needs-water` ⇔ `lastWateredAt === null` **or** `now − lastWateredAt ≥ wateringIntervalDays × 86 400 000`
- `bring-inside` ⇔ `location === "outside"` **and** `now − putOutsideAt ≥ maxHoursOutside × 3 600 000`

A plant may have both alerts at once. Deleting a plant removes its alerts automatically (FR-003).

**Summary ordering** (FR-013): `bring-inside` before `needs-water` (time-sensitive first), then
by `dueAt` ascending (never-watered first), then by name.

## Stored document (`localStorage["plantapp.v1"]`)

```json
{
  "schemaVersion": 1,
  "plants": [
    {
      "id": "8c3e…",
      "name": "Fern",
      "wateringIntervalDays": 3,
      "maxHoursOutside": 4,
      "lastWateredAt": 1794700800000,
      "location": "inside",
      "putOutsideAt": null,
      "createdAt": 1794614400000
    }
  ]
}
```

- Missing key → start with an empty plant list.
- Unparseable JSON or unknown `schemaVersion` → keep the raw value untouched, run in memory, show
  the "can't be saved" banner (research R3).
- Plants failing validation on load are skipped and reported in the console; valid plants still
  load.
