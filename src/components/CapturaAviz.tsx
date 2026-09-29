"use client";

import { useRef, useState } from "react";
import imageCompression from "browser-image-compression";

async function comprimaDacaEImagine(fisier: File): Promise<File> {
  if (!fisier.type.startsWith("image/")) return fisier; // PDF, trimis direct
  try {
    return await imageCompression(fisier, { maxSizeMB: 2, maxWidthOrHeight: 2000, useWebWorker: true });
  } catch {
    return fisier;
  }
}

export function CapturaAviz({ onCaptura, dezactivat }: { onCaptura: (fisiere: File[]) => void; dezactivat: boolean }) {
  const inputCameraRef = useRef<HTMLInputElement>(null);
  const inputFisierRef = useRef<HTMLInputElement>(null);
  const [seComprima, setSeComprima] = useState(false);

  async function proceseazaFisiere(fisiere: File[]) {
    setSeComprima(true);
    try {
      const comprimate = await Promise.all(fisiere.map(comprimaDacaEImagine));
      onCaptura(comprimate);
    } finally {
      setSeComprima(false);
    }
  }

  function alegeFisiere(e: React.ChangeEvent<HTMLInputElement>) {
    const fisiere = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (fisiere.length > 0) proceseazaFisiere(fisiere);
  }

  return (
    <div className="flex flex-col items-center gap-4 rounded-2xl border border-pink-200 bg-white/80 py-12 text-center shadow-md shadow-pink-100 backdrop-blur-sm">
      <p className="text-pink-500">📸 Fă o poză avizului sau alege mai multe deodată din galerie</p>
      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          disabled={dezactivat || seComprima}
          onClick={() => inputCameraRef.current?.click()}
          className="rounded-full bg-gradient-to-r from-pink-400 to-rose-400 px-6 py-3 font-semibold text-white shadow-md shadow-pink-200 disabled:opacity-50"
        >
          {seComprima ? "Se pregătește…" : "📷 Fă o poză"}
        </button>
        <button
          type="button"
          disabled={dezactivat || seComprima}
          onClick={() => inputFisierRef.current?.click()}
          className="rounded-full border-2 border-pink-300 px-6 py-3 font-semibold text-pink-600 disabled:opacity-50"
        >
          {seComprima ? "Se pregătește…" : "📁 Alege din galerie / fișiere"}
        </button>
      </div>
      <p className="text-xs text-pink-300">Poți alege mai multe poze deodată din galerie — le procesăm pe rând, ca avize separate.</p>

      <input ref={inputCameraRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={alegeFisiere} />
      <input ref={inputFisierRef} type="file" accept="image/*,application/pdf" multiple className="hidden" onChange={alegeFisiere} />
    </div>
  );
}
