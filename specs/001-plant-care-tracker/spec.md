# Feature Specification: Plant Care Tracker

**Feature Branch**: `001-plant-care-tracker`

**Created**: 2026-11-14

**Status**: Draft

**Input**: User description: "./docs/initial-spec.md" — PlantApp: Two roommates are having trouble
keeping track of when to water plants and bring them inside the house. Requirements: (1) Track when
a plant was last watered. (2) Track when a plant was put outside. (3) Alert when plant needs to be
watered. (4) Alert when plant needs to be brought back inside.

### Source Requirement Traceability

| Source (docs/initial-spec.md) | Functional Requirements |
|-------------------------------|-------------------------|
| 1. Track when a plant was last watered | FR-004, FR-005, FR-014, FR-015 |
| 2. Track when a plant was put outside | FR-006, FR-007, FR-008, FR-015 |
| 3. Alert when plant needs to be watered | FR-009, FR-010, FR-012, FR-013 |
| 4. Alert when plant needs to be brought back inside | FR-011, FR-012, FR-013 |

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Add plants and log watering (Priority: P1)

A roommate adds each household plant to PlantApp with a name and how often it needs watering.
Whenever either roommate waters a plant, they mark it as watered, and anyone looking at the app can
see when each plant was last watered.

**Why this priority**: Knowing when a plant was last watered is the core problem the roommates face
and is the foundation for watering alerts. On its own, it already prevents double-watering and
forgotten plants.

**Independent Test**: Add a plant, mark it watered, and confirm the plant list shows the correct
last-watered date and time, including after the app is closed and reopened.

**Acceptance Scenarios**:

1. **Given** the plant list is empty, **When** the user adds a plant named "Fern" with a watering
   interval of 3 days, **Then** "Fern" appears in the plant list showing "Never watered".
   *(FR-001, FR-002, FR-005)*
2. **Given** "Fern" exists and has never been watered, **When** the user marks "Fern" as watered,
   **Then** "Fern" shows a last-watered timestamp equal to the current date and time (to the
   minute). *(FR-004, FR-005)*
3. **Given** "Fern" was marked watered, **When** the user closes and reopens the app, **Then**
   "Fern" still shows the same last-watered timestamp. *(FR-014)*
4. **Given** the user is adding a plant, **When** they submit without a name or with a watering
   interval that is not a whole number from 1 to 365, **Then** the plant is not saved and a message
   identifies the invalid field. *(FR-002)*
5. **Given** one roommate marked "Fern" as watered on the shared device, **When** the other
   roommate opens the app on that same device, **Then** they see the updated last-watered
   timestamp. *(FR-016)*
6. **Given** "Fern" exists, **When** the user edits its watering interval to 5 days, **Then**
   "Fern" shows a 5-day interval; **and When** the user deletes "Fern" and confirms, **Then**
   "Fern" no longer appears in the plant list. *(FR-003)*

---

### User Story 2 - Get alerted when a plant needs water (Priority: P1)

When a plant's watering interval has passed since it was last watered, the app clearly alerts the
roommates so the plant gets watered on time.

**Why this priority**: Alerts are what actually stop plants from being forgotten; tracking alone
relies on someone remembering to check.

**Independent Test**: Create a plant with a 1-day interval and a last-watered time more than 1 day
ago, open the app, and confirm a "Needs water" alert is shown for that plant only; mark it watered
and confirm the alert clears.

**Acceptance Scenarios**:

1. **Given** "Fern" has a 3-day interval and was last watered 3 days and 1 minute ago, **When** the
   user views the app, **Then** "Fern" displays a "Needs water" alert. *(FR-009, FR-012)*
2. **Given** "Fern" has a 3-day interval and was last watered 2 days ago, **When** the user views
   the app, **Then** no "Needs water" alert is shown for "Fern". *(FR-009)*
3. **Given** "Fern" has never been watered, **When** the user views the app, **Then** "Fern"
   displays a "Needs water" alert. *(FR-009)*
4. **Given** "Fern" displays a "Needs water" alert, **When** the user marks "Fern" as watered,
   **Then** the alert disappears immediately. *(FR-010)*
