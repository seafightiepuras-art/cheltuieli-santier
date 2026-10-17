"use client";

import { useEffect, useRef, useState } from "react";
import { formateazaSuma } from "@/lib/format";

/** O sumă de bani care „urcă” de la 0 la valoarea reală când apare, apoi se schimbă lin când se schimbă valoarea. */
export function SumaAnimata({ suma, moneda = "RON", durata = 1100 }: { suma: number; moneda?: "RON" | "EUR"; durata?: number }) {
  const [afisat, setAfisat] = useState(suma);
  const anterior = useRef(0);

  useEffect(() => {
    const redus = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (redus) {
      setAfisat(suma);
      anterior.current = suma;
      return;
    }
    const de = anterior.current;
    const t0 = performance.now();
    let rafId = 0;
    const pas = (t: number) => {
      const k = Math.min(1, (t - t0) / durata);
      const e = 1 - Math.pow(1 - k, 3);
      setAfisat(de + (suma - de) * e);
      if (k < 1) rafId = requestAnimationFrame(pas);
      else anterior.current = suma;
    };
    rafId = requestAnimationFrame(pas);
    return () => cancelAnimationFrame(rafId);
  }, [suma, durata]);

  return <>{formateazaSuma(afisat, moneda)}</>;
}
