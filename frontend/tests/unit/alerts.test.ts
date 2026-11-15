import { describe, expect, it } from "vitest";
import { computeAlerts } from "../../src/domain/alerts";
import { createPlant, DAY_MS, type Plant } from "../../src/domain/plant";

const NOW = 2_000_000_000_000;
const plant = (overrides: Partial<Plant> = {}): Plant => ({
  ...createPlant({ name: "Fern", wateringIntervalDays: 3, maxHoursOutside: 4 }, 0),
  ...overrides,
});
const water = (p: Plant) => computeAlerts([p], NOW).filter((a) => a.type === "needs-water");

describe("needs-water alerts [FR-009]", () => {
  it("alerts for a never-watered plant with dueAt null", () => {
    const p = plant();
    expect(water(p)).toEqual([{ plantId: p.id, type: "needs-water", dueAt: null }]);
  });

  it("does not alert 1 ms before the interval elapses", () => {
    expect(water(plant({ lastWateredAt: NOW - 3 * DAY_MS + 1 }))).toEqual([]);
  });

  it("alerts exactly when the interval elapses (>=)", () => {
    const p = plant({ lastWateredAt: NOW - 3 * DAY_MS });
    expect(water(p)).toEqual([{ plantId: p.id, type: "needs-water", dueAt: NOW }]);
  });

  it("treats a future lastWateredAt (clock moved back) as just watered", () => {
    expect(() => computeAlerts([plant({ lastWateredAt: NOW + DAY_MS })], NOW)).not.toThrow();
    expect(water(plant({ lastWateredAt: NOW + DAY_MS }))).toEqual([]);
  });
});

describe("bring-inside alerts [FR-011]", () => {
  const HOUR = 3_600_000;
  const inside = (p: Plant) => computeAlerts([p], NOW).filter((a) => a.type === "bring-inside");

  it("never alerts for a plant that is inside", () => {
    expect(inside(plant({ lastWateredAt: NOW }))).toEqual([]);
  });

  it("does not alert 1 ms before max time outside", () => {
    expect(inside(plant({ location: "outside", putOutsideAt: NOW - 4 * HOUR + 1 }))).toEqual([]);
  });

  it("alerts exactly at max time outside (>=)", () => {
    const p = plant({ location: "outside", putOutsideAt: NOW - 4 * HOUR });
    expect(inside(p)).toEqual([{ plantId: p.id, type: "bring-inside", dueAt: NOW }]);
  });

  it("can show both alerts for the same plant", () => {
    const p = plant({ lastWateredAt: null, location: "outside", putOutsideAt: NOW - 5 * HOUR });
    expect(computeAlerts([p], NOW).map((a) => a.type).sort()).toEqual(["bring-inside", "needs-water"]);
  });

  it("treats a future putOutsideAt as just put outside", () => {
    expect(inside(plant({ location: "outside", putOutsideAt: NOW + HOUR }))).toEqual([]);
  });
});
