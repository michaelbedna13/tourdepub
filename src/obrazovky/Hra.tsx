import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Carky } from "../components/Carky";
import { Hlava } from "../components/Hlava";
import { Ikona } from "../components/Ikona";
import { PruhSyncu } from "../components/PruhSyncu";
import { ZAKLAD, type Hospoda } from "../lib/data";
import { sklonujTym, sklonujUkol, vazat } from "../lib/format";
import { odmena } from "../lib/odmena";
import {
  body, indexHospody, jdePridat, nastavHospodu, poradiTymu, posunHospodu,
  prepniZaklad, rozpad, stav, tym, useStav, type Zaklad,
} from "../lib/stav";

/** Hlavní obrazovka. Hero karta nese celou štaci: kolikátá je, jak se jmenuje,
 *  kde jsme na trase a co se tu dá zapsat. Dřív to byly čtyři samostatné bloky
 *  se stejnou vahou, takže nic nevedlo. */
export function Hra() {
  useStav();
  const t = tym();
  const r = rozpad();
  const celkem = body();
  const zbyva = t ? stav.ukoly.filter((u) => jdePridat(u, t)).length : 0;
  const poradi = poradiTymu();
  const nejvic = poradi[0]?.body || 0;

  if (!t) return <><Hlava nadpis="Hra" /><div className="prazdno">Nejdřív si založ tým.</div></>;

  return (
    <>
      <Hlava />
      <PruhSyncu />
      <HeroPas />

      <div className="sekce">
        <div className="vrstva">
          <div className="skore-velke">
            <div className="skore-cislo cislo">{celkem}</div>
            <div className="skore-vedle">
              <Carky kolik={celkem} vyska={22} />
              <div className="skore-popis cislo">
                {r.dochazka} za špeluňky · {r.skopky} za škopky · {r.ukoly} za srandy
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Dokud hraje jedna parta, není co srovnávat – „vede, odstup 0" je
          jen řádek navíc. Naskočí to, jakmile přibude druhý tým. */}
      {poradi.length > 1 && (
        <div className="sekce">
          <div className="sekce-hlava">
            <h2>JAK NA TOM JSOU</h2>
            <span className="pocet">{poradi.length} {sklonujTym(poradi.length)}</span>
          </div>
          <div className="vrstva radky">
            {poradi.map((p) => {
              const rozdil = p.body - nejvic;
              return (
                <div key={p.id} className={`pruh-tymu${p.id === stav.tymId ? " ja" : ""}`}>
                  <span className="tecka" style={{ background: p.barva }} />
                  <span className="jmeno">{p.nazev}</span>
                  <span className="odstup cislo">{rozdil === 0 ? "vede" : rozdil}</span>
                  <span className="cifra cislo">{p.body}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="sekce">
        <Link className="tl" to="/ukoly">
          <Ikona jmeno="hvezda" px={18} />
          {zbyva ? `Zbývá ${zbyva} ${sklonujUkol(zbyva)}` : "Projít úkoly"}
        </Link>
      </div>
    </>
  );
}

/* ---------- hero karty štací ---------- */

/** Karty štací vedle sebe, přepínají se švihem do boku i šipkami.
 *  Švih je pro jednu ruku v hospodě rychlejší než mířit na malý terč.
 *
 *  Která karta zrovna platí, si pás drží sám (`videna`) a přepisuje to hned,
 *  jak se karta dostane do obrazu. Do stavu týmu se to zapíše až po dojetí.
 *  Dřív se čekalo na obojí a karta se rozsvítila skoro vteřinu po švihu —
 *  vypadalo to, jako by se něco načítalo. */
function HeroPas() {
  const i = indexHospody();
  const [videna, setVidena] = useState(i);
  const pas = useRef<HTMLDivElement>(null);
  const hned = useRef(true);
  const cas = useRef(0);

  // srovná posun na aktivní štaci: po šipkách, po skoku z Hospod i po spuštění
  useEffect(() => {
    setVidena(i);
    const p = pas.current;
    const karta = p?.children[i] as HTMLElement | undefined;
    const prvni = p?.children[0] as HTMLElement | undefined;
    if (!p || !karta || !prvni) return;
    const rovnou = hned.current;
    hned.current = false;
    const cil = karta.offsetLeft - prvni.offsetLeft;
    if (Math.abs(p.scrollLeft - cil) < 2) return;
    p.scrollTo({ left: cil, behavior: rovnou ? "auto" : "smooth" });
  }, [i]);

  useEffect(() => () => window.clearTimeout(cas.current), []);

  /** Která karta je nejblíž levému kraji pásu. */
  function vObraze(): number {
    const p = pas.current;
    const prvni = p?.children[0] as HTMLElement | undefined;
    if (!p || !prvni) return videna;
    let nej = 0;
    let nejblize = Infinity;
    Array.from(p.children).forEach((el, j) => {
      const d = Math.abs((el as HTMLElement).offsetLeft - prvni.offsetLeft - p.scrollLeft);
      if (d < nejblize) { nejblize = d; nej = j; }
    });
    return nej;
  }

  function naPosun() {
    // rozsvítit hned, jakmile je karta v obraze (překreslí se jen při změně)
    const ted = vObraze();
    if (ted !== videna) setVidena(ted);
    // zápis do stavu týmu až po dojetí: jeden švih by ho jinak přepsal
    // několikrát za sebou a každý zápis jde i do telefonu a na server
    window.clearTimeout(cas.current);
    cas.current = window.setTimeout(() => {
      const cil = stav.hospody[vObraze()];
      if (cil) nastavHospodu(cil.id);
    }, 90);
  }

  return (
    <div className="hero-pas" ref={pas} onScroll={naPosun} data-vodorovne>
      {stav.hospody.map((h, j) => <HeroKarta key={h.id} h={h} cislo={j + 1} aktivni={j === videna} />)}
    </div>
  );
}

function HeroKarta({ h, cislo, aktivni }: { h: Hospoda; cislo: number; aktivni: boolean }) {
  const t = tym();
  const posledni = cislo === stav.hospody.length;
  // štace je hotová, když je zapsaný příchod i škopek – pak na kartu klapne razítko
  const hotova = !!t?.prichod[h.id] && !!t?.skopek[h.id];

  return (
    <section className={`hero${aktivni ? " ted" : ""}${hotova ? " hotova" : ""}`}
      aria-label={`${cislo}. štace: ${h.nazev}${hotova ? " (hotová)" : ""}`}>
      {/* číslo štace ještě jednou, ve velkém a potichu: karty jsou jinak k
          nerozeznání a tohle jim dá tvář, aniž by to něco přidalo na čtení */}
      <span className="hero-duch cislo" aria-hidden="true">{cislo}</span>

      <div className="hero-vrch">
        <div className="hero-cislo cislo">{cislo}</div>
        {hotova && <span className="hero-razitko" aria-hidden="true">Hotovo</span>}
        <div className="hero-sipky">
          <button className="ikonove" onClick={() => posunHospodu(-1)} disabled={cislo === 1}
            aria-label="Předchozí špeluňka"><Ikona jmeno="i-zpet" px={16} /></button>
          <button className="ikonove" onClick={() => posunHospodu(1)} disabled={posledni}
            aria-label="Další špeluňka"><Ikona jmeno="i-zpet" px={16} trida="otocit" /></button>
        </div>
      </div>

      <h1 className="hero-nazev">{h.nazev}</h1>

      <div className="hero-trasa">
        <div className="trasa-body" role="img" aria-label={`Štace ${cislo} z ${stav.hospody.length}`}>
          {stav.hospody.map((x, j) => (
            <div key={x.id} className={`trasa-bod${x.id === h.id ? " ted" : t?.prichod[x.id] ? " splneno" : ""}`}
              title={`${j + 1}. ${x.nazev}`} />
          ))}
        </div>
        <span className="hero-stace cislo">{cislo}/{stav.hospody.length}</span>
      </div>

      <div className="hero-zapis">
        {ZAKLAD.map((z) => {
          const hotovo = !!t?.[z.id as Zaklad][h.id];
          return (
            <button key={z.id} className={`zaskrt${hotovo ? " hotovo" : ""}`} aria-pressed={hotovo}
              onClick={() => { if (prepniZaklad(z.id as Zaklad, h.id)) odmena("+1"); }}>
              <span className="zaskrt-kolecko"><Ikona jmeno="check" px={14} /></span>
              <span className="zaskrt-text">{vazat(z.nazev)}</span>
              <span className="zaskrt-hodnota cislo">+1</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
