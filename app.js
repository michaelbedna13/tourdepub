// Obrazovky a ovládání. Jedna stránka, mezi pohledy se přepíná spodní lištou.
// Při hře se ťuká jednou rukou v hospodě, tak jsou terče velké a nic není schované.
import { KATEGORIE, ZAKLAD, OBTIZNOST } from "./data.js";
import {
  stav, uloz, naZmenu, tym, body, rozpad, strop, dostupnost, kolikrat, jdePridat,
  prepniZaklad, pridejUkol, uberUkol, nastavHospodu, posunHospodu, hospodaTed, indexHospody,
  pridejTym, upravTym, smazTym, prepniTym, vynulujTym,
  pridejHospodu, upravHospodu, smazHospodu, posunHospoduVPoradi,
  pridejNovyUkol, upravUkol, smazUkol, ukolPodleId, BARVY,
} from "./stav.js";
import { ikona, carky, obtiznost, nazevObtiznosti, sklonuj, sklonujUkol, bezpecne } from "./ui.js";
import { spustSync, stavSyncu, ostatniTymy } from "./sync.js";

const el = document.getElementById("app");
let pohled = "hra";
let okno = null;       // { druh, id, ... } – otevřené okno
let konceptBarvy = null;
let konceptPiva = null;
let konceptKat = null;

/* ---------- drobnosti ---------- */

function odmena(text) {
  const d = document.createElement("div");
  d.className = "plusjedna cislo";
  d.textContent = text;
  document.body.appendChild(d);
  setTimeout(() => d.remove(), 900);
  if (navigator.vibrate) navigator.vibrate(10);
}

function hlava() {
  const t = tym();
  return `<div class="hlava">
    <div class="logo">Tour de Pub</div>
    <button class="prepinac-tymu" data-okno="tymy-rychle" aria-label="Přepnout tým">
      <span class="tecka" style="background:${bezpecne(t?.barva || BARVY[0])}"></span>
      <b>${bezpecne(t?.nazev || "Bez týmu")}</b>
      ${ikona("i-dolu", 13)}
    </button>
  </div>`;
}

const pruhUkazky = () => stavSyncu().rezim === "ukazka"
  ? `<div class="rezim">${ikona("zamek", 16)}
      <span>Zapisuje se jen do tohohle telefonu. Jak zapnout živé pořadí, je v README.</span></div>`
  : "";

/* ---------- obrazovka: Hra ---------- */

function hra() {
  const t = tym();
  if (!t) return hlava() + `<div class="prazdno">Nejdřív si založ tým.</div>`;
  const h = hospodaTed();
  const i = indexHospody();
  const r = rozpad();
  const celkem = body();
  const jePrichod = h && !!t.prichod[h.id];
  const jeSkopek = h && !!t.skopek[h.id];
  const zbyva = stav.ukoly.filter((u) => jdePridat(u, t)).length;

  const trasa = stav.hospody.map((x, j) => {
    const stavD = x.id === t.hospoda ? " ted" : t.prichod[x.id] ? " splneno" : "";
    return `<div class="trasa-bod${stavD}" title="${j + 1}. ${bezpecne(x.nazev)}"></div>`;
  }).join("");

  return `
    ${hlava()}
    ${pruhUkazky()}

    <div class="staci">
      <div class="staci-poradi cislo">${i + 1}</div>
      <div style="min-width:0">
        <h1>${bezpecne(h?.nazev || "Žádná špeluňka")}</h1>
        <div class="staci-kolik cislo">${i + 1} z ${stav.hospody.length}</div>
      </div>
    </div>
    <div class="trasa">${trasa}</div>

    <div class="tl-rada" style="margin-bottom:10px">
      <button class="tl" data-akce="hospoda-min" ${i <= 0 ? "disabled" : ""}>
        ${ikona("i-zpet", 18)} Zpátky</button>
      <button class="tl" data-akce="hospoda-plus" ${i >= stav.hospody.length - 1 ? "disabled" : ""}>
        Další ${ikona("i-zpet", 18, "otocit")}</button>
    </div>
    <button class="tl ${jePrichod ? "hotovo" : "hlavni"}" data-akce="prichod" style="margin-bottom:9px">
      ${ikona(jePrichod ? "check" : "mista", 21)} ${jePrichod ? "Jsme tady" : "Jsme v špeluňce"}
    </button>
    <button class="tl ${jeSkopek ? "hotovo" : "hlavni"}" data-akce="skopek">
      ${ikona(jeSkopek ? "check" : "piva", 21)} ${jeSkopek ? "Škopek padl" : "Lupnul škopek"}
    </button>
    <p class="poznamka">${ZAKLAD[1].popis}</p>

    <div class="sekce">
      <div class="vrstva skore">
        <div class="skore-cislo cislo">${celkem}</div>
        <div class="skore-vedle">
          ${carky(celkem, 24)}
          <div class="skore-popis cislo">${r.dochazka} za špeluňky · ${r.skopky} za škopky · ${r.ukoly} za srandy</div>
        </div>
      </div>
    </div>

    <div class="sekce">
      <button class="tl" data-pohled="ukoly">
        ${ikona("hvezda", 19)} ${zbyva ? `Zbývá ${zbyva} ${sklonujUkol(zbyva)}` : "Projít úkoly"}
      </button>
    </div>
  `;
}

