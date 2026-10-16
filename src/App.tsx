import { useEffect, useLayoutEffect, useState } from "react";
import { HashRouter, Outlet, Route, Routes, useLocation } from "react-router-dom";
import { Lista } from "./components/Lista";
import { PotvrzeniHost } from "./components/Potvrzeni";
import { Uvod } from "./components/Uvod";
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

function Kostra() {
  const { pathname } = useLocation();
  // ještě před vykreslením nové obrazovky, ať neproblikne na staré pozici
  useLayoutEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return (
    <div className="app">
      {/* klíč podle adresy: každá obrazovka se jemně zvedne, ne střih */}
      <main className="obrazovka" key={pathname}>
        <Outlet />
      </main>
      <Lista />
    </div>
  );
}
