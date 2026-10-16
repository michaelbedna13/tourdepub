import { LOGO_CESTA, LOGO_VIEWBOX } from "../lib/logo";

interface Props {
  trida?: string;
  /** Kreslí se dráha, ne obrázek – dědí barvu textu a nic se nestahuje. */
  popis?: string;
}

/** Slovní značka Tour de Pub. V rozhraní není, nese ji ikona appky,
 *  úvodní obrazovka a patička Pravidel. */
export function Logo({ trida, popis = "Tour de Pub" }: Props) {
  return (
    <svg className={trida} viewBox={LOGO_VIEWBOX} fill="currentColor" fillRule="evenodd"
      role="img" aria-label={popis}>
      <path d={LOGO_CESTA} />
    </svg>
  );
}
