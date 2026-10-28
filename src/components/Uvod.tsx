// Úvod po každém spuštění: značka se složí písmeno po písmenu, pak čtyři
// plakáty, kterými se proklikává.
//
// Každý plakát stojí na stejné mřížce — šest sloupců, jeden žlab — a liší
// se tím, kde na ní kresba a text leží. Mřížka drží rytmus, rozmístění dělá
// rozdíl: čtyři stejně poskládané obrazovky za sebou vypadají jako formulář,
// a plakáty se mají střídat.
//
// Nikam se to neposouvá samo. Dřív to byla patnáctivteřinová znělka a než
// se dočetla věta, obrazovka byla pryč; teď se ťuká dál a kdo to zná, dá
// Přeskočit.
//
// Značku kreslí index.html, ne React, a React ji nepřekresluje. Logo svítí
// od prvního snímku a skládá se po písmenech; kdyby se o něj React uprostřed
// přihlásil, animace by buď naskočila v půlce, nebo by písmena zmizela
// a začala znova. Tahle vrstva je proto do příchodu plakátů průhledná
// a značka pod ní prosvítá — teprve s prvním se #uvod odklidí.
import { useEffect, useId, useRef, useState } from "react";
import { vazat } from "../lib/format";
import { bodovani, COURANI, PARTYJE, CAJK, UVODNIK, ZAKLAD, type Bod } from "../lib/pravidla";
import { stav } from "../lib/stav";
import { UVOD_KRESBY } from "../lib/uvod-kresby";
import { Logo } from "./Logo";
import { Pravidlo } from "./Pravidlo";

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

interface Plakat {
  /** Klíč kresby v UVOD_KRESBY. */
  id: keyof typeof UVOD_KRESBY;
  nadpis: string;
  /** Jeden odstavec, nebo seznam pravidel. Vždycky jedno z toho. */
  text?: string;
  body?: Bod[];
}

/** Pět plakátů. Nejsou to moje věty: text se bere z lib/pravidla.ts, odkud
 *  čte i obrazovka Pravidla. Úvod tedy neříká „něco jako pravidla", ale
 *  přímo je — a když se jedno změní, změní se obojí.
 *
 *  Jeden plakát = jedna kapitola pravidel a jedna kresba, co říká to samé:
 *  budík k času, šnek k loudání, čárky k bodování, kotel k banku. Dlouhé
 *  courání má plakát celý pro sebe, aby se nemuselo tlačit vedle cajku
 *  a partyjí. */
