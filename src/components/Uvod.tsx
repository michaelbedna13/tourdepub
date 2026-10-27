// Úvod po každém spuštění: značka se složí písmeno po písmenu, pak průprava.
//
// Průprava není čtyři obrazovky, po kterých se listuje. Je to jedno velké
// plátno — nadpisy, věty a kresby rozházené po ploše — a po něm jezdí kamera.
// Najede na detail slova, odjede na celý nadpis, přesune se na větu, pak na
// kresbu, která se mezitím hýbe. Buď se to dokouká, nebo přeskočí; ťukat se
// nikam nedá, protože ve chvíli, kdy po někom chceš ťukat, to přestane být
// film a jsou z toho zase čtyři obrazovky formuláře.
//
// Podklad je tmavý jako zbytek appky, texty krémové, barevné jsou jen kresby.
// Barevné plakáty na celou plochu dělaly z každého přejezdu blik a pruh nad
// stránkou se musel přebarvovat s nimi; tohle je jedna scéna od začátku
// do konce, takže se nahoře nic nepřepisuje.
//
// Značku kreslí index.html, ne React, a React ji nepřekresluje. Logo svítí
// od prvního snímku a skládá se po písmenech; kdyby se o něj React uprostřed
// přihlásil, animace by buď naskočila v půlce, nebo by písmena zmizela
// a začala znova. Tahle vrstva je proto do příchodu průpravy průhledná
// a značka pod ní prosvítá — teprve s prvním záběrem se #uvod odklidí.
import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { vazat } from "../lib/format";
import { UVOD_KRESBY } from "../lib/uvod-kresby";
import { Logo } from "./Logo";

/** Nejmíň takhle dlouho zůstane značka od načtení stránky. */
const ZNACKA_NEJMIN = 1700;
/** A nejmíň takhle dlouho od chvíle, kdy se rozběhl React.
 *  Na pomalé síti se stránka načítá dýl než ZNACKA_NEJMIN, takže by se
 *  značka ukázala a ve stejném okamžiku zase odešla — čárky by se nestihly
 *  dokreslit a vypadalo by to jako záblesk. */
const ZNACKA_PO_STARTU = 1000;
/** Na písma se nečeká věčně; po téhle době se jede i s náhradními. */
const PISMA_NEJVIC = 2500;
/** Jak dlouho se úvod vytrácí, než se odklidí. */
const ZAVRENI = 300;

/** Jak dlouho kamera přejíždí mezi dvěma záběry. Je to pořádný kus času
 *  každého záběru schválně: kamera, co doletí za dvě desetiny a pak stojí,
 *  je střih. Tohle má být jízda. */
const PREJEZD = 600;

/* ---------- plátno ----------
   Souřadnice jsou v bodech plátna, ne v pixelech obrazovky. Kamera si je
   přepočítá sama, takže celá průprava vypadá stejně na telefonu i na
   širokém okně — jen se na širokém vidí víc do stran.

   Kapitoly jsou pod sebou po KROK bodech. Je to víc, než se vejde do
   nejširšího záběru, takže se sousedi do obrazu nikdy nedostanou; mezi
   nimi je prázdno, kterým kamera proletí. */
const PLATNO_SIRKA = 600;
const KROK = 1800;

interface Kapitola {
  /** Klíč kresby v UVOD_KRESBY. */
  id: keyof typeof UVOD_KRESBY;
  /** Barva kresby a zdůrazněného slova. Jediná barva na scéně. */
  barva: string;
  /** Nadpis je rozdělený: první slovo nese barvu a na ně najíždí první
   *  záběr, zbytek je krémový. */
  duraz: string;
  nadpis: string;
  text: string;
}

/** Shrnutí pravidel na čtyři kapitoly. Je to výtah z obrazovky Pravidla —
 *  co se hraje, za co jsou čárky, co se trestá a co se vyhrává.
 *
 *  Mluví to hantecem z Pravidel, ne návodem. Přepsat to do spisovného
 *  bylo věcně správně a znělo to jako příbalový leták — v appce, kde se
 *  jinde píše o betelný řežbě a vypatlaný palici, je to cizí hlas. */
