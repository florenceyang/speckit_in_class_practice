// Persistence in browser localStorage on the shared device (FR-014, FR-016; research R3).
// No network or remote storage is used (constitution Principle IV).
import { isValidStoredPlant, type Plant } from "../domain/plant";

export const STORAGE_KEY = "plantapp.v1";
export const SCHEMA_VERSION = 1;
const PROBE_KEY = "plantapp.probe";

let writable = true;

export interface LoadResult {
  plants: Plant[];
  canSave: boolean;
}

function storageWorks(): boolean {
  try {
    localStorage.setItem(PROBE_KEY, "1");
    localStorage.removeItem(PROBE_KEY);
    return true;
  } catch {
    return false;
  }
}

export function loadPlants(): LoadResult {
  if (!storageWorks()) {
    writable = false;
    return { plants: [], canSave: false };
  }
  let raw: string | null;
  try {
    raw = localStorage.getItem(STORAGE_KEY);
  } catch {
    writable = false;
    return { plants: [], canSave: false };
  }
  if (raw === null) {
    writable = true;
    return { plants: [], canSave: true };
  }
  try {
    const doc = JSON.parse(raw) as unknown;
    if (
      typeof doc !== "object" ||
      doc === null ||
      (doc as { schemaVersion?: unknown }).schemaVersion !== SCHEMA_VERSION ||
      !Array.isArray((doc as { plants?: unknown }).plants)
    ) {
      throw new Error("Unsupported document");
    }
    const plants: Plant[] = [];
    for (const p of (doc as { plants: unknown[] }).plants) {
      if (isValidStoredPlant(p)) plants.push(p);
      else console.warn("PlantApp: skipped invalid stored plant", p);
    }
    writable = true;
    return { plants, canSave: true };
  } catch {
    // Keep the unreadable value untouched; run in memory only.
    writable = false;
    return { plants: [], canSave: false };
  }
}

/** Writes synchronously. Returns false when changes cannot be saved. */
export function savePlants(plants: Plant[]): boolean {
  if (!writable) return false;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ schemaVersion: SCHEMA_VERSION, plants }));
    return true;
  } catch {
    writable = false;
    return false;
  }
}

/** Calls onChange when another tab on the same device changes the stored plants (FR-016). */
export function subscribeToExternalChanges(onChange: () => void): () => void {
  const handler = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY || e.key === null) onChange();
  };
  window.addEventListener("storage", handler);
  return () => window.removeEventListener("storage", handler);
}
