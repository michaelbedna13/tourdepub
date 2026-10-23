import type { Kategorie, Ukol } from "../lib/data";
import { sklonuj, vazat } from "../lib/format";
import { odmena } from "../lib/odmena";
import { jdePridat, kolikrat, pridejUkol, tym } from "../lib/stav";
import { Ikona } from "./Ikona";
import { Kresba, maKresbu } from "./Kresba";

interface Props {
  u: Ukol;
  k: Kategorie;
  otevri: () => void;
}

/** Jeden úkol jako karta v galerii. Rozvržení je jednoduché a drží se na
 *  všech kartách: kresba nahoře dostane všechno volné místo, text sedí dole
 *  a vedle něj je čtvereček, co zapisuje.
 *
 *  Čtvereček je u textu, ne v rohu nad kresbou: ruka ho tam má blíž, kresba
 *  nemusí uhýbat a karta se čte odshora dolů jako jedna věc. Popis, poznámky
 *  a odznaky jsou v detailu, co se otevře ťuknutím.
 *
 *  Celá galerie je v barvě kategorie — obrazovka Keců je zelená, Těla žlutá,
 *  Žranic červená. Všechny karty mají stejný odstín: obtížnost se dá přečíst
 *  z toho, kolik za úkol padne čárek, a z půllitrů v detailu, takže ji nemusí
 *  nést ještě podklad. Splněná karta se zbarví naplno. */
export function KartaUkolu({ u, k, otevri }: Props) {
  const t = tym();
  const kolik = kolikrat(u.id, t);
  const opakovatelny = u.max > 1;
  const splneno = kolik > 0 && (opakovatelny ? kolik >= u.max : true);

  // Na dlaždici jen to nejkratší, co dává smysl. Strop („až 5") je v detailu;
  // tady by se zalomil na tři řádky a ujedl místo jménu.
  const zaCo = opakovatelny ? `+${u.body} za kus` : `+${u.body} ${sklonuj(u.body)}`;

  function zapis(e: React.MouseEvent) {
    e.stopPropagation();
    if (pridejUkol(u)) odmena("+" + u.body);
  }

  return (
    <div
      className={`ukol-karta${splneno ? " splneno" : ""}`}
      style={splneno
        ? { background: k.barva, color: k.naBarve }
        : { "--kat": k.barva } as React.CSSProperties}
      role="button" tabIndex={0}
      onClick={otevri}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); otevri(); } }}
      aria-label={`${u.nazev}${splneno ? " (splněno)" : ""}`}>

      {/* Vlastní kresba úkolu, když k němu je; jinak ikona kategorie.
          Kresby dodává scripts/prevod-kreseb.py ze složky kresby/. */}
      <div className="ukol-karta-obraz">
        <Kresba id={u.id} trida="ukol-karta-kresba" />
        {!maKresbu(u.id) && <Ikona jmeno={u.ikona ?? k.ikona} px={96} trida="ukol-karta-kresba" />}
      </div>

      {/* Jméno přes celou šířku, ať se neláme uprostřed slova; čtvereček až
          u řádky s čárkami, jako na předloze. */}
      <h3 className="ukol-karta-nazev">{vazat(u.nazev)}</h3>

      <div className="ukol-karta-spodek">
        <span className="ukol-karta-zaco cislo">
          {opakovatelny && kolik > 0 && !splneno ? `${kolik}/${u.max} · ${zaCo}` : zaCo}
        </span>

        {/* Hotový úkol už se zapsat nedá, tak z tlačítka zbude jen fajfka. */}
        {splneno ? (
          <span className="ukol-karta-box hotovo" aria-hidden="true">
            <Ikona jmeno="check" px={17} />
          </span>
        ) : (
          <button className="ukol-karta-box" onClick={zapis} disabled={!jdePridat(u, t)}
            aria-label={`Zapsat ${u.nazev}`}>
            <Ikona jmeno="plus" px={17} />
          </button>
        )}
      </div>
    </div>
  );
}
