// Kniha zápisů týmu: co parta zapsala, kdy a z kterého telefonu.
//
// Dřív se tým posílal na server celý a vyhrával ten, kdo zapsal poslední.
// Když za jeden tým zapisovaly dva telefony skoro naráz, druhý zápis přepsal
// první i s čárkou, kterou první telefon zrovna přidal: čárka se ztratila.
//
// Kniha se proto neslučuje „celá za celou", ale po položkách, a dvě knihy
// jdou sloučit v libovolném pořadí a kolikrát chceš se stejným výsledkem:
//  - příchod, škopek, zloděj a štace jsou hodnoty s časem a telefonem.
//    Vyhrává novější zápis TÉ JEDNÉ položky. Když jeden telefon zapíše
//    škopek a druhý příchod, zůstane obojí.
//  - úkoly si každý telefon počítá zvlášť (kolik přidal, kolik ubral)
//    a platí součet. Dva lidi, co naráz odškrtnou pivo, jsou dvě piva.
//
// Modul nemá žádné závislosti, ať jde vyzkoušet samostatně.

/** Náhodné jméno telefonu, viz zarizeni() ve stav.ts. */
export type Zarizeni = string;

/** Hodnota položky, čas zápisu (ms) a telefon, ze kterého přišel. */
export type Zapis<T> = [T, number, Zarizeni];

export interface Kniha {
  v: 1;
  hospoda: Zapis<string | null> | null;
  prichod: Record<string, Zapis<boolean>>;
  skopek: Record<string, Zapis<boolean>>;
  zlodej: Record<string, Zapis<boolean>>;
  /** id úkolu → telefon → [kolikrát přidal, kolikrát ubral] */
  ukoly: Record<string, Record<Zarizeni, [number, number]>>;
}

/** To, co z knihy čte zbytek appky (stejný tvar jako dřív na Tym). */
export interface Vyklad {
  hospoda: string | null;
  prichod: Record<string, boolean>;
  prichodCas: Record<string, number>;
  skopek: Record<string, boolean>;
  zlodej: Record<string, boolean>;
  ukoly: Record<string, number>;
}

export type Prepinac = "prichod" | "skopek" | "zlodej";

export const prazdnaKniha = (): Kniha =>
  ({ v: 1, hospoda: null, prichod: {}, skopek: {}, zlodej: {}, ukoly: {} });

/** Je zápis b novější než a? Při shodném čase rozhodne jméno telefonu,
 *  ať oba telefony vyberou totéž. */
const novejsi = (a: Zapis<unknown>, b: Zapis<unknown>) =>
  b[1] !== a[1] ? b[1] > a[1] : b[2] > a[2];

function slucZapis<T>(a: Zapis<T> | null | undefined, b: Zapis<T> | null | undefined): Zapis<T> | null {
  if (!a) return b ?? null;
  if (!b) return a;
  return novejsi(a, b) ? b : a;
}

function slucMapu(a: Record<string, Zapis<boolean>>, b: Record<string, Zapis<boolean>>) {
  const v: Record<string, Zapis<boolean>> = { ...a };
  for (const k of Object.keys(b)) v[k] = slucZapis(a[k], b[k])!;
  return v;
}

/** Sloučí dvě knihy. Na pořadí ani opakování nezáleží. */
export function sluc(a: Kniha, b: Kniha): Kniha {
  const ukoly: Kniha["ukoly"] = {};
  for (const id of new Set([...Object.keys(a.ukoly), ...Object.keys(b.ukoly)])) {
    const x = a.ukoly[id] || {};
    const y = b.ukoly[id] || {};
    const m: Record<Zarizeni, [number, number]> = {};
    for (const z of new Set([...Object.keys(x), ...Object.keys(y)])) {
      // Každý telefon jen přičítá do svých dvou čísel, takže větší je novější.
      m[z] = [Math.max(x[z]?.[0] || 0, y[z]?.[0] || 0), Math.max(x[z]?.[1] || 0, y[z]?.[1] || 0)];
    }
    ukoly[id] = m;
  }
  return {
    v: 1,
    hospoda: slucZapis(a.hospoda, b.hospoda),
    prichod: slucMapu(a.prichod, b.prichod),
    skopek: slucMapu(a.skopek, b.skopek),
    zlodej: slucMapu(a.zlodej, b.zlodej),
    ukoly,
  };
}

