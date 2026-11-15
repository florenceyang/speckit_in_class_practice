import { describe, expect, it } from "vitest";
import {
  createPlant,
  isValidStoredPlant,
  validatePastTime,
  validatePlantInput,
} from "../../src/domain/plant";

const valid = { name: "Fern", wateringIntervalDays: 3, maxHoursOutside: 4 };

describe("validatePlantInput [FR-001, FR-002]", () => {
  it("accepts a valid plant", () => {
    expect(validatePlantInput(valid)).toEqual({});
  });

  it.each(["", "   "])("requires a name (%j)", (name) => {
    expect(validatePlantInput({ ...valid, name }).name).toBe("Name is required.");
  });

  it("accepts a 50-character name and rejects 51", () => {
    expect(validatePlantInput({ ...valid, name: "a".repeat(50) }).name).toBeUndefined();
    expect(validatePlantInput({ ...valid, name: "a".repeat(51) }).name).toBe(
      "Name must be 50 characters or fewer.",
    );
  });

  it.each([0, 366, 2.5, NaN])("rejects watering interval %s", (wateringIntervalDays) => {
    expect(validatePlantInput({ ...valid, wateringIntervalDays }).wateringIntervalDays).toBe(
      "Watering interval must be a whole number from 1 to 365 days.",
    );
  });

  it.each([1, 365])("accepts watering interval %s", (wateringIntervalDays) => {
    expect(validatePlantInput({ ...valid, wateringIntervalDays })).toEqual({});
  });

  it.each([0, 73, 1.5, NaN])("rejects max hours outside %s", (maxHoursOutside) => {
    expect(validatePlantInput({ ...valid, maxHoursOutside }).maxHoursOutside).toBe(
      "Max time outside must be a whole number from 1 to 72 hours.",
    );
  });

  it.each([1, 72])("accepts max hours outside %s", (maxHoursOutside) => {
    expect(validatePlantInput({ ...valid, maxHoursOutside })).toEqual({});
  });
});

describe("validatePastTime [FR-015]", () => {
  it("rejects a time in the future", () => {
    expect(validatePastTime(1001, 1000)).toBe("Time can't be in the future.");
  });
  it("accepts now and the past", () => {
    expect(validatePastTime(1000, 1000)).toBeUndefined();
    expect(validatePastTime(1, 1000)).toBeUndefined();
  });
});

describe("createPlant [FR-001]", () => {
  it("trims the name and starts inside and never watered", () => {
    const p = createPlant({ ...valid, name: "  Fern  " }, 5000);
    expect(p).toMatchObject({
      name: "Fern",
      wateringIntervalDays: 3,
      maxHoursOutside: 4,
      lastWateredAt: null,
      location: "inside",
      putOutsideAt: null,
      createdAt: 5000,
    });
    expect(p.id).toEqual(expect.any(String));
  });
});

describe("isValidStoredPlant", () => {
  const base = createPlant(valid, 0);
  it("accepts a valid plant", () => {
    expect(isValidStoredPlant(base)).toBe(true);
  });
  it("enforces putOutsideAt non-null iff outside", () => {
    expect(isValidStoredPlant({ ...base, location: "outside", putOutsideAt: null })).toBe(false);
    expect(isValidStoredPlant({ ...base, location: "inside", putOutsideAt: 5 })).toBe(false);
    expect(isValidStoredPlant({ ...base, location: "outside", putOutsideAt: 5 })).toBe(true);
  });
  it("rejects non-objects and bad fields", () => {
    expect(isValidStoredPlant(null)).toBe(false);
    expect(isValidStoredPlant({ ...base, name: "" })).toBe(false);
    expect(isValidStoredPlant({ ...base, wateringIntervalDays: 0 })).toBe(false);
  });
});
