import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./styles/pisma.css";
import "./styles/app.css";
import { App } from "./App";
import { Zachrana } from "./components/Zachrana";

// chová se jako appka: přibližování dvěma prsty nic nepřinese a jen rozhodí
// rozložení (iOS ignoruje user-scalable=no, proto i gesta)
const stopZoom = (e: Event) => e.preventDefault();
document.addEventListener("gesturestart", stopZoom, { passive: false });
document.addEventListener("gesturechange", stopZoom, { passive: false });

// Dřív tu byl service worker kvůli běhu bez signálu. V hospodách na trase signál
// je, takže nic nepřinášel a jen bránil tomu, aby se nová verze dostala do
// telefonu. Tohle po něm uklidí na zařízeních, kde ještě zůstal.
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.getRegistrations()
    .then((r) => r.forEach((x) => x.unregister()))
    .catch(() => {});
  if (window.caches) caches.keys().then((k) => k.forEach((x) => caches.delete(x))).catch(() => {});
}

createRoot(document.getElementById("app")!).render(
  <StrictMode>
    <Zachrana>
      <App />
    </Zachrana>
  </StrictMode>,
);