/** Čas nového zápisu: teď, ale vždycky později než to, co přepisuje.
 *  Hodiny telefonů se rozcházejí; bez toho by odepsání na telefonu, který se
 *  opožďuje, prohrálo se zápisem, který zrovna opravuje. */
const casPo = (pred?: Zapis<unknown> | null) => Math.max(Date.now(), (pred?.[1] ?? 0) + 1);

export function nastavHospodu(k: Kniha, id: string | null, ja: Zarizeni) {
  k.hospoda = [id, casPo(k.hospoda), ja];
}

export function nastavPrepinac(k: Kniha, druh: Prepinac, klic: string, hodnota: boolean, ja: Zarizeni) {
  k[druh][klic] = [hodnota, casPo(k[druh][klic]), ja];
}

export const pocet = (k: Kniha, id: string): number =>
  Object.values(k.ukoly[id] || {}).reduce((s, [plus, minus]) => s + plus - minus, 0);

/** Přidá (+1) nebo ubere (-1) úkol za tenhle telefon. */
export function pricti(k: Kniha, id: string, o: 1 | -1, ja: Zarizeni) {
  const m = (k.ukoly[id] ??= {});
  const z = (m[ja] ??= [0, 0]);
  if (o > 0) z[0]++;
  else z[1]++;
}

/** Vynuluje tým. Úkoly se nesmažou (smazané číslo by druhý telefon při
 *  sloučení vrátil), ale tenhle telefon ubere tolik, kolik je zrovna
 *  zapsáno. Co druhý telefon přidá mezitím, zůstane. */
export function vynuluj(k: Kniha, prvniHospoda: string | null, ja: Zarizeni) {
  for (const druh of ["prichod", "skopek", "zlodej"] as const)
    for (const klic of Object.keys(k[druh])) if (k[druh][klic][0]) nastavPrepinac(k, druh, klic, false, ja);
  for (const id of Object.keys(k.ukoly)) {
    const n = pocet(k, id);
    const z = ((k.ukoly[id] ??= {})[ja] ??= [0, 0]);
    if (n > 0) z[1] += n;
    else if (n < 0) z[0] -= n;
  }
  nastavHospodu(k, prvniHospoda, ja);
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
    hospoda: k.hospoda?.[0] ?? null,
    prichod: zapnute(k.prichod), prichodCas, skopek: zapnute(k.skopek),
    zlodej: zapnute(k.zlodej), ukoly,
  };
}

/** Kniha z tvaru, který se ukládal a posílal před knihou. Položky dostanou
 *  čas `cas` (razítko týmu) a telefon „stare“; počty úkolů jsou všechny
 *  připsané tomuhle jménu, takže se dva převody téhož týmu nesečtou. */
export function zeStarehoTvaru(s: Partial<Vyklad> | null | undefined, cas: number): Kniha {
  const k = prazdnaKniha();
  const ja = "stare";
  if (!s) return k;
  if (s.hospoda) k.hospoda = [s.hospoda, cas, ja];
  for (const druh of ["prichod", "skopek", "zlodej"] as const)
    for (const [klic, ano] of Object.entries(s[druh] || {}))
      if (ano) k[druh][klic] = [true, druh === "prichod" ? (s.prichodCas?.[klic] ?? cas) : cas, ja];
  for (const [id, n] of Object.entries(s.ukoly || {}))
    if (n > 0) k.ukoly[id] = { [ja]: [n, 0] };
  return k;
}

/** Je kniha platná? Ze serveru může přijít cokoli. */
export const jeKniha = (x: unknown): x is Kniha =>
  !!x && typeof x === "object" && (x as Kniha).v === 1
  && typeof (x as Kniha).prichod === "object" && typeof (x as Kniha).ukoly === "object";

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
