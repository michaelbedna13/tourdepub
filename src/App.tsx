import { useEffect, useLayoutEffect, useState } from "react";
import { HashRouter, Outlet, Route, Routes, useLocation } from "react-router-dom";
import { PotvrzeniHost } from "./components/Potvrzeni";
import { Ramy } from "./components/Ramy";
import { FabMenu } from "./components/FabMenu";
import { Uvod } from "./components/Uvod";
import { KATEGORIE } from "./lib/data";
import { useSvih } from "./lib/svih";
import { spustSync } from "./lib/sync";
import { Hospody } from "./obrazovky/Hospody";
import { Hra } from "./obrazovky/Hra";
import { Kategorie } from "./obrazovky/Kategorie";
import { Pravidla } from "./obrazovky/Pravidla";
import { Tymy } from "./obrazovky/Tymy";
import { Ukoly } from "./obrazovky/Ukoly";

// jako v nativní appce: prohlížeč si pozici posunu nepamatuje, každá obrazovka začíná nahoře
if ("scrollRestoration" in history) history.scrollRestoration = "manual";

export function App() {
  // Úvod běží po každém spuštění a vždycky jde přeskočit – takhle to chtěl Mišák.
  // Appka se pod ním už kreslí a připojuje, takže po doběhnutí je hned hotová.
  const [uvod, setUvod] = useState(true);

  useEffect(() => { spustSync(); }, []);

  return (
    <HashRouter>
      {uvod && <Uvod hotovo={() => setUvod(false)} />}
      <PotvrzeniHost />
      <Routes>
        <Route element={<Kostra />}>
          <Route index element={<Hra />} />
          <Route path="ukoly" element={<Ukoly />} />
          <Route path="ukoly/:kat" element={<Kategorie />} />
          <Route path="tymy" element={<Tymy />} />
          <Route path="hospody" element={<Hospody />} />
          <Route path="pravidla" element={<Pravidla />} />
          {/* stará adresa z oblíbených nebo překlep – ať to nespadne na prázdnou stránku */}
          <Route path="*" element={<Hra />} />
        </Route>
      </Routes>
    </HashRouter>
  );
}

// Pořadí pro švih do boku. Stejné jako v rozcestníku, ať se to nepere.
const HLAVNI = ["/", "/ukoly", "/tymy", "/hospody", "/pravidla"];
const KATEGORIE_CESTY = KATEGORIE.map((k) => `/ukoly/${k.id}`);

function Kostra() {
  const { pathname } = useLocation();
  // V kategorii se švihem chodí mezi kategoriemi, ne na jinou obrazovku –
  // tam člověk zrovna prochází úkoly a skok na Hospody by byl překvapení.
  const svih = useSvih(pathname.startsWith("/ukoly/") ? KATEGORIE_CESTY : HLAVNI);
  // ještě před vykreslením nové obrazovky, ať neproblikne na staré pozici
  useLayoutEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return (
    <div className="app" {...svih.obal}>
      <Ramy />
      {/* klíč podle adresy: každá obrazovka přijede, ne střih */}
      <main className={`obrazovka${svih.prichod ? ` z-${svih.prichod}` : ""}`}
        key={pathname} ref={svih.vrstva}>
        <Outlet />
      </main>
      <FabMenu />
    </div>
  );
}
