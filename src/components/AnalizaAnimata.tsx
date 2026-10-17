"use client";

import { useEffect, useMemo, useState } from "react";

const PASI = [
  "Se citește furnizorul…",
  "Se caută numărul și data…",
  "Se numără produsele…",
  "Se verifică prețurile și TVA-ul…",
  "Se calculează totalul…",
];

/** Poza avizului cu o rază roz care o scanează, plus mesaje care se schimbă cât durează citirea automată. */
export function AnalizaAnimata({ poza }: { poza: File }) {
  const adresa = useMemo(() => URL.createObjectURL(poza), [poza]);
  const [pas, setPas] = useState(0);

  useEffect(() => () => URL.revokeObjectURL(adresa), [adresa]);
  useEffect(() => {
    const id = setInterval(() => setPas((p) => (p + 1) % PASI.length), 1700);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="flex flex-col items-center gap-4 py-6 text-center">
      <div className="scanare w-full max-w-xs border-2 border-pink-300 bg-white/70 p-2 shadow-lg shadow-pink-200">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={adresa} alt="Avizul care se citește" className="max-h-72 w-full rounded-xl object-contain" />
      </div>
      <p key={pas} className="apare font-semibold text-pink-600">
        {PASI[pas]} 💕
      </p>
      <div className="bara-roz w-full max-w-xs">
        <i className="bara-indeterminata" />
      </div>
    </div>
  );
}
