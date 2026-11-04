// Brána: heslo hry (nebo heslo správce) při prvním spuštění. Pak si ho telefon pamatuje
// (přihlášení drží Supabase v localStorage a samo ho obnovuje).
//
// Není to vrstva přes appku, ale obrazovka místo ní: vrstva přes celou
// obrazovku s vlastní barvou by v Safari 26 natřela blok pod lištou
// (viz „Vrstvy přes obrazovku nesmí mít barvu“), a appka pod heslem
// stejně nemá co ukazovat.
import { useEffect, useState, type FormEvent } from "react";
import { vazat } from "../lib/format";
import { aktualniUcet, dejKlienta, prihlasBranou } from "../lib/prihlaseni";
import { odkryjSpravce } from "../lib/spravce";
import { Logo } from "./Logo";

export function Brana() {
  const [heslo, setHeslo] = useState("");
  const [chyba, setChyba] = useState("");
  const [ceka, setCeka] = useState(false);

  // Klient se stahuje zvlášť. Ať je v ruce, než se dopíše heslo.
  useEffect(() => { dejKlienta().catch(() => {}); }, []);

  async function vstup(e: FormEvent) {
    e.preventDefault();
    // Mezera na konci je skoro vždycky od klávesnice, ne od člověka.
    const h = heslo.trim();
    if (!h || ceka) return;
    setCeka(true);
    setChyba("");
    const c = await prihlasBranou(h);
    setCeka(false);
    if (c) setChyba(c);
    else if (aktualniUcet() === "spravce") odkryjSpravce();
  }

  return (
    <main className="brana">
      <Logo trida="brana-logo" />
      <h1 className="brana-nadpis">Heslo hry</h1>
      <form onSubmit={vstup} noValidate>
        {/* Viditelné písmo, ne tečky. Heslo hry zná celá parta a píše se
            v hospodě; vidět, co člověk naťukal, ušetří půlku omylů. */}
        <input type="text" value={heslo} name="heslo-hry" aria-label="Heslo hry"
          autoComplete="off" autoCapitalize="none" autoCorrect="off" spellCheck={false}
          enterKeyHint="go" aria-invalid={chyba ? true : undefined}
          onChange={(e) => { setHeslo(e.target.value); setChyba(""); }} />
        {chyba && <span className="poznamka spatne brana-chyba" role="alert">{vazat(chyba)}</span>}
        <button className="tl hlavni" type="submit" disabled={ceka || !heslo.trim()}>
          {ceka ? "Ověřuju…" : "Pustit dál"}
        </button>
      </form>
    </main>
  );
}
