// Kreslení opakujících se kousků: ikony, čárky, půllitry obtížnosti.
import { IKONY } from "./ikony.js";

let poradi = 0;

/** Ikona jako vystřižená z papíru: plocha v barvě textu, výstřižky jsou průhledné. */
export function ikona(jmeno, px = 24, trida = "") {
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
export function carky(kolik, vyska = 34) {
  if (kolik <= 0) return `<span class="napis">zatím nic</span>`;
  const skupin = Math.floor(kolik / 5), zbytek = kolik % 5;
  const sirkaJedne = 9, mezera = 3;
  const kus = (n, prect) => {
    // n = kolik svislých (1–4), prect = jestli jde přes ně pátá
    const w = n * sirkaJedne + (prect ? 10 : 0) + 4;
    let d = "";
    for (let i = 0; i < n; i++) {
      // každá čárka je jinak nakloněná a jinak dlouhá, jako psaná
      const x = 4 + i * sirkaJedne, sklon = ((i * 7919) % 5) - 2, delta = ((i * 104729) % 4);
      d += `<path d="M${x + sklon} 4 L${x - sklon} ${36 - delta}" />`;
    }
    if (prect) d += `<path d="M1 31 L${n * sirkaJedne + 9} 7" />`;
    return `<svg width="${(w / 40) * vyska}" height="${vyska}" viewBox="0 0 ${w} 40" fill="none"
      stroke="currentColor" stroke-width="4.6" stroke-linecap="round">${d}</svg>`;
  };
  let out = "";
  for (let i = 0; i < skupin; i++) out += kus(4, true);
  if (zbytek) out += kus(zbytek, false);
  return `<span class="carky" role="img" aria-label="${kolik} ${sklonuj(kolik)}">${out}</span>`;
}

/** Obtížnost úkolu: 1–3 půllitry. */
export function pullitry(kolik, slabe = false) {
  return `<span class="piva${slabe ? " slabe" : ""}" role="img" aria-label="${kolik} ${
    kolik === 1 ? "půllitr" : kolik < 5 ? "půllitry" : "půllitrů"
  } obtížnosti">${Array.from({ length: kolik }, () => ikona("piva", 17)).join("")}</span>`;
}

/** Správný tvar slova „čárka“ podle počtu. */
export function sklonuj(n) {
  const a = Math.abs(n);
  if (a === 1) return "čárka";
  if (a >= 2 && a <= 4) return "čárky";
  return "čárek";
}

/** Ochrana proti vložení HTML z názvu party. */
export function bezpecne(s) {
  return String(s).replace(/[&<>"']/g, (z) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[z]));
}
