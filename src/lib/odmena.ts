// Odměna po zápisu: čárka vyletí nad obrazovku a telefon krátce cukne.
// Je to mimo React schválně – jeden prchavý prvek nemá cenu držet ve stavu
// a překreslovat kvůli němu obrazovku.

export function odmena(text: string) {
  const d = document.createElement("div");
  d.className = "plusjedna cislo";
  d.textContent = text;
  document.body.appendChild(d);
  setTimeout(() => d.remove(), 900);
  cuknuti();
}

/** Krátké cuknutí. Na iOS nefunguje, tam se nic nestane. */
export function cuknuti(ms = 10) {
  try {
    navigator.vibrate?.(ms);
  } catch {
    // zařízení bez motorku
  }
}
