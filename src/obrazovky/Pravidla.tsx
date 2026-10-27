import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Hlava } from "../components/Hlava";
import { Ikona } from "../components/Ikona";
import { Logo } from "../components/Logo";
import { Obtiznost } from "../components/Obtiznost";
import { Okno } from "../components/Okno";
import { potvrdit } from "../components/Potvrzeni";
import { OBTIZNOST } from "../lib/data";
import { bodovani, JAK_SE_VALI, UVODNIK, ZAKLAD } from "../lib/pravidla";
import { Pravidlo } from "../components/Pravidlo";
import { sklonuj, vazat } from "../lib/format";
import { nastavSpravce, sediKod, useSpravce } from "../lib/spravce";
import { strop, tym, useStav, vynulujTym } from "../lib/stav";

/** Pravidla a nastavení. Režim správce se zapíná tady, ať se na hlavních
 *  obrazovkách neplete do hry. */
export function Pravidla() {
  useStav();
  const spravce = useSpravce();
  const kam = useNavigate();
  const [okno, setOkno] = useState<"zadne" | "zapnout" | "vypnout">("zadne");
  const s = strop();
  const t = tym();

  async function vynuluj() {
    if (!spravce) return; // zámek i tady, ne jen schované tlačítko – je to nevratné
    const ok = await potvrdit(`Vynulovat čárky týmu ${t?.nazev || ""}?`,
      "Smaže všechny zápisy týmu. Hospody a úkoly zůstanou. Tohle se nedá vrátit.", "Vynulovat čárky");
    if (!ok) return;
    vynulujTym();
    kam("/");
  }

  return (
    <>
      <Hlava nadpis="Pravidla" />

      <div className="pravidla">
        {/* úvodní odstavec se čte jako text, ne jako seznam pravidel */}
        <div className="pravidla-uvod">
          <p>{vazat(UVODNIK)}</p>
        </div>
        <p>
          {ZAKLAD.map((b, i) => (
            <span key={b.stitek}>{i > 0 && <br />}<Pravidlo bod={b} /></span>
          ))}
        </p>

        <h2>JAK SE TO VALÍ</h2>
        <ol>
          {JAK_SE_VALI.map((b) => <li key={b.stitek}><Pravidlo bod={b} /></li>)}
        </ol>

        <h2>BODOVÁNÍ</h2>
        <ol>
          {bodovani(s.hospody).map((b) => <li key={b.text}><Pravidlo bod={b} /></li>)}
        </ol>
        <div className="legenda">
          {OBTIZNOST.map((o) => (
            <div key={o.piva} className="legenda-radek">
              <Obtiznost piva={o.piva} sNazvem={false} />
              <span>{vazat(`${o.nazev} — ${o.piva} ${sklonuj(o.piva)}`)}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="sekce">
        <div className="sekce-hlava"><h2>NASTAVENÍ</h2></div>
        <div className="vrstva radky">
          <button className="radek" onClick={() => setOkno(spravce ? "vypnout" : "zapnout")}>
            <div className="radek-telo">
              <div className="radek-nazev">{spravce ? "Režim správce je zapnutý" : "Režim správce"}</div>
              <div className="radek-pod">{vazat(spravce
                ? "Můžeš upravovat úkoly a hospody. Ťukni pro vypnutí."
                : "Na úpravy úkolů a hospod. Ostatní můžou jenom hrát.")}</div>
            </div>
            <Ikona jmeno={spravce ? "check" : "zamek"} px={18} />
          </button>
          {spravce && (
            <button className="radek" onClick={vynuluj}>
              <div className="radek-telo">
                <div className="radek-nazev spatne">Vynulovat čárky týmu</div>
                <div className="radek-pod">{vazat(`Smaže zápisy týmu ${t?.nazev || ""}. Hospody a úkoly zůstanou.`)}</div>
              </div>
            </button>
          )}
        </div>
      </div>

      <div className="paticka">
        <Logo trida="logo-paticka" />
        <span>© Mišák</span>
      </div>

      {okno === "zapnout" && <OknoSpravce zavri={() => setOkno("zadne")} />}
      {okno === "vypnout" && (
        <Okno nadpis="Vypnout režim správce" pod="Úpravy úkolů a hospod se zase schovají."
          zavri={() => setOkno("zadne")}>
          <div className="okno-akce">
            <button className="tl hlavni" onClick={() => { nastavSpravce(false); setOkno("zadne"); }}>
              <Ikona jmeno="check" px={19} /> Vypnout
            </button>
            <button className="tl tise" onClick={() => setOkno("zadne")}>Zpátky</button>
          </div>
        </Okno>
      )}
    </>
  );
}

function OknoSpravce({ zavri }: { zavri: () => void }) {
  const [kod, setKod] = useState("");
  const [spatne, setSpatne] = useState(false);

  function odemkni() {
    if (sediKod(kod)) { nastavSpravce(true); zavri(); }
    else setSpatne(true);
  }

  return (
    <Okno nadpis="Režim správce" zavri={zavri}
      pod="Odemkne úpravy úkolů a hospod. Je to zámek proti omylu, ne bezpečnost — kdo se podívá do zdrojáku, kód si přečte.">
      <label className="pole">
        <span className="nazev">Kód</span>
        <input type="password" value={kod} autoComplete="off" enterKeyHint="done"
          onChange={(e) => { setKod(e.target.value); setSpatne(false); }}
          onKeyDown={(e) => { if (e.key === "Enter") odemkni(); }} />
        {spatne && <span className="poznamka spatne" style={{ padding: 0 }}>Tenhle kód nesedí.</span>}
      </label>
      <div className="okno-akce">
        <button className="tl hlavni" onClick={odemkni}><Ikona jmeno="check" px={19} /> Odemknout</button>
        <button className="tl tise" onClick={zavri}>Zpátky</button>
      </div>
    </Okno>
  );
}
