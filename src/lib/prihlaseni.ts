// Přihlášení do hry přes Supabase Auth.
//
// Dřív byla tabulka otevřená komukoli s odkazem (a s klíčem, který je
// v prohlížeči veřejný): kdo našel adresu projektu, mohl číst, přepisovat
// i mazat čárky všem partám. Teď do ní pustí server jen účet s rolí Tour de
// Pub, a k tomu je potřeba heslo hry.
//
// Tady bydlí jediný klient Supabase pro celou appku. Synchronizace si ho
// bere odsud, protože čte a zapisuje pod přihlášeným účtem.
import { useSyncExternalStore } from "react";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import { SUPABASE_URL, SUPABASE_KEY, EMAIL_HRACE, EMAIL_SPRAVCE } from "./nastaveni";

/** bez-serveru = appka nemá kam se připojit a běží jen z telefonu,
 *  venku = chce heslo hry, hrac/spravce = přihlášeno. */
export type Ucet = "bez-serveru" | "venku" | "hrac" | "spravce";
type Role = "hrac" | "spravce";

/** Vlastní klíč v localStorage. Výchozí je odvozený z adresy projektu a ten
 *  samý projekt používá i osobní appka; na jiné doméně by se nepotkaly, ale
 *  ať je jasné, čí přihlášení to je. */
const KLIC_RELACE = "tourdepub-prihlaseni";

const maServer = Boolean(SUPABASE_URL && SUPABASE_KEY);

function roleZ(user: Pick<User, "app_metadata"> | null | undefined): Role | null {
  const r = user?.app_metadata?.tourdepub;
  return r === "hrac" || r === "spravce" ? r : null;
}

/** Stav z uložené relace, hned při startu a bez sítě. Kdyby se čekalo na
 *  klienta (stahuje se zvlášť), bliklo by heslo i tomu, kdo je dávno
 *  přihlášený, a v hospodě bez signálu by tam zůstalo viset. */
function zUlozeni(): Ucet {
  if (!maServer) return "bez-serveru";
  try {
    const o = JSON.parse(localStorage.getItem(KLIC_RELACE) || "null");
    return roleZ(o?.user) ?? "venku";
  } catch {
    return "venku";
  }
}

let ucet: Ucet = zUlozeni();
const posluchaci = new Set<() => void>();

function nastav(novy: Ucet) {
  if (novy === ucet) return;
  ucet = novy;
  posluchaci.forEach((f) => f());
}

export const aktualniUcet = () => ucet;

/** Kdo je přihlášený. Obrazovka se překreslí, když se to změní. */
export function useUcet(): Ucet {
  return useSyncExternalStore(
    (f) => { posluchaci.add(f); return () => posluchaci.delete(f); },
    () => ucet,
    () => ucet,
  );
}

let klient: Promise<SupabaseClient> | null = null;

/** Klient Supabase. Nahrává se až když je potřeba (dynamický import), ať
 *  se kvůli tomu nestahuje sto kilobajtů dřív, než je co dělat. */
export function dejKlienta(): Promise<SupabaseClient> {
  if (!klient) {
    klient = import("@supabase/supabase-js").then(({ createClient }) => {
      const k = createClient(SUPABASE_URL, SUPABASE_KEY, {
        auth: { storageKey: KLIC_RELACE, persistSession: true, autoRefreshToken: true },
      });
      // Server může relaci zrušit sám (odhlášení všech, smazaný účet). Pak
      // přijde SIGNED_OUT a appka se zeptá na heslo znova. Výpadek sítě
      // relaci neruší: klient si ji drží a obnoví, až bude signál.
      k.auth.onAuthStateChange((_udalost, relace) => {
        nastav(roleZ(relace?.user) ?? "venku");
      });
      return k;
    });
    // Nepovedené stažení (bez signálu) nesmí zůstat v paměti navždy.
    klient.catch(() => { klient = null; });
  }
  return klient;
}

/** Přihlásí telefon. Vrací prázdný řetězec, když to prošlo, jinak větu
 *  pro člověka. */
export async function prihlas(kdo: Role, heslo: string): Promise<string> {
  try {
    const k = await dejKlienta();
    const { data, error } = await k.auth.signInWithPassword({
      email: kdo === "spravce" ? EMAIL_SPRAVCE : EMAIL_HRACE,
      password: heslo,
    });
    if (error) return popisChyby(error, kdo);
    const r = roleZ(data.user);
    if (r !== kdo && !(kdo === "hrac" && r === "spravce")) {
      await odhlas();
      return "Účet nemá v Tour de Pub roli. Zkontroluj app_metadata v Supabase.";
    }
    nastav(r!);
    return "";
  } catch (e) {
    return popisChyby(e, kdo);
  }
}

/** Odhlásí jen tenhle telefon.
 *
 *  Pozor na výchozí chování: signOut() bez parametru je „global“ a zruší
 *  relace účtu všude. Hráči sdílejí jeden účet, takže by jedno odhlášení
 *  vyhodilo z hry celou partu. */
export async function odhlas() {
  try {
    const k = await dejKlienta();
    await k.auth.signOut({ scope: "local" });
  } catch {
    // bez sítě se server nedozví, ale místní relace se smaže i tak
    try { localStorage.removeItem(KLIC_RELACE); } catch { /* nic */ }
  }
  nastav(maServer ? "venku" : "bez-serveru");
}

function popisChyby(e: unknown, kdo: Role): string {
  const o = e as { status?: number; code?: string; message?: string; name?: string };
  const zprava = o?.message || String(e);
  if (o?.code === "invalid_credentials" || /invalid login credentials/i.test(zprava))
    return kdo === "spravce" ? "Tohle heslo správce nesedí." : "Tohle heslo nesedí.";
  if (o?.status === 429 || /rate limit/i.test(zprava))
    return "Moc pokusů za sebou. Chvilku počkej a zkus to znova.";
  if (o?.name === "AuthRetryableFetchError" || o?.status === 0 ||
      /Failed to fetch|NetworkError|Load failed|dynamically imported module/i.test(zprava))
    return "Není signál. Na přihlášení je potřeba internet, pak už se hraje i bez něj.";
  console.warn("Tour de Pub: přihlášení neprošlo.", e);
  return zprava;
}
