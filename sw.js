// Service worker: uloží web do telefonu, ať funguje i bez signálu.
// Při změně webu zvedni VERZE, jinak si telefon nechá starou verzi.
const VERZE = "tourdepub-7";
const SOUBORY = [
  ".", "index.html", "styl.css", "app.js", "stav.js", "data.js", "ui.js",
  "ikony.js", "sync.js", "nastaveni.js", "logo.js", "logo.svg",
  "ikona.svg", "zrno.svg", "manifest.json",
  "pisma/archivo-black-lat.woff2", "pisma/archivo-black-ext.woff2",
  "pisma/psaci-lat.woff2", "pisma/psaci-ext.woff2",
  "pisma/outfit-400-lat.woff2", "pisma/outfit-400-ext.woff2",
  "pisma/outfit-500-lat.woff2", "pisma/outfit-500-ext.woff2",
  "pisma/outfit-600-lat.woff2", "pisma/outfit-600-ext.woff2",
  "uvodni/320x568@2x.png",
  "uvodni/375x667@2x.png",
  "uvodni/375x812@3x.png",
  "uvodni/390x844@3x.png",
  "uvodni/393x852@3x.png",
  "uvodni/402x874@3x.png",
  "uvodni/414x736@3x.png",
  "uvodni/414x896@2x.png",
  "uvodni/414x896@3x.png",
  "uvodni/428x926@3x.png",
  "uvodni/430x932@3x.png",
  "uvodni/440x956@3x.png",
];

self.addEventListener("install", (e) => {
  // addAll spadne celé, když chybí jediný soubor – proto po jednom
  e.waitUntil(caches.open(VERZE)
    .then((c) => Promise.all(SOUBORY.map((s) => c.add(s).catch(() => {}))))
    .then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys()
    .then((k) => Promise.all(k.filter((x) => x !== VERZE).map((x) => caches.delete(x))))
    .then(() => self.clients.claim()));
});

self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== "GET" || url.origin !== location.origin) return;
  // Nejdřív síť (ať se změny projeví), při výpadku to, co máme uložené.
  e.respondWith(
    fetch(e.request)
      .then((odpoved) => {
        const kopie = odpoved.clone();
        caches.open(VERZE).then((c) => c.put(e.request, kopie)).catch(() => {});
        return odpoved;
      })
      .catch(() => caches.match(e.request).then((z) => z || caches.match("index.html")))
  );
});