/* ---------- obrazovka: Úkoly ---------- */

function ukoly() {
  const t = tym();
  const r = rozpad();
  const sekce = KATEGORIE.map((k) => {
    const v = stav.ukoly.filter((u) => u.kat === k.id);
    if (!v.length) return "";
    return `
      <div class="sekce">
        <div class="sekce-hlava">
          <h2>${k.nazev}</h2>
          <span class="pocet cislo">${v.filter((u) => kolikrat(u.id, t) > 0).length}/${v.length}</span>
        </div>
        <div class="vrstva radky">${v.map(radekUkolu).join("")}</div>
      </div>`;
  }).join("");

  return `
    ${hlava()}
    <div class="nadpis">
      <h1>Úkoly</h1>
      <p class="cislo">Splněno ${r.splneno} z ${stav.ukoly.length} · ${r.ukoly} ${sklonuj(r.ukoly)} za srandy</p>
    </div>
    ${sekce}
    <div class="sekce">
      <button class="tl" data-okno="ukol-novy">${ikona("plus", 18)} Přidat úkol</button>
    </div>
  `;
}

function radekUkolu(u) {
  const t = tym();
  const kolik = kolikrat(u.id, t);
  const dost = dostupnost(u, t);
  const opakovatelny = u.max > 1;
  const splneno = kolik > 0 && (opakovatelny ? kolik >= u.max : true);

  const odznaky = [
    !dost.jde ? `<span class="odznak">${bezpecne(dost.duvod)}</span>` : "",
    u.exkluzivni ? `<span class="odznak">Bere jen jedna parta</span>` : "",
    opakovatelny ? `<span class="odznak cislo">${u.body} ${sklonuj(u.body)} za kus, až ${u.body * u.max}</span>` : "",
    u.jednouZaHospodu && dost.jde && t?.zlodej[t.hospoda]
      ? `<span class="odznak">Z týhle špeluňky už máte</span>` : "",
  ].filter(Boolean).join("");

  const ovladani = opakovatelny
    ? `<div class="pocitadlo">
        <button data-uber="${u.id}" ${kolik <= 0 ? "disabled" : ""} aria-label="Ubrat ${bezpecne(u.nazev)}">${ikona("minus", 13)}</button>
        <span class="kolik cislo">${kolik}</span>
        <button data-pridej="${u.id}" ${!jdePridat(u, t) ? "disabled" : ""} aria-label="Přidat ${bezpecne(u.nazev)}">${ikona("plus", 13)}</button>
      </div>`
    : `<div class="fajfka">${ikona("check", 15)}</div>`;

  return `<div class="ukol${splneno ? " splneno" : ""}${!dost.jde ? " zamceno" : ""}"
      ${!opakovatelny ? `data-prepni="${u.id}" role="button" tabindex="0" aria-pressed="${kolik > 0}"` : ""}>
    <div class="ukol-hlava">
      <span class="ukol-nazev">${bezpecne(u.nazev)}</span>
      ${ovladani}
    </div>
    ${u.popis ? `<p class="ukol-popis">${bezpecne(u.popis)}</p>` : ""}
    ${u.pozn ? `<p class="ukol-pozn">${bezpecne(u.pozn)}</p>` : ""}
    <div class="ukol-stav">
      <div class="ukol-chipy">${obtiznost(u.piva)}${odznaky}</div>
      <button class="ikonove" data-okno="ukol-uprava" data-id="${u.id}"
        aria-label="Upravit ${bezpecne(u.nazev)}">${ikona("i-tuzka", 16)}</button>
    </div>
  </div>`;
}

