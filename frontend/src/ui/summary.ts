// "Needs attention" summary of every active alert (FR-013; data-model "Summary ordering").
import type { Alert } from "../domain/alerts";
import type { Plant } from "../domain/plant";

const TYPE_ORDER: Record<Alert["type"], number> = { "bring-inside": 0, "needs-water": 1 };
const LABEL: Record<Alert["type"], string> = { "bring-inside": "Bring inside", "needs-water": "Needs water" };

/** Bring-inside first (time-sensitive), then dueAt ascending with never-watered (null) first, then name. */
export function orderAlerts(alerts: Alert[], plants: Plant[]): Alert[] {
  const names = new Map(plants.map((p) => [p.id, p.name]));
  return [...alerts].sort((a, b) => {
    if (a.type !== b.type) return TYPE_ORDER[a.type] - TYPE_ORDER[b.type];
    if (a.dueAt !== b.dueAt) {
      if (a.dueAt === null) return -1;
      if (b.dueAt === null) return 1;
      return a.dueAt - b.dueAt;
    }
    return (names.get(a.plantId) ?? "").localeCompare(names.get(b.plantId) ?? "");
  });
}

export function createSummary(): { element: HTMLElement; update(alerts: Alert[], plants: Plant[]): void } {
  const section = document.createElement("section");
  section.className = "card summary";
  section.setAttribute("aria-label", "Needs attention");
  section.setAttribute("aria-live", "polite");

  const heading = document.createElement("h2");
  heading.textContent = "Needs attention";
  const body = document.createElement("div");
  section.append(heading, body);

  return {
    element: section,
    update(alerts, plants) {
      const names = new Map(plants.map((p) => [p.id, p.name]));
      if (alerts.length === 0) {
        const ok = document.createElement("p");
        ok.className = "all-good";
        ok.textContent = "All plants are taken care of.";
        body.replaceChildren(ok);
        return;
      }
      const count = document.createElement("p");
      count.textContent = `${alerts.length} ${alerts.length === 1 ? "alert" : "alerts"}`;
      const list = document.createElement("ul");
      for (const a of orderAlerts(alerts, plants)) {
        const li = document.createElement("li");
        li.textContent = `${names.get(a.plantId) ?? "Unknown plant"} — ${LABEL[a.type]}`;
        list.append(li);
      }
      body.replaceChildren(count, list);
    },
  };
}
