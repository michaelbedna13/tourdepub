// Úvod po každém spuštění: značka se složí písmeno po písmenu, pak pět
// plakátů, kterými se proklikává.
//
// Všech pět stojí stejně: nadpis a souvislý odstavec nahoře, panák dole
// nad lištou. Rozdíl mezi nimi dělá jen to, co je na nich napsané a co
// panák zrovna dělá.
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
import { PRIBEH } from "../lib/pribeh";
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

/** Pět plakátů, pět kapitol jednoho večera (lib/pribeh.ts). Ke každé
 *  patří panák, co ji hraje: ťuká si škopkem, opírá se o hospodu, běží
 *  s pivem, píše čárky na tabuli, skáče s pohárem. Kresby jdou ve stejném
 *  pořadí jako kapitoly. */
const KRESBY_KAPITOL = ["sraz", "hospoda", "beh", "zed", "vitez"] as const;
const PLAKATY = PRIBEH.map((k, i) => ({ ...k, id: KRESBY_KAPITOL[i] }));

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
    setTimeout(() => { hotovo(); postrcStranku(); }, ZAVRENI);
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

  /** Pás se značkou a Přeskočit nahoře. Ťuknutí do jeho pravé půlky
   *  zavírá úvod, i když mine samotné tlačítko.
   *
   *  Mišák: na iPhonu Přeskočit nefungovalo. V Chromiu se to napodobit
   *  nedá, tlačítko tam dostane ťuknutí a úvod zavře. Takže se na to, komu
   *  Safari ťuknutí přidělí, nespoléhá: rozhoduje plakát podle místa,
   *  stejně jako u Dál a Zpátky, které na telefonu fungují. Drobné slovo
   *  v rohu je terč, který se po pár pivech snadno mine; netrefené ťuknutí
   *  dřív padlo do pravé části plakátu a posunulo dál místo zavření. */
  const hlava = useRef<HTMLDivElement>(null);

  function tuk(e: React.PointerEvent<HTMLDivElement>) {
    const r = e.currentTarget.getBoundingClientRect();
    const h = hlava.current?.getBoundingClientRect();
    if (h && e.clientY <= h.bottom && e.clientX - r.left >= r.width / 2) { zavri(); return; }
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
          <div className="uvod-hlava" ref={hlava}>
            <Logo trida="uvod-znak" />
            {/* Ťuknutí sem řeší tuk() podle místa (viz hlava výš). Tlačítko
                zůstává kvůli klávesnici a čtečce; click nepropadne dál. */}
            <button className="uvod-preskocit" type="button"
              onClick={(e) => { e.stopPropagation(); zavri(); }}>Přeskočit</button>
          </div>

          {/* key: každý plakát přijede jako nový, ne že se přepíše text.
              Nadpis a text nahoře, panák dole nad lištou: čte se shora
              a kresba je tečka na konci, ne překážka před textem. */}
          <div className="uvod-list" key={kde}>
            <h1 className="uvod-nadpis">
              <span>{vazat(p.nadpis[0])}</span>
              <span>{vazat(p.nadpis[1])}</span>
            </h1>
            <p className="uvod-telo">{vazat(p.text)}</p>
            <div className="uvod-kresba"><Cmaranice id={p.id} /></div>
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

/** Postrčí stránku o bod a zpátky.
 *
 *  Appka z plochy na iPhonu po zmizení úvodu (vrstva přes celou obrazovku)
 *  zůstala celá posunutá dolů o výšku stavového řádku a srovnala se až po
 *  prvním dotyku. Na Mišákově screenshotu: pilulka týmu na 156 bodech před
 *  dotykem, 97 po něm, má být 95; posun 59 až 61 bodů, safe-area nahoře
 *  je 59. Dotyk nedělá nic jiného, než že iOS přepočítá posun stránky,
 *  a to samé udělá posunutí o bod tam a zpátky. Je to chyba WebKitu
 *  v režimu z plochy, v prohlížeči se to neděje a v Chromiu se nedá
 *  napodobit, takže ověřit to jde jen na telefonu. */
function postrcStranku() {
  requestAnimationFrame(() => {
    window.scrollTo(0, 1);
    window.scrollTo(0, 0);
  });
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
  const kresba = UVOD_KRESBY[id];
  if (!kresba) return null;
  const [bx, by, bw, bh] = kresba.box.split(" ").map(Number);
  // viewBox je obálka inkoustu, ne celý čtverec, ve kterém se kreslilo: jinak
  // by měla každá kresba jinak velkou mezeru pod sebou podle toho, kolik
  // z čtverce zabrala (viz obalka() v scripts/kresli-uvod.mjs).
  return (
    <svg className="uvod-cmaranice" viewBox={kresba.box} aria-hidden="true">
      {/* Maska i plocha podle obálky kresby, ne pevně -20…120: hospoda se
          štítem sahá za 120 a pevná maska ji usekla. */}
      <mask id={maska} maskUnits="userSpaceOnUse" x={bx - 5} y={by - 5} width={bw + 10} height={bh + 10}>
        {kresba.vrstvy.map(([druh, d], i) => (
          <path key={i} d={d} fill={druh === "i" ? "#FFFFFF" : "#000000"} />
        ))}
      </mask>
      <rect x={bx - 5} y={by - 5} width={bw + 10} height={bh + 10} fill="currentColor" mask={`url(#${maska})`} />
    </svg>
  );
}