/* ---------- obrazovka: Týmy ---------- */

function tymy() {
  const mujId = stav.tymId;
  const zvenku = ostatniTymy();
  const mistni = stav.tymy.map((t) => ({
    id: t.id, nazev: t.nazev || "Bez názvu", barva: t.barva, body: body(t), rozpad: rozpad(t),
    hospoda: indexHospody(t) + 1, mistni: true,
  }));
  // tým, co máme i my i server, bereme z telefonu – ten je zdroj pravdy
  const vse = [...mistni, ...zvenku.filter((z) => !mistni.some((m) => m.id === z.id))]
    .sort((a, b) => b.body - a.body || b.rozpad.makacky - a.rozpad.makacky);

  const radky = vse.map((p, i) => `
    <div class="radek${i === 0 && p.body > 0 ? " vede" : ""}${p.id === mujId ? " ja" : ""}">
      <div class="poradi-cislo cislo">${i + 1}</div>
      ${p.mistni ? `<button class="radek-telo" data-prepni-tym="${p.id}" style="text-align:left">`
                 : `<div class="radek-telo">`}
        <div class="radek-nazev">
          <span class="tecka" style="background:${bezpecne(p.barva)}"></span>
          ${bezpecne(p.nazev)}
          ${p.id === mujId ? `<span class="odznak duraz">zapisuju</span>` : ""}
        </div>
        <div class="radek-pod cislo">${p.rozpad.splneno} ${sklonujUkol(p.rozpad.splneno)} · ${
          p.rozpad.makacky} ${p.rozpad.makacky === 1 ? "makačka" : "makaček"} · štace ${p.hospoda}</div>
      ${p.mistni ? "</button>" : "</div>"}
      <div class="radek-body cislo">${p.body}</div>
      ${p.mistni ? `<button class="ikonove" data-okno="tym-uprava" data-id="${p.id}"
        aria-label="Upravit ${bezpecne(p.nazev)}">${ikona("i-tuzka", 16)}</button>` : ""}
    </div>`).join("");

  const s = strop();
  return `
    ${hlava()}
    <div class="nadpis">
      <h1>Týmy</h1>
      <p>Ťukni na tým, za který chceš zapisovat.</p>
    </div>
    ${pruhUkazky()}
    <div class="vrstva radky">${radky}</div>
    <div class="sekce">
      <button class="tl" data-okno="tym-novy">${ikona("plus", 18)} Přidat tým</button>
    </div>
    <div class="sekce">
      <div class="vrstva prodyseny">
        <h3 style="margin-bottom:9px">Kolik se dá urvat</h3>
        <p class="skore-popis cislo">${s.hospody} za špeluňky · ${s.hospody} za škopky · ${s.ukoly} za srandy</p>
        <p style="margin-top:9px;font-size:14.5px;color:var(--text-2)">Dohromady nejvíc
          <b class="cislo" style="color:var(--akcent);font-weight:600">${s.celkem}</b> ${sklonuj(s.celkem)}</p>
      </div>
    </div>
  `;
}

/* ---------- obrazovka: Hospody ---------- */

