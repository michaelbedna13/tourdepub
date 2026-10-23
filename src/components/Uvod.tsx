// Úvod po každém spuštění: značka se složí písmeno po písmenu, pak průprava.
// Vždycky jde přeskočit a žádná stránka se nepřehodí sama — Mišák chtěl mít
// jistotu, že si to někdo opravdu přečetl, ne že mu to uteklo.
//
// Značku kreslí index.html, ne React, a React ji nepřekresluje. Logo svítí
// od prvního snímku a skládá se po písmenech; kdyby se o něj React uprostřed
// přihlásil, animace by buď naskočila v půlce, nebo by písmena zmizela
// a začala znova. Tahle vrstva je proto do příchodu průpravy průhledná
// a značka pod ní prosvítá — teprve s první stránkou se #uvod odklidí.
import { useEffect, useRef, useState } from "react";
import { vazat } from "../lib/format";
import type { JmenoIkony } from "../lib/ikony";
import { Ikona } from "./Ikona";
import { Kresba } from "./Kresba";
import { KRESBY } from "../lib/kresby";

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
  /** Klíč kresby: soubor kresby/uvod-<id>.png, viz scripts/prevod-kreseb.py. */
  id: string;
  /** Záskok, dokud ke stránce není kresba. */
  ikona: JmenoIkony;
  /** Barva stránky. Nasvítí podklad, nic víc — průprava zůstává tmavá. */
  barva: string;
  nadpis: string;
  text: string;
}

const PRUPRAVA: Stranka[] = [
  { id: "statl", ikona: "mista", barva: "#F9A204", nadpis: "Večer ve Štatlu",
    text: "Devět brněnskejch špeluněk, jedna noc a partyje, co si nedá říct. Valí se to od šesti večer do dvou do rána." },
  { id: "carky", ikona: "carka", barva: "#006633", nadpis: "Čárky nejsou za chlast",
    text: "Za každou špeluňku, do který vlezete, čárka. Za škopek čárka. Ale ty tučný padajó za srandy — za koule, za dobrej kšaft a za to, že to v palici nemáš vypatlaný." },
  { id: "loudal", ikona: "hospoda", barva: "#026C80", nadpis: "Kdo se loudá, ten nemá",
    text: "Na každou štaci je tak 45 minut a pak se valí dál. Jak se nějaká partyja fest loudá a ostatní na ni čumijó, za srandy v tý špeluňce nemá ani čárku." },
  { id: "bank", ikona: "koruna", barva: "#E5331F", nadpis: "Celej bank bere jedna",
    text: "Vlezné je kilo na palici a na konci to všecko shrábne ta parta, co nahrabala nejvíc čárek. Tak ať je to betelný." },
];

/** Jak dlouho se značka z index.html vytrácí, než se odklidí.
 *  Drží se #uvod.odchazi v index.html. */
const ZNACKA_ODCHOD = 340;

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

  return (
    <div className={`uvod${zavira ? " zavira" : ""}${kde >= 0 ? " barevna" : " znacka"}`}
      style={{ "--kat": s.barva } as React.CSSProperties}
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
      {/* Přeskočit naskočí až s průpravou. Ve fázi značky je to jediný text
          na obrazovce a dokud se nenačte písmo, vysází se náhradním a po
          chvilce přeskočí do správného — drobné, ale je to vidět. Značka
          trvá necelé dvě vteřiny, takže není co zmeškat. */}
      {kde >= 0 && (
        <button className="uvod-preskocit" onClick={zavri}
          onPointerUp={(e) => e.stopPropagation()}>Přeskočit</button>
      )}

      {kde >= 0 && (
        <div className="uvod-obsah">
          <div className="uvod-stranka" key={kde}>
            <div className="uvod-krok cislo">{kde + 1} ze {PRUPRAVA.length}</div>
            <h1 className="uvod-nadpis">{vazat(s.nadpis)}</h1>

            {/* Místo pro kresbu stránky. Dokud není, drží ho ikona — ale
                výšku si bere stejnou, takže se nadpis ani text nehnou,
                až kresby přijdou. */}
            <div className="uvod-kresba">
              {KRESBY[`uvod-${s.id}`]
                ? <Kresba id={`uvod-${s.id}`} />
                : <Ikona jmeno={s.ikona} px={96} />}
            </div>

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
              {posledni ? <><Ikona jmeno="piva" px={17} /> Jedeme na to</> : "Dál"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

