// Úvod po každém spuštění: značka se dokreslí čárkami, pak průprava.
// Vždycky jde přeskočit a žádná stránka se nepřehodí sama — Mišák chtěl mít
// jistotu, že si to někdo opravdu přečetl, ne že mu to uteklo.
//
// Logo kreslí React, ne jen index.html. Dřív to bylo obojí: statické logo
// odcházelo prolnutím a průprava se přes něj zároveň zjevovala, takže mezi
// nimi na okamžik prosvítala appka. Teď je to jedna neprůhledná vrstva,
// uvnitř které se jen přepíná obsah; statické logo z index.html se odklidí
// hned, jak React vykreslí to svoje na stejné místo.
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { vazat } from "../lib/format";
import type { JmenoIkony } from "../lib/ikony";
import { Ikona } from "./Ikona";
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
  ikona: JmenoIkony;
  nadpis: string;
  text: string;
}

const PRUPRAVA: Stranka[] = [
  { ikona: "mista", nadpis: "Večer ve Štatlu",
    text: "Devět brněnskejch špeluněk, jedna noc a partyje, co si nedá říct. Valí se to od šesti večer do dvou do rána." },
  { ikona: "carka", nadpis: "Čárky nejsou za chlast",
    text: "Za každou špeluňku, do který vlezete, čárka. Za škopek čárka. Ale ty tučný padajó za srandy — za koule, za dobrej kšaft a za to, že to v palici nemáš vypatlaný." },
  { ikona: "hospoda", nadpis: "Kdo se loudá, ten nemá",
    text: "Na každou štaci je tak 45 minut a pak se valí dál. Jak se nějaká partyja fest loudá a ostatní na ni čumijó, za srandy v tý špeluňce nemá ani čárku." },
  { ikona: "koruna", nadpis: "Celej bank bere jedna",
    text: "Vlezné je kilo na palici a na konci to všecko shrábne ta parta, co nahrabala nejvíc čárek. Tak ať je to betelný." },
];

/** Odklidí úvodní obrazovku z index.html. Nechat ji tam by znamenalo
 *  krémové logo přes celou appku. */
function odklidStatickeLogo() {
  document.getElementById("uvod")?.remove();
}

/** Načte přesně ta písma, kterými je průprava vysázená.
 *
 *  `document.fonts.ready` na tohle nestačí: slibuje jen, že doběhlo, co si
 *  stránka **už vyžádala**, a dokud svítí logo, nic Bricolage ani psanou ruku
 *  nepoužívá. Bez tohohle se průprava vysází náhradním písmem a po chvilce
 *  přeskočí do správného — a přesně to vypadá jako probliknutí. */
function nactiPisma(): Promise<unknown> {
  const vzorek = "ŠČŘŽĚÚŮ příklad";
  const chci = [`800 1rem "Nadpisy"`, `1rem "Psaci"`, `500 1rem "Outfit"`];
  try {
    return Promise.all(chci.map((f) => document.fonts.load(f, vzorek)))
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

  // Statické logo zmizí ve stejném snímku, ve kterém React vykreslí to svoje
  // na to samé místo. Prolnutí mezi nimi by bylo vidět jako bliknutí.
  useLayoutEffect(odklidStatickeLogo, []);

  // Značka odejde, až se čárky dokreslily a písma jsou opravdu načtená.
  // Značka a první stránka se prolnou přes sebe — kdyby jedna odešla dřív,
  // než druhá přijde, byl by mezi nimi prázdný snímek.
  useEffect(() => {
    let platne = true;
    const pockej = (ms: number) => new Promise((h) => setTimeout(h, ms));
    Promise.all([
      pockej(Math.max(ZNACKA_PO_STARTU, ZNACKA_NEJMIN - performance.now())),
      Promise.race([nactiPisma(), pockej(PISMA_NEJVIC)]),
    ]).then(() => { if (platne) setKde(0); });
    return () => { platne = false; };
  }, []);

  /** Úvod se nevypne střihem, ale vytratí se. */
  function zavri() {
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
    <div className={`uvod${zavira ? " zavira" : ""}`} role="dialog" aria-label="Úvod"
      onPointerDown={(e) => { svih.current = e.clientX; }}
      onPointerUp={(e) => {
        const z = svih.current;
        svih.current = null;
        if (z === null || kde < 0) return;
        const dx = e.clientX - z;
        if (dx < -50) dal();
        else if (dx > 50) setKde(Math.max(0, kde - 1));
      }}
    >
      <button className="uvod-preskocit" onClick={zavri}
        onPointerUp={(e) => e.stopPropagation()}>Přeskočit</button>

      {/* značka zůstává vykreslená a jen se vytrácí, zatímco první stránka
          už přichází — jinak by mezi nimi blikl prázdný podklad */}
      <div className={`uvod-znacka${kde >= 0 ? " odchazi" : ""}`} aria-hidden={kde >= 0}>
        <Logo trida="uvod-logo" />
        <CarkyKreslene />
      </div>

      {kde >= 0 && (
        <div className="uvod-obsah">
          <div className="uvod-stranka" key={kde}>
            <Ikona jmeno={s.ikona} px={84} trida="uvod-ikona" />
            <h1 className="uvod-nadpis">{vazat(s.nadpis)}</h1>
            <p className="uvod-text psane">{vazat(s.text)}</p>
          </div>

          <div className="uvod-spodek">
            <div className="uvod-tecky" role="img"
              aria-label={`Stránka ${kde + 1} z ${PRUPRAVA.length}`}>
              {PRUPRAVA.map((_, i) => (
                <span key={i} className={`uvod-tecka${i === kde ? " ted" : ""}${i < kde ? " bylo" : ""}`} />
              ))}
            </div>
            <button className="tl hlavni" onClick={dal} onPointerUp={(e) => e.stopPropagation()}>
              {posledni ? <><Ikona jmeno="piva" px={19} /> Jedeme na to</> : "Dál"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/** Pět čárek pod značkou, co se dokreslí jedna po druhé — čtyři svislé
 *  a pátá přes ně. Je to jediná ozdoba, co appka má, a nese téma hry:
 *  animace, která nic nepředstírá, jen počítá. */
function CarkyKreslene() {
  const tahy = [
    "M6 5 L4 33", "M16 4 L18 31", "M27 5 L25 32", "M37 4 L39 33", "M2 29 L42 7",
  ];
  return (
    <svg className="uvod-carky" viewBox="0 0 44 38" fill="none" stroke="currentColor"
      strokeWidth={3.4} strokeLinecap="round" aria-hidden="true">
      {tahy.map((d, i) => (
        <path key={i} d={d} style={{ animationDelay: `${300 + i * 130}ms` }} />
      ))}
    </svg>
  );
}