function hospody() {
  const t = tym();
  const radky = stav.hospody.map((h, i) => `
    <div class="radek${h.id === t?.hospoda ? " ted" : ""}">
      <div class="poradi-cislo cislo">${i + 1}</div>
      <button class="radek-telo" data-skoc="${h.id}" style="text-align:left">
        <div class="radek-nazev">${bezpecne(h.nazev)}</div>
        ${h.id === t?.hospoda ? `<div class="radek-pod">Tady jste teď</div>`
          : t?.prichod[h.id] ? `<div class="radek-pod">Máte odsud čárku</div>` : ""}
      </button>
      <div class="radek-vpravo">
        <button class="ikonove" data-posun="${h.id}" data-smer="-1" ${i === 0 ? "disabled" : ""}
          aria-label="Posunout ${bezpecne(h.nazev)} nahoru">${ikona("i-nahoru", 15)}</button>
        <button class="ikonove" data-posun="${h.id}" data-smer="1" ${i === stav.hospody.length - 1 ? "disabled" : ""}
          aria-label="Posunout ${bezpecne(h.nazev)} dolů">${ikona("i-dolu", 15)}</button>
        <button class="ikonove" data-okno="hospoda-uprava" data-id="${h.id}"
          aria-label="Upravit ${bezpecne(h.nazev)}">${ikona("i-tuzka", 16)}</button>
      </div>
    </div>`).join("");

  return `
    ${hlava()}
    <div class="nadpis">
      <h1>Hospody</h1>
      <p>Pořadí určuje trasu. Šipkami se přehazuje, ťuknutím na název se přesuneš.</p>
    </div>
    <div class="vrstva radky">${radky}</div>
    <div class="sekce">
      <button class="tl" data-okno="hospoda-nova">${ikona("plus", 18)} Přidat hospodu</button>
    </div>
  `;
}

/* ---------- obrazovka: Pravidla ---------- */

function pravidla() {
  const s = strop();
  return `
    ${hlava()}
    <div class="pravidla">
      <h1 style="margin-bottom:14px">Pravidla</h1>
      <p>Bacha, to není jenom takový to klasický večerní nasávání v Štatlu. Tady se jede
      betelná řežba přes brněnský špeluňky, kde čárky nemáš jenom za vyžahnutý pruty,
      ale hlavně za to, že máš koule, dobrej kšaft a v palici to nemáš vypatlaný.</p>
      <p><b>O co jde:</b> Nahrabat víc čárek než ty druhý partyje a urvat titul z Tour De Pub.<br>
      <b>Vlezné do kotla:</b> Kilo na palici.<br>
      <b>Celej bank:</b> První parta bere všecko — všechny love só jejich.</p>

      <h2>Jak se to valí</h2>
      <ol>
        <li><b>Časovej cajk:</b> Valí se to od <b>šesti večer do dvou do rána</b>. Co se zvrtne potom, už se do čárek nepočítá.</li>
        <li><b>Partyje:</b> Jede se ve dvou až třech partách.</li>
        <li><b>Žádný courání:</b> Na každou štaci je zhruba 45 minut. Jak se nějaká parta bude fest loudat a ty druhý na ně budou muset čumět, tak v té špeluňce nebudou mít za ty srandy ani čárku.</li>
      </ol>

      <h2>Bodování</h2>
      <ol>
        <li>Čárka za každou špeluňku, do který vlezete. <b class="cislo">(max. ${s.hospody})</b></li>
        <li>Čárka, když v tý štaci lupne aspoň půlka partyje jeden škopek. <b class="cislo">(max. ${s.hospody})</b></li>
        <li>Další čárky za plnění srand, rozhozený podle toho, jaká je to haluz:</li>
      </ol>
      <div class="legenda">
        ${OBTIZNOST.map((o) => `<div class="legenda-radek">${obtiznost(o.piva, false)}
          <span>${o.nazev} — ${o.piva} ${sklonuj(o.piva)}</span></div>`).join("")}
      </div>
    </div>

    <div class="sekce">
      <div class="sekce-hlava"><h2>Vaše hra</h2></div>
      <div class="vrstva radky">
        <button class="radek" data-akce="vynulovat">
          <div class="radek-telo">
            <div class="radek-nazev" style="color:var(--spatne)">Vynulovat čárky týmu</div>
            <div class="radek-pod">Smaže zápisy týmu ${bezpecne(tym()?.nazev || "")}. Hospody a úkoly zůstanou.</div>
          </div>
        </button>
      </div>
    </div>
  `;
}

/* ---------- okna ---------- */