const KAPITOLY: Kapitola[] = [
  { id: "skopek", barva: "#E5331F", duraz: "Devět", nadpis: "špeluněk, jedna noc",
    text: "Devět brněnskejch špeluněk a partyje, co si nedá říct. Valí se to od šesti večer do dvou do rána." },
  { id: "carky", barva: "#F9A204", duraz: "Čárky", nadpis: "nejsou za chlast",
    text: "Za každou špeluňku čárka, za škopek čárka. Ale ty tučný padajó za srandy — za koule a za to, že to v palici nemáš vypatlaný." },
  { id: "snek", barva: "#CBD183", duraz: "Kdo se loudá,", nadpis: "ten nemá",
    text: "Na štaci je tak 45 minut. Kdo se fest loudá a ostatní na něj čumijó, za srandy v tý špeluňce nemá ani čárku." },
  { id: "koruna", barva: "#EFCE7B", duraz: "Celej bank", nadpis: "bere jedna",
    text: "Vlezné je kilo na palici a celej bank shrábne parta s nejvíc čárkama. Tak ať je to betelný." },
];

/** Kde co na plátně leží. Plátno je schválně úzké: čím míň bodů je přes
 *  šířku, tím větší je všechno v obraze. Když bylo široké tisíc, vešel se
 *  do záběru celý nadpis, ale zabíral pětinu výšky a zbytek byla díra.
 *
 *  Liché kapitoly mají větu odsazenou doprava, aby kamera nejezdila pořád
 *  stejnou drahou. */
function mistaKapitoly(i: number) {
  const oy = i * KROK;
  const zrcadlo = i % 2 === 1;
  return {
    oy, zrcadlo,
    nadpis: { x: 30, y: oy + 120, w: 540 },
    text: { x: zrcadlo ? 150 : 30, y: oy + 560, w: 420 },
    kresba: { x: 300, y: oy + 880, r: 115 },
  };
}

interface Zaber {
  /** Střed záběru na plátně. */
  x: number; y: number;
  /** Výřez plátna, který se má do obrazu vejít celý. */
  w: number; h: number;
  /** Jak dlouho záběr trvá i s přejezdem na něj. */
  cas: number;
}

/** Jak dlouho který záběr v kapitole trvá. Pořadí je pevné: detail slova,
 *  odjezd na celý nadpis, přejezd dolů na větu s kresbou. */
const CASY = [750, 1100, 1550];
const CELKEM = CASY.reduce((a, b) => a + b, 0) * KAPITOLY.length;
/** Vzduch kolem výřezu, v bodech plátna. Nahoře a dole ho je víc: tam visí
 *  značka s Přeskočit a dole stopáž, a text jim lezl pod ně. */
const OKRAJ_X = 44, OKRAJ_Y = 84;

type Ram = { x: number; y: number; w: number; h: number };
/** Kde prvek na plátně leží. offsetLeft/offsetTop se počítají od nejbližšího
 *  polohovaného předka, a ten nemusí být plátno: zvýrazněné slovo sedí uvnitř
 *  nadpisu, takže samo o sobě hlásilo (0, −5) a kamera na ně mířila na začátek
 *  plátna. Proto se posuny sčítají až k plátnu. */
function ram(el: HTMLElement, platno: HTMLElement): Ram {
  let x = 0, y = 0;
  for (let e: HTMLElement | null = el; e && e !== platno; e = e.offsetParent as HTMLElement | null) {
    x += e.offsetLeft; y += e.offsetTop;
  }
  return { x, y, w: el.offsetWidth, h: el.offsetHeight };
}
/** Výřez kolem jednoho nebo víc prvků i s okrajem. */
function vyrez(prvky: Ram[], cas: number): Zaber {
  const x1 = Math.min(...prvky.map((r) => r.x)) - OKRAJ_X;
  const y1 = Math.min(...prvky.map((r) => r.y)) - OKRAJ_Y;
  const x2 = Math.max(...prvky.map((r) => r.x + r.w)) + OKRAJ_X;
  const y2 = Math.max(...prvky.map((r) => r.y + r.h)) + OKRAJ_Y;
  return { x: (x1 + x2) / 2, y: (y1 + y2) / 2, w: x2 - x1, h: y2 - y1, cas };
}

