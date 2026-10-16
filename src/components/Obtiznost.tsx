import { Ikona } from "./Ikona";

export const NAZVY_OBTIZNOSTI: Record<1 | 2 | 3, string> =
  { 1: "Brnkačka", 2: "Větší haluz", 3: "Betelná makačka" };

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
      {sNazvem && NAZVY_OBTIZNOSTI[piva]}
    </span>
  );
}
