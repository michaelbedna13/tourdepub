import { defineConfig, type Plugin } from "vite";

// Appka běží na vlastní doméně betelnarezba.cz v kořeni, takže nasazení
// staví s VITE_BASE=/ (viz .github/workflows/nasazeni.yml). Záloha zůstává
// na podsložku, ve které appka běžela na michaelbedna13.github.io — kdyby
// se doména někdy pustila, stačí proměnnou z workflow vyndat.
const base = process.env.VITE_BASE ?? "/tourdepub/";

/** Styl appky nesmí blokovat první vykreslení.
 *
 *  Vite vkládá do hlavičky obyčejný <link rel="stylesheet">, a ten prohlížeč
 *  zastaví: než ho dotáhne, nevykreslí vůbec nic a uživatel kouká na to, co
 *  bylo předtím (bílo, nebo úvodní obrazovku z plochy). Naměřeno na pomalé
 *  síti: první vykreslení 664 ms, z toho 581 ms čekání na ten soubor. Přesně
 *  to Mišák vidí jako probliknutí při spuštění.
 *
 *  Úvodní obrazovka (#uvod s logem) má přitom všechen svůj styl rovnou
 *  v index.html, takže na app.css nečeká — jen se k ní nesmí prohlížeč dostat
 *  až po něm. media="print" ho shodí z blokujících, po dotažení se přepne
 *  zpátky na all. Appka pod úvodem je do té doby schovaná (html.uvodni .app)
 *  a React se pouští až se stylem v ruce — viz pockejNaStyl() v main.tsx.
 *
 *  Ve vývoji se nic takového neděje: tam styly chodí přes skript.
 */
function stylNeblokuje(): Plugin {
  return {
    name: "styl-neblokuje",
    apply: "build",
    transformIndexHtml: {
      order: "post",
      handler(html) {
        let kolik = 0;
        const novy = html.replace(/<link rel="stylesheet"([^>]*)>/g, (cely, zbytek) => {
          // typekit (a jeho záskok v <noscript>) je odložený už v index.html
          if (zbytek.includes("use.typekit.net")) return cely;
          kolik++;
          return `<link rel="stylesheet" id="styl-appky"${zbytek} media="print" onload="this.media='all'">`;
        });
        if (kolik !== 1) {
          throw new Error(
            `styl-neblokuje: čekal jsem v index.html jeden styl appky, našel ${kolik}. ` +
            "Nejspíš se změnilo, jak Vite styl vkládá — bez téhle úpravy appka při " +
            "spuštění probliká.",
          );
        }
        return novy;
      },
    },
  };
}

export default defineConfig({
  base,
  plugins: [stylNeblokuje()],
  build: { target: "es2022" },
});
