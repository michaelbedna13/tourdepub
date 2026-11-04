import { OBTIZNOST } from "../lib/data";
import { Ikona } from "./Ikona";

/* Názvy obtížností byly napsané dvakrát: tady a v OBTIZNOST v data.ts,
   odkud je bere formulář úkolu i Pravidla. Teď jen tam. */

interface Props {
  piva: 1 | 2 | 3;
  /** Bez názvu zůstanou jen půllitry – do legendy, kde název stojí vedle. */
  sNazvem?: boolean;
}

/** Štítek obtížnosti. Barva sama nikdy nestačí, proto je vedle ní
 *  i počet půllitrů a název (HIG: nespoléhat jen na barvu). */
export function Obtiznost({ piva, sNazvem = true }: Props) {
  return (
    <span className={`obtiznost o${piva}`}>
      <span className="piva">
        {Array.from({ length: piva }, (_, i) => <Ikona key={i} jmeno="piva" px={13} />)}
      </span>
      {sNazvem && OBTIZNOST.find((o) => o.piva === piva)?.nazev}
    </span>
  );
}
