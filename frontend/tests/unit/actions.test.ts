import { describe, expect, it } from "vitest";
import { addPlant, deletePlant, markInside, markOutside, markWatered, updatePlant } from "../../src/domain/actions";
import { createPlant, type Plant } from "../../src/domain/plant";

const NOW = 1_000_000_000;
const fern = (): Plant =>
  createPlant({ name: "Fern", wateringIntervalDays: 3, maxHoursOutside: 4 }, NOW - 10);

describe("addPlant [FR-001, FR-002]", () => {
  it("adds a valid plant", () => {
    const r = addPlant([], { name: "Fern", wateringIntervalDays: 3, maxHoursOutside: 4 }, NOW);
    expect("plants" in r && r.plants).toHaveLength(1);
  });
  it("returns errors for invalid input and adds nothing", () => {
    const r = addPlant([], { name: "", wateringIntervalDays: 3, maxHoursOutside: 4 }, NOW);
    expect(r).toEqual({ errors: { name: "Name is required." } });
  });
});

describe("markWatered [FR-004]", () => {
  it("sets lastWateredAt to now and leaves location unchanged", () => {
    const p = { ...fern(), location: "outside" as const, putOutsideAt: NOW - 100 };
    const [after] = markWatered([p], p.id, NOW);
    expect(after.lastWateredAt).toBe(NOW);
    expect(after.location).toBe("outside");
    expect(after.putOutsideAt).toBe(NOW - 100);
  });
  it("leaves other plants untouched", () => {
    const a = fern();
    const b = { ...fern(), id: "other" };
    const [, bAfter] = markWatered([a, b], a.id, NOW);
    expect(bAfter).toBe(b);
  });
});

describe("updatePlant [FR-003, FR-015]", () => {
  it("updates name, interval, and max time outside", () => {
    const p = fern();
    const r = updatePlant([p], p.id, { name: " Big Fern ", wateringIntervalDays: 5, maxHoursOutside: 6 }, NOW);
    expect("plants" in r && r.plants[0]).toMatchObject({ name: "Big Fern", wateringIntervalDays: 5, maxHoursOutside: 6 });
  });
  it("re-validates input", () => {
    const p = fern();
    const r = updatePlant([p], p.id, { name: "Fern", wateringIntervalDays: 0, maxHoursOutside: 4 }, NOW);
    expect(r).toEqual({ errors: { wateringIntervalDays: "Watering interval must be a whole number from 1 to 365 days." } });
  });
  it("corrects lastWateredAt to an earlier time", () => {
    const p = fern();
    const r = updatePlant([p], p.id, { name: "Fern", wateringIntervalDays: 3, maxHoursOutside: 4, lastWateredAt: NOW - 5000 }, NOW);
    expect("plants" in r && r.plants[0].lastWateredAt).toBe(NOW - 5000);
  });
  it("rejects a future lastWateredAt", () => {
    const p = fern();
    const r = updatePlant([p], p.id, { name: "Fern", wateringIntervalDays: 3, maxHoursOutside: 4, lastWateredAt: NOW + 1 }, NOW);
    expect(r).toEqual({ errors: { lastWateredAt: "Time can't be in the future." } });
  });
});

describe("deletePlant [FR-003]", () => {
  it("removes the plant", () => {
    const p = fern();
    expect(deletePlant([p], p.id)).toEqual([]);
  });
});

describe("markOutside / markInside [FR-006, FR-008]", () => {
  it("markOutside sets location and putOutsideAt, keeps lastWateredAt", () => {
    const p = { ...fern(), lastWateredAt: NOW - 50 };
    const [after] = markOutside([p], p.id, NOW);
    expect(after).toMatchObject({ location: "outside", putOutsideAt: NOW, lastWateredAt: NOW - 50 });
  });
  it("markInside sets location inside and clears putOutsideAt, keeps lastWateredAt", () => {
    const p = { ...fern(), lastWateredAt: NOW - 50, location: "outside" as const, putOutsideAt: NOW - 10 };
    const [after] = markInside([p], p.id);
    expect(after).toMatchObject({ location: "inside", putOutsideAt: null, lastWateredAt: NOW - 50 });
  });
});

describe("correcting putOutsideAt [FR-015]", () => {
  const outside = () => ({ ...fern(), location: "outside" as const, putOutsideAt: NOW - 10 });
  const base = { name: "Fern", wateringIntervalDays: 3, maxHoursOutside: 4 };
  it("accepts an earlier time", () => {
    const p = outside();
    const r = updatePlant([p], p.id, { ...base, putOutsideAt: NOW - 5000 }, NOW);
    expect("plants" in r && r.plants[0].putOutsideAt).toBe(NOW - 5000);
  });
  it("rejects a future time", () => {
    const p = outside();
    const r = updatePlant([p], p.id, { ...base, putOutsideAt: NOW + 1 }, NOW);
    expect(r).toEqual({ errors: { putOutsideAt: "Time can't be in the future." } });
  });
  it("ignores putOutsideAt for a plant that is inside", () => {
    const p = fern();
    const r = updatePlant([p], p.id, { ...base, putOutsideAt: NOW - 5000 }, NOW);
    expect("plants" in r && r.plants[0].putOutsideAt).toBeNull();
  });
});
