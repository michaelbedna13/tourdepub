import { RAMY } from "../lib/ramy";

// Obrysy karet nastříhané nůžkama – ta samá ruka jako ikonky a kresby.
// Definice visí jednou v kostře appky, karty si je v CSS berou přes
// clip-path:url(#ram-…). Jsou v 0–1, takže se cesta napne na velikost karty;
// proto má každý tvar karty vlastní ráme, ať se křivka netahá na nudli.
export function Ramy() {
  return (
    <svg className="ramy" aria-hidden="true" focusable="false">
      <defs>
        {Object.entries(RAMY).map(([jm, d]) => (
          <clipPath key={jm} id={`ram-${jm}`} clipPathUnits="objectBoundingBox">
            <path d={d} />
          </clipPath>
        ))}
      </defs>
    </svg>
  );
}
