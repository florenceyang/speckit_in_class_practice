import "./styles.css";
import { loadPlants, subscribeToExternalChanges } from "./storage/store";
import { mountApp } from "./ui/render";

const root = document.getElementById("app");
if (!root) throw new Error("PlantApp: #app root element missing");

const app = mountApp(root, loadPlants());

// Another tab on the same shared device changed the data (FR-016).
subscribeToExternalChanges(() => app.replace(loadPlants()));

// Re-evaluate alerts while the app is open so they appear within 1 minute of becoming due (FR-012).
// Alerts are in-app only: no Notification API, sounds, or network calls (FR-012, Principle IV).
const ALERT_TICK_MS = 30_000;
setInterval(() => app.rerender(), ALERT_TICK_MS);
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible") app.rerender();
});