5. **Given** the app is open and "Fern" becomes due while the user is viewing it, **When** at most
   1 minute passes after the due time, **Then** the "Needs water" alert appears without the user
   reloading the app. *(FR-012)*

---

### User Story 3 - Track plants put outside and get alerted to bring them in (Priority: P2)

When a roommate puts a plant outside (e.g., for sun), they mark it as outside. The app shows which
plants are outside and since when, and alerts the roommates when a plant needs to be brought back
in. When the plant is brought in, they mark it as inside.

**Why this priority**: This addresses the second half of the roommates' problem, but only matters
for plants that are moved outdoors, so it is secondary to watering.

**Independent Test**: Mark a plant as outside, confirm it shows as outside with the time it was put
out, let its maximum time outside pass (or set an earlier put-outside time), confirm the alert
appears, then mark it inside and confirm
the alert clears.

**Acceptance Scenarios**:

1. **Given** "Basil" is inside, **When** the user marks "Basil" as put outside, **Then** "Basil"
   shows status "Outside" with a put-outside timestamp equal to the current date and time.
   *(FR-006, FR-007)*
2. **Given** "Basil" has a maximum time outside of 4 hours and was put outside 4 hours and
   1 minute ago, **When** the user views the app, **Then** "Basil" displays a "Bring inside" alert.
   *(FR-011, FR-012)*
3. **Given** "Basil" has a maximum time outside of 4 hours and was put outside 3 hours ago,
   **When** the user views the app, **Then** no "Bring inside" alert is shown for "Basil".
   *(FR-011)*
4. **Given** "Basil" displays a "Bring inside" alert, **When** the user marks "Basil" as brought
   inside, **Then** the alert disappears and "Basil" shows status "Inside". *(FR-008)*
5. **Given** "Basil" is inside, **When** the user views the app, **Then** no "Bring inside" alert is
   shown for "Basil". *(FR-011)*

---

### User Story 4 - See everything that needs attention at a glance (Priority: P3)

A roommate opens the app and immediately sees which plants need water or need to come inside,
without inspecting each plant.

**Why this priority**: Improves convenience once tracking and alerts exist; not required for a
working MVP.

**Independent Test**: With a mix of plants (some due for water, some outside past their limit, some
fine), open the app and confirm the attention summary lists exactly the plants with active alerts.

**Acceptance Scenarios**:

1. **Given** 5 plants exist, of which 2 need water and 1 needs to be brought inside, **When** the
   user opens the app, **Then** a summary at the top shows 3 alerts naming exactly those plants
   and their alert type. *(FR-013)*
2. **Given** no plants have active alerts, **When** the user opens the app, **Then** the summary
   states that all plants are taken care of. *(FR-013)*

---

### Edge Cases

- A plant that has never been watered is treated as needing water (US2 scenario 3).
- A plant can need water and need to be brought inside at the same time; both alerts are shown.
- Marking a plant "put outside" while it is already outside does not reset the put-outside time
  unless the user confirms. *(FR-007)*
- Watering a plant does not change its inside/outside status, and moving it does not change its
  last-watered time.
- If the user corrects a watering or put-outside time, timestamps in the future are rejected.
  *(FR-015)*
- Deleting a plant asks for confirmation and removes its alerts. *(FR-003)*
- Two plants with the same name are allowed; each is tracked independently.
- If the device clock is moved backwards so a last-watered time appears in the future, the plant is
  treated as just watered (no alert) rather than producing an error.

## Requirements *(mandatory)*

### Functional Requirements

**Plant management**

- **FR-001**: Users MUST be able to add a plant with a name (1–50 characters), a watering
  interval in whole days (1–365), and a maximum time outside in whole hours (1–72, default 4).
- **FR-002**: System MUST reject a plant with a missing/over-length name, an out-of-range
  watering interval, or an out-of-range maximum time outside, and indicate which field is invalid.
- **FR-003**: Users MUST be able to edit a plant's name, watering interval, and maximum time
  outside, and delete a plant after confirming the deletion.

