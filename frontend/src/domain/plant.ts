// Plant entity, validation rules, and factory (FR-001, FR-002, FR-015).
// Rules and messages follow specs/001-plant-care-tracker/data-model.md.

export type Location = "inside" | "outside";

export interface Plant {
  id: string;
  name: string;
  wateringIntervalDays: number;
  maxHoursOutside: number;
  lastWateredAt: number | null;
  location: Location;
  putOutsideAt: number | null;
  createdAt: number;
}

export interface PlantInput {
  name: string;
  wateringIntervalDays: number;
  maxHoursOutside: number;
}

export type FieldErrors = Partial<
  Record<"name" | "wateringIntervalDays" | "maxHoursOutside" | "lastWateredAt" | "putOutsideAt", string>
>;

export const DAY_MS = 86_400_000;
export const HOUR_MS = 3_600_000;
export const DEFAULT_WATERING_DAYS = 3;
export const DEFAULT_MAX_HOURS_OUTSIDE = 4;
export const NAME_MAX = 50;

export const MESSAGES = {
  nameRequired: "Name is required.",
  nameTooLong: "Name must be 50 characters or fewer.",
  interval: "Watering interval must be a whole number from 1 to 365 days.",
  maxOutside: "Max time outside must be a whole number from 1 to 72 hours.",
  future: "Time can't be in the future.",
} as const;

const isIntInRange = (n: unknown, min: number, max: number): boolean =>
  typeof n === "number" && Number.isInteger(n) && n >= min && n <= max;

export function validatePlantInput(input: PlantInput): FieldErrors {
  const errors: FieldErrors = {};
  const name = (input.name ?? "").trim();
  if (name.length === 0) errors.name = MESSAGES.nameRequired;
  else if (name.length > NAME_MAX) errors.name = MESSAGES.nameTooLong;
  if (!isIntInRange(input.wateringIntervalDays, 1, 365)) errors.wateringIntervalDays = MESSAGES.interval;
  if (!isIntInRange(input.maxHoursOutside, 1, 72)) errors.maxHoursOutside = MESSAGES.maxOutside;
  return errors;
}

export function validatePastTime(t: number, now: number): string | undefined {
  return t > now ? MESSAGES.future : undefined;
}

export function createPlant(input: PlantInput, now: number): Plant {
  return {
    id: crypto.randomUUID(),
    name: input.name.trim(),
    wateringIntervalDays: input.wateringIntervalDays,
    maxHoursOutside: input.maxHoursOutside,
    lastWateredAt: null,
    location: "inside",
    putOutsideAt: null,
    createdAt: now,
  };
}

const isTime = (x: unknown): x is number => typeof x === "number" && Number.isFinite(x);

export function isValidStoredPlant(x: unknown): x is Plant {
  if (typeof x !== "object" || x === null) return false;
  const p = x as Record<string, unknown>;
  if (typeof p.id !== "string" || p.id.length === 0) return false;
  if (typeof p.name !== "string") return false;
  if (
    Object.keys(
      validatePlantInput({
        name: p.name,
        wateringIntervalDays: p.wateringIntervalDays as number,
        maxHoursOutside: p.maxHoursOutside as number,
      }),
    ).length > 0
  )
    return false;
  if (!(p.lastWateredAt === null || isTime(p.lastWateredAt))) return false;
  if (!isTime(p.createdAt)) return false;
  if (p.location === "inside") return p.putOutsideAt === null;
  if (p.location === "outside") return isTime(p.putOutsideAt);
  return false;
}