function oknoObsah() {
  if (!okno) return "";
  switch (okno.druh) {
    case "tymy-rychle": {
      return oknoRam("Za koho zapisuju", "Ťukni na tým. Můžeš zapisovat komukoliv.", `
        <div class="vrstva radky" style="margin-bottom:12px">
          ${stav.tymy.map((t) => `
            <button class="radek" data-prepni-tym="${t.id}">
              <span class="tecka" style="background:${bezpecne(t.barva)}"></span>
              <div class="radek-telo"><div class="radek-nazev">${bezpecne(t.nazev || "Bez názvu")}</div></div>
              <div class="radek-body cislo">${body(t)}</div>
              ${t.id === stav.tymId ? ikona("check", 18) : ""}
            </button>`).join("")}
        </div>
        <div class="okno-akce">
          <button class="tl" data-okno="tym-novy">${ikona("plus", 18)} Přidat tým</button>
          <button class="tl tise" data-akce="zavri">Zpátky</button>
        </div>`);
    }

    case "tym-novy":
    case "tym-uprava": {
      const novy = okno.druh === "tym-novy";
      const t = novy ? null : stav.tymy.find((x) => x.id === okno.id);
      if (!novy && !t) return "";
      const barva = konceptBarvy || t?.barva || BARVY[stav.tymy.length % BARVY.length];
      return oknoRam(novy ? "Nový tým" : "Upravit tým", "Jméno uvidí ostatní party v pořadí.", `
        <label class="pole">
          <span class="nazev">Jak si říkáte</span>
          <input type="text" id="pole-nazev" value="${bezpecne(t?.nazev || "")}" maxlength="40"
            placeholder="Borci ze Štatlu" autocomplete="off" enterkeyhint="done">
        </label>
        <label class="pole">
          <span class="nazev">Barva</span>
          <span class="barvy">${BARVY.map((b) => `<button data-barva="${b}" style="background:${b}"
            aria-pressed="${b === barva}" aria-label="Barva ${b}"></button>`).join("")}</span>
        </label>
        <div class="okno-akce">
          <button class="tl hlavni" data-akce="uloz-tym">${ikona("check", 19)} Hotovo</button>
          ${!novy && stav.tymy.length > 1 ? `<button class="tl nebezpecne" data-akce="smaz-tym">
            ${ikona("i-kos", 18)} Smazat tým</button>` : ""}
          <button class="tl tise" data-akce="zavri">Zpátky</button>
        </div>`);
    }

    case "hospoda-nova":
    case "hospoda-uprava": {
      const nova = okno.druh === "hospoda-nova";
      const h = nova ? null : stav.hospody.find((x) => x.id === okno.id);
      if (!nova && !h) return "";
      return oknoRam(nova ? "Nová hospoda" : "Upravit hospodu", "", `
        <label class="pole">
          <span class="nazev">Název</span>
          <input type="text" id="pole-nazev" value="${bezpecne(h?.nazev || "")}" maxlength="60"
            placeholder="U Ričího" autocomplete="off" enterkeyhint="done">
        </label>
        <div class="okno-akce">
          <button class="tl hlavni" data-akce="uloz-hospodu">${ikona("check", 19)} Hotovo</button>
          ${!nova && stav.hospody.length > 1 ? `<button class="tl nebezpecne" data-akce="smaz-hospodu">
            ${ikona("i-kos", 18)} Smazat hospodu</button>` : ""}
          <button class="tl tise" data-akce="zavri">Zpátky</button>
        </div>`);
    }

    case "ukol-novy":
    case "ukol-uprava": {
      const novy = okno.druh === "ukol-novy";
      const u = novy ? null : ukolPodleId(okno.id);
      if (!novy && !u) return "";
      const piva = konceptPiva || u?.piva || 1;
      const kat = konceptKat || u?.kat || KATEGORIE[0].id;
      const max = u?.max || 1;
      return oknoRam(novy ? "Nový úkol" : "Upravit úkol", "", `
        <label class="pole">
          <span class="nazev">Název</span>
          <input type="text" id="pole-nazev" value="${bezpecne(u?.nazev || "")}" maxlength="80"
            placeholder="Hádka o čárku" autocomplete="off">
        </label>
        <label class="pole">
          <span class="nazev">Zadání</span>
          <textarea id="pole-popis" maxlength="400" placeholder="Co se musí udělat">${bezpecne(u?.popis || "")}</textarea>
        </label>
        <label class="pole">
          <span class="nazev">Kategorie</span>
          <select id="pole-kat">${KATEGORIE.map((k) =>
            `<option value="${k.id}"${k.id === kat ? " selected" : ""}>${k.nazev}</option>`).join("")}</select>
        </label>
        <div class="pole">
          <span class="nazev">Obtížnost</span>
          <div class="volba-ob">${OBTIZNOST.map((o) => `
            <button class="v${o.piva}" data-piva="${o.piva}" aria-pressed="${o.piva === piva}">
              <span class="piva">${Array.from({ length: o.piva }, () => ikona("piva", 14)).join("")}</span>
              ${o.nazev}</button>`).join("")}</div>
        </div>
        <label class="pole">
          <span class="nazev">Kolikrát to jde splnit</span>
          <input type="text" inputmode="numeric" id="pole-max" value="${max}" maxlength="2" autocomplete="off">
          <span class="poznamka" style="padding:0">Jednou = úkol hodí ${piva} ${sklonuj(piva)}.
            Víckrát = čárka za každý kus.</span>
        </label>
        <div class="okno-akce">
          <button class="tl hlavni" data-akce="uloz-ukol">${ikona("check", 19)} Hotovo</button>
          ${!novy ? `<button class="tl nebezpecne" data-akce="smaz-ukol">
            ${ikona("i-kos", 18)} Smazat úkol</button>` : ""}
          <button class="tl tise" data-akce="zavri">Zpátky</button>
        </div>`);
    }
  }
  return "";
}

