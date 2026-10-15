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
let chyba = "";

export const stavSyncu = () => ({
  rezim,
  pocet: zvenku.length,
  chyba,
  // bez signálu to není špatné nastavení, jen se nemá kam připojit
  offline: typeof navigator !== "undefined" && navigator.onLine === false,
});
export const ostatniTymy = () => zvenku;

export async function spustSync(naZmenuPohledu) {
  prekresli = naZmenuPohledu;
  if (!SUPABASE_URL || !SUPABASE_KEY) return; // ukázkový režim

  rezim = "pripojuji";
  prekresli();
  try {
    const { createClient } = await nactiKlienta();
    klient = createClient(SUPABASE_URL, SUPABASE_KEY);
    // První čtení musí projít, jinak bychom se tvářili připojeně a nic by se nesdílelo.
    // Typicky tu spadne chybějící tabulka nebo špatný klíč – to se musí poznat.
    if (!(await nacti())) {
      rezim = "chyba";
      prekresli();
      return;
    }
    await posli();
    klient
      .channel(`tourdepub-${HRA}`)
      .on("postgres_changes", { event: "*", schema: "public", table: TABULKA, filter: `hra=eq.${HRA}` }, nacti)
      .subscribe();
    rezim = "zivo";
    naZmenu(posliOpatrne);
    // bez signálu zápis spadne; jak se síť vrátí, dopošle se
    addEventListener("online", posliOpatrne);
  } catch (e) {
    chyba = popisChyby(e);
    rezim = "chyba"; // nevadí, hra funguje dál lokálně
  }
  prekresli();
}

// Verze musí umět nový formát klíče (sb_publishable_…). Starší klient ho nepozná
// a připojení selže. Drž ji stejnou, jakou má untrois.
const VERZE_KLIENTA = "2.117.2";
const CDN = [
  `https://esm.sh/@supabase/supabase-js@${VERZE_KLIENTA}`,
  `https://cdn.jsdelivr.net/npm/@supabase/supabase-js@${VERZE_KLIENTA}/+esm`,
];

/** Stáhne klienta. Když první CDN nejede, zkusí druhé — na jedné adrese
 *  by celé živé pořadí viselo zbytečně. */
async function nactiKlienta() {
  let posledni;
  for (const adresa of CDN) {
    try { return await import(/* @vite-ignore */ adresa); }
    catch (e) { posledni = e; }
  }
  throw new Error("Nepodařilo se stáhnout klienta Supabase: " + popisChyby(posledni));
}

/** Zapisovat při každém ťuknutí by bylo zbytečně často, tak se to slučuje. */
function posliOpatrne() {
  if (cekaZapis) return;
  cekaZapis = true;
  setTimeout(() => { cekaZapis = false; posli(); }, 700);
}

async function posli() {
  if (!klient) return false;
  try {
    // posíláme všechny místní týmy – tenhle telefon může zapisovat víc partám
    const { error } = await klient.from(TABULKA).upsert(stav.tymy.map((t) => ({
      id: t.id,
      hra: HRA,
      nazev: t.nazev || "Bezejmenná parta",
      barva: t.barva,
      hospoda: indexHospody(t) + 1,
      body: body(t),
      rozpad: rozpad(t),
      upraveno: new Date().toISOString(),
    })));
    if (error) throw error;
    return true;
  } catch {
    return false; // offline: zůstane to v telefonu a pošle se příště
  }
}

async function nacti() {
  if (!klient) return false;
  try {
    const { data, error } = await klient.from(TABULKA).select("*").eq("hra", HRA);
    if (error) throw error;
    const mistni = new Set(stav.tymy.map((t) => t.id));
    zvenku = (data || []).filter((t) => !mistni.has(t.id));
    chyba = "";
    prekresli();
    return true;
  } catch (e) {
    chyba = popisChyby(e);
    prekresli();
    return false; // ponecháme poslední známé pořadí
  }
}

/** Supabase vrací kód i radu, a ty rozhodnou, co je špatně. Samotné „Failed to
 *  fetch" nestačí na nic. */
function popisChyby(e) {
  if (!e) return "neznámá chyba";
  const kusy = [];
  if (e.code) kusy.push(e.code);
  if (e.message) kusy.push(e.message);
  if (e.hint) kusy.push("Rada: " + e.hint);
  if (e.details) kusy.push(e.details);
  return kusy.length ? kusy.join(" · ") : String(e);
}

/** Zkusit se připojit znovu, aniž by se načítala celá stránka. */
export async function zkusZnovu() {
  klient = null;
  rezim = "ukazka";
  chyba = "";
  await spustSync(prekresli);
}
