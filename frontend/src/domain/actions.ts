// Pure state transitions on the plant list (FR-001–FR-004, FR-006–FR-008, FR-015).
import {
  createPlant,
  validatePastTime,
  validatePlantInput,
  type FieldErrors,
  type Plant,
  type PlantInput,
} from "./plant";

export type Result = { plants: Plant[] } | { errors: FieldErrors };

export interface PlantChanges extends PlantInput {
  /** Corrected last-watered time (FR-015). Omit to keep the current value. */
  lastWateredAt?: number;
  /** Corrected put-outside time, only for plants outside (FR-015). Omit to keep it. */
  putOutsideAt?: number;
}

const mapPlant = (plants: Plant[], id: string, fn: (p: Plant) => Plant): Plant[] =>
  plants.map((p) => (p.id === id ? fn(p) : p));

export function addPlant(plants: Plant[], input: PlantInput, now: number): Result {
  const errors = validatePlantInput(input);
  if (Object.keys(errors).length > 0) return { errors };
  return { plants: [...plants, createPlant(input, now)] };
}

export function markWatered(plants: Plant[], id: string, now: number): Plant[] {
  return mapPlant(plants, id, (p) => ({ ...p, lastWateredAt: now }));
}

export function updatePlant(plants: Plant[], id: string, changes: PlantChanges, now: number): Result {
  const target = plants.find((p) => p.id === id);
  if (!target) return { plants };

  const errors: FieldErrors = validatePlantInput(changes);
  if (changes.lastWateredAt !== undefined) {
    const msg = Number.isFinite(changes.lastWateredAt)
      ? validatePastTime(changes.lastWateredAt, now)
      : "Enter a valid date and time.";
    if (msg) errors.lastWateredAt = msg;
  }
  if (changes.putOutsideAt !== undefined && target.location === "outside") {
    const msg = Number.isFinite(changes.putOutsideAt)
      ? validatePastTime(changes.putOutsideAt, now)
      : "Enter a valid date and time.";
    if (msg) errors.putOutsideAt = msg;
  }
  if (Object.keys(errors).length > 0) return { errors };

  return {
    plants: mapPlant(plants, id, (p) => ({
      ...p,
      name: changes.name.trim(),
      wateringIntervalDays: changes.wateringIntervalDays,
      maxHoursOutside: changes.maxHoursOutside,
      lastWateredAt: changes.lastWateredAt ?? p.lastWateredAt,
      putOutsideAt:
        p.location === "outside" && changes.putOutsideAt !== undefined ? changes.putOutsideAt : p.putOutsideAt,
    })),
  };
}

/** FR-006: mark as put outside now. Invariant: putOutsideAt is non-null iff location is "outside". */
export function markOutside(plants: Plant[], id: string, now: number): Plant[] {
  return mapPlant(plants, id, (p) => ({ ...p, location: "outside", putOutsideAt: now }));
}

/** FR-008: mark as brought inside. */
export function markInside(plants: Plant[], id: string): Plant[] {
  return mapPlant(plants, id, (p) => ({ ...p, location: "inside", putOutsideAt: null }));
}

export function deletePlant(plants: Plant[], id: string): Plant[] {
  return plants.filter((p) => p.id !== id);
}
