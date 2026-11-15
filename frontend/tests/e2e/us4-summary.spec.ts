// User Story 4 - See everything that needs attention at a glance (P3)
import { expect, test } from "@playwright/test";
import { DAY_MS, HOUR_MS, NOW, installClock, makePlant, seedPlants } from "./fixtures";

test("US4-S1 [FR-013] summary lists exactly the plants needing attention", async ({ page }) => {
  await installClock(page);
  await seedPlants(page, [
    makePlant({ name: "Fern", lastWateredAt: NOW - 4 * DAY_MS }),
    makePlant({ name: "Ivy", lastWateredAt: NOW - 5 * DAY_MS }),
    makePlant({ name: "Basil", lastWateredAt: NOW, location: "outside", putOutsideAt: NOW - 5 * HOUR_MS }),
    makePlant({ name: "Cactus", lastWateredAt: NOW - DAY_MS }),
    makePlant({ name: "Mint", lastWateredAt: NOW, location: "outside", putOutsideAt: NOW - HOUR_MS }),
  ]);
  await page.goto("/");

  const summary = page.getByRole("region", { name: "Needs attention" });
  await expect(summary).toContainText("3 alerts");
  await expect(summary.getByRole("listitem")).toHaveText([
    "Basil — Bring inside",
    "Ivy — Needs water",
    "Fern — Needs water",
  ]);
  await expect(summary).not.toContainText("Cactus");
  await expect(summary).not.toContainText("Mint");
});

test("US4-S2 [FR-013] summary says all plants are taken care of", async ({ page }) => {
  await installClock(page);
  await seedPlants(page, [
    makePlant({ name: "Cactus", lastWateredAt: NOW - DAY_MS }),
    makePlant({ name: "Mint", lastWateredAt: NOW }),
  ]);
  await page.goto("/");
  const summary = page.getByRole("region", { name: "Needs attention" });
  await expect(summary).toContainText("All plants are taken care of.");
  await expect(summary.getByRole("listitem")).toHaveCount(0);
});
