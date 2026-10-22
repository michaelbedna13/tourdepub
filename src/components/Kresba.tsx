import { KRESBY } from "../lib/kresby";

/** Kresba úkolu, pokud k němu nějaká je. Vrací null, když není — volající
 *  pak sáhne po ikoně kategorie. Kreslí se barvou textu stejně jako ikony,
 *  takže funguje na vybarvené i nevybarvené kartě. */
export function Kresba({ id, trida }: { id: string; trida?: string }) {
  const d = KRESBY[id];
  if (!d) return null;
  return (
    <svg className={["ikona", trida].filter(Boolean).join(" ")} viewBox="0 0 100 100"
      fill="currentColor" fillRule="evenodd" aria-hidden="true">
      <path d={d} />
    </svg>
  );
}
