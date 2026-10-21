# -*- coding: utf-8 -*-
"""Obtáhne logo z rastru do SVG drah (logo.svg).

Logo je kresba fixou, takže z ní chceme čisté obrysy bez pozadí. Výsledek se
kreslí barvou textu (fill="currentColor") stejně jako ikony, aby šel použít
na jakémkoli podkladu.

Spuštění: python3 scripts/prevod-loga.py <obrazek>
"""
import sys, os, json, re
import numpy as np
from PIL import Image
import potrace

CIL = os.path.join(os.path.dirname(__file__), "..", "public", "logo.svg")

def main(cesta):
    im = Image.open(cesta).convert("L")
    # Práh: písmo je výrazně tmavší než krémové pozadí, 128 sedí s rezervou.
    # Přes numpy, ne po pixelech – milion volání getpixel trvá minuty.
    #
    # Pozor na polaritu: potracer bere jedničku jako POZADÍ, ne jako kresbu.
    # S maskou „tmavé = 1" obtáhne obdélník celého plátna místo písmen.
    a = np.array(im)
    bmp = potrace.Bitmap(a >= 128)
    # alphamax 1.0 = zachovat oblost tahů fixou; opttolerance 0.2 = svižnější křivky,
    # ať soubor nenaroste do stovek kilo
    cesty = bmp.trace(turdsize=8, alphamax=1.0, opticurve=True, opttolerance=0.2)

    # ořez na samotné písmo, ať logo nemá kolem sebe prázdný okraj
    xs, ys = [], []
    for k in cesty:
        xs.append(k.start_point.x); ys.append(k.start_point.y)
        for u in k:
            if u.is_corner:
                xs += [u.c.x, u.end_point.x]; ys += [u.c.y, u.end_point.y]
            else:
                xs += [u.c1.x, u.c2.x, u.end_point.x]; ys += [u.c1.y, u.c2.y, u.end_point.y]
    minx, maxx, miny, maxy = min(xs), max(xs), min(ys), max(ys)
    sirka, vyska = maxx - minx, maxy - miny

    # Kontrola polarity: obtažené písmo musí sedět na to, kde je v obrázku tmavá
    # barva. Kdyby se obtáhlo pozadí, vyšel by obdélník přes celé plátno.
    tmave = np.argwhere(a < 128)
    oy, ox = tmave[:, 0], tmave[:, 1]
    if abs(minx - ox.min()) > 12 or abs(maxx - ox.max()) > 12 or \
       abs(miny - oy.min()) > 12 or abs(maxy - oy.max()) > 12:
        raise SystemExit(
            "Obtažený tvar nesedí na kresbu v obrázku (obtaženo x %.0f-%.0f y %.0f-%.0f, "
            "kresba x %d-%d y %d-%d). Nejspíš je obrácená polarita masky."
            % (minx, maxx, miny, maxy, ox.min(), ox.max(), oy.min(), oy.max()))

    n = lambda v: round(v, 1)
    px = lambda p: (n(p.x - minx), n(p.y - miny))

    kusy = []
    for k in cesty:
        d = "M%s %s" % px(k.start_point)
        for u in k:
            if u.is_corner:
                d += "L%s %sL%s %s" % (px(u.c) + px(u.end_point))
            else:
                d += "C%s %s %s %s %s %s" % (px(u.c1) + px(u.c2) + px(u.end_point))
        kusy.append(d + "Z")

    # jedna dráha s fill-rule evenodd: díry v písmenech (o, u, b) zůstanou díry
    d = "".join(kusy)
    svg = (
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 %s %s" '
        'fill="currentColor" fill-rule="evenodd" role="img" aria-label="Tour de Pub">'
        '<path d="%s"/></svg>\n' % (n(sirka), n(vyska), d)
    )
    with open(CIL, "w", encoding="utf-8") as f:
        f.write(svg)

    # Dráha i jako modul, ať jde logo vložit rovnou do stránky komponentou <Logo>.
    # Načítat logo.svg zvlášť by znamenalo další požadavek a probliknutí.
    ts = os.path.join(os.path.dirname(__file__), "..", "src", "lib", "logo.ts")
    with open(ts, "w", encoding="utf-8") as f:
        f.write("// Slovní značka Tour de Pub jako jedna dráha.\n"
                "// Generuje scripts/prevod-loga.py z obrázku – needitovat ručně.\n"
                "// Kreslí ji <Logo> (src/components/Logo.tsx).\n"
                "export const LOGO_VIEWBOX = %s;\n"
                "export const LOGO_CESTA = %s;\n"
                % (json.dumps("0 0 %s %s" % (n(sirka), n(vyska))), json.dumps(d)))

    # Stejná dráha i přímo do index.html mezi značky <!-- logo:start/end -->.
    # Jako <img> by to byl samostatný soubor, který dorazí až po prvním
    # vykreslení stránky — a mezi úvodní obrazovkou iOS (na které logo je)
    # a naším logem by bliklo černo.
    html = os.path.join(os.path.dirname(__file__), "..", "index.html")
    with open(html, encoding="utf-8") as f:
        stranka = f.read()
    vlozene = (
        '<svg class="logo" viewBox="0 0 %s %s" fill="#EFEBE0" fill-rule="evenodd" '
        'role="img" aria-label="Tour de Pub"><path d="%s"/></svg>' % (n(sirka), n(vyska), d)
    )
    nova = re.sub(r"(<!-- logo:start -->).*?(<!-- logo:end -->)",
                  lambda m: m.group(1) + vlozene + m.group(2), stranka, flags=re.S)
    if nova == stranka and "logo:start" not in stranka:
        print("POZOR: v index.html chybí značky <!-- logo:start --> a <!-- logo:end -->")
    with open(html, "w", encoding="utf-8") as f:
        f.write(nova)

    print("logo.svg + logo.ts + index.html: %d drah, %.1f kB, viewBox %s×%s"
          % (len(kusy), len(svg) / 1024, n(sirka), n(vyska)))

if __name__ == "__main__":
    main(sys.argv[1])
