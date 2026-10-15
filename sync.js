// Živé pořadí přes Supabase. Je to doplněk, ne podmínka: bez nastavení (nebo bez signálu)
// hra běží dál z telefonu a v Týmech jsou vidět jen ty místní.
// Klient se stahuje až když je co připojovat, aby web bez nastavení nenačítal nic zvenku.
import { SUPABASE_URL, SUPABASE_KEY, TABULKA, HRA } from "./nastaveni.js";
import { stav, naZmenu, body, rozpad, indexHospody } from "./stav.js";

let klient = null;
let rezim = "ukazka"; // ukazka | pripojuji | zivo | chyba
let zvenku = [];
let prekresli = () => {};
let cekaZapis = false;

export const stavSyncu = () => ({ rezim, pocet: zvenku.length });
export const ostatniTymy = () => zvenku;

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
      .channel(`tourdepub-${HRA}`)
      .on("postgres_changes", { event: "*", schema: "public", table: TABULKA, filter: `hra=eq.${HRA}` }, nacti)
      .subscribe();
    rezim = "zivo";
    naZmenu(posliOpatrne);
    // bez signálu zápis spadne; jak se síť vrátí, dopošle se
    addEventListener("online", posliOpatrne);
  } catch {
    rezim = "chyba"; // nevadí, hra funguje dál lokálně
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
    // posíláme všechny místní týmy – tenhle telefon může zapisovat víc partám
    await klient.from(TABULKA).upsert(stav.tymy.map((t) => ({
      id: t.id,
      hra: HRA,
      nazev: t.nazev || "Bezejmenná parta",
      barva: t.barva,
      hospoda: indexHospody(t) + 1,
      body: body(t),
      rozpad: rozpad(t),
      upraveno: new Date().toISOString(),
    })));
  } catch {
    // offline: zůstane to v telefonu a pošle se příště
  }
}

async function nacti() {
  if (!klient) return;
  try {
    const { data } = await klient.from(TABULKA).select("*").eq("hra", HRA);
    const mistni = new Set(stav.tymy.map((t) => t.id));
    zvenku = (data || []).filter((t) => !mistni.has(t.id));
    prekresli();
  } catch {
    // ponecháme poslední známé pořadí
  }
}
