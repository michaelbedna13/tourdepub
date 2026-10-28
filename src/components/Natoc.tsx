import { Logo } from "./Logo";

/** Cedule přes celou obrazovku, když někdo otočí telefon na šířku.
 *
 *  Zamknout otáčení pořádně nejde. V manifestu stojí orientation:portrait
 *  a Android se podle toho zařídí, jenže iOS tuhle položku nečte a Screen
 *  Orientation API (screen.orientation.lock) Safari nemá vůbec. Na iPhonu
 *  je tedy tohle jediná cesta: na šířku se appka nepřekresluje do kraje,
 *  ale schová se za ceduli.
 *
 *  Kdy se objeví, rozhoduje CSS, ne JavaScript — žádné posluchače na otočení,
 *  žádné dopočítávání. Podmínka je na šířku A nízké okno, takže se nespustí
 *  na notebooku ani na iPadu naležato, kde je appky vidět dost. */
export function Natoc() {
  return (
    <div className="natoc" role="alertdialog" aria-label="Otoč telefon na výšku">
      <Logo trida="natoc-logo" />
      <h2>Otoč to na výšku</h2>
      <p>Tour de Pub jede jen nastojato. Naležato by se do toho nevešel ani škopek.</p>
    </div>
  );
}
