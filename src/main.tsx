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

/** Počká na styl appky.
 *
 *  Ve vybuildované appce visí styl v hlavičce jako `media="print"`, aby
 *  neblokoval první vykreslení (viz stylNeblokuje() ve vite.config.ts).
 *  Úvodní obrazovka s logem má svůj styl rovnou v index.html, takže se
 *  ukáže hned — ale React jí to logo vzápětí přebírá a kreslí svoje. Kdyby
 *  se do toho pustil dřív, než styl dorazí, mrklo by na okamžik nevysázené
 *  logo přilepené nahoře vlevo. Proto se čeká.
 *
 *  Ve vývoji žádný takový <link> není (styly chodí přes skript), takže se
 *  pokračuje rovnou. Když se styl nepodaří stáhnout, nečeká se věčně —
 *  od toho je strop. */
function pockejNaStyl(): Promise<unknown> {
  const l = document.getElementById("styl-appky") as HTMLLinkElement | null;
  // sheet je k dispozici, jakmile je soubor v prohlížeči (i u media="print")
  if (!l || l.sheet) return Promise.resolve();
  return new Promise((h) => {
    l.addEventListener("load", h, { once: true });
    l.addEventListener("error", h, { once: true });
    setTimeout(h, 3000);
  });
}

pockejNaStyl().then(() => {
  createRoot(document.getElementById("app")!).render(
    <StrictMode>
      <Zachrana>
        <App />
      </Zachrana>
    </StrictMode>,
  );
});
