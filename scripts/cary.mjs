// Kreslení od ruky: tvary s okrajem křivým jako stříhaný tupýma nůžkama.
// Sdílí to kresba ikon (scripts/kresli-ikony.mjs) i razítka (scripts/kresli-razitko.mjs),
// proto to sedí tady a ne v jednom z nich. Náhodnost je pevná: stejné semínko,
// stejný výstup, takže se generované soubory nemění samy od sebe.

let seed = 7;
/** Nasadí semínko – stejné semínko dá pokaždé stejnou kresbu. */
export const nasad = (s) => { seed = s; };
export const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
export const n1 = (v) => Math.round(v * 10) / 10;
const TAU = Math.PI * 2;

/** Dorovná body po obvodu, ať je obrys hustší a dá se na něm rozehrát nepravidelnost. */
export function resample(pts, step) {
  const out = [];
  for (let i = 0; i < pts.length; i++) {
    const [x1, y1] = pts[i], [x2, y2] = pts[(i + 1) % pts.length];
    const d = Math.hypot(x2 - x1, y2 - y1), k = Math.max(1, Math.round(d / step));
    for (let j = 0; j < k; j++) out.push([x1 + ((x2 - x1) * j) / k, y1 + ((y2 - y1) * j) / k]);
  }
  return out;
}

/** Uzavřený tvar přes body s křivým okrajem. amp = jak moc se střih kymácí, step = jak hustě. */
export function cut(pts, { amp = 2.4, step = 9, tension = 0.42, nicks = 0 } = {}) {
  const p = resample(pts, step);
  const n = p.length;
  // střed kvůli zářezům dovnitř
  const cx = p.reduce((s, q) => s + q[0], 0) / n, cy = p.reduce((s, q) => s + q[1], 0) / n;
  // kymácení je plynulé (součet dvou sinů s náhodnou fází), ne bodový šum – jinak je okraj roztřepený jak pila
  const f1 = 1.5 + rnd() * 2, f2 = 4 + rnd() * 3, ph1 = rnd() * TAU, ph2 = rnd() * TAU;
  const q = p.map(([x, y], i) => {
    const t = (i / n) * TAU;
    let off = Math.sin(t * f1 + ph1) * amp + Math.sin(t * f2 + ph2) * amp * 0.4 + (rnd() - 0.5) * amp * 0.5;
    const dx = x - cx, dy = y - cy, len = Math.hypot(dx, dy) || 1;
    return [x + (dx / len) * off, y + (dy / len) * off];
  });
  // pár zářezů dovnitř, jak když nůžky cvaknou nakřivo
  for (let k = 0; k < nicks; k++) {
    const i = Math.floor(rnd() * n), [x, y] = q[i];
    const dx = x - cx, dy = y - cy, len = Math.hypot(dx, dy) || 1;
    q[i] = [x - (dx / len) * (amp * 1.6), y - (dy / len) * (amp * 1.6)];
  }
  let d = `M${n1(q[0][0])} ${n1(q[0][1])}`;
  for (let i = 0; i < n; i++) {
    const p0 = q[(i - 1 + n) % n], p1 = q[i], p2 = q[(i + 1) % n], p3 = q[(i + 2) % n];
    const c1 = [p1[0] + ((p2[0] - p0[0]) * tension) / 3, p1[1] + ((p2[1] - p0[1]) * tension) / 3];
    const c2 = [p2[0] - ((p3[0] - p1[0]) * tension) / 3, p2[1] - ((p3[1] - p1[1]) * tension) / 3];
    d += `C${n1(c1[0])} ${n1(c1[1])} ${n1(c2[0])} ${n1(c2[1])} ${n1(p2[0])} ${n1(p2[1])}`;
  }
  return d + "Z";
}

export const ell = (cx, cy, rx, ry = rx, n = 16, rot = 0) =>
  [...Array(n)].map((_, i) => { const a = (i / n) * TAU + rot; return [cx + Math.cos(a) * rx, cy + Math.sin(a) * ry]; });
export const rect = (x1, y1, x2, y2, r = 3) => [[x1 + r, y1], [x2 - r, y1], [x2, y1 + r], [x2, y2 - r], [x2 - r, y2], [x1 + r, y2], [x1, y2 - r], [x1, y1 + r]];
export const rot = (pts, deg, cx = 50, cy = 50) => { const a = (deg * Math.PI) / 180, c = Math.cos(a), s = Math.sin(a); return pts.map(([x, y]) => [cx + (x - cx) * c - (y - cy) * s, cy + (x - cx) * s + (y - cy) * c]); };
export const star = (cx, cy, R, r, k = 5, rot0 = -Math.PI / 2) => [...Array(k * 2)].map((_, i) => { const a = rot0 + (i * Math.PI) / k; const rr = i % 2 ? r : R; return [cx + Math.cos(a) * rr, cy + Math.sin(a) * rr]; });
/** Tlustá čára jako obdélník mezi dvěma body – tahy musí být tlusté, ne vlásek. */
export const stroke = (x1, y1, x2, y2, w) => {
  const dx = x2 - x1, dy = y2 - y1, len = Math.hypot(dx, dy) || 1, nx = (-dy / len) * w / 2, ny = (dx / len) * w / 2;
  return [[x1 + nx, y1 + ny], [x2 + nx, y2 + ny], [x2 - nx, y2 - ny], [x1 - nx, y1 - ny]];
};
