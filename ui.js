// Kreslení opakujících se kousků: ikony, čárky, štítek obtížnosti.
import { IKONY } from "./ikony.js";

let poradi = 0;

/** Ikona jako vystřižená z papíru: plocha v barvě textu, výstřižky jsou průhledné. */
export function ikona(jmeno, px = 22, trida = "") {
  const vrstvy = IKONY[jmeno];
  if (!vrstvy) return "";
  const id = `ik${poradi++}`;
  const maska = vrstvy
    .map(([druh, d]) => `<path d="${d}" fill="${druh === "i" ? "#fff" : "#000"}"/>`)
    .join("");
  return `<svg class="ikona ${trida}" width="${px}" height="${px}" viewBox="0 0 100 100" aria-hidden="true">
    <mask id="${id}" maskUnits="userSpaceOnUse" x="-10" y="-10" width="120" height="120">${maska}</mask>
    <rect x="-10" y="-10" width="120" height="120" fill="currentColor" mask="url(#${id})"/></svg>`;
}

/** Čárky, jak se počítaly v hospodě: čtyři svislé a pátá přes ně.
 *  Kreslí se lehce nakřivo, ať to vypadá psané rukou, ne vysázené. */
export function carky(kolik, vyska = 26) {
  if (kolik <= 0) return `<span class="znacka-text">zatím nic</span>`;
  const skupin = Math.floor(kolik / 5), zbytek = kolik % 5;
  const rozestup = 8;
  const kus = (n, prect) => {
    const w = n * rozestup + (prect ? 9 : 0) + 4;
    let d = "";
    for (let i = 0; i < n; i++) {
      // každá čárka je jinak nakloněná a jinak dlouhá, jako psaná
      const x = 4 + i * rozestup, sklon = ((i * 7919) % 5) - 2, delta = (i * 104729) % 4;
      d += `<path d="M${x + sklon} 4 L${x - sklon} ${34 - delta}"/>`;
    }
    if (prect) d += `<path d="M1 29 L${n * rozestup + 8} 6"/>`;
    return `<svg width="${(w / 38) * vyska}" height="${vyska}" viewBox="0 0 ${w} 38" fill="none"
      stroke="currentColor" stroke-width="3.4" stroke-linecap="round">${d}</svg>`;
  };
  let out = "";
  for (let i = 0; i < skupin; i++) out += kus(4, true);
  if (zbytek) out += kus(zbytek, false);
  return `<span class="carky" role="img" aria-label="${kolik} ${sklonuj(kolik)}">${out}</span>`;
}

const NAZVY_OBTIZNOSTI = { 1: "Brnkačka", 2: "Větší haluz", 3: "Betelná makačka" };

/** Štítek obtížnosti. Barva sama nikdy nestačí, proto je vedle ní
 *  i počet půllitrů a název (HIG: nespoléhat jen na barvu). */
export function obtiznost(piva, sPopisem = true) {
  const p = Array.from({ length: piva }, () => ikona("piva", 13)).join("");
  return `<span class="obtiznost o${piva}">
    <span class="piva">${p}</span>${sPopisem ? NAZVY_OBTIZNOSTI[piva] : ""}</span>`;
}

export const nazevObtiznosti = (p) => NAZVY_OBTIZNOSTI[p];

/** Správný tvar slova „čárka“ podle počtu. */
export function sklonuj(n) {
  const a = Math.abs(n);
  if (a === 1) return "čárka";
  if (a >= 2 && a <= 4) return "čárky";
  return "čárek";
}

/** Správný tvar slova „úkol“ podle počtu. */
export function sklonujUkol(n) {
  const a = Math.abs(n);
  if (a === 1) return "úkol";
  if (a >= 2 && a <= 4) return "úkoly";
  return "úkolů";
}

// Jednopísmenné předložky a spojky (k, s, v, z, o, u, a, i) nesmí v češtině
// zůstat na konci řádku. Přilepíme je nedělitelnou mezerou k dalšímu slovu.
// Opakuje se, dokud se text mění: u dvou krátkých slov za sebou („a v palici")
// spotřebuje první průchod mezeru před druhým slovem a to by zůstalo nesvázané.
const KRATKA = /(^|[\s(\[„"'\u2014])([ksvzouaiKSVZOUAI])[ \t]+/g;
function spoj(t) {
  let drive;
  do { drive = t; t = t.replace(KRATKA, "$1$2\u00A0"); } while (t !== drive);
  return t;
}

/** Projde text mezi značkami a sváže krátká slova. Obsah značek a atributů
 *  nechává být, aby se nerozbily cesty v SVG ani popisky pro čtečku. */
export function vazat(html) {
  return html.replace(/>([^<>]+)</g, (_, t) => ">" + spoj(t) + "<");
}

/** Ochrana proti vložení HTML z názvu týmu nebo úkolu. */
export function bezpecne(s) {
  return String(s ?? "").replace(/[&<>"']/g, (z) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[z]));
}