/** Storyboard se neodhaduje, ale změří na vysázené stránce.
 *
 *  Napevno napsané výřezy vypadaly dobře přesně do chvíle, než se nadpis
 *  zalomil jinak — a ten se zalomí pokaždé, když místo Hagridu naskočí
 *  náhradní písmo. Pak kamera mířila vedle a věta lezla z obrazu. Prvky
 *  jsou na plátně absolutně, takže offsetLeft/offsetTop jsou rovnou body
 *  plátna; stačí je obalit a přidat okraj.
 *
 *  Tři záběry na kapitolu a každý jinak blízko — jenom popojíždět ve stejném
 *  přiblížení není jízda kamerou, ale posouvání papíru:
 *  1. detail barevného slova (nejblíž, slovo přes půl obrazovky),
 *  2. odjezd na celý nadpis,
 *  3. přejezd dolů na větu i s kresbou, a zase o kus blíž. */
function zmerStoryboard(platno: HTMLElement): Zaber[] {
  const vem = (t: string) => [...platno.querySelectorAll<HTMLElement>(t)].map((e) => ram(e, platno));
  const duraz = vem(".uvod-duraz"), nadpis = vem(".uvod-nadpis");
  const text = vem(".uvod-text"), kresba = vem(".uvod-kresba");
  return KAPITOLY.flatMap((_, i) => [
    vyrez([duraz[i]], CASY[0]),
    vyrez([nadpis[i]], CASY[1]),
    vyrez([text[i], kresba[i]], CASY[2]),
  ]);
}

/** Jak dlouho se značka z index.html vytrácí, než se odklidí. Odchází
 *  nadvakrát (nejdřív logo, pak podklad), tohle je obojí dohromady.
 *  Drží se #uvod.odchazi v index.html. */
const ZNACKA_ODCHOD = 600;

/** Pošle značku z index.html pryč. Nechat ji tam by znamenalo krémové logo
 *  přes celou appku. */
function odklidZnacku() {
  const u = document.getElementById("uvod");
  if (!u) return;
  u.classList.add("odchazi");
  setTimeout(() => u.remove(), ZNACKA_ODCHOD);
}

/** Počká na kit z Adobe Fonts.
 *
 *  Kit se v index.html natahuje jako `media="print"` a na `all` se přepne až
 *  po dotažení, aby neblokoval první vykreslení. Jenže dokud nedorazí, rodina
 *  „hagrid" v dokumentu vůbec není — `document.fonts.load("…hagrid")` na ni
 *  mlčky nic nenajde a `fonts.ready` doběhne s prázdnou rukou. Úvod se proto
 *  tvářil, že je hotovo, pustil průpravu, a kit dorazil až na ni: text se
 *  přesázel a bliklo to. Na mrtvé síti se čeká marně, od toho je PISMA_NEJVIC. */
function pockejNaAdobe(): Promise<unknown> {
  const l = document.getElementById("pismo-adobe") as HTMLLinkElement | null;
  // sheet je k dispozici, jakmile je soubor v prohlížeči (i u media="print")
  if (!l || l.sheet) return Promise.resolve();
  // Požadavek mohl selhat dřív, než se sem React dostal — pak už žádná událost
  // nepřijde a čekalo by se marně až do stropu. Záznam o přenosu je důkaz, že
  // je po všem; že chybí sheet, znamená, že to nedopadlo.
  try {
    if (performance.getEntriesByName(l.href, "resource").length) return Promise.resolve();
  } catch { /* prohlížeč bez Resource Timing: nevadí, od toho je strop */ }
  return new Promise((h) => {
    l.addEventListener("load", h, { once: true });
    l.addEventListener("error", h, { once: true });
  });
}

/** Načte přesně ta písma, kterými je průprava vysázená.
 *
 *  `document.fonts.ready` na tohle nestačí: slibuje jen, že doběhlo, co si
 *  stránka **už vyžádala**, a dokud svítí logo, nic Bricolage ani psanou ruku
 *  nepoužívá. Bez tohohle se průprava vysází náhradním písmem a po chvilce
 *  přeskočí do správného — a přesně to vypadá jako probliknutí. */
