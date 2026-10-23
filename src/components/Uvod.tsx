// Úvod po každém spuštění: značka se složí písmeno po písmenu, pak průprava.
// Vždycky jde přeskočit a žádná stránka se nepřehodí sama — Mišák chtěl mít
// jistotu, že si to někdo opravdu přečetl, ne že mu to uteklo.
//
// Značku kreslí index.html, ne React, a React ji nepřekresluje. Logo svítí
// od prvního snímku a skládá se po písmenech; kdyby se o něj React uprostřed
// přihlásil, animace by buď naskočila v půlce, nebo by písmena zmizela
// a začala znova. Tahle vrstva je proto do příchodu průpravy průhledná
// a značka pod ní prosvítá — teprve s první stránkou se #uvod odklidí.
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

interface Stranka {
  /** Klíč kresby v UVOD_KRESBY. */
  id: keyof typeof UVOD_KRESBY;
  /** Plná barva celé stránky a inkoust, kterým se na ni kreslí i píše.
   *  Není to nádech barvy jako dřív — stránka je plakát, ne tmavá
   *  obrazovka s podtónem. */
  barva: string;
  inkoust: string;
  /** Kam na stránce padne text: pod kresbu, kolem ní, nebo nad ni.
   *  Čtyři stejně poskládané stránky za sebou vypadají jako formulář —
   *  plakáty se mají střídat. */
  skladba?: "kolem" | "nahore";
  /** Kam se kresba přitiskne. */
  kotva?: "vlevo" | "vpravo";
  nadpis: string;
  text: string;
}

const KREM = "#F2E7CF";
const INKOUST = "#1A1A14";

/** Shrnutí pravidel na čtyři plakáty. Je to výtah z obrazovky Pravidla —
 *  co se hraje, za co jsou čárky, co se trestá a co se vyhrává.
 *
 *  Mluví to hantecem z Pravidel, ne návodem. Přepsat to do spisovného
 *  („Valí se to od šesti večer do dvou do rána, ve dvou až třech partách")
 *  bylo věcně správně a znělo to jako příbalový leták — v appce, kde se
 *  jinde píše o betelný řežbě a vypatlaný palici, je to cizí hlas. Krátké
 *  věty, dvě na stránku, ať to je k přečtení na jeden pohled. */
const PRUPRAVA: Stranka[] = [
  { id: "skopek", barva: "#E5331F", inkoust: KREM, nadpis: "Devět špeluněk, jedna noc",
    text: "Devět brněnskejch špeluněk a partyje, co si nedá říct. Valí se to od šesti večer do dvou do rána." },
  { id: "carky", barva: "#F9A204", inkoust: INKOUST, skladba: "kolem", kotva: "vlevo",
    nadpis: "Čárky nejsou za chlast",
    text: "Za každou špeluňku čárka, za škopek čárka. Ale ty tučný padajó za srandy — za koule a za to, že to v palici nemáš vypatlaný." },
  { id: "snek", barva: "#006633", inkoust: KREM, skladba: "nahore", kotva: "vpravo",
    nadpis: "Kdo se loudá, ten nemá",
    text: "Na štaci je tak 45 minut. Kdo se fest loudá a ostatní na něj čumijó, za srandy v tý špeluňce nemá ani čárku." },
  { id: "koruna", barva: KREM, inkoust: INKOUST, kotva: "vlevo",
    nadpis: "Celej bank bere jedna",
    text: "Vlezné je kilo na palici a celej bank shrábne parta s nejvíc čárkama. Tak ať je to betelný." },
];

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

/** Přebarví pruh nad stránkou (v prohlížeči) na barvu stránky průpravy.
 *  Bez toho visí nad barevným plakátem tmavý pruh v barvě appky.
 *
 *  Mění se obojí: `theme-color` i podklad `<html>` a `<body>`. Samotná
 *  `theme-color` nestačila — iOS Safari kreslí ten pruh z podkladu stránky,
 *  takže barva v hlavičce se dala přepsat, jak chtěla, a pruh zůstával
 *  tmavý. Plakát je `position:fixed` vrstva nad stránkou, takže podklad pod
 *  ním o jeho barvě neví a musí se mu říct.
 *
 *  Layout, ne obyčejný efekt: obyčejný běží až po vykreslení, takže by byl
 *  na každém přepnutí stránky jeden snímek se starou barvou pruhu.
 *
 *  Po konci se vrátí to, co stálo ve stylu — prázdný řetězec, ne pevná
 *  barva, aby platilo i pravidlo pro širokou obrazovku. */
