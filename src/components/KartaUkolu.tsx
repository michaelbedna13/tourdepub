import type { Kategorie, Ukol } from "../lib/data";
import { useSazbaJmena, vzorJmena } from "../lib/sazba";
import { kolikrat, tym } from "../lib/stav";
import { Ikona } from "./Ikona";
import { Kresba, maKresbu } from "./Kresba";

interface Props {
  u: Ukol;
  k: Kategorie;
  otevri: () => void;
}

/** Jeden úkol jako dlaždice v galerii: kresba a jméno, nic víc.
 *
 *  Zapisovat se odsud nedalo vždycky. Byl tu čtvereček se znaménkem, pak
 *  tlačítko s hodnotou (+2) a pokaždé se o místo pralo s jménem: u krátkého
 *  jména zbyla uprostřed karty díra, u dlouhého se k sobě obojí přimáčklo.
 *  Dlaždice je přehled, ne ovládání. Zapisuje se v detailu, kam vede ťuknutí,
 *  a je to jediné, co se na kartě dá udělat, takže se celá karta chová jako
 *  jedno tlačítko.
 *
 *  Stav je v rohu, ne v řádce: splněný úkol má fajfku a celou kartu v barvě
 *  kategorie, načatý opakovatelný ukazuje kolikrát z kolika. Co se nehodí
 *  říct, se neřekne, takže na většině karet není v rohu nic. */
export function KartaUkolu({ u, k, otevri }: Props) {
  const t = tym();
  const kolik = kolikrat(u.id, t);
  const opakovatelny = u.max > 1;
  const splneno = kolik > 0 && (opakovatelny ? kolik >= u.max : true);
  const postup = opakovatelny && kolik > 0 && !splneno ? `${kolik}/${u.max}` : null;

  // Lámání i případné stažení jména si spočítá lib/sazba.ts z naměřené
  // šířky v tom písmu, které se opravdu načetlo. Odhad podle počtu znaků tu
  // stál dřív a stahoval skoro dvakrát víc, než bylo potřeba.
  const { radky, sazba, prostrkani } = useSazbaJmena(u.nazev);

  return (
    <div
      className={`ukol-karta${splneno ? " splneno" : ""}`}
      style={splneno
        ? { background: k.karta }
        : { "--kat": k.barva } as React.CSSProperties}
      role="button" tabIndex={0}
      onClick={otevri}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); otevri(); } }}
      aria-label={`${u.nazev}${splneno ? ", splněno" : postup ? `, ${postup}` : ""}`}>

      {splneno && (
        <span className="ukol-karta-odznak hotovo" aria-hidden="true">
          <Ikona jmeno="check" px={15} />
        </span>
      )}
      {postup && <span className="ukol-karta-odznak cislo" aria-hidden="true">{postup}</span>}

      {/* Vlastní kresba úkolu, když k němu je; jinak ikona kategorie.
          Kresby dodává scripts/prevod-kreseb.py ze složky kresby/. */}
      <div className="ukol-karta-obraz">
        <Kresba id={u.id} trida="ukol-karta-kresba" />
        {!maKresbu(u.id) && <Ikona jmeno={u.ikona ?? k.ikona} px={96} trida="ukol-karta-kresba" />}
      </div>

      <h3 ref={vzorJmena} className="ukol-karta-nazev"
        style={{ "--sazba": sazba, "--prostrkani": `${prostrkani}em` } as React.CSSProperties}>
        {radky.map((r, i) => <span key={i}>{r}</span>)}
      </h3>
    </div>
  );
}
