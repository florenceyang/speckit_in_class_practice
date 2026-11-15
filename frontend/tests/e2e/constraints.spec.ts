// Cross-cutting constitution and data-safety checks.
import { expect, test } from "@playwright/test";
import { STORAGE_KEY, makePlant, plantRow, seedPlants, seedRaw } from "./fixtures";

test("CONST [Principle IV] makes no network requests after load", async ({ page }) => {
  await seedPlants(page, [makePlant({ name: "Basil" })]);
  await page.goto("/");
  await page.waitForLoadState("networkidle");

  const requests: string[] = [];
  page.on("request", (r) => requests.push(r.url()));

  const form = page.getByRole("form", { name: "Add plant" });
  await form.getByLabel("Name").fill("Fern");
  await form.getByRole("button", { name: "Add plant" }).click();
  const row = plantRow(page, "Basil");
  await row.getByRole("button", { name: "Watered" }).click();
  await row.getByRole("button", { name: "Put outside" }).click();
  await row.getByRole("button", { name: "Bring inside" }).click();
  await expect(plantRow(page, "Fern")).toBeVisible();

  expect(requests).toEqual([]);
});

test("EDGE [FR-014] shows storage warning on corrupt data and keeps it untouched", async ({ page }) => {
  await seedRaw(page, "not json");
  await page.goto("/");
  await expect(page.getByRole("alert")).toHaveText("Changes can't be saved on this device.");

  const form = page.getByRole("form", { name: "Add plant" });
  await form.getByLabel("Name").fill("Fern");
  await form.getByRole("button", { name: "Add plant" }).click();
  await expect(plantRow(page, "Fern")).toBeVisible();

  expect(await page.evaluate((k) => localStorage.getItem(k), STORAGE_KEY)).toBe("not json");
});

test("EDGE [FR-014] no storage warning when storage works", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "PlantApp" })).toBeVisible();
  await expect(page.getByRole("alert")).toBeHidden();
});