function useBarvaOkoli(barva: string | null) {
  useLayoutEffect(() => {
    if (!barva) return;
    const stary = document.querySelector('meta[name="theme-color"]');
    const puvodni = stary?.getAttribute("content") ?? null;
    // Přepsat obsah nestačilo: Safari si barvu přečte při načtení a změny
    // atributu si nevšimne. Na výměnu celého prvku reaguje, takže se starý
    // odklidí a nový se vloží.
    stary?.remove();
    const novy = document.createElement("meta");
    novy.name = "theme-color";
    novy.content = barva;
    document.head.appendChild(novy);
    document.documentElement.style.backgroundColor = barva;
    document.body.style.backgroundColor = barva;
    return () => {
      novy.remove();
      if (puvodni) {
        const zpet = document.createElement("meta");
        zpet.name = "theme-color";
        zpet.content = puvodni;
        document.head.appendChild(zpet);
      }
      document.documentElement.style.backgroundColor = "";
      document.body.style.backgroundColor = "";
    };
  }, [barva]);
}

export function Uvod({ hotovo }: { hotovo: () => void }) {
  // -1 = značka, 0+ = stránka průpravy
  const [kde, setKde] = useState(-1);
  const [zavira, setZavira] = useState(false);
  const svih = useRef<number | null>(null);

  // Značka odejde, až se čárky dokreslily a písma jsou opravdu načtená.
  // Značka a první stránka se prolnou přes sebe — kdyby jedna odešla dřív,
  // než druhá přijde, byl by mezi nimi prázdný snímek.
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

  function dal() {
    if (kde + 1 >= PRUPRAVA.length) zavri();
    else setKde(kde + 1);
  }

  const posledni = kde + 1 === PRUPRAVA.length;
  const s = PRUPRAVA[Math.max(0, kde)];
  // Drží se i při zavírání: plakát se vytrácí a pruh nad ním nemá skočit
  // dřív než on. Vrátí se to, až úvod zmizí úplně.
  useBarvaOkoli(kde >= 0 ? s.barva : null);

  return (
    <div className={`uvod${zavira ? " zavira" : ""}${kde >= 0 ? " barevna" : " znacka"}`}
      style={{ "--papir": s.barva, "--inkoust": s.inkoust } as React.CSSProperties}
      role="dialog" aria-label="Úvod"
      onPointerDown={(e) => { svih.current = e.clientX; }}
      onPointerUp={(e) => {
        const z = svih.current;
        svih.current = null;
        if (z === null || kde < 0) return;
        const dx = e.clientX - z;
        // švih do boku listuje, ťuknutí kamkoli na obrazovku posune dál
        if (dx < -50) dal();
        else if (dx > 50) setKde(Math.max(0, kde - 1));
        else dal();
      }}
    >
      {/* Plakát: značka a číslo nahoře, čmáranice přes půl obrazovky,
          dole nadpis s větou a úplně na spodku lišta s ovládáním. Je to
          skladba z tiskového plakátu, ne z formuláře — stránka má mít jednu
          věc, na kterou se kouká, a všechno ostatní potichu po okrajích. */}
      {kde >= 0 && (
        <div className="uvod-obsah">
          {/* Nahoře značka a Přeskočit, dole proužky a Dál. Dvě řádky po dvou
              věcech, každá drží obě hrany stránky. Dřív byly dole tři věci
              vedle sebe (proužky, Přeskočit, Dál) a číslo stránky nahoře —
              jenže proužky číslo stránky říkají taky, takže to bylo jednou
              navíc, a tři věci na jedné řádce se nedaly vyvážit. */}
          <div className="uvod-hlava">
            <Logo trida="uvod-znak" />
            <button className="uvod-preskocit" onClick={zavri}
              onPointerUp={(e) => e.stopPropagation()}>Přeskočit</button>
          </div>

          <div className={`uvod-stranka${s.skladba ? " " + s.skladba : ""}`} key={kde}>
            <div className={`uvod-kresba${s.kotva ? " " + s.kotva : ""}`}><Cmaranice id={s.id} /></div>
            <h1 className="uvod-nadpis">{vazat(s.nadpis)}</h1>
            <p className="uvod-text">{vazat(s.text)}</p>
          </div>

          <div className="uvod-spodek">
            <div className="uvod-tecky" role="img"
              aria-label={`Stránka ${kde + 1} z ${PRUPRAVA.length}`}>
              {PRUPRAVA.map((_, i) => (
                <span key={i} className={`uvod-tecka${i === kde ? " ted" : ""}${i < kde ? " bylo" : ""}`} />
              ))}
            </div>
            <button className="uvod-dal" onClick={dal} onPointerUp={(e) => e.stopPropagation()}>
              {posledni ? "Jedeme na to" : "Dál"}
              <svg className="uvod-sipka" viewBox="0 0 24 10" fill="none" stroke="currentColor"
                strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M1 5h21M17 1l5 4-5 4" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/** Čmáranice stránky: ta samá ruka jako ikony, jen velká. Plocha je v barvě
 *  inkoustu, výstřižky jsou průhledné a prosvítá jimi barva stránky —
 *  proto maska, ne dvě barvy (viz Ikona). */
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
