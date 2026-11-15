// User Story 1 - Add plants and log watering (P1)
import { expect, test } from "@playwright/test";
import { DAY_MS, NOW, formatInPage, installClock, makePlant, plantRow, seedPlants } from "./fixtures";

test("US1-S1 [FR-001, FR-002, FR-005] adds a plant that shows Never watered", async ({ page }) => {
  await page.goto("/");
  const form = page.getByRole("form", { name: "Add plant" });
  await form.getByLabel("Name").fill("Fern");
  await form.getByLabel("Water every (days)").fill("3");
  await form.getByRole("button", { name: "Add plant" }).click();

  const row = plantRow(page, "Fern");
  await expect(row).toBeVisible();
  await expect(row).toContainText("Never watered");
});

test("US1-S2 [FR-004, FR-005] marking watered records current time", async ({ page }) => {
  await installClock(page);
  await seedPlants(page, [makePlant({ name: "Fern" })]);
  await page.goto("/");

  const row = plantRow(page, "Fern");
  await row.getByRole("button", { name: "Watered" }).click();
  await expect(row).toContainText(`Last watered: ${await formatInPage(page, NOW)}`);
  await expect(row).not.toContainText("Never watered");
});

test("US1-S3 [FR-014] last-watered time survives reload", async ({ page }) => {
  await installClock(page);
  await seedPlants(page, [makePlant({ name: "Fern" })]);
  await page.goto("/");
  await plantRow(page, "Fern").getByRole("button", { name: "Watered" }).click();
  const expected = `Last watered: ${await formatInPage(page, NOW)}`;
  await expect(plantRow(page, "Fern")).toContainText(expected);

  await page.reload();
  await expect(plantRow(page, "Fern")).toContainText(expected);
});

test("US1-S4 [FR-002] rejects invalid plant input", async ({ page }) => {
  await page.goto("/");
  const form = page.getByRole("form", { name: "Add plant" });
  const plants = page.getByRole("list", { name: "Plants" });

  await form.getByRole("button", { name: "Add plant" }).click();
  await expect(form.getByText("Name is required.")).toBeVisible();
  await expect(form.getByLabel("Name")).toHaveAttribute("aria-invalid", "true");
  await expect(form.getByLabel("Name")).toBeFocused();
  await expect(plants.getByRole("listitem")).toHaveCount(0);

  await form.getByLabel("Name").fill("Fern");
  await form.getByLabel("Water every (days)").fill("0");
  await form.getByRole("button", { name: "Add plant" }).click();
  await expect(form.getByText("Watering interval must be a whole number from 1 to 365 days.")).toBeVisible();
  await expect(form.getByLabel("Water every (days)")).toHaveAttribute("aria-invalid", "true");
  await expect(plants.getByRole("listitem")).toHaveCount(0);
});

test("US1-S5 [FR-016] change is visible to the other roommate on the same device", async ({ page, context }) => {
  await seedPlants(page, [makePlant({ name: "Fern" })]);
  await page.goto("/");
  const other = await context.newPage();
  await other.goto("/");
  await expect(plantRow(other, "Fern")).toContainText("Never watered");

  await plantRow(page, "Fern").getByRole("button", { name: "Watered" }).click();
  await expect(plantRow(other, "Fern")).toContainText("Last watered:");
  await expect(plantRow(other, "Fern")).not.toContainText("Never watered");
});

test("US1-S6 [FR-003] edits interval and deletes a plant", async ({ page }) => {
  await seedPlants(page, [makePlant({ name: "Fern", lastWateredAt: Date.now() - DAY_MS })]);
  await page.goto("/");
  const row = plantRow(page, "Fern");
  await expect(row).toContainText("Every 3 days");

  await row.getByRole("button", { name: "Edit" }).click();
  await row.getByLabel("Water every (days)").fill("5");
  await row.getByRole("button", { name: "Save" }).click();
  await expect(row).toContainText("Every 5 days");

  let message = "";
  page.once("dialog", (d) => {
    message = d.message();
    void d.accept();
  });
  await row.getByRole("button", { name: "Delete" }).click();
  expect(message).toBe("Delete Fern?");
  await expect(plantRow(page, "Fern")).toHaveCount(0);
});

test("EDGE [FR-015] rejects a future last-watered correction", async ({ page }) => {
  await installClock(page);
  await seedPlants(page, [makePlant({ name: "Fern", lastWateredAt: NOW - DAY_MS })]);
  await page.goto("/");
  const row = plantRow(page, "Fern");
  const before = `Last watered: ${await formatInPage(page, NOW - DAY_MS)}`;
  await expect(row).toContainText(before);

  const tomorrow = await page.evaluate((t) => {
    const d = new Date(t);
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }, NOW + DAY_MS);

  await row.getByRole("button", { name: "Edit" }).click();
  await row.getByLabel("Correct last watered").fill(tomorrow);
  await row.getByRole("button", { name: "Save" }).click();
  await expect(row.getByText("Time can't be in the future.")).toBeVisible();

  await row.getByRole("button", { name: "Cancel" }).click();
  await expect(row).toContainText(before);
});
