// Kniha zápisů týmu: co parta zapsala, kdy a z kterého telefonu.
//
// Dřív se tým posílal na server celý a vyhrával ten, kdo zapsal poslední.
// Když za jeden tým zapisovaly dva telefony skoro naráz, druhý zápis přepsal
// první i s čárkou, kterou první telefon zrovna přidal: čárka se ztratila.
//
// Kniha se proto neslučuje „celá za celou", ale po položkách, a dvě knihy
// jdou sloučit v libovolném pořadí a kolikrát chceš se stejným výsledkem.
// Každá položka (příchod v té hospodě, škopek, zloděj, počet u úkolu) je
// hodnota s časem a telefonem a vyhrává novější zápis TÉ JEDNÉ položky.
// Když jeden telefon zapíše škopek a druhý příchod, zůstane obojí.
//
// U úkolů se zapisuje stav, ne přírůstek: kdo vidí 1 a ťukne +, zapíše
// „mají být 2“. Když totéž udělá naráz kamarád z party, jsou to pořád 2,
// ne 3. Mišák nechtěl, aby se body zdvojovaly. (Sčítání přírůstků bylo
// v první verzi knihy, v1; převede se, viz zKnihyV1.)
//
// Štace v knize není: kde parta stojí, si drží každý telefon sám, ať
// posunutí štace na jednom telefonu nepřehodí obrazovku ostatním.
//
// Modul nemá žádné závislosti, ať jde vyzkoušet samostatně.

/** Náhodné jméno telefonu, viz zarizeni() ve stav.ts. */
export type Zarizeni = string;

/** Hodnota položky, čas zápisu (ms) a telefon, ze kterého přišel. */
export type Zapis<T> = [T, number, Zarizeni];

export interface Kniha {
  v: 2;
  prichod: Record<string, Zapis<boolean>>;
  skopek: Record<string, Zapis<boolean>>;
  zlodej: Record<string, Zapis<boolean>>;
  /** id úkolu → kolikrát splněno */
  ukoly: Record<string, Zapis<number>>;
}

/** To, co z knihy čte zbytek appky (stejný tvar jako dřív na Tym). */
export interface Vyklad {
  prichod: Record<string, boolean>;
  prichodCas: Record<string, number>;
  skopek: Record<string, boolean>;
  zlodej: Record<string, boolean>;
  ukoly: Record<string, number>;
}

export type Prepinac = "prichod" | "skopek" | "zlodej";

export const prazdnaKniha = (): Kniha =>
  ({ v: 2, prichod: {}, skopek: {}, zlodej: {}, ukoly: {} });

/** Je zápis b novější než a? Při shodném čase rozhodne jméno telefonu,
 *  ať oba telefony vyberou totéž. */
const novejsi = (a: Zapis<unknown>, b: Zapis<unknown>) =>
  b[1] !== a[1] ? b[1] > a[1] : b[2] > a[2];

function slucZapis<T>(a: Zapis<T> | null | undefined, b: Zapis<T> | null | undefined): Zapis<T> | null {
  if (!a) return b ?? null;
  if (!b) return a;
  return novejsi(a, b) ? b : a;
}

function slucMapu<T>(a: Record<string, Zapis<T>>, b: Record<string, Zapis<T>>) {
  const v: Record<string, Zapis<T>> = { ...a };
  for (const k of Object.keys(b)) v[k] = slucZapis(a[k], b[k])!;
  return v;
}

/** Sloučí dvě knihy. Na pořadí ani opakování nezáleží. */
export function sluc(a: Kniha, b: Kniha): Kniha {
  return {
    v: 2,
    prichod: slucMapu(a.prichod, b.prichod),
    skopek: slucMapu(a.skopek, b.skopek),
    zlodej: slucMapu(a.zlodej, b.zlodej),
    ukoly: slucMapu(a.ukoly, b.ukoly),
  };
}

/** Čas nového zápisu: teď, ale vždycky později než to, co přepisuje.
 *  Hodiny telefonů se rozcházejí; bez toho by odepsání na telefonu, který se
 *  opožďuje, prohrálo se zápisem, který zrovna opravuje. */
const casPo = (pred?: Zapis<unknown> | null) => Math.max(Date.now(), (pred?.[1] ?? 0) + 1);

export function nastavPrepinac(k: Kniha, druh: Prepinac, klic: string, hodnota: boolean, ja: Zarizeni) {
  k[druh][klic] = [hodnota, casPo(k[druh][klic]), ja];
}

export const pocet = (k: Kniha, id: string): number => Math.max(0, k.ukoly[id]?.[0] || 0);

