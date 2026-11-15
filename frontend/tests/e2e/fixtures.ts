// Shared e2e helpers: seed storage (the "Given" state) and control the clock.
import type { Locator, Page } from "@playwright/test";

export const MINUTE_MS = 60_000;
export const HOUR_MS = 3_600_000;
export const DAY_MS = 86_400_000;
export const STORAGE_KEY = "plantapp.v1";

/** Fixed "now" used by time-dependent tests. */
export const NOW_ISO = "2026-11-14T12:00:00";
export const NOW = new Date(NOW_ISO).getTime();

export interface SeedPlant {
  id: string;
  name: string;
  wateringIntervalDays: number;
  maxHoursOutside: number;
  lastWateredAt: number | null;
  location: "inside" | "outside";
  putOutsideAt: number | null;
  createdAt: number;
}

let counter = 0;
export function makePlant(overrides: Partial<SeedPlant> & { name: string }): SeedPlant {
  counter += 1;
  return {
    id: `seed-${counter}-${overrides.name.toLowerCase()}`,
    wateringIntervalDays: 3,
    maxHoursOutside: 4,
    lastWateredAt: null,
    location: "inside",
    putOutsideAt: null,
    createdAt: counter,
    ...overrides,
  };
}

/** Writes plants to localStorage before the app loads (only on the first load of the page). */
export async function seedPlants(page: Page, plants: SeedPlant[]): Promise<void> {
  await page.addInitScript(
    ({ key, doc }) => {
      if (!sessionStorage.getItem("plantapp.seeded")) {
        localStorage.setItem(key, doc);
        sessionStorage.setItem("plantapp.seeded", "1");
      }
    },
    { key: STORAGE_KEY, doc: JSON.stringify({ schemaVersion: 1, plants }) },
  );
}

export async function seedRaw(page: Page, raw: string): Promise<void> {
  await page.addInitScript(
    ({ key, raw }) => {
      if (!sessionStorage.getItem("plantapp.seeded")) {
        localStorage.setItem(key, raw);
        sessionStorage.setItem("plantapp.seeded", "1");
      }
    },
    { key: STORAGE_KEY, raw },
  );
}

export async function installClock(page: Page, time: number = NOW): Promise<void> {
  await page.clock.install({ time });
}

export function plantRow(page: Page, name: string): Locator {
  return page
    .locator('li[data-testid^="plant-"]')
    .filter({ has: page.getByRole("heading", { name, exact: true }) });
}

/** Formats a time exactly as the app does, using the browser's locale. */
export async function formatInPage(page: Page, ms: number): Promise<string> {
  return page.evaluate(
    (t) => new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(t)),
    ms,
  );
}

export function waterBadge(row: Locator): Locator {
  return row.getByTestId("badge-needs-water");
}

export function insideBadge(row: Locator): Locator {
  return row.getByTestId("badge-bring-inside");
}
