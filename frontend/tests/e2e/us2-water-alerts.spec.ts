// User Story 2 - Get alerted when a plant needs water (P1)
import { expect, test } from "@playwright/test";
import { DAY_MS, MINUTE_MS, NOW, installClock, makePlant, plantRow, seedPlants, waterBadge } from "./fixtures";

test("US2-S1 [FR-009, FR-012] shows Needs water after interval passes", async ({ page }) => {
  await installClock(page);
  await seedPlants(page, [makePlant({ name: "Fern", lastWateredAt: NOW - 3 * DAY_MS - MINUTE_MS })]);
  await page.goto("/");
  await expect(waterBadge(plantRow(page, "Fern"))).toHaveText("Needs water");
});

test("US2-S2 [FR-009] no alert before interval passes", async ({ page }) => {
  await installClock(page);
  await seedPlants(page, [makePlant({ name: "Fern", lastWateredAt: NOW - 2 * DAY_MS })]);
  await page.goto("/");
  await expect(plantRow(page, "Fern")).toBeVisible();
  await expect(waterBadge(plantRow(page, "Fern"))).toHaveCount(0);
});

test("US2-S3 [FR-009] never-watered plant needs water", async ({ page }) => {
  await seedPlants(page, [makePlant({ name: "Fern", lastWateredAt: null })]);
  await page.goto("/");
  await expect(waterBadge(plantRow(page, "Fern"))).toHaveText("Needs water");
});

test("US2-S4 [FR-010] watering clears the alert immediately", async ({ page }) => {
  await installClock(page);
  await seedPlants(page, [makePlant({ name: "Fern", lastWateredAt: NOW - 3 * DAY_MS - MINUTE_MS })]);
  await page.goto("/");
  const row = plantRow(page, "Fern");
  await expect(waterBadge(row)).toBeVisible();
  await row.getByRole("button", { name: "Watered" }).click();
  await expect(waterBadge(row)).toHaveCount(0);
});

test("US2-S5 [FR-012] alert appears within 1 minute without reload", async ({ page }) => {
  await installClock(page);
  await seedPlants(page, [makePlant({ name: "Fern", lastWateredAt: NOW - 3 * DAY_MS + 30_000 })]);
  await page.goto("/");
  const row = plantRow(page, "Fern");
  await expect(row).toBeVisible();
  await expect(waterBadge(row)).toHaveCount(0);

  await page.clock.runFor(MINUTE_MS);
  await expect(waterBadge(row)).toHaveText("Needs water");
});