function nactiPisma(): Promise<unknown> {
  const vzorek = "ŠČŘŽĚÚŮ příklad";
  const chci = [
    // z Adobe Fonts (kit thr1dyh); když se kit nenačte, požadavek se odmítne
    `400 1rem "hagrid"`, `700 1rem "hagrid"`, `400 1rem "hagrid-text"`, `700 1rem "hagrid-text"`,
    // záloha uložená v appce
    `700 1rem "Nadpisy"`, `400 1rem "Outfit"`, `700 1rem "Outfit"`,
  ];
  try {
    // rodina, kterou prohlížeč nezná, skončí odmítnutím – na to se nečeká
    return pockejNaAdobe()
      .then(() => Promise.all(chci.map((f) => document.fonts.load(f, vzorek).catch(() => null))))
      .then(() => document.fonts.ready);
  } catch {
    return Promise.resolve(); // prohlížeč bez Font Loading API
  }
}

export function Uvod({ hotovo }: { hotovo: () => void }) {
  // -1 = značka, 0+ = pořadí záběru
  const [kde, setKde] = useState(-1);
  const [zavira, setZavira] = useState(false);
  // Kamera počítá přiblížení z opravdové velikosti okna: scale() chce číslo
  // a v CSS se dvě délky vydělit nedají, takže min(šířka, výška) tady.
  const [okno, setOkno] = useState(() => ({ w: window.innerWidth, h: window.innerHeight }));
  const [zabery, setZabery] = useState<Zaber[]>([]);
  const platno = useRef<HTMLDivElement>(null);

  // Změřit se musí před vykreslením, jinak by první snímek byl z nezměřené
  // kamery — tedy někde mimo. Přesázení po změně okna se chytne taky:
  // jiná šířka obrazovky plátnem nehýbe, ale jiná písma ano.
  useLayoutEffect(() => {
    if (platno.current) setZabery(zmerStoryboard(platno.current));
  }, [kde >= 0]);

  useEffect(() => {
    const zmer = () => setOkno({ w: window.innerWidth, h: window.innerHeight });
    window.addEventListener("resize", zmer);
    return () => window.removeEventListener("resize", zmer);
  }, []);

  // Značka odejde, až se čárky dokreslily a písma jsou opravdu načtená.
  // Značka a první záběr se prolnou přes sebe — kdyby jedna odešla dřív,
  // než druhý přijde, byl by mezi nimi prázdný snímek.
  useEffect(() => {
    let platne = true;
    const pockej = (ms: number) => new Promise((h) => setTimeout(h, ms));
    Promise.all([
      pockej(Math.max(ZNACKA_PO_STARTU, ZNACKA_NEJMIN - performance.now())),
      Promise.race([nactiPisma(), pockej(PISMA_NEJVIC)]),
    ]).then(() => { if (!platne) return; odklidZnacku(); setKde(0); });
    return () => { platne = false; };
  }, []);

  /** Úvod se nevypne střihem, ale vytratí se. */
  function zavri() {
    // kdyby se zavíralo ještě ve fázi značky (třeba z klávesnice), nesmí
    // zůstat viset nad appkou
    odklidZnacku();
    // appka je pod úvodem schovaná (html.uvodni v index.html); odkryje se
    // teď, ať je vidět, jak se úvod vytrácí, a ne až po střihu
    document.documentElement.classList.remove("uvodni");
    setZavira(true);
    setTimeout(hotovo, ZAVRENI);
  }

  // Kamera jede sama: každý záběr si odbyde svůj čas a pustí další. Po
  // posledním se úvod zavře, takže appka naskočí bez jediného ťuknutí.
  const zavriRef = useRef(zavri);
  zavriRef.current = zavri;
  useEffect(() => {
    if (kde < 0) return;
    const t = setTimeout(() => {
      if (kde + 1 >= CASY.length * KAPITOLY.length) zavriRef.current();
      else setKde(kde + 1);
    }, CASY[kde % CASY.length]);
    return () => clearTimeout(t);
  }, [kde]);

  // Dokud není změřeno, kamera stojí na jedničce – ale to je jen jeden snímek
  // před prvním layout efektem, nikdo to neuvidí.
  const z = zabery[Math.max(0, kde)] ?? { x: PLATNO_SIRKA / 2, y: 300, w: PLATNO_SIRKA, h: 600, cas: CASY[0] };
  // Výřez se má vejít celý, takže rozhoduje ta těsnější strana. Na telefonu
  // je to skoro vždycky šířka, na širokém okně výška.
  const zvetseni = Math.min(okno.w / z.w, okno.h / z.h);

  return (
    <div className={`uvod${zavira ? " zavira" : ""}${kde >= 0 ? " jede" : " znacka"}`}
      role="dialog" aria-label="Úvod">
      {kde >= 0 && (
        <div className="uvod-obsah">
          <div className="uvod-oko">
            {/* Kamera: sedí ve středu obrazovky a plátnem pod sebou posouvá
                tak, aby střed záběru padl přesně na ni. Pořadí v transformu
                je schválně scale() a teprve pak translate() — posun se tím
                počítá v bodech plátna, ne v pixelech obrazovky, takže se
                nemusí nikde násobit přiblížením. */}
            <div className="uvod-kamera"
              style={{
                transform: `scale(${zvetseni}) translate(${-z.x}px, ${-z.y}px)`,
                transitionDuration: `${PREJEZD}ms`,
              }}>
              <div className="uvod-platno" ref={platno} style={{ width: PLATNO_SIRKA, height: KAPITOLY.length * KROK }}>
                {KAPITOLY.map((k, i) => {
                  const m = mistaKapitoly(i);
                  return (
                    <div key={k.id} style={{ "--kap": k.barva } as React.CSSProperties}>
                      <h2 className="uvod-nadpis"
                        style={{ left: m.nadpis.x, top: m.nadpis.y, width: m.nadpis.w }}>
                        <span className="uvod-duraz">{vazat(k.duraz)}</span> {vazat(k.nadpis)}
                      </h2>
                      <p className="uvod-text"
                        style={{ left: m.text.x, top: m.text.y, width: m.text.w }}>{vazat(k.text)}</p>
                      <div className={`uvod-kresba kr-${k.id}`}
                        style={{ left: m.kresba.x - m.kresba.r, top: m.kresba.y - m.kresba.r,
                          width: m.kresba.r * 2, height: m.kresba.r * 2 }}>
                        <Cmaranice id={k.id} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Značka a Přeskočit visí nad scénou a s kamerou se nehýbou —
              je to popis filmu, ne jeho kus. */}
          <div className="uvod-hlava">
            <Logo trida="uvod-znak" />
            <button className="uvod-preskocit" onClick={zavri}>Přeskočit</button>
          </div>

          {/* Pruh dole je stopáž, ne ovládání: kolik ze znělky zbývá. Jede
              jedním tahem přes všechny záběry, proto není keyed a přehozením
              záběru se nerestartuje. */}
          <div className="uvod-pas" role="img"
            aria-label={`Úvod, ${kde + 1}. záběr z ${CASY.length * KAPITOLY.length}`}>
            <span className="uvod-pas-cara" style={{ "--stopaz": `${CELKEM}ms` } as React.CSSProperties} />
          </div>
        </div>
      )}
    </div>
  );
}

/** Kresba kapitoly: ta samá ruka jako ikony, jen velká. Plocha je v barvě
 *  kapitoly, výstřižky jsou průhledné a prosvítá jimi podklad — proto maska,
 *  ne dvě barvy (viz Ikona). */
function Cmaranice({ id }: { id: keyof typeof UVOD_KRESBY }) {
  // useId vrací dvojtečky, které v url(#…) nefungují všude
  const maska = `uk${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  const vrstvy = UVOD_KRESBY[id];
  if (!vrstvy) return null;
  return (
    <svg className="uvod-cmaranice" viewBox="0 0 100 100" aria-hidden="true">
      <mask id={maska} maskUnits="userSpaceOnUse" x="-10" y="-10" width="120" height="120">
        {vrstvy.map(([druh, d], i) => (
          <path key={i} d={d} fill={druh === "i" ? "#FFFFFF" : "#000000"} />
        ))}
      </mask>
      <rect x="-10" y="-10" width="120" height="120" fill="currentColor" mask={`url(#${maska})`} />
    </svg>
  );
}