**Watering tracking** *(source requirement 1)*

- **FR-004**: Users MUST be able to mark a plant as watered with one action, recording the current
  date and time as its last-watered time.
- **FR-005**: System MUST display each plant's last-watered date and time, or "Never watered" if
  none has been recorded.

**Outdoor tracking** *(source requirement 2)*

- **FR-006**: Users MUST be able to mark a plant as put outside with one action, recording the
  current date and time as its put-outside time and setting its status to "Outside".
- **FR-007**: System MUST display, for each plant currently outside, its status and put-outside
  date and time; marking an already-outside plant as outside MUST require confirmation before the
  put-outside time is reset.
- **FR-008**: Users MUST be able to mark an outside plant as brought inside with one action,
  setting its status to "Inside".

**Alerts** *(source requirements 3 and 4)*

- **FR-009**: System MUST show a "Needs water" alert for a plant when it has never been watered or
  when the time since its last-watered time is greater than or equal to its watering interval.
- **FR-010**: System MUST clear a plant's "Needs water" alert as soon as it is marked watered.
- **FR-011**: System MUST show a "Bring inside" alert for a plant that is outside when the time
  since its put-outside time is greater than or equal to its maximum time outside, and clear it as
  soon as the plant is marked inside.
- **FR-012**: System MUST evaluate alerts on app open and at least once per minute while the app is
  open, so an alert appears within 1 minute of becoming due without a reload. Alerts MUST be shown
  only within the app's own screen; no device or browser notifications are sent.
- **FR-013**: System MUST show an attention summary listing every plant with an active alert and
  the alert type, or a message that all plants are taken care of when there are none.

**Data & sharing**

- **FR-014**: System MUST retain all plants, last-watered times, and outside status across app
  restarts on the same device.
- **FR-015**: Users MUST be able to correct a plant's last-watered or put-outside time to an
  earlier date and time; times in the future MUST be rejected.
- **FR-016**: System MUST support both roommates using the app on a single shared device, where
  every change made by one roommate is immediately visible to the other on that device. Syncing
  data between multiple devices is out of scope.

### Key Entities

- **Plant**: A household plant being cared for. Attributes: name, watering interval (days),
  last-watered time (optional), location status (Inside/Outside), put-outside time (present only
  while outside), and maximum time outside (hours).
- **Alert**: A derived, non-stored indication that a plant needs attention. Attributes: plant,
  type ("Needs water" or "Bring inside"), and the time it became due.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A roommate can record that a plant was watered or moved in under 5 seconds and no
  more than 2 interactions from opening the app.
- **SC-002**: A new user can add their first plant in under 1 minute without instructions.
- **SC-003**: 100% of plants that are due for watering or due to be brought inside show an alert
  within 1 minute of becoming due while the app is open.
- **SC-004**: 0 alerts are shown for plants that are not due (no false alerts) in acceptance
  testing.
- **SC-005**: On opening the app, a roommate can identify every plant needing attention within
  10 seconds.
- **SC-006**: Over a 2-week trial, the roommates report no plant missing a watering or being left
  outside past its limit because they forgot.

## Assumptions

- Users are the two roommates; there are no user accounts or login (per constitution
  Principle IV), and either roommate can perform any action.
- The roommates share one device (e.g., a tablet or laptop kept at home) for PlantApp (FR-016).
- Alerts are only seen when someone opens or is viewing the app; roommates are expected to check
  the app as part of their routine (FR-012).
- A plant's need to come inside is decided only by its own maximum time outside, not by time of
  day or weather (FR-011).
- Each plant has a single fixed watering interval chosen by the user; seasonal or weather-based
  adjustments are out of scope.
- No weather data or other external information is used to decide when plants need water or must
  come inside (per constitution Principle IV).
- A household has a small number of plants (up to about 50).
- "Watering" is a single event per plant; amount of water, fertilizer, and other care are out of
  scope.
- Times are shown in the device's local time zone.
- Plant photos, care history logs beyond the latest event, and plant species lookup are out of
  scope for this feature.
