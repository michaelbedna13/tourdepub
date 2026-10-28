// Živé pořadí přes Supabase. Je to doplněk, ne podmínka: bez nastavení (nebo bez signálu)
// hra běží dál z telefonu a v Týmech jsou vidět jen ty místní.
// Klient se nahrává až když je co připojovat (dynamický import), ať se kvůli něčemu,
// co nemusí být zapnuté, nestahuje ke každému spuštění sto kilobajtů.
import { useSyncExternalStore } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { SUPABASE_URL, SUPABASE_KEY, TABULKA, HRA } from "./nastaveni";
import { stav, naZmenu, kOdeslani, slucZeServeru, type RadekTymu } from "./stav";

/** ukazka = jen tenhle telefon · pripojuji · zivo · chyba = nepodařilo se */
export type Rezim = "ukazka" | "pripojuji" | "zivo" | "chyba";

export interface StavSyncu {
  rezim: Rezim;
  /** Kolik řádků stojí na serveru. */
  pocet: number;
  chyba: string;
  /** Bez signálu to není špatné nastavení, jen se nemá kam připojit. */
  offline: boolean;
}

let klient: SupabaseClient | null = null;
let rezim: Rezim = "ukazka";
let naposledy: RadekTymu[] = [];
// První čtení se slučuje vždycky, i když vyjde prázdné: může znamenat, že
// ostatní své party mezitím smazali a naše uložená kopie je má zahodit.
let prvniCteni = true;
let cekaZapis = false;
let chyba = "";

let revize = 0;
const posluchaci = new Set<() => void>();
function zmena() {
  revize++;
  posluchaci.forEach((f) => f());
}

export const stavSyncu = (): StavSyncu => ({
  rezim,
  pocet: naposledy.length,
  chyba,
  offline: typeof navigator !== "undefined" && navigator.onLine === false,
});

/** Přihlásí obrazovku na změny připojení. */
export function useSync(): StavSyncu {
  useSyncExternalStore(
    (f) => { posluchaci.add(f); return () => posluchaci.delete(f); },
    () => revize,
    () => revize,
  );
  return stavSyncu();
}

let spusteno = false;

export async function spustSync() {
  if (spusteno) return;
  spusteno = true;
  if (!SUPABASE_URL || !SUPABASE_KEY) return; // ukázkový režim

  rezim = "pripojuji";
  zmena();
  try {
    const { createClient } = await import("@supabase/supabase-js");
    klient = createClient(SUPABASE_URL, SUPABASE_KEY);
    // První čtení musí projít, jinak bychom se tvářili připojeně a nic by se nesdílelo.
    // Typicky tu spadne chybějící tabulka nebo špatný klíč – to se musí poznat.
    if (!(await nacti())) {
      rezim = "chyba";
      zmena();
      return;
    }
    await posli();
    klient
      .channel(`tourdepub-${HRA}`)
      .on("postgres_changes", { event: "*", schema: "public", table: TABULKA, filter: `hra=eq.${HRA}` },
          () => { nacti(); })
      .subscribe();
    rezim = "zivo";
    naZmenu(posliOpatrne);
    // Živý kanál je hlavní cesta, ale sám nestačí. Když telefon zhasne nebo
    // se appka přepne na pozadí, websocket umře — a co mezitím ostatní
    // zapsali, se nedožene: realtime události rozesílá, nedoručené nedrží.
    // Takže se při návratu k obrazovce (a při návratu signálu) čte znovu,
    // a dokud se na appku někdo kouká, jede pomalý doptávací takt. Je to
    // pojistka i pro případ, že by v Supabase nebyla tabulka v publikaci
    // supabase_realtime — pak kanál mlčí a bez taktu by se nedělo nic.
    document.addEventListener("visibilitychange", priNavratu);
    addEventListener("online", priNavratu);
    takt();
  } catch (e) {
    chyba = popisChyby(e);
    rezim = "chyba"; // nevadí, hra funguje dál lokálně
  }
  zmena();
}

/** Jak často se appka doptá serveru, i když živý kanál mlčí. Pětadvacet
 *  vteřin: pořadí part není burza, a telefon v hospodě má jiné starosti
 *  než držet spojení na milisekundy. */
const TAKT = 25_000;
let hodiny: ReturnType<typeof setInterval> | undefined;

function takt() {
  clearInterval(hodiny);
  hodiny = undefined;
  if (typeof document === "undefined" || document.visibilityState !== "visible") return;
  hodiny = setInterval(() => { if (document.visibilityState === "visible") nacti(); }, TAKT);
}

/** Appka se vrátila na obrazovku nebo se vrátil signál: dohnat, co uteklo,
 *  a dopsat, co se nestihlo odeslat. */
function priNavratu() {
  if (document.visibilityState !== "visible") { takt(); return; }
  nacti();
  posliOpatrne();
  takt();
}

/** Zapisovat při každém ťuknutí by bylo zbytečně často, tak se to slučuje. */
function posliOpatrne() {
  if (cekaZapis) return;
  cekaZapis = true;
  setTimeout(() => { cekaZapis = false; posli(); }, 700);
}

