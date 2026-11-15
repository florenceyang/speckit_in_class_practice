# UI Contract: Plant Care Tracker

**Feature**: [spec.md](../spec.md) | **Data model**: [data-model.md](../data-model.md)

PlantApp exposes no network API (constitution Principle IV). Its external interfaces are the
**user interface** and the **storage document** on the shared device. This contract fixes the
accessible names, texts, and test hooks that acceptance tests rely on, so tests and implementation
can be written independently.

Tests locate elements by ARIA role + accessible name first, and by `data-testid` only where a role
is ambiguous (e.g., per-plant rows).

## Screen layout (single page)

| Region | Element | Contract | Requirement |
|--------|---------|----------|-------------|
| Header | `<h1>` | Text "PlantApp" | — |
| Storage warning | `role="alert"` | Shown only when storage is unavailable: "Changes can't be saved on this device." | FR-014 |
| Attention summary | `<section aria-label="Needs attention">` with `aria-live="polite"` | Lists one item per active alert: "`<name>` — Needs water" / "`<name>` — Bring inside". When empty: "All plants are taken care of." Count shown as "`N` alert(s)". | FR-013 |
| Add form | `<form aria-label="Add plant">` | Fields below; submit button "Add plant" | FR-001, FR-002 |
| Plant list | `<ul aria-label="Plants">` | One `<li data-testid="plant-<id>">` per plant, ordered by `createdAt` | FR-005, FR-007 |

## Add / edit plant form

| Label | Input | Default | Validation (message shown next to field, `aria-invalid="true"`) |
|-------|-------|---------|----------|
| "Name" | text | empty | see data-model validation table |
| "Water every (days)" | number, step 1 | 3 | 1–365 |
| "Max time outside (hours)" | number, step 1 | 4 | 1–72 |

On invalid submit: nothing is saved, focus moves to the first invalid field (FR-002).
Edit uses the same form inside the plant row with buttons "Save" and "Cancel" (FR-003).

## Plant row

| Element | Contract | Requirement |
|---------|----------|-------------|
| Name | Plant name as heading text | FR-005 |
| Interval | "Every `N` days" | FR-001, FR-003 |
| Last watered | "Last watered: `<local date time>`" or "Never watered" | FR-005 |
| Location | "Inside" or "Outside since `<local date time>`" | FR-007 |
| Badges | Text badges "Needs water" and/or "Bring inside" when active | FR-009, FR-011 |
| Button "Watered" | Sets lastWateredAt = now; badge clears immediately | FR-004, FR-010 |
| Button "Put outside" | Visible when inside; sets location outside, putOutsideAt = now | FR-006 |
| Button "Bring inside" | Visible when outside; sets location inside | FR-008 |
| Button "Put outside again" | Visible when outside; asks confirmation "Reset the time `<name>` was put outside?" before resetting | FR-007 |
| Button "Edit" | Opens edit form, including "Correct last watered" and "Correct time put outside" date-time inputs; future times rejected | FR-003, FR-015 |
| Button "Delete" | Asks confirmation "Delete `<name>`?"; on confirm removes the plant | FR-003 |

Date-time display format: device locale, minute precision (e.g., "Nov 14, 2026, 9:05 PM").

## Timing contract

- Alerts recompute on load, after each action, every 30 s, and when the page becomes visible
  (FR-012). An alert MUST appear ≤ 60 s after its due time while the page is open.
- No browser notifications, sounds, or network requests are made (FR-012, Principle IV).

## Storage contract

`localStorage["plantapp.v1"]` holds the document defined in
[data-model.md](../data-model.md#stored-document-localstorageplantappv1). Tests may seed this key
before page load to establish a **Given** state. A `storage` event from another tab on the same
device triggers reload of state and re-render (FR-016).
