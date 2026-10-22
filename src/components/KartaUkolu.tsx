import type { Kategorie, Ukol } from "../lib/data";
import { sklonuj, vazat } from "../lib/format";
import { odmena } from "../lib/odmena";
import { jdePridat, kolikrat, pridejUkol, tym } from "../lib/stav";
import { Ikona } from "./Ikona";
import { Kresba } from "./Kresba";
import { KRESBY } from "../lib/kresby";

interface Props {
  u: Ukol;
  k: Kategorie;
  otevri: () => void;
}

/** Jeden úkol jako karta v galerii: nahoře kresba, dole jméno a co za to
 *  padne. Víc se na kartu nevejde a víc tam ani nemá být — popis, poznámky
 *  a odznaky jsou v detailu, co se otevře ťuknutím.
 *
 *  Celá galerie je v odstínech barvy kategorie — obrazovka Keců je zelená,
 *  Těla žlutá, Žranic červená. Sytost odstínu drží obtížnost: čím těžší
 *  úkol, tím víc barvy. Je to jedna barva ve třech silách, ne dvě soustavy
 *  vedle sebe. Splněná karta se zbarví naplno.
 *
 *  Čtvereček v rohu zapisuje rovnou z galerie — to je ten obvyklý pohyb.
 *  Kdo si chce přečíst zadání, ťukne na kartu a otevře se detail. */
export function KartaUkolu({ u, k, otevri }: Props) {
  const t = tym();
  const kolik = kolikrat(u.id, t);
  const opakovatelny = u.max > 1;
  const splneno = kolik > 0 && (opakovatelny ? kolik >= u.max : true);

  const zaCo = opakovatelny
    ? `+${u.body} za kus, až ${u.body * u.max}`
    : `+${u.body} ${sklonuj(u.body)}`;

  function zapis(e: React.MouseEvent) {
    e.stopPropagation();
    if (pridejUkol(u)) odmena("+" + u.body);
  }

  return (
    <div
      className={`ukol-karta sila${u.piva}${splneno ? " splneno" : ""}`}
      style={splneno
        ? { background: k.barva, color: k.naBarve }
        : { "--kat": k.barva } as React.CSSProperties}
      role="button" tabIndex={0}
      onClick={otevri}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); otevri(); } }}
      aria-label={`${u.nazev}${splneno ? " (splněno)" : ""}`}>

      {/* Vlastní kresba úkolu, když k němu je; jinak ikona kategorie.
          Kresby dodává scripts/prevod-kreseb.py ze složky kresby/. */}
      <Kresba id={u.id} trida="ukol-karta-kresba" />
      {!KRESBY[u.id] && <Ikona jmeno={u.ikona ?? k.ikona} px={96} trida="ukol-karta-kresba" />}

      <h3 className="ukol-karta-nazev">{vazat(u.nazev)}</h3>

      <span className="ukol-karta-zaco cislo">
        {opakovatelny && kolik > 0 && !splneno ? `${kolik}/${u.max} · ${zaCo}` : zaCo}
      </span>

      {/* Hotový úkol už se zapsat nedá, tak z tlačítka zbude jen fajfka. */}
      {splneno ? (
        <span className="ukol-karta-box hotovo" aria-hidden="true">
          <Ikona jmeno="check" px={16} />
        </span>
      ) : (
        <button className="ukol-karta-box" onClick={zapis} disabled={!jdePridat(u, t)}
          aria-label={`Zapsat ${u.nazev}`}>
          <Ikona jmeno="plus" px={16} />
        </button>
      )}
    </div>
  );
}
