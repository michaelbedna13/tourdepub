import type { Ukol } from "../lib/data";
import { sklonuj, vazat } from "../lib/format";
import { odmena } from "../lib/odmena";
import { jdePridat, kolikrat, pridejUkol, tipNaStaci, tym, uberUkol } from "../lib/stav";
import { Ikona } from "./Ikona";
import { Obtiznost } from "./Obtiznost";

interface Props {
  u: Ukol;
  /** Ťuknutím se otevře úprava – jen v režimu správce. */
  uprav?: () => void;
}

/** Jeden úkol v seznamu. Jednorázový se přepíná ťuknutím na celý řádek,
 *  opakovatelný má počítadlo (jinak by se dalo zapsat jen plus nebo nic). */
export function RadekUkolu({ u, uprav }: Props) {
  const t = tym();
  const kolik = kolikrat(u.id, t);
  const opakovatelny = u.max > 1;
  const splneno = kolik > 0 && (opakovatelny ? kolik >= u.max : true);

  // Štace je tip, ne zámek – úkol jde zapsat kdykoli a odkudkoli.
  const odznaky = [
    tipNaStaci(u),
    u.exkluzivni ? "Bere jen jedna parta" : null,
    opakovatelny ? `${u.body} ${sklonuj(u.body)} za kus, až ${u.body * u.max}` : null,
    u.jednouZaHospodu && t?.hospoda && t.zlodej[t.hospoda] ? "Z týhle špeluňky už máte" : null,
  ].filter(Boolean) as string[];

  function prepni() {
    if (opakovatelny) return;
    if (kolik > 0) uberUkol(u);
    else if (pridejUkol(u)) odmena("+" + u.body);
  }

  const tridy = ["ukol", splneno && "splneno"].filter(Boolean).join(" ");

  return (
    <div className={tridy}
      {...(opakovatelny ? {} : { role: "button", tabIndex: 0, "aria-pressed": kolik > 0, onClick: prepni,
        onKeyDown: (e: React.KeyboardEvent) => {
          if (e.key === "Enter" || e.key === " ") { e.preventDefault(); prepni(); }
        } })}>
      <div className="ukol-hlava">
        <span className="ukol-nazev">{vazat(u.nazev)}</span>
        {opakovatelny ? (
          <div className="pocitadlo">
            <button onClick={() => uberUkol(u)} disabled={kolik <= 0} aria-label={`Ubrat ${u.nazev}`}>
              <Ikona jmeno="minus" px={13} />
            </button>
            <span className="kolik cislo">{kolik}</span>
            <button onClick={() => { if (pridejUkol(u)) odmena("+" + u.body); }}
              disabled={!jdePridat(u, t)} aria-label={`Přidat ${u.nazev}`}>
              <Ikona jmeno="plus" px={13} />
            </button>
          </div>
        ) : (
          <div className="fajfka"><Ikona jmeno="check" px={15} /></div>
        )}
      </div>

      {u.popis && <p className="ukol-popis">{vazat(u.popis)}</p>}
      {u.pozn && <p className="ukol-pozn">{vazat(u.pozn)}</p>}

      <div className="ukol-stav">
        <div className="ukol-chipy">
          <Obtiznost piva={u.piva} />
          {odznaky.map((o) => <span key={o} className="odznak">{vazat(o)}</span>)}
        </div>
        {uprav && (
          <button className="ikonove holy" aria-label={`Upravit ${u.nazev}`}
            onClick={(e) => { e.stopPropagation(); uprav(); }}>
            <Ikona jmeno="i-tuzka" px={16} />
          </button>
        )}
      </div>
    </div>
  );
}
