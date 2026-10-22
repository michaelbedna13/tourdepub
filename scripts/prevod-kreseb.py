# -*- coding: utf-8 -*-
"""Obtáhne kresby úkolů z rastrů do SVG drah (src/lib/kresby.ts).

Kresba patří k úkolu podle jména souboru: `caluje.png` je kresba úkolu s id
„caluje" (id jsou v src/lib/data.ts). Obtažení funguje stejně jako u loga —
kresba fixou nebo perem na světlém podkladu, bez pozadí a bez stínů.

Každá dráha se posadí do čtverce 0 0 100 100 a vycentruje, takže je jedno,
jestli je původní obrázek na šířku nebo na výšku: v galerii mají všechny
kresby stejně velké místo a jméno pod nimi zůstane na stejné řádce.

Spuštění: python3 scripts/prevod-kreseb.py [složka]   (výchozí: kresby/)
"""
import sys, os, json
import numpy as np
from PIL import Image
import potrace

KOREN = os.path.join(os.path.dirname(__file__), "..")
CIL = os.path.join(KOREN, "src", "lib", "kresby.ts")
PRIPONY = (".png", ".jpg", ".jpeg", ".webp", ".gif", ".bmp")
# Kolik místa kolem kresby zůstane ve čtverci. Bez okraje se kresba dotýká
# hrany a vedle ostatních vypadá, že přetéká.
OKRAJ = 4


def obtahni(cesta):
    im = Image.open(cesta).convert("L")
    a = np.array(im)
    # Pozor na polaritu: potracer bere jedničku jako POZADÍ, ne jako kresbu.
    cesty = potrace.Bitmap(a >= 128).trace(
        turdsize=6, alphamax=1.0, opticurve=True, opttolerance=0.2)

    xs, ys = [], []
    for k in cesty:
        xs.append(k.start_point.x); ys.append(k.start_point.y)
        for u in k:
            if u.is_corner:
                xs += [u.c.x, u.end_point.x]; ys += [u.c.y, u.end_point.y]
            else:
                xs += [u.c1.x, u.c2.x, u.end_point.x]; ys += [u.c1.y, u.c2.y, u.end_point.y]
    if not xs:
        raise SystemExit("%s: nic se neobtáhlo – je kresba tmavá na světlém?" % cesta)
    minx, maxx, miny, maxy = min(xs), max(xs), min(ys), max(ys)

    # Kontrola polarity: obtažený tvar musí sedět na tmavá místa v obrázku.
    # Kdyby se obtáhlo pozadí, vyšel by obdélník přes celé plátno.
    tmave = np.argwhere(a < 128)
    if not len(tmave):
        raise SystemExit("%s: v obrázku není nic tmavého." % cesta)
    oy, ox = tmave[:, 0], tmave[:, 1]
    if abs(minx - ox.min()) > 12 or abs(maxy - oy.max()) > 12:
        raise SystemExit("%s: obtažený tvar nesedí na kresbu – nejspíš obrácená "
                         "polarita (kresba musí být tmavá na světlém)." % cesta)

    # posadit do čtverce 100×100 a vycentrovat
    sirka, vyska = max(maxx - minx, 1e-6), max(maxy - miny, 1e-6)
    m = (100 - 2 * OKRAJ) / max(sirka, vyska)
    dx = OKRAJ + (100 - 2 * OKRAJ - sirka * m) / 2
    dy = OKRAJ + (100 - 2 * OKRAJ - vyska * m) / 2
    n = lambda v: round(v, 1)
    px = lambda p: (n((p.x - minx) * m + dx), n((p.y - miny) * m + dy))

    kusy = []
    for k in cesty:
        d = "M%s %s" % px(k.start_point)
        for u in k:
            if u.is_corner:
                d += "L%s %sL%s %s" % (px(u.c) + px(u.end_point))
            else:
                d += "C%s %s %s %s %s %s" % (px(u.c1) + px(u.c2) + px(u.end_point))
        kusy.append(d + "Z")
    # jedna dráha s fill-rule evenodd: díry v kresbě zůstanou díry
    return "".join(kusy), len(kusy)


def main(slozka):
    if not os.path.isdir(slozka):
        raise SystemExit("Složka %s není. Dej do ní obrázky pojmenované podle "
                         "id úkolů (např. caluje.png)." % slozka)
    # id úkolů z dat, ať se dá upozornit na soubor, co k ničemu nepatří
    with open(os.path.join(KOREN, "src", "lib", "data.ts"), encoding="utf-8") as f:
        zdroj = f.read()
    znama = set(json.loads(x) for x in __import__("re").findall(r'\{ id: ("[^"]+")', zdroj))

    ven, hlasky = [], []
    for jmeno in sorted(os.listdir(slozka)):
        zaklad, pripona = os.path.splitext(jmeno)
        if pripona.lower() not in PRIPONY:
            continue
        d, pocet = obtahni(os.path.join(slozka, jmeno))
        ven.append((zaklad, d))
        hlasky.append("  %-14s %2d drah, %.1f kB%s"
                      % (zaklad, pocet, len(d) / 1024,
                         "" if zaklad in znama else "   ← takové id v datech není"))

    if not ven:
        raise SystemExit("Ve složce %s nejsou žádné obrázky." % slozka)

    with open(CIL, "w", encoding="utf-8") as f:
        f.write("// Kresby úkolů jako dráhy ve čtverci 0 0 100 100.\n"
                "// Generuje scripts/prevod-kreseb.py z obrázků – needitovat ručně.\n"
                "// Klíč je id úkolu z data.ts; co tu není, bere ikonu kategorie.\n"
                "export const KRESBY: Record<string, string> = {\n"
                + "".join("  %s: %s,\n" % (json.dumps(k), json.dumps(d)) for k, d in ven)
                + "};\n")
    print("src/lib/kresby.ts: %d kreseb" % len(ven))
    print("\n".join(hlasky))


if __name__ == "__main__":
    main(sys.argv[1] if len(sys.argv) > 1 else os.path.join(KOREN, "kresby"))