const oknoRam = (nadpis, pod, telo) => `<div class="okno" data-prekryv>
  <div class="okno-telo" role="dialog" aria-modal="true" aria-label="${bezpecne(nadpis)}">
    <h2>${nadpis}</h2>${pod ? `<p class="pod">${pod}</p>` : '<div style="height:16px"></div>'}
    ${telo}
  </div></div>`;

/* ---------- vykreslení ---------- */

const POHLEDY = { hra, ukoly, tymy, hospody, pravidla };
const LISTA = [
  { id: "hra", popis: "Hra", ikona: "i-domu" },
  { id: "ukoly", popis: "Úkoly", ikona: "hvezda" },
  { id: "tymy", popis: "Týmy", ikona: "trofej" },
  { id: "hospody", popis: "Hospody", ikona: "hospoda" },
  { id: "pravidla", popis: "Pravidla", ikona: "i-mrizka" },
];

export function vykresli() {
  const posun = window.scrollY;
  el.innerHTML = `
    <div class="obrazovka">${POHLEDY[pohled]()}</div>
    <nav class="lista" aria-label="Hlavní">
      ${LISTA.map((p) => `<button data-pohled="${p.id}" class="${p.id === pohled ? "ted" : ""}"
        aria-current="${p.id === pohled ? "page" : "false"}">
        ${ikona(p.ikona, 20)}<span class="popis">${p.popis}</span></button>`).join("")}
    </nav>
    ${oknoObsah()}`;
  window.scrollTo(0, posun);
  if (okno) setTimeout(() => el.querySelector("#pole-nazev")?.focus(), 30);
}

const otevri = (druh, id) => {
  okno = { druh, id };
  konceptBarvy = null;
  konceptPiva = null;
  konceptKat = null;
  vykresli();
};
const zavri = () => { okno = null; vykresli(); };
const hodnota = (id) => el.querySelector("#" + id)?.value ?? "";

/* ---------- ovládání ---------- */

