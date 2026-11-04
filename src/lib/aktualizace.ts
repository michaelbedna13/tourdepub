// Nová verze appky se do telefonu dostane sama.
//
// Appka uložená na ploše iPhonu se při „otevření" nespouští znova, jen se
// probudí: iOS ji drží v paměti a běží pořád ta stránka, která se načetla
// třeba ráno. Safari si stránku při otevření stáhne, appka z plochy ne,
// a navíc má vlastní mezipaměť, oddělenou od Safari, kde GitHub Pages
// dovolí držet index.html deset minut. Mišák tak v Safari viděl nové
// kresby a na ploše pořád staré.
//
// Service worker, který by to řešil, tu dřív byl a šel pryč (bránil tomu,
// aby se nová verze dostala do telefonu, viz main.tsx). Tohle je jednodušší:
// při každém návratu do popředí se stáhne index.html mimo mezipaměť
// a porovná se jméno hlavního skriptu. Vite ho pojmenuje podle obsahu
// (index-D5xpZOEz.js), takže jiné jméno = jiná verze. Pak se stránka
// načte znova. Stav hry je v localStorage, nic se neztratí.

/** Jméno hlavního skriptu, se kterým tahle stránka běží. Ve vývoji žádný
 *  takový <script> není a kontrola se nepouští. */
function mujSkript(): string | null {
  const s = document.querySelector<HTMLScriptElement>('script[type="module"][src*="/assets/index-"]');
  return s?.getAttribute("src") ?? null;
}

const SKRIPT = /\/assets\/index-[\w-]+\.js/;

/** Ať se to při nějaké chybě (třeba server chvíli vrací starou stránku
 *  a pak novou) nezacyklí: na jednu cizí verzi se znova načte jen jednou. */
const KLIC = "tdp-aktualizace";

let bezi = false;

async function zkontroluj() {
  const moje = mujSkript();
  if (!moje || bezi || !navigator.onLine) return;
  bezi = true;
  try {
    // ?_= obejde mezipaměť i tam, kde cache: "no-store" nestačí
    const r = await fetch(`${import.meta.env.BASE_URL}?_=${Date.now()}`, { cache: "no-store" });
    if (!r.ok) return;
    const nova = (await r.text()).match(SKRIPT)?.[0];
    if (!nova || moje.endsWith(nova)) return;
    try {
      if (sessionStorage.getItem(KLIC) === nova) return;
      sessionStorage.setItem(KLIC, nova);
    } catch { /* bez sessionStorage se prostě načte znova */ }
    // Nová adresa (s ?v=), ne reload: reload smí iOS vzít z mezipaměti
    // a načetl by zase starou stránku. Kotva s cestou v appce zůstává.
    const v = nova.replace(/^.*index-|\.js$/g, "");
    location.replace(`${import.meta.env.BASE_URL}?v=${v}${location.hash}`);
  } catch {
    /* bez signálu nebo chyba sítě: zkusí se při příštím návratu */
  } finally {
    bezi = false;
  }
}

/** Pustí hlídání nové verze: hned po startu a pokaždé, když se appka
 *  vrátí do popředí. */
export function hlidejNovouVerzi() {
  if (!mujSkript()) return;
  // ?v= v adrese už svou práci odvedl, ať v ní nestraší
  if (location.search.includes("v=")) {
    history.replaceState(null, "", `${location.pathname}${location.hash}`);
  }
  zkontroluj();
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") zkontroluj();
  });
  // iOS při probuzení appky z plochy někdy pošle jen pageshow
  window.addEventListener("pageshow", (e) => { if (e.persisted) zkontroluj(); });
}