async function posli(): Promise<boolean> {
  if (!klient) return false;
  try {
    // Posílají se jen týmy, se kterými někdo opravdu pracuje. Tým, co si appka
    // založila sama a nikdo se ho nedotkl, zůstane jen v telefonu.
    const k = stav.tymy.filter((t) => t.vlastni);
    if (!k.length) return true;
    // hra se přidává až tady: kOdeslani() popisuje tým, do které hry patří
    // je věc připojení. Bez něj zápis spadne — sloupec je not null a appka
    // by se k serveru hlásila, aniž by do něj kdy něco dostala.
    //
    // barva je pozůstatek. Party ji měly, než se z týmu stalo jenom jméno
    // (viz „Tým je jméno, ne barva"), jenže sloupec v tabulce zůstal povinný.
    // Posílá se prázdná, ať nemusí nikdo sahat do databáze; nová tabulka
    // z supabase/party.sql už ji povinnou nemá a časem může zmizet.
    const radky = k.map((t) => ({ ...kOdeslani(t), hra: HRA, barva: "" }));
    const { error } = await klient.from(TABULKA).upsert(radky);
    if (error) throw error;
    return true;
  } catch (e) {
    // Rozdíl mezi „není signál" a „zápis neprojde nikdy" se musí poznat.
    // Chyba z PostgRESTu má kód a znamená nastavení, ne síť: taková se
    // ohlásí, jinak se appka tváří připojeně a nic neposílá — přesně ten
    // stav, co je ze všech nejhorší. Výpadek sítě kód nemá a mlčí se,
    // zápis se zkusí znovu.
    if ((e as { code?: string })?.code) {
      chyba = popisChyby(e);
      rezim = "chyba";
      zmena();
    }
    return false;
  }
}

async function nacti(): Promise<boolean> {
  if (!klient) return false;
  try {
    const { data, error } = await klient.from(TABULKA).select("*").eq("hra", HRA);
    if (error) throw error;
    const nove = (data || []) as RadekTymu[];
    // Doptávací takt běží pořád, ale většinou se nic nezměnilo. Slučovat
    // a ukládat naprázdno každých pětadvacet vteřin by jen překreslovalo
    // obrazovku pod rukama.
    const jine = prvniCteni || JSON.stringify(nove) !== JSON.stringify(naposledy);
    naposledy = nove;
    prvniCteni = false;
    if (jine) slucZeServeru(naposledy); // uloz() uvnitř překreslí obrazovky
    chyba = "";
    zmena();
    return true;
  } catch (e) {
    chyba = popisChyby(e);
    zmena();
    return false; // ponecháme poslední známé pořadí
  }
}

/** Supabase vrací kód i radu, a ty rozhodnou, co je špatně. Samotné „Failed to
 *  fetch“ nestačí na nic. Nejčastější případy rovnou přeložíme do rady,
 *  co s tím, ať se nemusí luštit anglická hláška v hospodě. */
function popisChyby(e: unknown): string {
  if (!e) return "neznámá chyba";
  const o = e as { code?: string; message?: string; hint?: string; details?: string };
  const kod = o.code || "";
  const zprava = o.message || String(e);

  // sloupec, který appka neposílá, a tabulka ho vyžaduje
  if (kod === "23502" || /not-null constraint|null value in column/i.test(zprava))
    return `Tabulka „${TABULKA}“ čeká sloupec, který appka neposílá. Spusť v Supabase SQL Editoru znovu obsah supabase/party.sql.`;
  // tabulka v projektu není
  if (kod === "PGRST205" || kod === "42P01" || /schema cache|does not exist/i.test(zprava))
    return `Tabulka „${TABULKA}“ v projektu není. Spusť v Supabase SQL Editoru obsah supabase/party.sql.`;
  // klíč neplatí nebo je starý
  if (kod === "PGRST301" || kod === "401" || /JWT|api key|Invalid authentication/i.test(zprava))
    return "Klíč neplatí. Zkontroluj SUPABASE_KEY v src/lib/nastaveni.ts proti Settings → API v Supabase.";
  // čtení zakázané pravidly
  if (kod === "42501" || /row-level security|permission denied/i.test(zprava))
    return "Pravidla (RLS) nepouští ke čtení. Spusť v Supabase znovu část se zásadami z supabase/party.sql.";
  // Spojení neprošlo. Tohle jediné nastane i během hry, a to u party v hospodě,
  // ne u toho, kdo appku stavěl — proto se nikam neposílá do zdrojáků. Podrobnost
  // (adresa projektu, DNS) je v konzoli, kdyby to byla opravdu špatná adresa.
  if (/Failed to fetch|NetworkError|ERR_NAME_NOT_RESOLVED/i.test(zprava)) {
    console.warn("Tour de Pub: spojení se serverem neprošlo.", e);
    return "Není signál, nebo server neodpovídá. Zapisuje se dál do telefonu a srovná se to, až bude spojení.";
  }

  const kusy: string[] = [];
  if (kod) kusy.push(kod);
  kusy.push(zprava);
  if (o.hint) kusy.push("Rada: " + o.hint);
  if (o.details) kusy.push(o.details);
  return kusy.join(" · ");
}

/** Smaže tým i ze serveru. Bez toho by se po smazání vrátil zpátky jako „cizí“
 *  tým z jiného telefonu a strašil by v pořadí dál. */
export async function smazTymZeServeru(id: string) {
  if (!klient) return;
  try {
    await klient.from(TABULKA).delete().eq("id", id);
    naposledy = naposledy.filter((t) => t.id !== id);
    zmena();
  } catch {
    // nevadí, místní stav je už bez něj
  }
}

/** Zkusit se připojit znovu, aniž by se načítala celá stránka. */
export async function zkusZnovu() {
  klient = null;
  rezim = "ukazka";
  chyba = "";
  spusteno = false;
  await spustSync();
}
