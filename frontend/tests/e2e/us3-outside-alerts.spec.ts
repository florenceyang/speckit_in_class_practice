// User Story 3 - Track plants put outside and get alerted to bring them in (P2)
import { expect, test } from "@playwright/test";
import {
  HOUR_MS,
  MINUTE_MS,
  NOW,
  formatInPage,
  insideBadge,
  installClock,
  makePlant,
  plantRow,
  seedPlants,
} from "./fixtures";

test("US3-S1 [FR-006, FR-007] putting a plant outside records the time", async ({ page }) => {
  await installClock(page);
  await seedPlants(page, [makePlant({ name: "Basil", lastWateredAt: NOW })]);
  await page.goto("/");
  const row = plantRow(page, "Basil");
  await expect(row.getByTestId("plant-location")).toHaveText("Inside");
  await row.getByRole("button", { name: "Put outside" }).click();
  await expect(row.getByTestId("plant-location")).toHaveText(`Outside since ${await formatInPage(page, NOW)}`);
});

test("US3-S2 [FR-011, FR-012] shows Bring inside after max time outside", async ({ page }) => {
  await installClock(page);
  await seedPlants(page, [
    makePlant({ name: "Basil", lastWateredAt: NOW, maxHoursOutside: 4, location: "outside", putOutsideAt: NOW - 4 * HOUR_MS - MINUTE_MS }),
  ]);
  await page.goto("/");
  await expect(insideBadge(plantRow(page, "Basil"))).toHaveText("Bring inside");
});

test("US3-S3 [FR-011] no alert before max time outside", async ({ page }) => {
  await installClock(page);
  await seedPlants(page, [
    makePlant({ name: "Basil", lastWateredAt: NOW, maxHoursOutside: 4, location: "outside", putOutsideAt: NOW - 3 * HOUR_MS }),
  ]);
  await page.goto("/");
  await expect(plantRow(page, "Basil")).toBeVisible();
  await expect(insideBadge(plantRow(page, "Basil"))).toHaveCount(0);
});

test("US3-S4 [FR-008] bringing inside clears the alert", async ({ page }) => {
  await installClock(page);
  await seedPlants(page, [
    makePlant({ name: "Basil", lastWateredAt: NOW, maxHoursOutside: 4, location: "outside", putOutsideAt: NOW - 4 * HOUR_MS - MINUTE_MS }),
  ]);
  await page.goto("/");
  const row = plantRow(page, "Basil");
  await expect(insideBadge(row)).toBeVisible();
  await row.getByRole("button", { name: "Bring inside" }).click();
  await expect(insideBadge(row)).toHaveCount(0);
  await expect(row.getByTestId("plant-location")).toHaveText("Inside");
});

test("US3-S5 [FR-011] inside plant never shows Bring inside", async ({ page }) => {
  await installClock(page);
  await seedPlants(page, [makePlant({ name: "Basil", lastWateredAt: NOW, location: "inside" })]);
  await page.goto("/");
  await expect(plantRow(page, "Basil")).toBeVisible();
  await page.clock.runFor(5 * HOUR_MS);
  await expect(insideBadge(plantRow(page, "Basil"))).toHaveCount(0);
});

test("US3-edge [FR-007] Put outside again requires confirmation", async ({ page }) => {
  await installClock(page);
  await seedPlants(page, [
    makePlant({ name: "Basil", lastWateredAt: NOW, location: "outside", putOutsideAt: NOW - HOUR_MS }),
  ]);
  await page.goto("/");
  const row = plantRow(page, "Basil");
  const location = row.getByTestId("plant-location");
  const earlier = `Outside since ${await formatInPage(page, NOW - HOUR_MS)}`;
  await expect(location).toHaveText(earlier);

  let message = "";
  page.once("dialog", (d) => {
    message = d.message();
    void d.dismiss();
  });
  await row.getByRole("button", { name: "Put outside again" }).click();
  expect(message).toBe("Reset the time Basil was put outside?");
  await expect(location).toHaveText(earlier);

  page.once("dialog", (d) => void d.accept());
  await row.getByRole("button", { name: "Put outside again" }).click();
  await expect(location).toHaveText(`Outside since ${await formatInPage(page, NOW)}`);
});

test("EDGE [FR-015, FR-011] correcting the put-outside time to earlier triggers Bring inside", async ({ page }) => {
  await installClock(page);
  await seedPlants(page, [makePlant({ name: "Basil", lastWateredAt: NOW, location: "outside", putOutsideAt: NOW })]);
  await page.goto("/");
  const row = plantRow(page, "Basil");
  await expect(insideBadge(row)).toHaveCount(0);

  const fiveHoursAgo = await page.evaluate((t) => {
    const d = new Date(t);
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }, NOW - 5 * HOUR_MS);

  await row.getByRole("button", { name: "Edit" }).click();
  await row.getByLabel("Correct time put outside").fill(fiveHoursAgo);
  await row.getByRole("button", { name: "Save" }).click();
  await expect(row.getByTestId("plant-location")).toHaveText(`Outside since ${await formatInPage(page, NOW - 5 * HOUR_MS)}`);
  await expect(insideBadge(row)).toHaveText("Bring inside");
});
