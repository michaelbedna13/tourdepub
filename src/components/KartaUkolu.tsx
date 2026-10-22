import type { Kategorie, Ukol } from "../lib/data";
import { vazat } from "../lib/format";
import { kolikrat, tym } from "../lib/stav";
import { Ikona } from "./Ikona";

interface Props {
  u: Ukol;
  k: Kategorie;
  otevri: () => void;
}

/** Jeden úkol jako dlaždice v galerii. Na dlaždici je jen tolik, co se dá
 *  přečíst za vteřinu: půllitry podle obtížnosti a jméno. Všechno ostatní —
 *  popis, poznámky, odškrtnutí — je v detailu, co se otevře ťuknutím.
 *
 *  Splněný úkol se zbarví do barvy kategorie. Barva tu nic nového neznamená:
 *  je to ta samá, co nese kategorii přes celou appku, jen se jí tady vybarví,
 *  co už je hotové. */
export function KartaUkolu({ u, k, otevri }: Props) {
  const t = tym();
  const kolik = kolikrat(u.id, t);
  const opakovatelny = u.max > 1;
  const splneno = kolik > 0 && (opakovatelny ? kolik >= u.max : true);
  const rozdelane = kolik > 0 && !splneno;

  return (
    <button
      className={`ukol-karta${splneno ? " splneno" : ""}${rozdelane ? " rozdelane" : ""}`}
      style={splneno ? { background: k.barva, color: k.naBarve } : undefined}
      onClick={otevri}
      aria-label={`${u.nazev}${splneno ? " (splněno)" : ""}`}>
      <Ikona jmeno={u.ikona ?? k.ikona} px={56} trida="ukol-karta-vodoznak" />

      <span className="ukol-karta-vrch">
        <span className={`piva o${u.piva}`}>
          {Array.from({ length: u.piva }, (_, i) => <Ikona key={i} jmeno="piva" px={12} />)}
        </span>
        {/* Rozdělaný opakovatelný úkol ukáže, kolikátý kus je zapsaný —
            na dlaždici je to jediné číslo, které se mění. */}
        {opakovatelny && kolik > 0 && !splneno && (
          <span className="ukol-karta-pocet cislo">{kolik}/{u.max}</span>
        )}
        {splneno && <Ikona jmeno="check" px={15} trida="ukol-karta-fajfka" />}
      </span>

      <span className="ukol-karta-nazev">{vazat(u.nazev)}</span>
    </button>
  );
}
