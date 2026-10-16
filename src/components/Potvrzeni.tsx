// Potvrzení nevratných věcí. Systémový confirm() vypadal v appce jako cizí
// a na ploše iPhonu nad ním svítí adresa webu; tohle je stejné okno jako zbytek.
import { useSyncExternalStore } from "react";
import { Ikona } from "./Ikona";
import { Okno } from "./Okno";

interface Dotaz {
  nadpis: string;
  pod: string;
  /** Text potvrzovacího tlačítka. */
  akce: string;
  odpoved: (ano: boolean) => void;
}

let dotaz: Dotaz | null = null;
const posluchaci = new Set<() => void>();
function zmena() {
  posluchaci.forEach((f) => f());
}

/** Zeptá se a vrátí, jestli to má proběhnout. */
export function potvrdit(nadpis: string, pod: string, akce: string): Promise<boolean> {
  // druhý dotaz přes první nepustíme, první se tiše zavře jako „ne“
  dotaz?.odpoved(false);
  return new Promise((hotovo) => {
    dotaz = { nadpis, pod, akce, odpoved: hotovo };
    zmena();
  });
}

function odpovez(ano: boolean) {
  dotaz?.odpoved(ano);
  dotaz = null;
  zmena();
}

/** Stojí v App, aby se dotaz dal vyvolat odkudkoli. */
export function PotvrzeniHost() {
  const d = useSyncExternalStore(
    (f) => { posluchaci.add(f); return () => posluchaci.delete(f); },
    () => dotaz,
    () => dotaz,
  );
  if (!d) return null;
  return (
    <Okno nadpis={d.nadpis} pod={d.pod} zavri={() => odpovez(false)}>
      <div className="okno-akce">
        <button className="tl nebezpecne" onClick={() => odpovez(true)}>
          <Ikona jmeno="i-kos" px={18} /> {d.akce}
        </button>
        <button className="tl tise" onClick={() => odpovez(false)}>Nechat být</button>
      </div>
    </Okno>
  );
}
