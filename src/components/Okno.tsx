import { useEffect, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useRozmazanePozadi } from "../lib/vrstvy";
import { vazat } from "../lib/format";

interface Props {
  nadpis: string;
  /** Jedna věta pod nadpisem, psanou rukou. */
  pod?: string;
  zavri: () => void;
  children: ReactNode;
}

/** Okno vyjeté od spodní hrany. Jedna ruka, palec dosáhne na akce dole. */
export function Okno({ nadpis, pod, zavri, children }: Props) {
  useRozmazanePozadi();
  const telo = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const naKlavesu = (e: KeyboardEvent) => { if (e.key === "Escape") zavri(); };
    document.addEventListener("keydown", naKlavesu);
    // první pole samo do ruky, ať se nemusí ťukat dvakrát
    const t = setTimeout(() => telo.current?.querySelector<HTMLElement>("input,textarea")?.focus(), 60);
    return () => { document.removeEventListener("keydown", naKlavesu); clearTimeout(t); };
  }, [zavri]);

  return createPortal(
    <div className="okno" onClick={(e) => { if (e.target === e.currentTarget) zavri(); }}>
      <div className="okno-telo" ref={telo} role="dialog" aria-modal="true" aria-label={nadpis}>
        <h2>{nadpis}</h2>
        {pod ? <p className="pod">{vazat(pod)}</p> : <div style={{ height: 16 }} />}
        {children}
      </div>
    </div>,
    document.body,
  );
}