const PLAKATY: Plakat[] = [
  { id: "opilec", nadpis: "Betelná řežba", text: UVODNIK },
  { id: "hodiny", nadpis: "Jak se to valí", body: [CAJK, PARTYJE] },
  { id: "snek", nadpis: "Žádný courání", text: COURANI.text },
  { id: "carky", nadpis: "Bodování", body: bodovani(stav.hospody.length, true) },
  { id: "kotel", nadpis: "Celej bank", body: ZAKLAD },
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

export function Uvod({ hotovo }: { hotovo: () => void }) {
  // -1 = ještě svítí značka z index.html, 0+ = pořadí plakátu
  const [kde, setKde] = useState(-1);
  const [zavira, setZavira] = useState(false);

  // Značka odejde, až se čárky dokreslily a písma jsou opravdu načtená.
  // Značka a první plakát se prolnou přes sebe — kdyby jedna odešla dřív,
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

  /** Úvod se nevypne střihem, ale vytratí se. Pustit se smí jen jednou. */
  const zavirano = useRef(false);
  function zavri() {
    if (zavirano.current) return;
    zavirano.current = true;
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
    if (kde + 1 >= PLAKATY.length) zavri();
    else setKde(kde + 1);
  }

  function zpet() {
    if (kde > 0) setKde(kde - 1);
  }

  /** Ťuknutí se dělí na strany: vlevo zpátky, vpravo dál. Žádná tlačítka
   *  uprostřed — plakát má zůstat plakát a ruka drží telefon tak, že palec
   *  dosáhne všude.
   *
   *  Hranice není v polovině, ale v dvou pětinách. Dopředu se jde pětkrát,
   *  zpátky málokdy, takže větší strana patří tomu častějšímu; a kdo ťukne
   *  „někam doprostřed", protože chce dál, se netrefí zpátky. */
  const ZPET_DIL = 0.4;

  function tuk(e: React.PointerEvent<HTMLDivElement>) {
    const r = e.currentTarget.getBoundingClientRect();
    if (e.clientX - r.left < r.width * ZPET_DIL) zpet();
    else dal();
  }

  const p = PLAKATY[Math.max(0, kde)];
  const posledni = kde + 1 === PLAKATY.length;

  return (
    <div className={`uvod${zavira ? " zavira" : ""}${kde >= 0 ? " jede" : " znacka"}`}
      role="dialog" aria-label="Úvod">
      {kde >= 0 && (
        /* Ťuká se do obrazovky, ne do tlačítka: vpravo dál, vlevo zpátky.
           Šipky dole jsou jen cedule, že to tak funguje. */
        <div className="uvod-obsah" onPointerUp={tuk}>
          <div className="uvod-hlava">
            <Logo trida="uvod-znak" />
            {/* Přeskočit nesmí propadnout do ťuknutí pod sebou, jinak by
                posunulo dál a teprve pak zavřelo. */}
            <button className="uvod-preskocit" type="button"
              onPointerUp={(e) => { e.stopPropagation(); zavri(); }}
              onClick={(e) => { e.stopPropagation(); zavri(); }}>Přeskočit</button>
          </div>

          {/* key: každý plakát přijede jako nový, ne že se přepíše text */}
          <div className="uvod-list" key={kde}>
            <div className="uvod-kresba"><Cmaranice id={p.id} /></div>
            <h1 className="uvod-nadpis">{vazat(p.nadpis)}</h1>
            <div className="uvod-telo">
              {p.text && <p>{vazat(p.text)}</p>}
              {/* Bodování nese v štítku hodnotu (+1), ne jméno pravidla — ta
                  zůstává v řádce s větou, zbytek má štítek nad sebou. */}
              {p.body?.map((b) => (
                <p key={b.stitek ?? b.text} className={b.strop || b.stitek?.startsWith("+") ? "cena" : undefined}>
                  <Pravidlo bod={b} />
                </p>
              ))}
            </div>
          </div>

          <div className="uvod-spodek">
            {/* Šipka zpátky drží svoje místo i na prvním plakátu, kde nemá
                kam vést — jinak by čárky při každém listování poskočily. */}
            <span className={`uvod-zpet${kde > 0 ? "" : " nikam"}`} aria-hidden="true">
              <Sipka zpet />
            </span>
            <div className="uvod-tecky" role="img"
              aria-label={`Plakát ${kde + 1} ze ${PLAKATY.length}`}>
              {PLAKATY.map((_, i) => (
                <span key={i} className={`uvod-tecka${i === kde ? " ted" : ""}${i < kde ? " bylo" : ""}`} />
              ))}
            </div>
            <span className="uvod-dal">
              {posledni ? "Jedeme na to" : "Dál"}
              <Sipka />
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

/** Šipka u cedulí dole. `zpet` ji překlopí doleva. */
function Sipka({ zpet = false }: { zpet?: boolean }) {
  return (
    <svg className={`uvod-sipka${zpet ? " otocit" : ""}`} viewBox="0 0 24 10" fill="none"
      stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"
      aria-hidden="true">
      <path d="M1 5h21M17 1l5 4-5 4" />
    </svg>
  );
}

/** Kresba plakátu: ta samá ruka jako ikony, jen velká. Plocha je v barvě
 *  textu, výstřižky jsou průhledné a prosvítá jimi podklad — proto maska,
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
