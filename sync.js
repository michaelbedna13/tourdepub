// Živé pořadí přes Supabase. Je to doplněk, ne podmínka: bez nastavení (nebo bez signálu)
// hra běží dál z telefonu a pořadí ukáže jenom vlastní partu.
// Klient se stahuje až když je co připojovat, aby web bez nastavení nic nenačítal zvenku.
import { SUPABASE_URL, SUPABASE_KEY, HRA } from "./nastaveni.js";
import { stav, naZmenu, body, rozpad } from "./stav.js";

let klient = null;
let rezim = "ukazka"; // ukazka | pripojuji | zivo | chyba
let ostatni = [];
let prekresli = () => {};
let cekaZapis = false;

export const stavSyncu = () => ({ rezim, pocet: ostatni.length });
export const ostatniParty = () => ostatni;

export async function spustSync(naZmenuPohledu) {
  prekresli = naZmenuPohledu;
  if (!SUPABASE_URL || !SUPABASE_KEY) return; // ukázkový režim

  rezim = "pripojuji";
  prekresli();
  try {
    const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2.45.4");
    klient = createClient(SUPABASE_URL, SUPABASE_KEY);
    await posli();
    await nacti();
    klient
      .channel(`party-${HRA}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "party", filter: `hra=eq.${HRA}` }, nacti)
      .subscribe();
    rezim = "zivo";
    naZmenu(posliOpatrne);
    // bez signálu zápis spadne; jak se síť vrátí, dopošle se
    addEventListener("online", posliOpatrne);
  } catch {
    // nevadí – hra funguje dál lokálně
    rezim = "chyba";
  }
  prekresli();
}

/** Zapisovat při každém ťuknutí by bylo zbytečně často, tak se to slučuje. */
function posliOpatrne() {
  if (cekaZapis) return;
  cekaZapis = true;
  setTimeout(() => { cekaZapis = false; posli(); }, 700);
}

async function posli() {
  if (!klient) return;
  try {
    await klient.from("party").upsert({
      id: stav.parta.id,
      hra: HRA,
      nazev: stav.parta.nazev || "Bezejmenná parta",
      barva: stav.parta.barva,
      hospoda: stav.hospoda,
      body: body(),
      rozpad: rozpad(),
      upraveno: new Date().toISOString(),
    });
  } catch {
    // offline: zůstane to v telefonu a pošle se příště
  }
}

async function nacti() {
  if (!klient) return;
  try {
    const { data } = await klient.from("party").select("*").eq("hra", HRA);
    ostatni = (data || []).filter((p) => p.id !== stav.parta.id);
    prekresli();
  } catch {
    // ponecháme poslední známé pořadí
  }
}
