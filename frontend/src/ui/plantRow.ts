// One plant in the list: status text, alert badges, and action buttons (ui-contract "Plant row").
import type { PlantChanges } from "../domain/actions";
import type { Alert } from "../domain/alerts";
import type { FieldErrors, Plant } from "../domain/plant";
import { formatDateTime, fromDateTimeLocalValue, toDateTimeLocalValue } from "./format";
import { buildForm, plantFields, readPlantInput, type FieldSpec } from "./plantForm";

export interface RowHandlers {
  water(id: string): void;
  putOutside(id: string): void;
  bringInside(id: string): void;
  startEdit(id: string): void;
  cancelEdit(): void;
  save(id: string, changes: PlantChanges): FieldErrors | null;
  remove(id: string): void;
}

function button(label: string, onClick: () => void, className?: string): HTMLButtonElement {
  const b = document.createElement("button");
  b.type = "button";
  b.textContent = label;
  if (className) b.className = className;
  b.addEventListener("click", onClick);
  return b;
}

function text(tag: string, content: string, className?: string): HTMLElement {
  const el = document.createElement(tag);
  el.textContent = content;
  if (className) el.className = className;
  return el;
}

function rowShell(plant: Plant): HTMLLIElement {
  const li = document.createElement("li");
  li.className = "plant card";
  li.dataset.testid = `plant-${plant.id}`;
  li.setAttribute("data-testid", `plant-${plant.id}`);
  li.append(text("h2", plant.name, "plant__name"));
  return li;
}

const BADGES = {
  "needs-water": { text: "Needs water", className: "badge badge--water", testId: "badge-needs-water" },
  "bring-inside": { text: "Bring inside", className: "badge badge--inside", testId: "badge-bring-inside" },
} as const;

export function renderPlantRow(plant: Plant, alerts: Alert[], handlers: RowHandlers): HTMLLIElement {
  const li = rowShell(plant);

  if (alerts.length > 0) {
    const badges = document.createElement("div");
    badges.className = "badges";
    for (const a of alerts) {
      const spec = BADGES[a.type];
      const badge = text("span", spec.text, spec.className);
      badge.setAttribute("data-testid", spec.testId);
      badges.append(badge);
    }
    li.append(badges);
  }

  const days = plant.wateringIntervalDays;
  li.append(text("p", `Every ${days} ${days === 1 ? "day" : "days"}`, "plant__interval"));
  li.append(
    text(
      "p",
      plant.lastWateredAt === null ? "Never watered" : `Last watered: ${formatDateTime(plant.lastWateredAt)}`,
      "plant__watered",
    ),
  );

  const location = text(
    "p",
    plant.location === "outside" && plant.putOutsideAt !== null
      ? `Outside since ${formatDateTime(plant.putOutsideAt)}`
      : "Inside",
    "plant__location",
  );
  location.setAttribute("data-testid", "plant-location");
  li.append(location);

  const actions = document.createElement("div");
  actions.className = "actions";
  actions.append(button("Watered", () => handlers.water(plant.id)));
  if (plant.location === "inside") {
    actions.append(button("Put outside", () => handlers.putOutside(plant.id), "secondary"));
  } else {
    actions.append(
      button("Bring inside", () => handlers.bringInside(plant.id)),
      button(
        "Put outside again",
        () => {
          // FR-007: resetting the put-outside time requires confirmation.
          if (window.confirm(`Reset the time ${plant.name} was put outside?`)) handlers.putOutside(plant.id);
        },
        "secondary",
      ),
    );
  }
  actions.append(
    button("Edit", () => handlers.startEdit(plant.id), "secondary"),
    button(
      "Delete",
      () => {
        if (window.confirm(`Delete ${plant.name}?`)) handlers.remove(plant.id);
      },
      "danger",
    ),
  );
  li.append(actions);
  return li;
}

/** Inline edit form (FR-003, FR-015). Kept mounted across periodic re-renders. */
export function renderEditRow(plant: Plant, handlers: RowHandlers): HTMLLIElement {
  const li = rowShell(plant);
  li.dataset.editing = "true";

  const lastWateredValue = plant.lastWateredAt === null ? "" : toDateTimeLocalValue(plant.lastWateredAt);
  const putOutsideValue =
    plant.location === "outside" && plant.putOutsideAt !== null ? toDateTimeLocalValue(plant.putOutsideAt) : "";
  const fields: FieldSpec[] = [
    ...plantFields(plant),
    { name: "lastWateredAt", label: "Correct last watered", type: "datetime-local", value: lastWateredValue },
  ];
  if (plant.location === "outside") {
    fields.push({ name: "putOutsideAt", label: "Correct time put outside", type: "datetime-local", value: putOutsideValue });
  }
  const { form, inputs, showErrors } = buildForm(`Edit ${plant.name}`, fields);

  const actions = document.createElement("div");
  actions.className = "actions";
  const save = document.createElement("button");
  save.type = "submit";
  save.textContent = "Save";
  actions.append(save, button("Cancel", () => handlers.cancelEdit(), "secondary"));
  form.append(actions);

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const changes: PlantChanges = readPlantInput(inputs);
    const lw = inputs.get("lastWateredAt")!.value;
    // Only apply a correction when the user changed the value (inputs have minute precision).
    if (lw !== lastWateredValue) changes.lastWateredAt = fromDateTimeLocalValue(lw);
    const po = inputs.get("putOutsideAt");
    if (po && po.value !== putOutsideValue) changes.putOutsideAt = fromDateTimeLocalValue(po.value);
    const errors = handlers.save(plant.id, changes);
    if (errors) showErrors(errors);
  });

  li.append(form);
  return li;
}
