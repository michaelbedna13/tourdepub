// Service worker, který se sám odhlásí a uklidí po sobě.
//
// Dřív tu jeden byl, aby web fungoval bez signálu. Ve všech hospodách na trase
// ale signál je, takže nic nepřinášel – jen se kvůli němu nová verze dostávala
// do telefonu až na popohnání a jednou zůstala i černá plocha.
//
// Prázdný soubor by nestačil: prohlížeč, který si ten starý zaregistroval, by
// si ho držel dál. Proto tahle verze, která se odregistruje a smaže zásobu.
// Až budou všechna zařízení chvíli bez něj, může soubor zmizet úplně.

self.addEventListener("install", () => self.skipWaiting());

self.addEventListener("activate", (e) => {
  e.waitUntil((async () => {
    for (const klic of await caches.keys()) await caches.delete(klic);
    await self.registration.unregister();
    for (const klient of await self.clients.matchAll()) klient.navigate(klient.url);
  })());
});