/** Přidá (+1) nebo ubere (-1) úkol: zapíše, kolik má být. */
export function pricti(k: Kniha, id: string, o: 1 | -1, ja: Zarizeni) {
  k.ukoly[id] = [Math.max(0, pocet(k, id) + o), casPo(k.ukoly[id]), ja];
}

/** Vynuluje tým. Nic se nemaže (smazanou položku by druhý telefon při
 *  sloučení vrátil), všechno se přepíše na „ne“ a nulu. */
export function vynuluj(k: Kniha, ja: Zarizeni) {
  for (const druh of ["prichod", "skopek", "zlodej"] as const)
    for (const klic of Object.keys(k[druh])) if (k[druh][klic][0]) nastavPrepinac(k, druh, klic, false, ja);
  for (const id of Object.keys(k.ukoly)) if (pocet(k, id) > 0) k.ukoly[id] = [0, casPo(k.ukoly[id]), ja];
}

/** Co v knize stojí, ve tvaru, se kterým počítá zbytek appky. */
export function vyloz(k: Kniha): Vyklad {
  const zapnute = (m: Record<string, Zapis<boolean>>) =>
    Object.fromEntries(Object.entries(m).filter(([, z]) => z[0]).map(([klic]) => [klic, true]));
  const prichodCas = Object.fromEntries(
    Object.entries(k.prichod).filter(([, z]) => z[0]).map(([klic, z]) => [klic, z[1]]));
  const ukoly: Record<string, number> = {};
  for (const id of Object.keys(k.ukoly)) {
    const n = pocet(k, id);
    if (n > 0) ukoly[id] = n;
  }
  return {
    prichod: zapnute(k.prichod), prichodCas, skopek: zapnute(k.skopek),
    zlodej: zapnute(k.zlodej), ukoly,
  };
}

/** Kniha z tvaru, který se ukládal a posílal před knihou. Položky dostanou
 *  čas `cas` (razítko týmu) a telefon „stare“. Dva převody téhož týmu dají
 *  totéž, takže se nic nesečte. */
export function zeStarehoTvaru(s: Partial<Vyklad> | null | undefined, cas: number): Kniha {
  const k = prazdnaKniha();
  const ja = "stare";
  if (!s) return k;
  for (const druh of ["prichod", "skopek", "zlodej"] as const)
    for (const [klic, ano] of Object.entries(s[druh] || {}))
      if (ano) k[druh][klic] = [true, druh === "prichod" ? (s.prichodCas?.[klic] ?? cas) : cas, ja];
  for (const [id, n] of Object.entries(s.ukoly || {}))
    if (n > 0) k.ukoly[id] = [n, cas, ja];
  return k;
}

/** Kniha z čehokoli, co přijde ze serveru nebo z úložiště: platná v2,
 *  první verze knihy (v1, úkoly jako součty přírůstků) nebo starý tvar
 *  bez knihy. Vrací null, když kniha není. */
export function precti(x: unknown, cas: number): Kniha | null {
  if (!x || typeof x !== "object") return null;
  const o = x as { v?: number; ukoly?: Record<string, unknown> };
  if (o.v === 2 && typeof o.ukoly === "object") return x as Kniha;
  if (o.v === 1 && typeof o.ukoly === "object") return zKnihyV1(x as KnihaV1, cas);
  return null;
}

/** První verze knihy počítala úkoly jako součet přírůstků z telefonů. */
interface KnihaV1 {
  prichod: Record<string, Zapis<boolean>>; skopek: Record<string, Zapis<boolean>>;
  zlodej: Record<string, Zapis<boolean>>; ukoly: Record<string, Record<string, [number, number]>>;
}
function zKnihyV1(s: KnihaV1, cas: number): Kniha {
  const k = prazdnaKniha();
  k.prichod = { ...s.prichod }; k.skopek = { ...s.skopek }; k.zlodej = { ...s.zlodej };
  for (const [id, m] of Object.entries(s.ukoly || {})) {
    const n = Object.values(m).reduce((c, [plus, minus]) => c + plus - minus, 0);
    if (n > 0) k.ukoly[id] = [n, cas, "stare"];
  }
  return k;
}

/** Stejný obsah bez ohledu na pořadí klíčů (JSON ze serveru je jinak seřazený). */
export function stejne(a: unknown, b: unknown): boolean {
  return serad(a) === serad(b);
}

function serad(x: unknown): string {
  if (Array.isArray(x)) return `[${x.map(serad).join(",")}]`;
  if (x && typeof x === "object")
    return `{${Object.keys(x).sort().map((k) => `${JSON.stringify(k)}:${serad((x as Record<string, unknown>)[k])}`).join(",")}}`;
  return JSON.stringify(x ?? null);
}
