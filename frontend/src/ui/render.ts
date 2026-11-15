// App shell: owns state, persists after every action, and re-renders (ui-contract "Screen layout").
import { addPlant, deletePlant, markInside, markOutside, markWatered, updatePlant } from "../domain/actions";
import { computeAlerts, type Alert } from "../domain/alerts";
import type { Plant } from "../domain/plant";
import { savePlants } from "../storage/store";
import { createAddPlantForm } from "./plantForm";
import { renderEditRow, renderPlantRow, type RowHandlers } from "./plantRow";
import { createSummary } from "./summary";

export interface AppState {
  plants: Plant[];
  canSave: boolean;
}

/** Single clock source so tests can control time (Playwright page.clock / Vitest fake timers). */
export function getNow(): number {
  return Date.now();
}

export interface App {
  state: AppState;
  /** Apply a state change, save it synchronously, then re-render. */
  dispatch(updater: (plants: Plant[]) => Plant[]): void;
  /** Replace state from storage (e.g. another tab changed it) and re-render. */
  replace(next: AppState): void;
  rerender(): void;
}

export function mountApp(root: HTMLElement, initial: AppState): App {
  root.innerHTML = "";
  let editingId: string | null = null;

  const heading = document.createElement("h1");
  heading.textContent = "PlantApp";

  const warning = document.createElement("p");
  warning.setAttribute("role", "alert");
  warning.className = "storage-warning";
  warning.textContent = "Changes can't be saved on this device.";

  const list = document.createElement("ul");
  list.setAttribute("aria-label", "Plants");
  list.className = "plant-list";

  const addForm = createAddPlantForm((input) => {
    const r = addPlant(app.state.plants, input, getNow());
    if ("errors" in r) return r.errors;
    app.dispatch(() => r.plants);
    return null;
  });

  const summary = createSummary();

  root.append(heading, warning, summary.element, addForm, list);

  const handlers: RowHandlers = {
    water: (id) => app.dispatch((plants) => markWatered(plants, id, getNow())),
    putOutside: (id) => app.dispatch((plants) => markOutside(plants, id, getNow())),
    bringInside: (id) => app.dispatch((plants) => markInside(plants, id)),
    startEdit: (id) => {
      editingId = id;
      app.rerender();
    },
    cancelEdit: () => {
      editingId = null;
      app.rerender();
    },
    save: (id, changes) => {
      const r = updatePlant(app.state.plants, id, changes, getNow());
      if ("errors" in r) return r.errors;
      editingId = null;
      app.dispatch(() => r.plants);
      return null;
    },
    remove: (id) => {
      if (editingId === id) editingId = null;
      app.dispatch((plants) => deletePlant(plants, id));
    },
  };

  function renderList(alerts: Alert[]) {
    const plants = [...app.state.plants].sort((a, b) => a.createdAt - b.createdAt);
    if (editingId && !plants.some((p) => p.id === editingId)) editingId = null;

    // Keep an open edit form mounted so periodic re-renders don't discard what the user typed.
    const existingEdit = editingId
      ? list.querySelector<HTMLLIElement>(`li[data-editing="true"][data-testid="plant-${CSS.escape(editingId)}"]`)
      : null;

    const rows = plants.map((p) => {
      if (p.id === editingId) return existingEdit ?? renderEditRow(p, handlers);
      return renderPlantRow(p, alerts.filter((a) => a.plantId === p.id), handlers);
    });
    list.replaceChildren(...rows);
  }

  const app: App = {
    state: initial,
    dispatch(updater) {
      const plants = updater(app.state.plants);
      const saved = savePlants(plants);
      app.state = { plants, canSave: app.state.canSave && saved };
      app.rerender();
    },
    replace(next) {
      app.state = next;
      app.rerender();
    },
    rerender() {
      warning.hidden = app.state.canSave;
      // Alerts are computed once per render and shared by every view (FR-009, FR-011).
      const alerts = computeAlerts(app.state.plants, getNow());
      summary.update(alerts, app.state.plants);
      renderList(alerts);
    },
  };

  app.rerender();
  return app;
}
