// Alerts are derived from plant data and the current time; they are never stored (research R4).
import { DAY_MS, HOUR_MS, type Plant } from "./plant";

export type AlertType = "needs-water" | "bring-inside";

export interface Alert {
  plantId: string;
  type: AlertType;
  /** When the alert became due; null for a plant that has never been watered. */
  dueAt: number | null;
}

/** Elapsed time, clamped to 0 when a stored time is in the future (device clock moved back). */
const elapsed = (now: number, since: number) => Math.max(0, now - since);

export function computeAlerts(plants: Plant[], now: number): Alert[] {
  const alerts: Alert[] = [];
  for (const p of plants) {
    // FR-009: never watered, or watering interval has elapsed.
    if (p.lastWateredAt === null) {
      alerts.push({ plantId: p.id, type: "needs-water", dueAt: null });
    } else if (elapsed(now, p.lastWateredAt) >= p.wateringIntervalDays * DAY_MS) {
      alerts.push({ plantId: p.id, type: "needs-water", dueAt: p.lastWateredAt + p.wateringIntervalDays * DAY_MS });
    }

    // FR-011: outside for at least the plant's maximum time outside.
    if (p.location === "outside" && p.putOutsideAt !== null) {
      const limit = p.maxHoursOutside * HOUR_MS;
      if (elapsed(now, p.putOutsideAt) >= limit) {
        alerts.push({ plantId: p.id, type: "bring-inside", dueAt: p.putOutsideAt + limit });
      }
    }
  }
  return alerts;
}
