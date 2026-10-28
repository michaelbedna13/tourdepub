import { Logo } from "./Logo";
import { Ikona } from "./Ikona";
import { sklonuj, sklonujTym, sklonujUkol, vazat } from "../lib/format";
import { RAZITKO } from "../lib/razitko";
import type { Rozpad } from "../lib/stav";

interface Parta {
  id: string;
  nazev: string;
  body: number;
  rozpad: Rozpad;
}

interface Props {
  poradi: Parta[];
  /** Za koho se na tomhle telefonu zapisuje. */
  hospod: number;
  ukolu: number;
  strop: number;
  prepni: (id: string) => void;
  /** Bez toho se tužka nekreslí – na Hře se party neupravují. */
  uprav?: (id: string) => void;
}

/** Jedna položka účtenky: popis, tečky a číslo vpravo. */
function Polozka({ nazev, kolik }: { nazev: string; kolik: number }) {
  return (
    <div className="uc-polozka">
      <span>{nazev}</span>
      <span className="uc-tecky" />
      <span className="uc-kus cislo">{kolik}</span>
    </div>
  );
}

const dva = (x: number) => String(x).padStart(2, "0");

/** Datum ve tvaru, v jakém ho tiskne pokladna. */
function datum(d = new Date()): string {
  return `${dva(d.getDate())}/${dva(d.getMonth() + 1)} ${d.getFullYear()}`;
}

/** Číslo dokladu, jak ho tiskne opravdová pokladna: den a měsíc, lomítko,
 *  pořadí. Pořadí je počet čárek na stole dohromady — během večera naskakuje
 *  jako počítadlo a je to pořád pravdivý údaj.
 *
 *  Samotné datum (281026) by se do šesti číslic vešlo přesně, jenže tři řádky
 *  pod tím stojí DATUM a byla by to ta samá informace dvakrát. Takhle se den
 *  propíše a číslo přitom zůstane číslem dokladu, ne datem potřetí. */
function cisloDokladu(carek: number, d = new Date()): string {
  return `${dva(d.getDate())}${dva(d.getMonth() + 1)}/${String(carek).padStart(4, "0")}`;
}

/** Pořadí part jako účtenka z hospody.
 *
 *  Rozpad čárek (za špeluňky, za škopky, za srandy) stával u skóre na Hře,
 *  kde se nedal s nikým srovnat. Tady má smysl: party jsou pod sebou a je
 *  vidět, kdo nahrál kde. A účtenka je jediná tabulka, co v hospodě nikoho
 *  nepřekvapí — proto vypadá jako účtenka, ne jako tabulka z appky.
 *
 *  Skladba je převzatá z opravdové účtenky: štítek a číslo dokladu nahoře,
 *  pod tím značka, heslo mezi lomítky, datum mezi přerušovanými čarami,
 *  položky s vodicími tečkami, tlustý součet a patička. */
export function Uctenka({ poradi, hospod, ukolu, strop, prepni, uprav }: Props) {
  const cislo = cisloDokladu(poradi.reduce((a, p) => a + p.body, 0));
  return (
    <div className="uctenka">
      <div className="uc-vrch">
        <span className="uc-stitek">ÚČTENKA</span>
        <span className="uc-cislo cislo">No. {cislo}</span>
      </div>

      <div className="uc-hlava">
        <Logo trida="uc-znacka" />
      </div>
      <div className="uc-heslo">
        /{hospod} {hospod === 1 ? "špeluňka" : hospod < 5 ? "špeluňky" : "špeluněk"}
        {", "}{ukolu} {sklonujUkol(ukolu)}, {poradi.length} {sklonujTym(poradi.length)}/
      </div>

      <div className="uc-cara" />
      <div className="uc-datum">DATUM: {datum()}</div>
      <div className="uc-cara" />

      {poradi.map((p, i) => (
        <div key={p.id} className="uc-parta">
          <div className="uc-nazev">
            <button className="uc-jmeno" onClick={() => prepni(p.id)}>
              <span className="uc-text">{p.nazev}</span>
            </button>
            {/* Razítko až od první čárky – na začátku večera nikdo nevede.
                Sedí v řádce se jménem, ne přes položky: přes vodicí tečky
                vypadalo, jako by přebilo číslo, které k nim patří. */}
            {i === 0 && p.body > 0 && (
              <span className="uc-razitko" aria-hidden="true">
                <svg viewBox="0 0 172 60"><path d={RAZITKO} fillRule="evenodd" /></svg>
                <span>VEDE</span>
              </span>
            )}
            {uprav && (
              <button className="uc-tuzka" onClick={() => uprav(p.id)} aria-label={`Upravit ${p.nazev}`}>
                <Ikona jmeno="i-tuzka" px={15} />
              </button>
            )}
          </div>
          <Polozka nazev="špeluňky" kolik={p.rozpad.dochazka} />
          <Polozka nazev="škopky" kolik={p.rozpad.skopky} />
          <Polozka nazev="srandy" kolik={p.rozpad.ukoly} />
          <div className="uc-soucet">
            <span>čárek</span>
            <span className="uc-tecky" />
            <span className="uc-kus cislo">{p.body}</span>
          </div>
          {i < poradi.length - 1 && <div className="uc-cara" />}
        </div>
      ))}

      <div className="uc-cara" />
      <div className="uc-paticka">
        <div className="uc-pata">
          <span>{vazat(`max ${strop} ${sklonuj(strop)}`)}</span>
          <span>TOURDEPUB</span>
        </div>
      </div>
    </div>
  );
}
