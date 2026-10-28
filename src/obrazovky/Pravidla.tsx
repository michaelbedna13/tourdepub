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
import { vazat } from "../lib/format";
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

      {/* Pravidla jako skupiny řádek, ne jako odstavce textu. Byly to
          odrážky s tučným názvem a dvojtečkou a k tomu zvýrazněná slova
          uprostřed vět; pak popisky nad větami, což bylo lepší, ale pořád to
          byla zeď textu. Skupina s linkami mezi řádkami říká, co k čemu
          patří, dřív než se začne číst, a hodnota vpravo je tam, kde ji oko
          čeká. */}
      <p className="pravidla-lead">{vazat(UVODNIK)}</p>

      <Skupina nadpis="Základ">
        {ZAKLAD.map((b) => <Radek key={b.stitek} nazev={b.stitek!} popis={b.text} />)}
      </Skupina>

      <Skupina nadpis="Jak se to valí">
        {JAK_SE_VALI.map((b) => <Radek key={b.stitek} nazev={b.stitek!} popis={b.text} />)}
      </Skupina>

      <Skupina nadpis="Za co padají čárky">
        {bodovani(s.hospody).map((b) => (
          <Radek key={b.text} nazev={b.text} popis={b.strop} hodnota={b.stitek} />
        ))}
      </Skupina>

      <Skupina nadpis="Jaká je to haluz">
        {OBTIZNOST.map((o) => (
          <Radek key={o.piva} nazev={o.nazev} hodnota={`+${o.piva}`}
            pred={<Obtiznost piva={o.piva} sNazvem={false} />} />
        ))}
      </Skupina>

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

/** Skupina pravidel: tichý nadpis nad plochou s řádkami. Je to ta samá
 *  skladba jako v Nastavení o kus níž, takže se celá obrazovka čte stejně. */
function Skupina({ nadpis, children }: { nadpis: string; children: React.ReactNode }) {
  return (
    <section className="pr-skupina">
      <h2>{vazat(nadpis)}</h2>
      <div className="vrstva radky">{children}</div>
    </section>
  );
}

/** Jedna řádka: vlevo věta (a pod ní případně tichý dovětek), vpravo
 *  hodnota. Hodnota je vpravo schválně: tam ji oko hledá a nemusí ji lovit
 *  uprostřed odstavce. */
function Radek({ nazev, popis, hodnota, pred }: {
  nazev: string; popis?: string; hodnota?: string; pred?: React.ReactNode;
}) {
  return (
    <div className="pr-radek">
      {pred && <span className="pr-radek-pred">{pred}</span>}
      <span className="pr-radek-telo">
        <span className="pr-radek-nazev">{vazat(nazev)}</span>
        {popis && <span className="pr-radek-popis">{vazat(popis)}</span>}
      </span>
      {hodnota && <span className="pr-radek-hodnota cislo">{hodnota}</span>}
    </div>
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
      pod="Odemkne úpravy úkolů a hospod. Je to zámek proti omylu, ne bezpečnost. Kdo se podívá do zdrojáku, kód si přečte.">
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
