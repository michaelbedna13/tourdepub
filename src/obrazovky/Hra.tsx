import { useEffect, useRef, useState } from "react";
import { Hlava } from "../components/Hlava";
import { KartyKategorii } from "../components/KartyKategorii";
import { Ikona } from "../components/Ikona";
import { PruhSyncu } from "../components/PruhSyncu";
import { Uctenka } from "../components/Uctenka";
import { ZAKLAD, type Hospoda } from "../lib/data";
import { jakDlouho, vazat } from "../lib/format";
import { odmena } from "../lib/odmena";
import { RAZITKO } from "../lib/razitko";
import {
  indexHospody, nastavHospodu, poradiTymu, posunHospodu, prepniTym,
  prepniZaklad, stav, strop, tym, useStav, type Zaklad,
} from "../lib/stav";

/** Hlavní obrazovka. Hero karta nese celou štaci: kolikátá je, jak se jmenuje,
 *  kde jsme na trase a co se tu dá zapsat. Dřív to byly čtyři samostatné bloky
 *  se stejnou vahou, takže nic nevedlo. */
export function Hra() {
  useStav();
  const t = tym();
  const poradi = poradiTymu();

  if (!t) return <><Hlava nadpis="Hra" /><div className="prazdno">Nejdřív si založ tým.</div></>;

  return (
    <>
      <Hlava />
      <PruhSyncu />
      <HeroPas />

      {/* Skóre tu stávalo jako velké číslo s čárkami. Vlastní čárky si parta
          přečte v účtence na Týmech, kde je vedle ostatních — a na začátku
          večera to byla velká nula přes půl obrazovky. */}
      <div className="sekce">
        <div className="sekce-hlava">
          <h2>CO SE DÁ URVAT</h2>
        </div>
        <KartyKategorii male />
      </div>

      {/* Dokud hraje jedna parta, není co srovnávat – „vede, odstup 0" je
          jen řádek navíc. Naskočí to, jakmile přibude druhý tým.

          Je to ta samá účtenka jako na Týmech, protože tohle je obrazovka,
          na kterou se za večer kouká nejvíc, a pořadí part se tam hledalo
          přes menu. Tužka tu není: upravuje se na Týmech. */}
      {poradi.length > 1 && (
        <div className="sekce">
          <Uctenka
            poradi={poradi}
            tymId={stav.tymId}
            hospod={stav.hospody.length}
            ukolu={stav.ukoly.length}
            strop={strop().celkem}
            prepni={prepniTym}
          />
        </div>
      )}

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
  const odKdy = t?.prichodCas[h.id];
  return (
    <section className={`hero${aktivni ? " ted" : ""}${hotova ? " hotova" : ""}`}
      aria-label={`${cislo}. štace: ${h.nazev}${hotova ? " (hotová)" : ""}`}>
      {/* Razítko přes celou kartu, ne odznáček v rohu: hotová štace má být
          vidět na první pohled při švihu pásem. Pod ním se horní půlka karty
          rozostří — jméno a trasa jsou pořád poznat, ale už to není to, co
          se čte. Odškrtávátka dole zůstanou ostrá, aby šel zápis vzít zpátky. */}
      {hotova && (
        <span className="hero-razitko" aria-hidden="true">
          <svg className="razitko-ramecek" viewBox="0 0 172 60" preserveAspectRatio="none"
            aria-hidden="true">
            <path d={RAZITKO} fillRule="evenodd" />
          </svg>
          Hotovo
        </span>
      )}

      <div className="hero-vrch">
        <div className="hero-sipky">
          <button className="ikonove" onClick={() => posunHospodu(-1)} disabled={cislo === 1}
            aria-label="Předchozí špeluňka"><Ikona jmeno="i-zpet" px={16} /></button>
          <button className="ikonove" onClick={() => posunHospodu(1)} disabled={posledni}
            aria-label="Další špeluňka"><Ikona jmeno="i-zpet" px={16} trida="otocit" /></button>
        </div>
      </div>

      {/* Číslo štace jako tiché nadočko nad jménem. Dřív leželo za nadpisem
          jako obrovský obrys a lezlo přes jméno i přes pruh trasy — karta
          z toho byla přeplácaná a nedalo se poznat, co je na ní hlavní.
          Tady nese tu samou informaci a nic nepřekrývá. */}
      <div className="hero-nadocko">{cislo}. štace z {stav.hospody.length}</div>

      <h1 className="hero-nazev">{h.nazev}</h1>

      <div className="hero-trasa">
        <div className="trasa-body" role="img" aria-label={`Štace ${cislo} z ${stav.hospody.length}`}>
          {stav.hospody.map((x, j) => (
            <div key={x.id} className={`trasa-bod${x.id === h.id ? " ted" : t?.prichod[x.id] ? " splneno" : ""}`}
              title={`${j + 1}. ${x.nazev}`} />
          ))}
        </div>
      </div>

      <JakDlouho od={odKdy} />

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

/** Jak dlouho parta v téhle špeluňce sedí. Přepočítá se jednou za půl minuty:
 *  na vteřiny to nikdo nekouká a častější překreslování by jen bralo baterku.
 *  Řádka drží místo i bez zapsaného příchodu — karty v pásu jsou stejně vysoké
 *  a bez toho by trasa pod názvem při švihu skákala nahoru a dolů. */
function JakDlouho({ od }: { od?: number }) {
  const [, tik] = useState(0);
  useEffect(() => {
    const i = window.setInterval(() => tik((x) => x + 1), 30000);
    return () => window.clearInterval(i);
  }, []);
  return <div className="hero-cas">{od === undefined ? null : vazat(`Jste tady ${jakDlouho(od)}`)}</div>;
}
