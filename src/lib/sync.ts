// Živé pořadí přes Supabase. Je to doplněk, ne podmínka: bez nastavení (nebo bez signálu)
// hra běží dál z telefonu a v Týmech jsou vidět jen ty místní.
// Čte a zapisuje se pod přihlášeným účtem (lib/prihlaseni.ts), takže se
// připojuje až po zadání hesla hry. Nepřihlášeného server do tabulky nepustí.
import { useSyncExternalStore } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { SUPABASE_URL, SUPABASE_KEY, TABULKA, TABULKA_HRY, HRA } from "./nastaveni";
import { aktualniUcet, dejKlienta } from "./prihlaseni";
import { stav, naZmenu, kOdeslani, knihaRadku, poOdeslani, slucZeServeru, prevezmiSeznamy, seznamyKOdeslani, seznamyOdeslany, type RadekHry, type RadekTymu } from "./stav";
import * as K from "./kniha";

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
let prihlaseno = false;

export async function spustSync() {
  if (spusteno) return;
  spusteno = true;
  if (!SUPABASE_URL || !SUPABASE_KEY) return; // ukázkový režim

  rezim = "pripojuji";
  zmena();
  try {
    klient = await dejKlienta();
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
      .on("postgres_changes", { event: "*", schema: "public", table: TABULKA_HRY, filter: `hra=eq.${HRA}` },
          () => { nacti(); })
      .on("postgres_changes", { event: "*", schema: "public", table: TABULKA, filter: `hra=eq.${HRA}` },
          () => { nacti(); })
      .subscribe();
    rezim = "zivo";
    // Posluchači se přihlašují jen poprvé. „Zkusit znovu" prochází tudy
    // znovu a každé kolo by jinak přidalo další sadu: po třech pokusech by
    // se při návratu do appky četlo třikrát naráz.
    if (!prihlaseno) {
      prihlaseno = true;
      naZmenu(posliOpatrne);
      document.addEventListener("visibilitychange", priNavratu);
      addEventListener("online", priNavratu);
    }
    // Živý kanál je hlavní cesta, ale sám nestačí. Když telefon zhasne nebo
    // se appka přepne na pozadí, websocket umře — a co mezitím ostatní
    // zapsali, se nedožene: realtime události rozesílá, nedoručené nedrží.
    // Takže se při návratu k obrazovce (a při návratu signálu) čte znovu,
    // a dokud se na appku někdo kouká, jede pomalý doptávací takt. Je to
    // pojistka i pro případ, že by v Supabase nebyla tabulka v publikaci
    // supabase_realtime — pak kanál mlčí a bez taktu by se nedělo nic.
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
  if (!klient) return; // odhlášeno: není komu se doptávat
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

/** Běží zrovna odesílání? Dvě naráz by si přetahovaly stejné verze. */
let odesila = false;
let znova = false;

async function posli(): Promise<boolean> {
  if (!klient) return false;
  if (odesila) { znova = true; return true; }
  odesila = true;
  try {
    // Posílají se jen týmy, se kterými někdo opravdu pracuje (vlastni), a jen
    // ty, které mají v telefonu něco, co na serveru ještě není (neodeslano).
    // Cizí týmy, které sem jen přitekly, se neposílají: tenhle telefon k nim
    // nic nepřidal.
    await posliSeznamy();
    for (const t of stav.tymy.filter((x) => x.vlastni && x.neodeslano)) await posliTym(t.id);
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
  } finally {
    odesila = false;
    if (znova) { znova = false; posliOpatrne(); }
  }
}

/** Chybí na serveru tabulka s hospodami a úkoly? Pak appka běží jako
 *  dřív (seznamy jen v telefonu) a neotravuje chybou. */
let bezTabulkyHry = false;
const chybiTabulka = (e: { code?: string; message?: string } | null) =>
  !!e && (e.code === "PGRST205" || e.code === "42P01" || /schema cache|does not exist/i.test(e.message || ""));

/** Správce změnil hospody nebo úkoly: pošle celý seznam. Upravuje jen
 *  správce, takže stačí „poslední vyhrává“; hráčům to server ani nedovolí. */
async function posliSeznamy() {
  if (!klient || bezTabulkyHry || aktualniUcet() !== "spravce" || !stav.seznamyNeodeslano) return;
  const odeslane = seznamyKOdeslani();
  const upraveno = new Date().toISOString();
  const { data, error } = await klient.from(TABULKA_HRY)
    .upsert({ hra: HRA, ...odeslane, upraveno }, { onConflict: "hra" }).select();
  if (chybiTabulka(error)) { bezTabulkyHry = true; return; }
  if (error) throw error;
  seznamyOdeslany((data?.[0] as RadekHry | undefined)?.upraveno || upraveno, odeslane);
}

/** Kolikrát to telefon zkusí, když mu někdo pořád zapisuje pod rukama. */
const POKUSU = 6;

/** Zapíše jeden tým tak, aby nepřepsal cizí zápis.
 *
 *  Dřív šel nahoru celý tým a vyhrál, kdo zapsal poslední: když za jeden tým
 *  ťukaly dva telefony naráz, čárka z jednoho se ztratila. Teď:
 *   1. vezme řádek, jak ho naposledy viděl na serveru (i s číslem verze),
 *   2. sloučí jeho knihu se svou (lib/kniha.ts, po položkách),
 *   3. zapíše jen „pokud je na serveru pořád ta verze“ a zvedne ji o jednu,
 *   4. když mezitím zapsal někdo jiný (nic se nezapsalo), stáhne řádek
 *      znova a jde od jedničky.
 *  Nikdy tedy nezapíše knihu, ve které by chybělo něco, co na serveru je. */
async function posliTym(id: string) {
  const k = klient!;
  const spravce = aktualniUcet() === "spravce";
  let r = naposledy.find((x) => x.id === id);

  for (let pokus = 0; pokus < POKUSU; pokus++) {
    const t = stav.tymy.find((x) => x.id === id);
    if (!t) return;

    // Tým, který na serveru ještě není. Zakládat smí jen správce (hlídá to
    // server); hráči zůstane jen v telefonu, ať appka neplive chybu při
    // každé čárce.
    if (!r) {
      if (!spravce) return;
      // hra se přidává až tady: do které hry tým patří, je věc připojení.
      // barva je pozůstatek povinného sloupce, posílá se prázdná.
      const radek = { ...kOdeslani(t), hra: HRA, barva: "", verze: 1 };
      const { data, error } = await k.from(TABULKA).insert(radek).select();
      if (!error && data?.length) { zapsano(data[0] as RadekTymu, radek.stav.kniha!, radek.nazev); return; }
      // Mezitím ho založil jiný telefon správce: stáhnout a sloučit.
      if (error && error.code !== "23505") throw error;
      r = await stahni(id);
      continue;
    }

    const kniha = K.sluc(t.kniha, knihaRadku(r));
    const radek = kOdeslani(t, kniha);
    const verze = r.verze ?? 0;
    // Hráč jméno neposílá: přejmenovat smí jen správce a server by zápis
    // s cizím jménem odmítl.
    const { nazev, ...bezJmena } = radek;
    const zmena = { ...(spravce ? radek : bezJmena), verze: verze + 1 };
    const { data, error } = await k.from(TABULKA).update(zmena)
      .eq("id", id).eq("verze", verze).select();
    if (error) throw error;
    if (data?.length) { zapsano(data[0] as RadekTymu, kniha, nazev); return; }
    // Nic se nezapsalo: na serveru je jiná verze, nebo tým mezitím zmizel.
    r = await stahni(id);
    if (!r) return; // smazal ho správce; při dalším čtení zmizí i tady
  }
  // Pořád někdo zapisuje pod rukama. Tým zůstane k odeslání a zkusí se
  // to s dalším ťuknutím nebo s dalším čtením.
}

/** Řádek týmu přímo ze serveru, ne z posledního čtení. */
async function stahni(id: string): Promise<RadekTymu | undefined> {
  const { data, error } = await klient!.from(TABULKA).select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return (data as RadekTymu | null) ?? undefined;
}

/** Zápis prošel: zapamatovat si nový řádek (i s verzí) a dát vědět stavu. */
function zapsano(r: RadekTymu, kniha: K.Kniha, nazev: string) {
  naposledy = [...naposledy.filter((x) => x.id !== r.id), r].sort((a, b) => (a.id < b.id ? -1 : 1));
  poOdeslani(r.id, kniha, nazev);
}

async function nacti(): Promise<boolean> {
  if (!klient) return false;
  try {
    // Seřazené podle id. Bez pořadí vrací Postgres řádky tak, jak zrovna
    // leží, a po každém zápisu leží jinak. Porovnání níž by pak hlásilo změnu
    // i tam, kde žádná není, každý telefon by sloučil, uložil a odeslal,
    // a ostatní by na to zase odpověděli: dva telefony by si přehazovaly
    // tabulku pořád dokola.
    // Hospody a úkoly napřed: body týmů se z nich počítají.
    if (!bezTabulkyHry) {
      const h = await klient.from(TABULKA_HRY).select("*").eq("hra", HRA).maybeSingle();
      if (chybiTabulka(h.error)) bezTabulkyHry = true;
      else if (h.error) throw h.error;
      else if (h.data) prevezmiSeznamy(h.data as RadekHry, aktualniUcet() === "spravce");
    }
    const { data, error } = await klient.from(TABULKA).select("*").eq("hra", HRA).order("id");
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
  // Server nepustil. Od zavedení hesla to znamená hlavně „nejsi přihlášený“
  // (nebo účet nemá roli), ne rozbitou tabulku.
  if (kod === "42501" || /row-level security|permission denied/i.test(zprava))
    return "Server tě nepustil. Odhlas se v Pravidlech a přihlas se znova heslem hry.";
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
    // Supabase chybu vrací, ne vyhazuje. Dřív se tu nekontrolovala, takže
    // nepovedené smazání vypadalo jako povedené a tým se při dalším čtení
    // ze serveru vrátil.
    const { error } = await klient.from(TABULKA).delete().eq("id", id);
    if (error) throw error;
    naposledy = naposledy.filter((t) => t.id !== id);
    zmena();
  } catch (e) {
    console.warn("Tour de Pub: tým se ze serveru smazat nepodařilo.", e);
  }
}

/** Odpojí živé pořadí. Volá se po odhlášení: bez účtu by každé čtení
 *  i zápis jen narážely na pravidla a hlásily chybu. */
export function zastavSync() {
  // starý kanál zavřít, jinak by vedle nového dál poslouchal
  klient?.removeAllChannels();
  klient = null;
  clearInterval(hodiny);
  hodiny = undefined;
  rezim = "ukazka";
  chyba = "";
  naposledy = [];
  prvniCteni = true;
  spusteno = false;
  zmena();
}

/** Zkusit se připojit znovu, aniž by se načítala celá stránka. */
export async function zkusZnovu() {
  zastavSync();
  await spustSync();
}