el.addEventListener("click", (e) => {
  const c = (s) => e.target.closest(s);

  const naOkno = c("[data-okno]");
  if (naOkno) { otevri(naOkno.dataset.okno, naOkno.dataset.id); return; }

  const naPohled = c("[data-pohled]");
  if (naPohled) { pohled = naPohled.dataset.pohled; okno = null; vykresli(); window.scrollTo(0, 0); return; }

  const prep = c("[data-prepni-tym]");
  if (prep) { prepniTym(prep.dataset.prepniTym); zavri(); return; }

  const skoc = c("[data-skoc]");
  if (skoc) { nastavHospodu(skoc.dataset.skoc); pohled = "hra"; vykresli(); window.scrollTo(0, 0); return; }

  const posun = c("[data-posun]");
  if (posun) { posunHospoduVPoradi(posun.dataset.posun, +posun.dataset.smer); return; }

  const pridej = c("[data-pridej]");
  if (pridej) {
    const u = ukolPodleId(pridej.dataset.pridej);
    if (u && pridejUkol(u)) odmena("+" + u.body);
    return;
  }
  const uber = c("[data-uber]");
  if (uber) { const u = ukolPodleId(uber.dataset.uber); if (u) uberUkol(u); return; }

  const prepni = c("[data-prepni]");
  if (prepni) {
    const u = ukolPodleId(prepni.dataset.prepni);
    if (!u) return;
    if (kolikrat(u.id) > 0) uberUkol(u);
    else if (pridejUkol(u)) odmena("+" + u.body);
    return;
  }

  const barva = c("[data-barva]");
  if (barva) {
    konceptBarvy = barva.dataset.barva;
    el.querySelectorAll("[data-barva]").forEach((b) =>
      b.setAttribute("aria-pressed", String(b.dataset.barva === konceptBarvy)));
    return;
  }
  const pivo = c("[data-piva]");
  if (pivo) {
    konceptPiva = +pivo.dataset.piva;
    el.querySelectorAll("[data-piva]").forEach((b) =>
      b.setAttribute("aria-pressed", String(+b.dataset.piva === konceptPiva)));
    return;
  }

  const akce = c("[data-akce]")?.dataset.akce;
  if (!akce) { if (e.target.matches("[data-prekryv]")) zavri(); return; }

  switch (akce) {
    case "prichod": if (prepniZaklad("prichod")) odmena("+1"); break;
    case "skopek": if (prepniZaklad("skopek")) odmena("+1"); break;
    case "hospoda-plus": posunHospodu(1); window.scrollTo(0, 0); break;
    case "hospoda-min": posunHospodu(-1); window.scrollTo(0, 0); break;
    case "zavri": zavri(); break;

    case "uloz-tym": {
      const nazev = hodnota("pole-nazev").trim().slice(0, 40);
      if (okno.druh === "tym-novy") {
        const t = pridejTym(nazev || "Nová parta", konceptBarvy);
        prepniTym(t.id);
      } else {
        upravTym(okno.id, { nazev: nazev || "Bez názvu", barva: konceptBarvy || undefined });
      }
      zavri();
      break;
    }
    case "smaz-tym":
      if (confirm("Smazat tým i s jeho čárkami? Tohle se nedá vrátit.")) { smazTym(okno.id); zavri(); }
      break;

    case "uloz-hospodu": {
      const nazev = hodnota("pole-nazev");
      if (okno.druh === "hospoda-nova") pridejHospodu(nazev);
      else upravHospodu(okno.id, nazev);
      zavri();
      break;
    }
    case "smaz-hospodu":
      if (confirm("Smazat hospodu? Čárky, co z ní týmy mají, zmizí taky.")) { smazHospodu(okno.id); zavri(); }
      break;

    case "uloz-ukol": {
      const data = {
        nazev: hodnota("pole-nazev"),
        popis: hodnota("pole-popis"),
        kat: hodnota("pole-kat"),
        piva: konceptPiva || (okno.druh === "ukol-uprava" ? ukolPodleId(okno.id)?.piva : 1),
        max: parseInt(hodnota("pole-max"), 10) || 1,
      };
      if (okno.druh === "ukol-novy") pridejNovyUkol(data);
      else upravUkol(okno.id, data);
      zavri();
      break;
    }
    case "smaz-ukol":
      if (confirm("Smazat úkol? Čárky, co za něj týmy mají, zmizí taky.")) { smazUkol(okno.id); zavri(); }
      break;

    case "vynulovat":
      if (confirm(`Vynulovat čárky týmu ${tym()?.nazev || ""}? Tohle se nedá vrátit.`)) {
        vynulujTym();
        pohled = "hra";
        vykresli();
        window.scrollTo(0, 0);
      }
      break;
  }
});

el.addEventListener("keydown", (e) => {
  if ((e.key === "Enter" || e.key === " ") && e.target.matches("[data-prepni]")) {
    e.preventDefault();
    e.target.click();
  }
  if (e.key === "Escape" && okno) zavri();
});

/* ---------- start ---------- */

naZmenu(vykresli);
vykresli();
spustSync(vykresli);
