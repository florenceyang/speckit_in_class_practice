import { describe, expect, it } from "vitest";
import type { Alert } from "../../src/domain/alerts";
import { createPlant, type Plant } from "../../src/domain/plant";
import { orderAlerts } from "../../src/ui/summary";

const mk = (name: string): Plant => ({
  ...createPlant({ name, wateringIntervalDays: 3, maxHoursOutside: 4 }, 0),
  id: name,
});
const plants = ["Ivy", "Fern", "Basil", "Aloe", "Mint"].map(mk);

describe("orderAlerts [FR-013]", () => {
  it("puts bring-inside first, then dueAt ascending with null first, then name", () => {
    const alerts: Alert[] = [
      { plantId: "Ivy", type: "needs-water", dueAt: 200 },
      { plantId: "Fern", type: "needs-water", dueAt: 100 },
      { plantId: "Mint", type: "needs-water", dueAt: null },
      { plantId: "Aloe", type: "needs-water", dueAt: null },
      { plantId: "Basil", type: "bring-inside", dueAt: 300 },
    ];
    expect(orderAlerts(alerts, plants).map((a) => `${a.plantId}:${a.type}`)).toEqual([
      "Basil:bring-inside",
      "Aloe:needs-water",
      "Mint:needs-water",
      "Fern:needs-water",
      "Ivy:needs-water",
    ]);
  });

  it("does not mutate its input", () => {
    const alerts: Alert[] = [
      { plantId: "Ivy", type: "needs-water", dueAt: 2 },
      { plantId: "Fern", type: "needs-water", dueAt: 1 },
    ];
    orderAlerts(alerts, plants);
    expect(alerts[0].plantId).toBe("Ivy");
  });
});
