import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createPlant } from "../../src/domain/plant";
import { loadPlants, savePlants, STORAGE_KEY } from "../../src/storage/store";

const fern = createPlant({ name: "Fern", wateringIntervalDays: 3, maxHoursOutside: 4 }, 1000);

describe("store [FR-014]", () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => vi.restoreAllMocks());

  it("starts empty when nothing is stored", () => {
    expect(loadPlants()).toEqual({ plants: [], canSave: true });
  });

  it("round-trips saved plants", () => {
    loadPlants();
    savePlants([fern]);
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!)).toEqual({
      schemaVersion: 1,
      plants: [fern],
    });
    expect(loadPlants()).toEqual({ plants: [fern], canSave: true });
  });

  it("does not overwrite unparseable data", () => {
    localStorage.setItem(STORAGE_KEY, "not json");
    expect(loadPlants()).toEqual({ plants: [], canSave: false });
    savePlants([fern]);
    expect(localStorage.getItem(STORAGE_KEY)).toBe("not json");
  });

  it("treats an unknown schema version as unreadable", () => {
    const raw = JSON.stringify({ schemaVersion: 99, plants: [] });
    localStorage.setItem(STORAGE_KEY, raw);
    expect(loadPlants()).toEqual({ plants: [], canSave: false });
    savePlants([fern]);
    expect(localStorage.getItem(STORAGE_KEY)).toBe(raw);
  });

  it("skips invalid plants but loads valid ones", () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ schemaVersion: 1, plants: [fern, { ...fern, id: "x", name: "" }] }),
    );
    expect(loadPlants()).toEqual({ plants: [fern], canSave: true });
  });

  it("reports canSave false when storage writes throw", () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("QuotaExceededError");
    });
    expect(loadPlants().canSave).toBe(false);
  });
});
